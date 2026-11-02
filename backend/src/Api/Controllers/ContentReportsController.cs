// Chức năng: báo cáo nội dung cần xem xét. Tầng API nhận yêu cầu, kiểm tra quyền và chuyển xử lý cho Application.
using Api.Authorization;
using Application.Features.Moderation;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Api.Controllers;

// ContentReportsController: cung cấp endpoint HTTP, kiểm tra danh tính và chuyển yêu cầu cho tầng Application.
[ApiController]
public sealed class ContentReportsController(ContentReportService service) : ControllerBase
{
    // Create: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    [Authorize(Roles = "User,Admin")]
    [HttpPost("/api/content-reports")]
    [EnableRateLimiting("content-reports")]
    [RequestSizeLimit(16 * 1024)]
    public Task<IActionResult> Create(CreateContentReportRequest request, CancellationToken ct) => Execute(async () =>
    {
        if (User.GetUserId() is not { } userId) return Unauthorized();
        return StatusCode(201, await service.CreateAsync(userId, request, ct));
    });

    // GetMyReportStatus: Kiểm tra người dùng hiện tại đã gửi báo cáo cho nội dung này chưa.
    [Authorize(Roles = "User,Admin")]
    [HttpGet("/api/content-reports/status")]
    public Task<IActionResult> GetMyReportStatus([FromQuery] ModeratedContentType targetType,
        [FromQuery] Guid targetId, CancellationToken ct) => Execute(async () =>
    {
        if (User.GetUserId() is not { } userId) return Unauthorized();
        var hasReported = await service.HasReportedAsync(userId, targetType, targetId, ct);
        return Ok(new { hasReported });
    });

    // List: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [Authorize(Roles = "Admin")]
    [HttpGet("/api/admin/content-reports")]
    public Task<IActionResult> List([FromQuery] ContentReportStatus? status, [FromQuery] ModeratedContentType? targetType,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] bool groupByTarget = false,
        CancellationToken ct = default) =>
        Execute(async () => Ok(await service.ListAsync(status, targetType, page, pageSize, ct, groupByTarget)));

    // Resolve: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [Authorize(Roles = "Admin")]
    [HttpPost("/api/admin/content-reports/{id:guid}/resolve")]
    public Task<IActionResult> Resolve(Guid id, ResolveContentReportRequest request, CancellationToken ct) => Execute(async () =>
    {
        if (User.GetUserId() is not { } adminId) return Unauthorized();
        await service.ResolveAsync(id, adminId, request, ct);
        return NoContent();
    });

    // Execute: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
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
