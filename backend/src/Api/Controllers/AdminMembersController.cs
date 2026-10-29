// Chức năng: quản lý thành viên. Tầng API nhận yêu cầu, kiểm tra quyền và chuyển xử lý cho Application.
using System.Text.Json.Serialization;
using Api.Authorization;
using Application.Features.Administration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

// AdminMembersController: cung cấp endpoint HTTP, kiểm tra danh tính và chuyển yêu cầu cho tầng Application.
[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/members")]
public sealed class AdminMembersController(MemberService members) : ControllerBase
{
    // List: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet]
    public async Task<ActionResult<MemberPage>> List(
        [FromQuery] string? search, [FromQuery] bool? isLocked,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        try { return Ok(await members.ListAsync(search, isLocked, page, pageSize, cancellationToken)); }
        catch (ArgumentException ex) { return BadRequestProblem(ex.Message); }
    }

    // Detail: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [HttpGet("{id}")]
    public async Task<ActionResult<MemberDetail>> Detail(string id, CancellationToken cancellationToken)
    {
        var member = await members.FindAsync(id, cancellationToken);
        return member is null ? NotFound() : Ok(member);
    }

    // History: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [HttpGet("{id}/status-history")]
    public async Task<ActionResult<MemberStatusPage>> History(
        string id, [FromQuery] int page = 1, [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await members.HistoryAsync(id, page, pageSize, cancellationToken);
            return result is null ? NotFound() : Ok(result);
        }
        catch (ArgumentException ex) { return BadRequestProblem(ex.Message); }
    }

    // Lock: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [HttpPost("{id}/lock")]
    public Task<IActionResult> Lock(string id, [FromBody] ChangeStatusRequest request, CancellationToken cancellationToken) =>
        ChangeStatus(id, request.Reason, true, cancellationToken);

    // Unlock: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [HttpPost("{id}/unlock")]
    public Task<IActionResult> Unlock(string id, [FromBody] ChangeStatusRequest request, CancellationToken cancellationToken) =>
        ChangeStatus(id, request.Reason, false, cancellationToken);

    // ChangeStatus: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private async Task<IActionResult> ChangeStatus(string id, string? reason, bool lockAccount, CancellationToken cancellationToken)
    {
        var adminId = User.GetUserId();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(adminId)) return Unauthorized();
        try
        {
            var result = await members.ChangeStatusAsync(id, adminId, lockAccount, reason, cancellationToken);
            return result switch
            {
                MemberStatusUpdateResult.Updated => NoContent(),
                MemberStatusUpdateResult.NotFound => NotFound(),
                MemberStatusUpdateResult.AlreadyInState => ConflictProblem("Tài khoản đã ở trạng thái này."),
                MemberStatusUpdateResult.SelfLock => ConflictProblem("Không thể tự khóa tài khoản đang sử dụng."),
                MemberStatusUpdateResult.LastAdmin => ConflictProblem("Không thể khóa Admin hoạt động cuối cùng."),
                MemberStatusUpdateResult.ActorInactive => Unauthorized(),
                _ => StatusCode(500)
            };
        }
        catch (ArgumentException ex) { return BadRequestProblem(ex.Message); }
    }

    // BadRequestProblem: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private ObjectResult BadRequestProblem(string message) => StatusCode(400, new ProblemDetails { Status = 400, Title = message });
    // ConflictProblem: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private ObjectResult ConflictProblem(string message) => StatusCode(409, new ProblemDetails { Status = 409, Title = message });

    // ChangeStatusRequest: định nghĩa dữ liệu trao đổi của tính năng.
    [JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
    public sealed record ChangeStatusRequest(string? Reason);
}
