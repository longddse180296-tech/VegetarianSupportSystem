using Api.Authorization;
using Application.Features.Comments;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
public sealed class CommentsController(CommentService service) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("/api/comments")]
    public Task<IActionResult> List([FromQuery] CommentQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListPublicAsync(query, ct)));

    [AllowAnonymous]
    [HttpGet("/api/comments/{id:guid}")]
    public Task<IActionResult> Get(Guid id, CancellationToken ct) =>
        Execute(async () => Ok(await service.GetPublicAsync(id, ct)));

    [Authorize(Roles = "User,Admin")]
    [HttpPost("/api/comments")]
    public Task<IActionResult> Create([FromBody] CreateCommentRequest request, CancellationToken ct) =>
        Execute(async () =>
        {
            var result = await service.CreateAsync(User.GetUserId()!, request, ct);
            return StatusCode(201, result);
        });

    [Authorize(Roles = "User,Admin")]
    [HttpPut("/api/comments/{id:guid}")]
    public Task<IActionResult> Edit(Guid id, [FromBody] EditCommentRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await service.EditAsync(id, User.GetUserId()!, request, ct)));

    [Authorize(Roles = "User,Admin")]
    [HttpDelete("/api/comments/{id:guid}")]
    public Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        Execute(async () => { await service.DeleteAsync(id, User.GetUserId()!, ct); return NoContent(); });

    [Authorize(Roles = "User,Admin")]
    [HttpGet("/api/me/comments")]
    public Task<IActionResult> Mine([FromQuery] CommentQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListMineAsync(User.GetUserId()!, query, ct)));

    [Authorize(Roles = "Admin")]
    [HttpGet("/api/admin/comments")]
    public Task<IActionResult> AdminList([FromQuery] CommentQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListAdminAsync(query, ct)));

    [Authorize(Roles = "Admin")]
    [HttpGet("/api/admin/comments/{id:guid}")]
    public Task<IActionResult> AdminDetail(Guid id, CancellationToken ct) =>
        Execute(async () => Ok(await service.GetAdminAsync(id, ct)));

    [Authorize(Roles = "Admin")]
    [HttpPost("/api/admin/comments/{id:guid}/hide")]
    public Task<IActionResult> Hide(Guid id, [FromBody] ModerateCommentRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await service.ModerateAsync(id, User.GetUserId()!, CommentStatus.Hidden, request.Reason, ct)));

    [Authorize(Roles = "Admin")]
    [HttpPost("/api/admin/comments/{id:guid}/remove")]
    public Task<IActionResult> Remove(Guid id, [FromBody] ModerateCommentRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await service.ModerateAsync(id, User.GetUserId()!, CommentStatus.Removed, request.Reason, ct)));

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
