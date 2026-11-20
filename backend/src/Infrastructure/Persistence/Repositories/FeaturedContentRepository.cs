// BE2-06 | Triển khai truy vấn và lưu dữ liệu EF Core cho nội dung được Admin ghim lên trang chủ.
// Đọc và ghi nội dung được Admin ghim nổi bật bằng EF Core.
using System.Data;
using Application.Common.Exceptions;
using Application.Features.Administration;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

// FeaturedContentRepository: thực hiện truy vấn và lưu dữ liệu của tính năng qua EF Core.
public sealed class FeaturedContentRepository(AppDbContext db) : IFeaturedContentRepository
{
    // Xếp hạng toàn bộ nội dung đủ điều kiện trước phân trang. Ghim thủ công dùng luồng quản trị riêng.
    public async Task<FeaturedContentPage> ListPopularAsync(FeaturedContentType type, int page, int pageSize, CancellationToken ct)
    {
        var candidates = type switch
        {
            FeaturedContentType.Restaurant => PublicRestaurants(db.Restaurants.AsNoTracking()).Select(item =>
                new PopularCandidate { Id = item.Id, DefaultId = item.Id, Name = item.Name, Date = DateTimeOffset.MinValue }),
            FeaturedContentType.Video => PublicVideos(db.Videos.AsNoTracking(), db.ModerationSubmissions.AsNoTracking()).Select(item =>
                new PopularCandidate { Id = item.Video.Id, DefaultId = item.Video.Id, Name = "", Date = item.Video.CreatedAtUtc }),
            FeaturedContentType.Article => PublicArticles(db.ArticleVersions.AsNoTracking()).Select(item =>
                new PopularCandidate { Id = item.ArticleId, DefaultId = item.Id, Name = "", Date = item.SubmittedAt }),
            _ => throw new ArgumentOutOfRangeException(nameof(type))
        };
        var favoriteType = type switch { FeaturedContentType.Restaurant => FavoriteTargetType.Restaurant,
            FeaturedContentType.Video => FavoriteTargetType.Video, _ => FavoriteTargetType.Article };
        var commentType = type == FeaturedContentType.Video ? CommentTargetType.Video : CommentTargetType.Article;
        var scores = candidates.Select(item => new
        {
            Item = item,
            Favorites = db.Favorites.Count(row => row.TargetType == favoriteType && row.TargetId == item.Id),
            Comments = type == FeaturedContentType.Restaurant ? 0 : db.Comments.Count(row => row.TargetType == commentType && row.TargetId == item.Id && row.Status == CommentStatus.Visible),
            Views = type == FeaturedContentType.Video ? db.Videos.Where(row => row.Id == item.Id).Select(row => row.ViewCount).FirstOrDefault() : 0
        });
        var total = await candidates.CountAsync(ct);
        var ids = await scores.OrderByDescending(row => row.Favorites).ThenByDescending(row => row.Comments)
            .ThenByDescending(row => row.Views).ThenBy(row => row.Item.Name).ThenByDescending(row => row.Item.Date)
            .ThenBy(row => row.Item.DefaultId).Skip((page - 1) * pageSize).Take(pageSize).Select(row => row.Item.Id).ToArrayAsync(ct);
        var items = type switch
        {
            FeaturedContentType.Restaurant => await RestaurantItems(ids, [], ct),
            FeaturedContentType.Video => await VideoItems(ids, [], ct),
            _ => await ArticleItems(ids, [], ct)
        };
        var byId = items.ToDictionary(item => item.Id);
        return new(ids.Where(byId.ContainsKey).Select(id => byId[id]).ToArray(), total, page, pageSize);
    }

    private sealed class PopularCandidate
    {
        public Guid Id { get; init; }
        public Guid DefaultId { get; init; }
        public string Name { get; init; } = "";
        public DateTimeOffset Date { get; init; }
    }
    // PublicRestaurants: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    internal static IQueryable<Restaurant> PublicRestaurants(IQueryable<Restaurant> restaurants) =>
        restaurants.Where(x => x.IsActive);

    // PublicArticles: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    internal static IQueryable<ArticleVersion> PublicArticles(IQueryable<ArticleVersion> versions) =>
        versions.Where(x => x.Submission.ContentType == ModeratedContentType.Article &&
            x.Submission.AdminReviewStatus == AdminReviewStatus.Published && x.Submission.IsCurrentPublished);

    // PublicVideos: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    internal static IQueryable<PublishedVideo> PublicVideos(IQueryable<Video> videos, IQueryable<ModerationSubmission> submissions) =>
        from video in videos
        join submission in submissions on video.PublishedSubmissionId equals (Guid?)submission.Id
        where submission.ContentId == video.Id && submission.ContentType == ModeratedContentType.Video &&
            submission.AdminReviewStatus == AdminReviewStatus.Published && submission.IsCurrentPublished
        select new PublishedVideo { Video = video, Submission = submission };

    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<FeaturedContentPage> ListAsync(FeaturedContentType contentType, string? search,
        bool pinnedOnly, int page, int pageSize, CancellationToken ct)
    {
        var ids = EligibleIds(contentType, search);
        var pins = db.FeaturedContent.AsNoTracking().Where(x => x.ContentType == contentType);
        var query = PinCandidates(ids, pins, pinnedOnly);
        var total = await query.CountAsync(ct);
        var keys = await query.OrderByDescending(x => x.PinnedAt != null).ThenByDescending(x => x.PinnedAt)
            .ThenBy(x => x.Id).Skip((page - 1) * pageSize).Take(pageSize).ToArrayAsync(ct);
        var pageIds = keys.Select(x => x.Id).ToArray();
        var pinnedIds = keys.Where(x => x.PinnedAt != null).Select(x => x.Id).ToHashSet();
        var items = contentType switch
        {
            FeaturedContentType.Restaurant => await RestaurantItems(pageIds, pinnedIds, ct),
            FeaturedContentType.Article => await ArticleItems(pageIds, pinnedIds, ct),
            FeaturedContentType.Video => await VideoItems(pageIds, pinnedIds, ct),
            _ => throw new ArgumentOutOfRangeException(nameof(contentType))
        };
        var byId = items.ToDictionary(x => x.Id);
        return new(keys.Where(x => byId.ContainsKey(x.Id)).Select(x => byId[x.Id]).ToArray(), total, page, pageSize);
    }

    // PinCandidates: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    internal static IQueryable<PinCandidate> PinCandidates(IQueryable<Guid> ids,
        IQueryable<FeaturedContent> pins, bool pinnedOnly)
    {
        var query = from id in ids
                    join pin in pins on id equals pin.ContentId into matchingPins
                    from pin in matchingPins.DefaultIfEmpty()
                    select new PinCandidate { Id = id, PinnedAt = pin == null ? (DateTimeOffset?)null : pin.PinnedAt };
        return pinnedOnly ? query.Where(x => x.PinnedAt != null) : query;
    }

    // SetPinnedAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task SetPinnedAsync(FeaturedContentType contentType, Guid id, bool isPinned,
        string adminId, DateTimeOffset now, CancellationToken ct)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (!isPinned)
        {
            // A stale pin must remain removable after the target is hidden or deleted.
            var removed = await db.FeaturedContent.Where(x => x.ContentType == contentType && x.ContentId == id)
                .ExecuteDeleteAsync(ct);
            if (removed == 0 && !await TargetExists(contentType, id, ct))
                throw new KeyNotFoundException("Không tìm thấy nội dung.");
            return;
        }

        // Keep eligibility stable during insertion. UPDLOCK + HOLDLOCK serializes duplicate
        // pin requests while leaving the original pinnedAt/admin unchanged on repeated PUT.
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        if (!await TargetExists(contentType, id, ct))
            throw new KeyNotFoundException("Không tìm thấy nội dung.");
        if (!await EligibleIds(contentType, null).AnyAsync(candidate => candidate == id, ct))
            throw new ConflictException("Chỉ có thể ghim nội dung đang công khai hoặc nhà hàng đang hoạt động.");
        var type = contentType.ToString();
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            IF NOT EXISTS (SELECT 1 FROM [FeaturedContent] WITH (UPDLOCK, HOLDLOCK)
                WHERE [ContentType] = {type} AND [ContentId] = {id})
            INSERT INTO [FeaturedContent] ([ContentType], [ContentId], [PinnedByUserId], [PinnedAt])
            VALUES ({type}, {id}, {adminId}, {now})
            """, ct);
        await transaction.CommitAsync(ct);
    }

    // EligibleIds: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private IQueryable<Guid> EligibleIds(FeaturedContentType type, string? search)
    {
        switch (type)
        {
            case FeaturedContentType.Restaurant:
                var restaurants = PublicRestaurants(db.Restaurants.AsNoTracking());
                if (!string.IsNullOrEmpty(search)) restaurants = restaurants.Where(x => x.Name.Contains(search));
                return restaurants.Select(x => x.Id);
            case FeaturedContentType.Article:
                var articles = PublicArticles(db.ArticleVersions.AsNoTracking());
                if (!string.IsNullOrEmpty(search)) articles = articles.Where(x => x.Title.Contains(search));
                return articles.Select(x => x.ArticleId).Distinct();
            case FeaturedContentType.Video:
                var videos = PublicVideos(db.Videos.AsNoTracking(), db.ModerationSubmissions.AsNoTracking());
                if (!string.IsNullOrEmpty(search)) videos = videos.Where(x => x.Submission.Title.Contains(search));
                return videos.Select(x => x.Video.Id);
            default:
                throw new ArgumentOutOfRangeException(nameof(type));
        }
    }

    // TargetExists: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private Task<bool> TargetExists(FeaturedContentType type, Guid id, CancellationToken ct) => type switch
    {
        FeaturedContentType.Restaurant => db.Restaurants.AnyAsync(x => x.Id == id, ct),
        FeaturedContentType.Article => db.Articles.AnyAsync(x => x.Id == id, ct),
        FeaturedContentType.Video => db.Videos.AnyAsync(x => x.Id == id, ct),
        _ => throw new ArgumentOutOfRangeException(nameof(type))
    };

    // RestaurantItems: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private async Task<FeaturedContentItem[]> RestaurantItems(Guid[] ids, HashSet<Guid> pinned, CancellationToken ct)
    {
        var items = await PublicRestaurants(db.Restaurants.AsNoTracking()).Where(x => ids.Contains(x.Id))
            .Include(x => x.DietaryTypes).ToArrayAsync(ct);
        return items.Select(x => new FeaturedContentItem(x.Id, "Restaurant", x.Name, x.Description,
            x.ImageUrl, pinned.Contains(x.Id), null, null, null, x.Address,
            x.DietaryTypes.OrderBy(d => d.DietaryType).Select(d => d.DietaryType.ToString()).ToArray())).ToArray();
    }

    // ArticleItems: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private async Task<FeaturedContentItem[]> ArticleItems(Guid[] ids, HashSet<Guid> pinned, CancellationToken ct)
    {
        var items = await PublicArticles(db.ArticleVersions.AsNoTracking()).Where(x => ids.Contains(x.ArticleId))
            .Include(x => x.DietaryTypes).Include(x => x.Submission).ThenInclude(x => x.Decisions)
            .AsSplitQuery().ToArrayAsync(ct);
        var names = await AuthorNames(items.Select(x => x.Submission.OwnerUserId).ToArray(), ct);
        return items.Select(x => new FeaturedContentItem(x.ArticleId, "Article", x.Title, null,
            x.CoverImageUrl, pinned.Contains(x.ArticleId), names.GetValueOrDefault(x.Submission.OwnerUserId),
            PublishedAt(x.Submission), null, null,
            x.DietaryTypes.OrderBy(d => d.DietaryType).Select(d => d.DietaryType.ToString()).ToArray())).ToArray();
    }

    // VideoItems: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private async Task<FeaturedContentItem[]> VideoItems(Guid[] ids, HashSet<Guid> pinned, CancellationToken ct)
    {
        var videos = await PublicVideos(db.Videos.AsNoTracking(), db.ModerationSubmissions.AsNoTracking())
            .Where(x => ids.Contains(x.Video.Id)).Select(x => x.Video).ToArrayAsync(ct);
        var submissionIds = videos.Select(x => x.PublishedSubmissionId!.Value).ToArray();
        var submissions = await db.ModerationSubmissions.AsNoTracking().Where(x => submissionIds.Contains(x.Id))
            .Include(x => x.Decisions).ToDictionaryAsync(x => x.Id, ct);
        var names = await AuthorNames(videos.Select(x => x.OwnerUserId).ToArray(), ct);
        return videos.Select(video =>
        {
            var published = submissions[video.PublishedSubmissionId!.Value];
            return new FeaturedContentItem(video.Id, "Video", published.Title, published.TextContent,
                video.PublishedThumbnailKey is null ? null : $"/api/videos/{video.Id}/thumbnail",
                pinned.Contains(video.Id), names.GetValueOrDefault(video.OwnerUserId),
                PublishedAt(published), video.ViewCount, null, []);
        }).ToArray();
    }

    // AuthorNames: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private Task<Dictionary<string, string>> AuthorNames(string[] ids, CancellationToken ct) =>
        db.Users.AsNoTracking().Where(x => ids.Contains(x.Id)).ToDictionaryAsync(x => x.Id, x => x.FullName, ct);

    // PublishedAt: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static DateTimeOffset PublishedAt(ModerationSubmission submission) =>
        submission.Decisions.Where(x => x.Decision == ModerationDecisionType.Approve)
            .Select(x => (DateTimeOffset?)x.DecidedAt).Max() ?? submission.SubmittedAt;

    // PublishedVideo: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
    internal sealed class PublishedVideo
    {
        public required Video Video { get; init; }
        public required ModerationSubmission Submission { get; init; }
    }

    // PinCandidate: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
    internal sealed class PinCandidate
    {
        public Guid Id { get; init; }
        public DateTimeOffset? PinnedAt { get; init; }
    }
}
