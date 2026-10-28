// Chức năng: bài viết và phiên bản gửi duyệt. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Application.Features.Moderation;
using Domain.Entities;
using Domain.Enums;

namespace Application.Features.Articles;

// ArticleService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed class ArticleService(IArticleRepository repository, ModerationService moderation)
{
    // CreateAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<MyArticleDetail> CreateAsync(string ownerId, ArticleDraftRequest request, CancellationToken ct)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(ownerId) || ownerId.Length > 450)
            throw new ArticleException(ArticleError.Validation, "Vui lòng đăng nhập để quản lý bài viết của bạn.");
        Validate(request);
        var article = new Article(ownerId, request.Title.Trim(), request.Content.Trim(), Categories(request),
            request.CoverImageUrl?.Trim(), DietaryTypes(request), DateTimeOffset.UtcNow);
        await repository.AddAsync(article, ct);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
        return ToMine(article);
    }

    // UpdateAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<MyArticleDetail> UpdateAsync(Guid id, string ownerId, ArticleDraftRequest request, CancellationToken ct)
    {
        Validate(request);
        var article = await GetOwnedAsync(id, ownerId, ct);
        EnsureEditable(article);
        article.SetDraft(request.Title.Trim(), request.Content.Trim(), Categories(request),
            request.CoverImageUrl?.Trim(), DietaryTypes(request), DateTimeOffset.UtcNow);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
        return ToMine(article);
    }

    // DeleteAsync: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    public async Task DeleteAsync(Guid id, string ownerId, CancellationToken ct)
    {
        var article = await GetOwnedAsync(id, ownerId, ct);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (article.Versions.Count != 0)
            throw new ArticleException(ArticleError.Conflict, "Chỉ có thể xóa bản nháp chưa gửi duyệt.");
        repository.Remove(article);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
    }

    // SubmitAsync: Chuyển bản nội dung hợp lệ sang quy trình gửi duyệt.
    public async Task<MyArticleDetail> SubmitAsync(Guid id, string ownerId, CancellationToken ct)
    {
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        return await repository.InTransactionAsync(async token =>
        {
            var article = await GetOwnedAsync(id, ownerId, token);
            EnsureEditable(article);
            var duplicateTitle = await repository.HasDuplicatePublishedTitleAsync(article.Id, article.DraftTitle, token);
            var submission = await moderation.SubmitAsync(ownerId,
                new SubmitModerationCommand(article.ModerationContentId, ModeratedContentType.Article,
                    article.DraftTitle, article.DraftContent, article.DraftCoverImageUrl), token);
            if (duplicateTitle)
                submission.RejectDuplicateTitle("Tiêu đề đã trùng với một bài viết đã được duyệt và đang công khai. Vui lòng đổi tiêu đề để thể hiện nội dung riêng của bài viết rồi gửi lại.", DateTimeOffset.UtcNow);
            article.LinkSubmission(submission, DateTimeOffset.UtcNow);
            await repository.SaveAsync(token);
            return ToMine(article);
        }, ct);
    }

    // GetMineAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<MyArticleDetail> GetMineAsync(Guid id, string ownerId, CancellationToken ct) =>
        ToMine(await GetOwnedAsync(id, ownerId, ct));

    // ListMineAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<ArticlePage<MyArticleDetail>> ListMineAsync(string ownerId, MyArticleListQuery query, CancellationToken ct)
    {
        ValidatePage(query.Page, query.PageSize);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (query.Status is { } status && !Enum.IsDefined(status))
            throw new ArticleException(ArticleError.Validation, "Trạng thái đã chọn chưa hợp lệ. Vui lòng chọn lại.");
        if (query.AiStatus is { } aiStatus && !Enum.IsDefined(aiStatus))
            throw new ArticleException(ArticleError.Validation, "Trạng thái kiểm tra của Hệ thống chưa hợp lệ. Vui lòng chọn lại.");
        var page = await repository.ListMineAsync(ownerId, query, ct);
        return new(page.Items.Select(ToMine).ToArray(), page.TotalCount, page.Page, page.PageSize);
    }

    // ListPublicAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<ArticlePage<ArticleSummary>> ListPublicAsync(ArticleListQuery query, CancellationToken ct)
    {
        ValidatePage(query.Page, query.PageSize);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (query.Search?.Length > 120 || query.Category?.Length > 120 ||
            (query.DietaryType is { } dietaryType && !Enum.IsDefined(dietaryType)))
            throw new ArticleException(ArticleError.Validation, "Từ khóa và tên danh mục không được vượt quá 120 ký tự.");
        var page = await repository.ListPublicAsync(query, ct);
        var names = await repository.AuthorNamesAsync(page.Items.Select(x => x.Submission.OwnerUserId), ct);
        return new(page.Items.Select(x => ToSummary(x, names.GetValueOrDefault(x.Submission.OwnerUserId))).ToArray(),
            page.TotalCount, page.Page, page.PageSize);
    }

    // GetPublicAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<ArticleDetail> GetPublicAsync(Guid id, CancellationToken ct)
    {
        var version = await repository.GetPublicAsync(id, ct)
            ?? throw new ArticleException(ArticleError.NotFound, "Không tìm thấy bài viết hoặc bài viết không còn được hiển thị.");
        var related = await repository.GetRelatedAsync(id, Categories(version.Categories), 4, ct);
        var names = await repository.AuthorNamesAsync(
            new[] { version }.Concat(related).Select(x => x.Submission.OwnerUserId), ct);
        var dietaryTypes = ToDietaryTypes(version.DietaryTypes);
        return new(version.ArticleId, version.Title, version.Content, version.Category, Categories(version.Categories), dietaryTypes,
            dietaryTypes.Count == 1 ? dietaryTypes[0] : null, version.CoverImageUrl, version.Submission.OwnerUserId,
            names.GetValueOrDefault(version.Submission.OwnerUserId), version.Version,
            PublishedAt(version), related.Select(x => ToSummary(x, names.GetValueOrDefault(x.Submission.OwnerUserId))).ToArray());
    }

    // GetOwnedAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    private async Task<Article> GetOwnedAsync(Guid id, string ownerId, CancellationToken ct)
    {
        var article = await repository.GetAsync(id, ct);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (article is null || article.OwnerUserId != ownerId)
            throw new ArticleException(ArticleError.NotFound, "Không tìm thấy bài viết hoặc bài viết không còn được hiển thị.");
        return article;
    }

    // EnsureEditable: Kiểm tra dữ liệu và điều kiện nghiệp vụ; dừng xử lý khi không hợp lệ.
    private static void EnsureEditable(Article article)
    {
        var latest = article.Versions.OrderByDescending(x => x.Version).FirstOrDefault();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (latest?.Submission.AdminReviewStatus is AdminReviewStatus.Submitted or AdminReviewStatus.PendingAdminReview)
            throw new ArticleException(ArticleError.Conflict, "Bài viết đang được kiểm duyệt. Bạn có thể chỉnh sửa sau khi có kết quả.");
        if (latest?.Submission.AdminReviewStatus == AdminReviewStatus.Removed)
            throw new ArticleException(ArticleError.Conflict, "Bài viết đã được gỡ nên chưa thể chỉnh sửa hoặc gửi duyệt lại.");
    }

    // ToMine: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static MyArticleDetail ToMine(Article article)
    {
        var versions = article.Versions.OrderByDescending(x => x.Version).ToArray();
        var published = versions.FirstOrDefault(x => x.Submission.AdminReviewStatus == AdminReviewStatus.Published
            && x.Submission.IsCurrentPublished);
        var dietaryTypes = ToDietaryTypes(article.DietaryTypes);
        return new(article.Id, article.DraftTitle, article.DraftContent, article.DraftCategory, Categories(article.Categories),
            dietaryTypes, dietaryTypes.Count == 1 ? dietaryTypes[0] : null, article.DraftCoverImageUrl, article.CreatedAt, article.UpdatedAt,
            versions.FirstOrDefault()?.Submission.AdminReviewStatus ?? AdminReviewStatus.Draft,
            published is null ? null : ToSummary(published),
            versions.Select(x => new ArticleVersionInfo(x.Version, x.SubmissionId,
                x.Submission.AiFlagStatus, x.Submission.AdminReviewStatus, x.Submission.AiSummary,
                x.Submission.Decisions.OrderByDescending(d => d.DecidedAt).FirstOrDefault()?.Reason,
                x.SubmittedAt, x.Submission.SystemRejectionReason)).ToArray());
    }

    // ToSummary: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static ArticleSummary ToSummary(ArticleVersion version, string? authorName = null)
    {
        var dietaryTypes = ToDietaryTypes(version.DietaryTypes);
        return new(version.ArticleId, version.Title, version.Category, Categories(version.Categories), dietaryTypes,
            dietaryTypes.Count == 1 ? dietaryTypes[0] : null, version.CoverImageUrl, version.Submission.OwnerUserId,
            authorName, version.Version,
            PublishedAt(version));
    }

    // PublishedAt: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static DateTimeOffset PublishedAt(ArticleVersion version) =>
        version.Submission.Decisions.Where(x => x.Decision == ModerationDecisionType.Approve)
            .OrderByDescending(x => x.DecidedAt).Select(x => x.DecidedAt).FirstOrDefault();

    // Validate: Kiểm tra dữ liệu và điều kiện nghiệp vụ; dừng xử lý khi không hợp lệ.
    private static void Validate(ArticleDraftRequest request)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(request.Title) || request.Title.Trim().Length > 200
            || string.IsNullOrWhiteSpace(request.Content) || request.Content.Trim().Length > 50_000
            || request.CoverImageUrl?.Length > 2_000
            || (request.CoverImageUrl is { Length: > 0 } image &&
                (!Uri.TryCreate(image, UriKind.Absolute, out var uri) || uri.Scheme is not ("http" or "https"))))
            throw new ArticleException(ArticleError.Validation, "Vui lòng kiểm tra tiêu đề, nội dung và đường dẫn ảnh bìa của bài viết.");

        _ = Categories(request);
        _ = DietaryTypes(request);
    }

    // DietaryTypes: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static IReadOnlyList<DietaryType> DietaryTypes(ArticleDraftRequest request)
    {
        var dietaryTypes = request.DietaryType is { } dietaryType
            ? [dietaryType]
            : request.DietaryTypes ?? [];
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (dietaryTypes.Count > 1 || dietaryTypes.Distinct().Count() != dietaryTypes.Count ||
            dietaryTypes.Any(type => !Enum.IsDefined(type)))
            throw new ArticleException(ArticleError.Validation, "Vui lòng chọn tối đa một chế độ ăn.");
        return dietaryTypes;
    }

    // Categories: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static IReadOnlyList<string> Categories(ArticleDraftRequest request)
    {
        var categories = request.Categories is { Count: > 0 }
            ? request.Categories
            : string.IsNullOrWhiteSpace(request.Category) ? [] : [request.Category];
        return NormalizeCategories(categories);
    }

    // Categories: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static IReadOnlyList<string> Categories(IEnumerable<ArticleCategory> source) =>
        NormalizeCategories(source.Select(item => item.Category));

    // Categories: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static IReadOnlyList<string> Categories(IEnumerable<ArticleVersionCategory> source) =>
        NormalizeCategories(source.Select(item => item.Category));

    // NormalizeCategories: Chuẩn hóa hoặc chuyển đổi dữ liệu giữa các bước xử lý.
    private static IReadOnlyList<string> NormalizeCategories(IEnumerable<string> source)
    {
        var categories = source.Select(category => category?.Trim() ?? string.Empty)
            .Where(category => category.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(category => category, StringComparer.OrdinalIgnoreCase)
            .ToArray();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (categories.Length is 0 or > 8 || categories.Any(category => category.Length > 120))
            throw new ArticleException(ArticleError.Validation, "Vui lòng chọn từ 1 đến 8 danh mục; mỗi tên không quá 120 ký tự.");
        return categories;
    }

    // ToDietaryTypes: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static IReadOnlyList<DietaryType> ToDietaryTypes(IEnumerable<ArticleDietaryType> source) =>
        source.Select(x => x.DietaryType).OrderBy(x => x).ToArray();

    // ToDietaryTypes: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static IReadOnlyList<DietaryType> ToDietaryTypes(IEnumerable<ArticleVersionDietaryType> source) =>
        source.Select(x => x.DietaryType).OrderBy(x => x).ToArray();

    // ValidatePage: Kiểm tra dữ liệu và điều kiện nghiệp vụ; dừng xử lý khi không hợp lệ.
    private static void ValidatePage(int page, int pageSize)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (page < 1 || pageSize is < 1 or > 100 || (long)(page - 1) * pageSize > int.MaxValue)
            throw new ArticleException(ArticleError.Validation, "Trang phải từ 1 trở lên và số mục mỗi trang từ 1 đến 100.");
    }
}
