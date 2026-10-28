// Chức năng: bình luận và tương tác cộng đồng. Tầng API nhận yêu cầu, kiểm tra quyền và chuyển xử lý cho Application.
using Api.Authorization;
using Application.Features.Comments;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

// CommentsController: cung cấp endpoint HTTP, kiểm tra danh tính và chuyển yêu cầu cho tầng Application.
[ApiController]
public sealed class CommentsController(CommentService service) : ControllerBase
{
    // List: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [AllowAnonymous]
    [HttpGet("/api/comments")]
    public Task<IActionResult> List([FromQuery] CommentQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListPublicAsync(query, ct)));

    // Get: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [AllowAnonymous]
    [HttpGet("/api/comments/{id:guid}")]
    public Task<IActionResult> Get(Guid id, CancellationToken ct) =>
        Execute(async () => Ok(await service.GetPublicAsync(id, ct)));

    // Create: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    [Authorize(Roles = "User,Admin")]
    [HttpPost("/api/comments")]
    public Task<IActionResult> Create([FromBody] CreateCommentRequest request, CancellationToken ct) =>
        Execute(async () =>
        {
            var result = await service.CreateAsync(User.GetUserId()!, request, ct);
            return StatusCode(201, result);
        });

    // Edit: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [Authorize(Roles = "User,Admin")]
    [HttpPut("/api/comments/{id:guid}")]
    public Task<IActionResult> Edit(Guid id, [FromBody] EditCommentRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await service.EditAsync(id, User.GetUserId()!, request, ct)));

    // Delete: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    [Authorize(Roles = "User,Admin")]
    [HttpDelete("/api/comments/{id:guid}")]
    public Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        Execute(async () => { await service.DeleteAsync(id, User.GetUserId()!, ct); return NoContent(); });

    // Mine: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [Authorize(Roles = "User,Admin")]
    [HttpGet("/api/me/comments")]
    public Task<IActionResult> Mine([FromQuery] CommentQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListMineAsync(User.GetUserId()!, query, ct)));

    // AdminList: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [Authorize(Roles = "Admin")]
    [HttpGet("/api/admin/comments")]
    public Task<IActionResult> AdminList([FromQuery] CommentQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListAdminAsync(query, ct)));

    // AdminDetail: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [Authorize(Roles = "Admin")]
    [HttpGet("/api/admin/comments/{id:guid}")]
    public Task<IActionResult> AdminDetail(Guid id, CancellationToken ct) =>
        Execute(async () => Ok(await service.GetAdminAsync(id, ct)));

    // Hide: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [Authorize(Roles = "Admin")]
    [HttpPost("/api/admin/comments/{id:guid}/hide")]
    public Task<IActionResult> Hide(Guid id, [FromBody] ModerateCommentRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await service.ModerateAsync(id, User.GetUserId()!, CommentStatus.Hidden, request.Reason, ct)));

    // Remove: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    [Authorize(Roles = "Admin")]
    [HttpPost("/api/admin/comments/{id:guid}/remove")]
    public Task<IActionResult> Remove(Guid id, [FromBody] ModerateCommentRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await service.ModerateAsync(id, User.GetUserId()!, CommentStatus.Removed, request.Reason, ct)));

    // Execute: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private async Task<IActionResult> Execute(Func<Task<IActionResult>> action)
    {
        try { return await action(); }
        catch (CommentException ex)
        {
            var status = ex.Error switch
            {
                CommentError.Validation => 400,
                CommentError.NotFound => 404,
                CommentError.Forbidden => 403,
                CommentError.Conflict => 409,
                _ => 500
            };
            return Problem(statusCode: status, title: ex.Error.ToString(), detail: ex.Message);
        }
    }
}
