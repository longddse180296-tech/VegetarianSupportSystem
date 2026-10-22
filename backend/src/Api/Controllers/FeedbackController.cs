using Application.Features.Administration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Api.Controllers;

[ApiController]
public sealed class FeedbackController(FeedbackService service) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("/api/feedback")]
    [EnableRateLimiting("contact-feedback")]
    [RequestSizeLimit(32 * 1024)]
    public async Task<IActionResult> Create([FromBody] CreateFeedbackRequest request, CancellationToken ct)
    {
        try { return StatusCode(201, await service.CreateAsync(request, ct)); }
        catch (ArgumentException ex) { return Problem(statusCode: 400, title: ex.Message); }
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("/api/admin/feedback")]
    public async Task<IActionResult> List([FromQuery] bool? isRead, [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10, CancellationToken ct = default)
    {
        try { return Ok(await service.ListAsync(isRead, page, pageSize, ct)); }
        catch (ArgumentException ex) { return Problem(statusCode: 400, title: ex.Message); }
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("/api/admin/feedback/{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken ct) =>
        await service.MarkReadAsync(id, ct) ? NoContent() : NotFound();
}
