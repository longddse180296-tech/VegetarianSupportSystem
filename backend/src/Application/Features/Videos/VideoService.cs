// Chức năng: video, bản nháp và nội dung công khai. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Application.Features.Moderation;
using Domain.Entities;
using Domain.Enums;

namespace Application.Features.Videos;

// VideoDetails: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record VideoDetails(Guid Id, string Title, string Description, Guid? CategoryId,
    string UploadStatus, AiFlagStatus? AiFlagStatus, AdminReviewStatus? AdminReviewStatus,
    int? Version, string? AiSummary, string? AiUncheckedScope, string? AdminReason,
    string? MediaUrl, string? ThumbnailUrl, long ViewCount, int FavoriteCount,
    DateTimeOffset CreatedAtUtc, string? AuthorName, double? DurationSeconds = null,
    bool? HasAudio = null, string MetadataStatus = "Unavailable");
// VideoPage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record VideoPage(IReadOnlyList<VideoDetails> Items, int TotalCount, int Page, int PageSize);

// VideoService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed class VideoService(IVideoRepository repository, IModerationRepository moderation, VideoMetadataService metadata)
{
    // CreateAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<VideoDetails> CreateAsync(string userId, string title, string description,
        Guid? categoryId, CancellationToken ct)
    {
        await CheckCategory(categoryId, ct);
        var video = Video.Create(userId, title, description, categoryId);
        await repository.AddAsync(video, ct);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
        return await MapAsync(video, false, ct);
    }

    // EditAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<VideoDetails?> EditAsync(Guid id, string userId, string title,
        string description, Guid? categoryId, CancellationToken ct)
    {
        var video = await GetOwnedAsync(id, userId, ct);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (video is null) return null;
        await EnsureEditable(video, ct);
        await CheckCategory(categoryId, ct);
        video.Edit(title, description, categoryId);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
        return await MapAsync(video, false, ct);
    }

    // SetMediaAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<VideoDetails?> SetMediaAsync(Guid id, string userId, string key,
        bool thumbnail, CancellationToken ct)
    {
        var video = await GetOwnedAsync(id, userId, ct);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (video is null) return null;
        await EnsureEditable(video, ct);
        if (thumbnail) video.SetThumbnail(key);
        else
        {
            await metadata.InspectUploadAsync(key, ct);
            video.SetMedia(key);
        }
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
        return await MapAsync(video, false, ct);
    }

    // BeginMediaUploadAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<bool> BeginMediaUploadAsync(Guid id, string userId, CancellationToken ct)
    {
        var video = await GetOwnedAsync(id, userId, ct);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (video is null) return false;
        await EnsureEditable(video, ct);
        video.BeginUpload();
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
        return true;
    }

    // CanEditAsync: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    public async Task<bool> CanEditAsync(Guid id, string userId, CancellationToken ct)
    {
        var video = await GetOwnedAsync(id, userId, ct);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (video is null) return false;
        await EnsureEditable(video, ct);
        return true;
    }

    // FailUploadAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task FailUploadAsync(Guid id, string userId, CancellationToken ct)
    {
        var video = await GetOwnedAsync(id, userId, ct);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (video is null) return;
        video.FailUpload();
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
    }

    // SubmitAsync: Chuyển bản nội dung hợp lệ sang quy trình gửi duyệt.
    public async Task<ModerationSubmission?> SubmitAsync(Guid id, string userId,
        ModerationService moderationService, CancellationToken ct)
    {
        var video = await GetOwnedAsync(id, userId, ct);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (video is null) return null;
        await EnsureEditable(video, ct);
        if (video.UploadStatus != "Ready" || video.MediaKey is null)
            throw new InvalidOperationException("Vui lòng tải video hợp lệ lên trước khi gửi duyệt.");
        if (await moderation.GetLatestForContentAsync(id, ct) is null)
            return await moderationService.SubmitFirstVideoAsync(id, userId, video.Title,
                video.Description, video.MediaKey, ct);
        return await moderationService.SubmitAsync(userId, new SubmitModerationCommand(
            id, ModeratedContentType.Video, video.Title, video.Description, video.MediaKey), ct);
    }

    // GetMineAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<VideoDetails?> GetMineAsync(Guid id, string userId, CancellationToken ct)
    {
        var video = await GetOwnedAsync(id, userId, ct);
        return video is null ? null : await MapAsync(video, false, ct);
    }

    // GetPublicAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<VideoDetails?> GetPublicAsync(Guid id, CancellationToken ct)
    {
        var video = await repository.GetAsync(id, ct);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (video?.PublishedSubmissionId is null) return null;
        var published = await moderation.GetCurrentPublishedAsync(id, ct);
        if (published?.Id != video.PublishedSubmissionId) return null;
        return await MapAsync(video, true, ct, published);
    }

    // RecordViewAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<bool> RecordViewAsync(Guid id, CancellationToken ct)
    {
        var video = await repository.GetAsync(id, ct);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (video?.PublishedSubmissionId is null) return false;
        var published = await moderation.GetCurrentPublishedAsync(id, ct);
        if (published?.Id != video.PublishedSubmissionId) return false;
        await repository.IncrementViewAsync(id, ct);
        return true;
    }

    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<VideoPage> ListAsync(string? owner, bool publishedOnly, int page,
        int pageSize, CancellationToken ct)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (page < 1 || pageSize is < 1 or > 100) throw new ArgumentException("Thông tin phân trang chưa hợp lệ. Vui lòng tải lại danh sách.");
        var (items, total) = await repository.ListAsync(owner, publishedOnly, page, pageSize, ct);
        var names = await repository.AuthorNamesAsync(items.Select(x => x.OwnerUserId), ct);
        var output = new List<VideoDetails>();
        foreach (var video in items)
        {
            var published = publishedOnly ? await moderation.GetCurrentPublishedAsync(video.Id, ct) : null;
            if (publishedOnly && published?.Id != video.PublishedSubmissionId) continue;
            output.Add(await MapAsync(video, publishedOnly, ct, published, names));
        }
        return new VideoPage(output, total, page, pageSize);
    }

    // OpenMediaAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<(Stream Stream, string MimeType)?> OpenMediaAsync(Guid id, string? userId,
        bool isAdmin, bool thumbnail, Guid? submissionId, IPrivateMediaStore store, CancellationToken ct)
    {
        var video = await repository.GetAsync(id, ct);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (video is null) return null;
        var isOwner = userId == video.OwnerUserId;
        var published = await moderation.GetCurrentPublishedAsync(id, ct);
        if (!isOwner && !isAdmin && (published is null || published.Id != video.PublishedSubmissionId)) return null;
        var requested = submissionId is { } requestedId && (isOwner || isAdmin)
            ? await moderation.GetByIdAsync(requestedId, ct) : null;
        if (submissionId is not null && (requested?.ContentId != id ||
            requested.OwnerUserId != video.OwnerUserId)) return null;
        var key = requested is not null && !thumbnail ? requested.MediaReference :
            isOwner || isAdmin ? (thumbnail ? video.ThumbnailKey : video.MediaKey)
            : (thumbnail ? video.PublishedThumbnailKey : published?.MediaReference);
        if (key is null) return null;
        var stream = await store.OpenReadAsync(key, ct);
        if (stream is null) return null;
        var mime = Path.GetExtension(key).ToLowerInvariant() switch
        {
            ".mp4" => "video/mp4", ".webm" => "video/webm", ".jpg" => "image/jpeg",
            ".png" => "image/png", ".webp" => "image/webp", _ => "application/octet-stream"
        };
        return (stream, mime);
    }

    // GetOwnedAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    private async Task<Video?> GetOwnedAsync(Guid id, string userId, CancellationToken ct)
    {
        var video = await repository.GetAsync(id, ct);
        return video?.OwnerUserId == userId ? video : null;
    }
    // CheckCategory: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private async Task CheckCategory(Guid? id, CancellationToken ct)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (id is { } value && !await repository.CategoryExistsAsync(value, ct))
            throw new ArgumentException("Danh mục không còn khả dụng. Vui lòng chọn danh mục khác.");
    }
    // EnsureEditable: Kiểm tra dữ liệu và điều kiện nghiệp vụ; dừng xử lý khi không hợp lệ.
    private async Task EnsureEditable(Video video, CancellationToken ct)
    {
        var latest = await moderation.GetLatestForContentAsync(video.Id, ct);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (latest?.AdminReviewStatus is AdminReviewStatus.Submitted or AdminReviewStatus.PendingAdminReview)
            throw new InvalidOperationException("Video đang được kiểm duyệt. Vui lòng chờ kết quả trước khi chỉnh sửa.");
    }
    // MapAsync: Chuẩn hóa hoặc chuyển đổi dữ liệu giữa các bước xử lý.
    private async Task<VideoDetails> MapAsync(Video video, bool publicView, CancellationToken ct,
        ModerationSubmission? published = null, IReadOnlyDictionary<string, string>? authorNames = null)
    {
        var submission = publicView ? published : await moderation.GetLatestForContentAsync(video.Id, ct);
        var decision = submission?.Decisions.OrderByDescending(x => x.DecidedAt).FirstOrDefault();
        var names = authorNames ?? await repository.AuthorNamesAsync([video.OwnerUserId], ct);
        // Metadata lấy theo đúng media của phiên bản được phép xem, không theo media nháp mới nhất.
        var mediaKey = publicView ? published?.MediaReference : video.MediaKey;
        var info = mediaKey is null ? null : await metadata.GetAsync(mediaKey, ct);
        return new VideoDetails(video.Id, publicView ? published!.Title : video.Title,
            publicView ? published!.TextContent : video.Description,
            publicView ? video.PublishedCategoryId : video.CategoryId,
            video.UploadStatus, submission?.AiFlagStatus, submission?.AdminReviewStatus,
            submission?.Version, submission?.AiSummary, submission?.AiUncheckedScope,
            decision?.Reason,
            (publicView ? published?.MediaReference : video.MediaKey) is null ? null : $"/api/videos/{video.Id}/media",
            (publicView ? video.PublishedThumbnailKey : video.ThumbnailKey) is null ? null : $"/api/videos/{video.Id}/thumbnail",
            video.ViewCount, await repository.FavoriteCountAsync(video.Id, ct), video.CreatedAtUtc,
            names.GetValueOrDefault(video.OwnerUserId), info?.DurationSeconds, info?.HasAudio,
            mediaKey is null ? "Unavailable" : info is null ? "Processing" : info.DurationSeconds is null ? "Unavailable" : "Ready");
    }
}
