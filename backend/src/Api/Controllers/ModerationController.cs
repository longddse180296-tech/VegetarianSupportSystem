// Chức năng: kiểm duyệt nội dung và kết quả kiểm tra AI. Tầng API nhận yêu cầu, kiểm tra quyền và chuyển xử lý cho Application.
using System.Security.Claims;
using Application.Features.Moderation;
using Domain.Entities;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

// ModerationController: cung cấp endpoint HTTP, kiểm tra danh tính và chuyển yêu cầu cho tầng Application.
[ApiController]
[Authorize(Roles = "User,Admin")]
[Route("api/moderation/submissions")]
public sealed class ModerationController(ModerationService moderationService) : ControllerBase
{
    // Submit: Chuyển bản nội dung hợp lệ sang quy trình gửi duyệt.
    [HttpPost]
    public async Task<IActionResult> Submit(
        [FromBody] SubmitModerationRequest request,
        CancellationToken cancellationToken)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (request.ContentType == ModeratedContentType.Video)
            return BadRequest(new ProblemDetails { Detail = "Submit videos through /api/me/videos/{id}/submit." });
        if (request.ContentType == ModeratedContentType.Article)
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Detail = "Bài viết cần được gửi từ bản nháp của bạn qua /api/me/articles/{id}/submit. Không tạo phiên bản kiểm duyệt riêng từ endpoint này."
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

    // GetMine: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet]
    public async Task<IActionResult> GetMine(
        [FromQuery] ModeratedContentType? contentType,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var ownerUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
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

    // GetById: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var ownerUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
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

    // RetryAi: Thử lại thao tác khi trạng thái hiện tại cho phép.
    [HttpPost("{id:guid}/retry-ai")]
    public async Task<IActionResult> RetryAi(Guid id, CancellationToken cancellationToken)
    {
        var ownerUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
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

// AdminModerationController: cung cấp endpoint HTTP, kiểm tra danh tính và chuyển yêu cầu cho tầng Application.
[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/moderation/submissions")]
public sealed class AdminModerationController(
    ModerationService moderationService, ContentReportService contentReportService) : ControllerBase
{
    // GetAll: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
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
            var counts = await contentReportService.GetPendingCountsAsync(
                result.Items.Select(item => item.ContentId).Distinct().ToArray(), cancellationToken);
            var response = ModerationPageResponse.From(result);
            var names = await moderationService.GetAuthorNamesAsync(result.Items.Select(item => item.OwnerUserId), cancellationToken);
            return Ok(response with { Items = response.Items.Select(item => item with
            {
                OwnerName = names.GetValueOrDefault(item.OwnerUserId),
                PendingReporterCount = counts.GetValueOrDefault((item.ContentType, item.ContentId))
            }).ToArray() });
        }
        catch (ModerationException ex)
        {
            return ModerationHttpError.From(ex);
        }
    }

    // GetQueue: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
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
            var counts = await contentReportService.GetPendingCountsAsync(
                result.Items.Select(item => item.ContentId).Distinct().ToArray(), cancellationToken);
            var response = ModerationPageResponse.From(result);
            var names = await moderationService.GetAuthorNamesAsync(result.Items.Select(item => item.OwnerUserId), cancellationToken);
            return Ok(response with { Items = response.Items.Select(item => item with
            {
                OwnerName = names.GetValueOrDefault(item.OwnerUserId),
                PendingReporterCount = counts.GetValueOrDefault((item.ContentType, item.ContentId))
            }).ToArray() });
        }
        catch (ModerationException ex)
        {
            return ModerationHttpError.From(ex);
        }
    }

    // GetById: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var submission = await moderationService.GetForAdminAsync(id, cancellationToken);
            var names = await moderationService.GetAuthorNamesAsync([submission.OwnerUserId], cancellationToken);
            var counts = await contentReportService.GetPendingCountsAsync([submission.ContentId], cancellationToken);
            return Ok(ModerationSubmissionResponse.From(submission) with
            {
                OwnerName = names.GetValueOrDefault(submission.OwnerUserId),
                PendingReporterCount = counts.GetValueOrDefault((submission.ContentType, submission.ContentId))
            });
        }
        catch (ModerationException ex)
        {
            return ModerationHttpError.From(ex);
        }
    }

    // Decide: Áp dụng quyết định Admin lên đúng phiên bản và ghi lại lịch sử xử lý.
    [HttpPost("{id:guid}/decisions")]
    public async Task<IActionResult> Decide(
        Guid id,
        [FromBody] MakeModerationDecisionRequest request,
        CancellationToken cancellationToken)
    {
        var adminUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(adminUserId)) return Unauthorized();

        try
        {
            var submission = await moderationService.DecideAsync(
                id,
                request.Decision,
                adminUserId,
                request.Reason,
                cancellationToken);
            var names = await moderationService.GetAuthorNamesAsync([submission.OwnerUserId], cancellationToken);
            return Ok(ModerationSubmissionResponse.From(submission) with { OwnerName = names.GetValueOrDefault(submission.OwnerUserId) });
        }
        catch (ModerationException ex)
        {
            return ModerationHttpError.From(ex);
        }
    }


}

// SubmitModerationRequest: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record SubmitModerationRequest(
    Guid? ContentId,
    ModeratedContentType ContentType,
    string Title,
    string TextContent,
    string? MediaReference);

// MakeModerationDecisionRequest: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record MakeModerationDecisionRequest(
    ModerationDecisionType Decision,
    string Reason);

// ModerationDecisionResponse: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ModerationDecisionResponse(
    Guid Id,
    int Version,
    ModerationDecisionType Decision,
    string AdminUserId,
    string Reason,
    DateTimeOffset DecidedAt)
{
    // From: Chuyển dữ liệu nội bộ sang cấu trúc trả về cho bên gọi.
    public static ModerationDecisionResponse From(ModerationDecision decision) => new(
        decision.Id,
        decision.Version,
        decision.Decision,
        decision.AdminUserId,
        decision.Reason,
        decision.DecidedAt);
}

// ModerationSubmissionResponse: định nghĩa dữ liệu trao đổi của tính năng.
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
    public int PendingReporterCount { get; init; }
    public string? OwnerName { get; init; }
    public string? SystemRejectionReason { get; init; }
    // From: Chuyển dữ liệu nội bộ sang cấu trúc trả về cho bên gọi.
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
        submission.Decisions.OrderBy(x => x.DecidedAt).Select(ModerationDecisionResponse.From).ToArray())
        { SystemRejectionReason = submission.SystemRejectionReason };
}

// ModerationPageResponse: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ModerationPageResponse(
    IReadOnlyList<ModerationSubmissionResponse> Items,
    int TotalCount,
    int Page,
    int PageSize)
{
    // From: Chuyển dữ liệu nội bộ sang cấu trúc trả về cho bên gọi.
    public static ModerationPageResponse From(ModerationPage page) => new(
        page.Items.Select(ModerationSubmissionResponse.From).ToArray(),
        page.TotalCount,
        page.Page,
        page.PageSize);
}

// ModerationHttpError: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
internal static class ModerationHttpError
{
    // From: Chuyển dữ liệu nội bộ sang cấu trúc trả về cho bên gọi.
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
