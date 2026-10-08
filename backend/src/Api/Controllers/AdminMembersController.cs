using System.Text.Json.Serialization;
using Application.Features.Administration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/members")]
public sealed class AdminMembersController(MemberService members) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<MemberPage>> List(
        [FromQuery] string? search, [FromQuery] bool? isLocked,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        try { return Ok(await members.ListAsync(search, isLocked, page, pageSize, cancellationToken)); }
        catch (ArgumentException ex) { return BadRequestProblem(ex.Message); }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MemberDetail>> Detail(string id, CancellationToken cancellationToken)
    {
        var member = await members.FindAsync(id, cancellationToken);
        return member is null ? NotFound() : Ok(member);
    }

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

    [HttpPost("{id}/lock")]
    public Task<IActionResult> Lock(string id, [FromBody] ChangeStatusRequest request, CancellationToken cancellationToken) =>
        ChangeStatus(id, request.Reason, true, cancellationToken);

    [HttpPost("{id}/unlock")]
    public Task<IActionResult> Unlock(string id, [FromBody] ChangeStatusRequest request, CancellationToken cancellationToken) =>
        ChangeStatus(id, request.Reason, false, cancellationToken);

    private async Task<IActionResult> ChangeStatus(string id, string? reason, bool lockAccount, CancellationToken cancellationToken)
    {
        var adminId = User.FindFirst("sub")?.Value;
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
                _ => StatusCode(500)
            };
        }
        catch (ArgumentException ex) { return BadRequestProblem(ex.Message); }
    }

    private ObjectResult BadRequestProblem(string message) => StatusCode(400, new ProblemDetails { Status = 400, Title = message });
    private ObjectResult ConflictProblem(string message) => StatusCode(409, new ProblemDetails { Status = 409, Title = message });

    [JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
    public sealed record ChangeStatusRequest(string? Reason);
}
