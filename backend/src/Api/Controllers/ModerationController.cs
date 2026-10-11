using System.Security.Claims;
using Application.Features.Moderation;
using Domain.Entities;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Authorize(Roles = "User,Admin")]
[Route("api/moderation/submissions")]
public sealed class ModerationController(ModerationService moderationService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Submit(
        [FromBody] SubmitModerationRequest request,
        CancellationToken cancellationToken)
    {
        if (request.ContentType == ModeratedContentType.Video)
            return BadRequest(new ProblemDetails { Detail = "Submit videos through /api/me/videos/{id}/submit." });
        if (request.ContentType == ModeratedContentType.Article)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new ProblemDetails
            {
                Status = StatusCodes.Status503ServiceUnavailable,
                Detail = "Article draft/version backend is not integrated yet. No moderation submission was created."
            });
        var ownerUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(ownerUserId)) return Unauthorized();

        try
        {
            var submission = await moderationService.SubmitAsync(
                ownerUserId,
                new SubmitModerationCommand(
                    request.ContentId,
                    request.ContentType,
                    request.Title,
                    request.TextContent,
                    request.MediaReference),
                cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = submission.Id },
                ModerationSubmissionResponse.From(submission));
        }
        catch (ModerationException ex)
        {
            return ModerationHttpError.From(ex);
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetMine(
        [FromQuery] ModeratedContentType? contentType,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var ownerUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(ownerUserId)) return Unauthorized();

        try
        {
            var result = await moderationService.GetOwnedPageAsync(
                ownerUserId, contentType, page, pageSize, cancellationToken);
            return Ok(ModerationPageResponse.From(result));
        }
        catch (ModerationException ex)
        {
            return ModerationHttpError.From(ex);
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var ownerUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(ownerUserId)) return Unauthorized();

        try
        {
            var submission = await moderationService.GetOwnedAsync(id, ownerUserId, cancellationToken);
            return Ok(ModerationSubmissionResponse.From(submission));
        }
        catch (ModerationException ex)
        {
            return ModerationHttpError.From(ex);
        }
    }

    [HttpPost("{id:guid}/retry-ai")]
    public async Task<IActionResult> RetryAi(Guid id, CancellationToken cancellationToken)
    {
        var ownerUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(ownerUserId)) return Unauthorized();

        try
        {
            var submission = await moderationService.RetryAiAsync(id, ownerUserId, cancellationToken);
            return Ok(ModerationSubmissionResponse.From(submission));
        }
        catch (ModerationException ex)
        {
            return ModerationHttpError.From(ex);
        }
    }
}

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/moderation/submissions")]
public sealed class AdminModerationController(
    ModerationService moderationService,
    IHostEnvironment hostEnvironment) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] ModeratedContentType? contentType,
        [FromQuery] AiFlagStatus? aiStatus,
        [FromQuery] AdminReviewStatus? adminStatus,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await moderationService.GetAdminPageAsync(
                contentType, aiStatus, adminStatus, page, pageSize, cancellationToken);
            return Ok(ModerationPageResponse.From(result));
        }
        catch (ModerationException ex)
        {
            return ModerationHttpError.From(ex);
        }
    }

    [HttpGet("queue")]
    public async Task<IActionResult> GetQueue(
        [FromQuery] ModeratedContentType? contentType,
        [FromQuery] AiFlagStatus? aiStatus,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await moderationService.GetAdminPageAsync(
                contentType,
                aiStatus,
                AdminReviewStatus.PendingAdminReview,
                page,
                pageSize,
                cancellationToken);
            return Ok(ModerationPageResponse.From(result));
        }
        catch (ModerationException ex)
        {
            return ModerationHttpError.From(ex);
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var submission = await moderationService.GetForAdminAsync(id, cancellationToken);
            return Ok(ModerationSubmissionResponse.From(submission));
        }
        catch (ModerationException ex)
        {
            return ModerationHttpError.From(ex);
        }
    }

    [HttpPost("{id:guid}/decisions")]
    public async Task<IActionResult> Decide(
        Guid id,
        [FromBody] MakeModerationDecisionRequest request,
        CancellationToken cancellationToken)
    {
        var adminUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(adminUserId)) return Unauthorized();

        try
        {
            var submission = await moderationService.DecideAsync(
                id,
                request.Decision,
                adminUserId,
                request.Reason,
                cancellationToken);
            return Ok(ModerationSubmissionResponse.From(submission));
        }
        catch (ModerationException ex)
        {
            return ModerationHttpError.From(ex);
        }
    }

    [HttpPost("{id:guid}/mock-ai-result")]
    public async Task<IActionResult> RecordMockAiResult(
        Guid id,
        [FromBody] MockAiResultRequest request,
        CancellationToken cancellationToken)
    {
        if (!hostEnvironment.IsDevelopment()) return NotFound();

        try
        {
            var submission = await moderationService.RecordAiResultAsync(
                id,
                new ModerationAiResult(
                    request.Status,
                    request.Summary,
                    request.CheckedScope,
                    request.UncheckedScope,
                    request.FlagReason),
                cancellationToken);
            return Ok(ModerationSubmissionResponse.From(submission));
        }
        catch (ModerationException ex)
        {
            return ModerationHttpError.From(ex);
        }
    }
}

public sealed record SubmitModerationRequest(
    Guid? ContentId,
    ModeratedContentType ContentType,
    string Title,
    string TextContent,
    string? MediaReference);

public sealed record MakeModerationDecisionRequest(
    ModerationDecisionType Decision,
    string Reason);

public sealed record MockAiResultRequest(
    AiFlagStatus Status,
    string Summary,
    string? CheckedScope,
    string? UncheckedScope,
    string? FlagReason);

public sealed record ModerationDecisionResponse(
    Guid Id,
    int Version,
    ModerationDecisionType Decision,
    string AdminUserId,
    string Reason,
    DateTimeOffset DecidedAt)
{
    public static ModerationDecisionResponse From(ModerationDecision decision) => new(
        decision.Id,
        decision.Version,
        decision.Decision,
        decision.AdminUserId,
        decision.Reason,
        decision.DecidedAt);
}

public sealed record ModerationSubmissionResponse(
    Guid Id,
    Guid ContentId,
    int Version,
    ModeratedContentType ContentType,
    string OwnerUserId,
    string Title,
    string TextContent,
    string? MediaReference,
    AiFlagStatus AiFlagStatus,
    AdminReviewStatus AdminReviewStatus,
    string? AiSummary,
    string? AiFlagReason,
    string? AiFlagType,
    string? AiPriority,
    string? AiEvidence,
    string? AiCheckedScope,
    string? AiUncheckedScope,
    DateTimeOffset? AiCheckedAt,
    DateTimeOffset SubmittedAt,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc,
    bool IsCurrentPublished,
    IReadOnlyList<ModerationDecisionResponse> Decisions)
{
    public static ModerationSubmissionResponse From(ModerationSubmission submission) => new(
        submission.Id,
        submission.ContentId,
        submission.Version,
        submission.ContentType,
        submission.OwnerUserId,
        submission.Title,
        submission.TextContent,
        submission.MediaReference,
        submission.AiFlagStatus,
        submission.AdminReviewStatus,
        submission.AiSummary,
        submission.AiFlagReason,
        submission.AiFlagType,
        submission.AiPriority,
        submission.AiEvidence,
        submission.AiCheckedScope,
        submission.AiUncheckedScope,
        submission.AiCheckedAt,
        submission.SubmittedAt,
        submission.CreatedAtUtc,
        submission.UpdatedAtUtc,
        submission.IsCurrentPublished,
        submission.Decisions.OrderBy(x => x.DecidedAt).Select(ModerationDecisionResponse.From).ToArray());
}

public sealed record ModerationPageResponse(
    IReadOnlyList<ModerationSubmissionResponse> Items,
    int TotalCount,
    int Page,
    int PageSize)
{
    public static ModerationPageResponse From(ModerationPage page) => new(
        page.Items.Select(ModerationSubmissionResponse.From).ToArray(),
        page.TotalCount,
        page.Page,
        page.PageSize);
}

internal static class ModerationHttpError
{
    public static ObjectResult From(ModerationException exception)
    {
        var statusCode = exception.Error switch
        {
            ModerationError.Validation => StatusCodes.Status400BadRequest,
            ModerationError.NotFound => StatusCodes.Status404NotFound,
            ModerationError.Forbidden => StatusCodes.Status403Forbidden,
            ModerationError.Conflict => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status500InternalServerError
        };

        return new ObjectResult(new ProblemDetails
        {
            Status = statusCode,
            Title = exception.Error.ToString(),
            Detail = exception.Message
        })
        {
            StatusCode = statusCode
        };
    }
}
