using Domain.Entities;
using Domain.Enums;
using Application.Features.Videos;

namespace Application.Features.Moderation;

public sealed class ModerationService(IModerationRepository repository, IVideoPublication videos)
{
    public async Task<ModerationSubmission> SubmitFirstVideoAsync(Guid videoId, string ownerUserId,
        string title, string description, string mediaKey, CancellationToken ct)
    {
        if (await repository.GetLatestForContentAsync(videoId, ct) is not null)
            throw new ModerationException(ModerationError.Conflict, "Video was already submitted.");
        var submission = ModerationSubmission.Submit(videoId, 1, ModeratedContentType.Video,
            ownerUserId, title, description, mediaKey, DateTimeOffset.UtcNow);
        await repository.AddAsync(submission, ct);
        await repository.SaveChangesAsync(ct);
        return submission;
    }
    public async Task<ModerationSubmission> SubmitAsync(
        string ownerUserId,
        SubmitModerationCommand command,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(ownerUserId) || ownerUserId.Length > 450)
            throw new ModerationException(ModerationError.Forbidden, "A signed-in user is required.");

        if (!Enum.IsDefined(command.ContentType)
            || string.IsNullOrWhiteSpace(command.Title)
            || command.Title.Length > 200
            || string.IsNullOrWhiteSpace(command.TextContent)
            || command.TextContent.Length > 50_000
            || command.MediaReference?.Length > 2_000)
        {
            throw new ModerationException(ModerationError.Validation, "Content type, title and text content are required and must fit the allowed lengths.");
        }

        if (command.ContentType == ModeratedContentType.Video
            && string.IsNullOrWhiteSpace(command.MediaReference))
        {
            throw new ModerationException(ModerationError.Validation, "A stored video media reference is required.");
        }

        Guid contentId;
        int version;
        if (command.ContentId is { } existingId)
        {
            if (existingId == Guid.Empty)
                throw new ModerationException(ModerationError.Validation, "Content ID must not be empty.");

            var latest = await repository.GetLatestForContentAsync(existingId, cancellationToken)
                ?? throw new ModerationException(ModerationError.NotFound, "Content was not found.");

            if (latest.OwnerUserId != ownerUserId)
                throw new ModerationException(ModerationError.Forbidden, "This content belongs to another user.");

            if (latest.ContentType != command.ContentType)
                throw new ModerationException(ModerationError.Validation, "Content type cannot change between versions.");

            if (latest.AdminReviewStatus is not (
                AdminReviewStatus.RevisionRequested or AdminReviewStatus.Rejected or AdminReviewStatus.Published))
            {
                throw new ModerationException(ModerationError.Conflict, "The latest version cannot be resubmitted yet.");
            }

            contentId = existingId;
            version = checked(latest.Version + 1);
        }
        else
        {
            contentId = Guid.NewGuid();
            version = 1;
        }

        var submission = ModerationSubmission.Submit(
            contentId,
            version,
            command.ContentType,
            ownerUserId,
            command.Title,
            command.TextContent,
            command.MediaReference,
            DateTimeOffset.UtcNow);

        await repository.AddAsync(submission, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return submission;
    }

    public async Task<ModerationSubmission> GetOwnedAsync(
        Guid submissionId,
        string ownerUserId,
        CancellationToken cancellationToken)
    {
        var submission = await repository.GetByIdAsync(submissionId, cancellationToken)
            ?? throw new ModerationException(ModerationError.NotFound, "Submission was not found.");

        if (submission.OwnerUserId != ownerUserId)
            throw new ModerationException(ModerationError.NotFound, "Submission was not found.");

        return submission;
    }

    public Task<ModerationPage> GetOwnedPageAsync(
        string ownerUserId,
        ModeratedContentType? contentType,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(ownerUserId) || ownerUserId.Length > 450)
            throw new ModerationException(ModerationError.Forbidden, "A signed-in user is required.");

        ValidatePage(page, pageSize);
        if (contentType is { } type && !Enum.IsDefined(type))
            throw new ModerationException(ModerationError.Validation, "Invalid content type.");
        return repository.SearchAsync(
            new ModerationSearch(ownerUserId, contentType, null, null, page, pageSize),
            cancellationToken);
    }

    public async Task<ModerationSubmission> RetryAiAsync(
        Guid submissionId,
        string ownerUserId,
        CancellationToken cancellationToken)
    {
        var submission = await GetOwnedAsync(submissionId, ownerUserId, cancellationToken);

        try
        {
            submission.RetryAiCheck(DateTimeOffset.UtcNow);
        }
        catch (InvalidOperationException ex)
        {
            throw new ModerationException(ModerationError.Conflict, ex.Message);
        }

        await repository.SaveChangesAsync(cancellationToken);
        return submission;
    }

    // Called by a trusted backend AI worker after it has performed a real check.
    // It is intentionally not exposed as an HTTP endpoint.
    public async Task<ModerationSubmission> RecordAiResultAsync(
        Guid submissionId,
        ModerationAiResult result,
        CancellationToken cancellationToken)
    {
        var submission = await repository.GetByIdAsync(submissionId, cancellationToken)
            ?? throw new ModerationException(ModerationError.NotFound, "Submission was not found.");

        var latest = await repository.GetLatestForContentAsync(submission.ContentId, cancellationToken);
        if (latest?.Id != submission.Id)
            throw new ModerationException(ModerationError.Conflict, "AI result belongs to an older version.");

        try
        {
            submission.RecordAiResult(
                result.Status,
                result.Summary,
                result.CheckedScope,
                result.UncheckedScope,
                DateTimeOffset.UtcNow,
                result.FlagReason,
                result.FlagType,
                result.Priority,
                result.Evidence);
        }
        catch (ArgumentException ex)
        {
            throw new ModerationException(ModerationError.Validation, ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            throw new ModerationException(ModerationError.Conflict, ex.Message);
        }

        await repository.SaveChangesAsync(cancellationToken);
        return submission;
    }

    public async Task<ModerationSubmission> GetForAdminAsync(
        Guid submissionId,
        CancellationToken cancellationToken)
    {
        return await repository.GetByIdAsync(submissionId, cancellationToken)
            ?? throw new ModerationException(ModerationError.NotFound, "Submission was not found.");
    }

    public Task<ModerationPage> GetAdminPageAsync(
        ModeratedContentType? contentType,
        AiFlagStatus? aiStatus,
        AdminReviewStatus? adminStatus,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        ValidatePage(page, pageSize);
        if ((contentType is { } type && !Enum.IsDefined(type))
            || (aiStatus is { } ai && !Enum.IsDefined(ai))
            || (adminStatus is { } admin && !Enum.IsDefined(admin)))
        {
            throw new ModerationException(ModerationError.Validation, "Invalid moderation filter.");
        }

        return repository.SearchAsync(
            new ModerationSearch(null, contentType, aiStatus, adminStatus, page, pageSize),
            cancellationToken);
    }

    public async Task<ModerationSubmission> DecideAsync(
        Guid submissionId,
        ModerationDecisionType decision,
        string adminUserId,
        string reason,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(adminUserId) || adminUserId.Length > 450)
            throw new ModerationException(ModerationError.Forbidden, "An Admin identity is required.");

        if (!Enum.IsDefined(decision) || string.IsNullOrWhiteSpace(reason) || reason.Length > 2_000)
            throw new ModerationException(ModerationError.Validation, "A valid decision and a reason of at most 2000 characters are required.");

        var submission = await repository.GetByIdAsync(submissionId, cancellationToken)
            ?? throw new ModerationException(ModerationError.NotFound, "Submission was not found.");

        if (decision == ModerationDecisionType.Approve)
        {
            var latest = await repository.GetLatestForContentAsync(submission.ContentId, cancellationToken);
            if (latest?.Id != submission.Id)
                throw new ModerationException(ModerationError.Conflict, "Cannot approve an older version.");
            if (submission.AdminReviewStatus != AdminReviewStatus.PendingAdminReview
                || submission.AiFlagStatus is not (
                    AiFlagStatus.Passed or AiFlagStatus.Flagged or AiFlagStatus.Partial))
            {
                throw new ModerationException(ModerationError.Conflict, "Admin review requires a completed AI check.");
            }

            await repository.ExecuteInTransactionAsync(async ct =>
            {
                var previous = await repository.GetCurrentPublishedAsync(submission.ContentId, ct);
                if (previous is not null && previous.Id != submission.Id)
                {
                    previous.SupersedePublishedVersion(DateTimeOffset.UtcNow);
                    await repository.SaveChangesAsync(ct);
                }

                submission.Decide(decision, adminUserId, reason, DateTimeOffset.UtcNow);
                await repository.SaveChangesAsync(ct);
                if (submission.ContentType == ModeratedContentType.Video)
                    await videos.ApplyDecisionAsync(submission.ContentId, submission.Id, true, ct);
            }, cancellationToken);
        }
        else
        {
            try
            {
                submission.Decide(decision, adminUserId, reason, DateTimeOffset.UtcNow);
            }
            catch (InvalidOperationException ex)
            {
                throw new ModerationException(ModerationError.Conflict, ex.Message);
            }

            if (decision == ModerationDecisionType.Remove && submission.ContentType == ModeratedContentType.Video)
            {
                await repository.ExecuteInTransactionAsync(async ct =>
                {
                    await repository.SaveChangesAsync(ct);
                    await videos.ApplyDecisionAsync(submission.ContentId, submission.Id, false, ct);
                }, cancellationToken);
            }
            else await repository.SaveChangesAsync(cancellationToken);
        }
        return submission;
    }

    private static void ValidatePage(int page, int pageSize)
    {
        if (page < 1 || pageSize is < 1 or > 100
            || (long)(page - 1) * pageSize > int.MaxValue)
            throw new ModerationException(ModerationError.Validation, "Page must be positive and page size must be between 1 and 100.");
    }
}
