using Api.Authorization;
using Application.Features.Moderation;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Api.Controllers;

[ApiController]
public sealed class ContentReportsController(ContentReportService service) : ControllerBase
{
    [Authorize(Roles = "User,Admin")]
    [HttpPost("/api/content-reports")]
    [EnableRateLimiting("content-reports")]
    [RequestSizeLimit(16 * 1024)]
    public Task<IActionResult> Create(CreateContentReportRequest request, CancellationToken ct) => Execute(async () =>
    {
        if (User.GetUserId() is not { } userId) return Unauthorized();
        return StatusCode(201, await service.CreateAsync(userId, request, ct));
    });

    [Authorize(Roles = "Admin")]
    [HttpGet("/api/admin/content-reports")]
    public Task<IActionResult> List([FromQuery] ContentReportStatus? status, [FromQuery] ModeratedContentType? targetType,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10, CancellationToken ct = default) =>
        Execute(async () => Ok(await service.ListAsync(status, targetType, page, pageSize, ct)));

    [Authorize(Roles = "Admin")]
    [HttpPost("/api/admin/content-reports/{id:guid}/resolve")]
    public Task<IActionResult> Resolve(Guid id, ResolveContentReportRequest request, CancellationToken ct) => Execute(async () =>
    {
        if (User.GetUserId() is not { } adminId) return Unauthorized();
        await service.ResolveAsync(id, adminId, request, ct);
        return NoContent();
    });

    private async Task<IActionResult> Execute(Func<Task<IActionResult>> work)
    {
        try { return await work(); }
        catch (ModerationException ex)
        {
            var status = ex.Error switch
            {
                ModerationError.Validation => 400, ModerationError.NotFound => 404,
                ModerationError.Forbidden => 403, ModerationError.Conflict => 409, _ => 500
            };
            return Problem(statusCode: status, detail: ex.Message);
        }
    }
}
