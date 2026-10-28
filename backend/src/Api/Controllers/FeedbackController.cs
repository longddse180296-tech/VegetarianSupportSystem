// Chức năng: hạ tầng và quy tắc dùng chung. Tầng API nhận yêu cầu, kiểm tra quyền và chuyển xử lý cho Application.
using Application.Features.Administration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Api.Controllers;

// FeedbackController: cung cấp endpoint HTTP, kiểm tra danh tính và chuyển yêu cầu cho tầng Application.
[ApiController]
public sealed class FeedbackController(FeedbackService service) : ControllerBase
{
    // Create: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    [AllowAnonymous]
    [HttpPost("/api/feedback")]
    [EnableRateLimiting("contact-feedback")]
    [RequestSizeLimit(32 * 1024)]
    public async Task<IActionResult> Create([FromBody] CreateFeedbackRequest request, CancellationToken ct)
    {
        try { return StatusCode(201, await service.CreateAsync(request, ct)); }
        catch (ArgumentException ex) { return Problem(statusCode: 400, title: ex.Message); }
    }

    // List: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [Authorize(Roles = "Admin")]
    [HttpGet("/api/admin/feedback")]
    public async Task<IActionResult> List([FromQuery] bool? isRead, [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10, CancellationToken ct = default)
    {
        try { return Ok(await service.ListAsync(isRead, page, pageSize, ct)); }
        catch (ArgumentException ex) { return Problem(statusCode: 400, title: ex.Message); }
    }

    // MarkRead: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [Authorize(Roles = "Admin")]
    [HttpPost("/api/admin/feedback/{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken ct) =>
        await service.MarkReadAsync(id, ct) ? NoContent() : NotFound();
}
