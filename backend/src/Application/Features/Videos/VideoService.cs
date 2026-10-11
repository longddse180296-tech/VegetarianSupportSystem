using Application.Features.Moderation;
using Domain.Entities;
using Domain.Enums;

namespace Application.Features.Videos;

public sealed record VideoDetails(Guid Id, string Title, string Description, Guid? CategoryId,
    string UploadStatus, AiFlagStatus? AiFlagStatus, AdminReviewStatus? AdminReviewStatus,
    int? Version, string? AiSummary, string? AiUncheckedScope, string? AdminReason,
    string? MediaUrl, string? ThumbnailUrl, long ViewCount, int FavoriteCount,
    DateTimeOffset CreatedAtUtc);
public sealed record VideoPage(IReadOnlyList<VideoDetails> Items, int TotalCount, int Page, int PageSize);

public sealed class VideoService(IVideoRepository repository, IModerationRepository moderation)
{
    public async Task<VideoDetails> CreateAsync(string userId, string title, string description,
        Guid? categoryId, CancellationToken ct)
    {
        await CheckCategory(categoryId, ct);
        var video = Video.Create(userId, title, description, categoryId);
        await repository.AddAsync(video, ct);
        await repository.SaveAsync(ct);
        return await MapAsync(video, false, ct);
    }

    public async Task<VideoDetails?> EditAsync(Guid id, string userId, string title,
        string description, Guid? categoryId, CancellationToken ct)
    {
        var video = await GetOwnedAsync(id, userId, ct);
        if (video is null) return null;
        await EnsureEditable(video, ct);
        await CheckCategory(categoryId, ct);
        video.Edit(title, description, categoryId);
        await repository.SaveAsync(ct);
        return await MapAsync(video, false, ct);
    }

    public async Task<VideoDetails?> SetMediaAsync(Guid id, string userId, string key,
        bool thumbnail, CancellationToken ct)
    {
        var video = await GetOwnedAsync(id, userId, ct);
        if (video is null) return null;
        await EnsureEditable(video, ct);
        if (thumbnail) video.SetThumbnail(key);
        else video.SetMedia(key);
        await repository.SaveAsync(ct);
        return await MapAsync(video, false, ct);
    }

    public async Task<bool> BeginMediaUploadAsync(Guid id, string userId, CancellationToken ct)
    {
        var video = await GetOwnedAsync(id, userId, ct);
        if (video is null) return false;
        await EnsureEditable(video, ct);
        video.BeginUpload();
        await repository.SaveAsync(ct);
        return true;
    }

    public async Task<bool> CanEditAsync(Guid id, string userId, CancellationToken ct)
    {
        var video = await GetOwnedAsync(id, userId, ct);
        if (video is null) return false;
        await EnsureEditable(video, ct);
        return true;
    }

    public async Task FailUploadAsync(Guid id, string userId, CancellationToken ct)
    {
        var video = await GetOwnedAsync(id, userId, ct);
        if (video is null) return;
        video.FailUpload();
        await repository.SaveAsync(ct);
    }

    public async Task<ModerationSubmission?> SubmitAsync(Guid id, string userId,
        ModerationService moderationService, CancellationToken ct)
    {
        var video = await GetOwnedAsync(id, userId, ct);
        if (video is null) return null;
        await EnsureEditable(video, ct);
        if (video.UploadStatus != "Ready" || video.MediaKey is null)
            throw new InvalidOperationException("Upload a valid video before submitting.");
        if (await moderation.GetLatestForContentAsync(id, ct) is null)
            return await moderationService.SubmitFirstVideoAsync(id, userId, video.Title,
                video.Description, video.MediaKey, ct);
        return await moderationService.SubmitAsync(userId, new SubmitModerationCommand(
            id, ModeratedContentType.Video, video.Title, video.Description, video.MediaKey), ct);
    }

    public async Task<VideoDetails?> GetMineAsync(Guid id, string userId, CancellationToken ct)
    {
        var video = await GetOwnedAsync(id, userId, ct);
        return video is null ? null : await MapAsync(video, false, ct);
    }

    public async Task<VideoDetails?> GetPublicAsync(Guid id, CancellationToken ct)
    {
        var video = await repository.GetAsync(id, ct);
        if (video?.PublishedSubmissionId is null) return null;
        var published = await moderation.GetCurrentPublishedAsync(id, ct);
        if (published?.Id != video.PublishedSubmissionId) return null;
        return await MapAsync(video, true, ct, published);
    }

    public async Task<bool> RecordViewAsync(Guid id, CancellationToken ct)
    {
        var video = await repository.GetAsync(id, ct);
        if (video?.PublishedSubmissionId is null) return false;
        var published = await moderation.GetCurrentPublishedAsync(id, ct);
        if (published?.Id != video.PublishedSubmissionId) return false;
        await repository.IncrementViewAsync(id, ct);
        return true;
    }

    public async Task<VideoPage> ListAsync(string? owner, bool publishedOnly, int page,
        int pageSize, CancellationToken ct)
    {
        if (page < 1 || pageSize is < 1 or > 100) throw new ArgumentException("Invalid pagination.");
        var (items, total) = await repository.ListAsync(owner, publishedOnly, page, pageSize, ct);
        var output = new List<VideoDetails>();
        foreach (var video in items)
        {
            var published = publishedOnly ? await moderation.GetCurrentPublishedAsync(video.Id, ct) : null;
            if (publishedOnly && published?.Id != video.PublishedSubmissionId) continue;
            output.Add(await MapAsync(video, publishedOnly, ct, published));
        }
        return new VideoPage(output, total, page, pageSize);
    }

    public async Task<(Stream Stream, string MimeType)?> OpenMediaAsync(Guid id, string? userId,
        bool isAdmin, bool thumbnail, Guid? submissionId, IPrivateMediaStore store, CancellationToken ct)
    {
        var video = await repository.GetAsync(id, ct);
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

    private async Task<Video?> GetOwnedAsync(Guid id, string userId, CancellationToken ct)
    {
        var video = await repository.GetAsync(id, ct);
        return video?.OwnerUserId == userId ? video : null;
    }
    private async Task CheckCategory(Guid? id, CancellationToken ct)
    {
        if (id is { } value && !await repository.CategoryExistsAsync(value, ct))
            throw new ArgumentException("Category does not exist or is inactive.");
    }
    private async Task EnsureEditable(Video video, CancellationToken ct)
    {
        var latest = await moderation.GetLatestForContentAsync(video.Id, ct);
        if (latest?.AdminReviewStatus is AdminReviewStatus.Submitted or AdminReviewStatus.PendingAdminReview)
            throw new InvalidOperationException("Wait for review before changing this video.");
    }
    private async Task<VideoDetails> MapAsync(Video video, bool publicView, CancellationToken ct,
        ModerationSubmission? published = null)
    {
        var submission = publicView ? published : await moderation.GetLatestForContentAsync(video.Id, ct);
        var decision = submission?.Decisions.OrderByDescending(x => x.DecidedAt).FirstOrDefault();
        return new VideoDetails(video.Id, publicView ? published!.Title : video.Title,
            publicView ? published!.TextContent : video.Description,
            publicView ? video.PublishedCategoryId : video.CategoryId,
            video.UploadStatus, submission?.AiFlagStatus, submission?.AdminReviewStatus,
            submission?.Version, submission?.AiSummary, submission?.AiUncheckedScope,
            decision?.Reason,
            (publicView ? published?.MediaReference : video.MediaKey) is null ? null : $"/api/videos/{video.Id}/media",
            (publicView ? video.PublishedThumbnailKey : video.ThumbnailKey) is null ? null : $"/api/videos/{video.Id}/thumbnail",
            video.ViewCount, await repository.FavoriteCountAsync(video.Id, ct), video.CreatedAtUtc);
    }
}
