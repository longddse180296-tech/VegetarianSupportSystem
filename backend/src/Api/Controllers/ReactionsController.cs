// Chức năng: hạ tầng và quy tắc dùng chung. Tầng API nhận yêu cầu, kiểm tra quyền và chuyển xử lý cho Application.
using Api.Authorization;
using Application.Features.Comments;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

// ReactionsController: cung cấp endpoint HTTP, kiểm tra danh tính và chuyển yêu cầu cho tầng Application.
[ApiController]
public sealed class ReactionsController(CommentService service) : ControllerBase
{
    // ArticleHelpful: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [AllowAnonymous]
    [HttpGet("/api/articles/{id:guid}/helpful")]
    public Task<IActionResult> ArticleHelpful(Guid id, CancellationToken ct) => React(ReactionTargetType.ArticleHelpful, id, null, ct);

    // AddArticleHelpful: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    [Authorize(Roles = "User,Admin")]
    [HttpPut("/api/articles/{id:guid}/helpful")]
    public Task<IActionResult> AddArticleHelpful(Guid id, CancellationToken ct) => React(ReactionTargetType.ArticleHelpful, id, true, ct);

    // DeleteArticleHelpful: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    [Authorize(Roles = "User,Admin")]
    [HttpDelete("/api/articles/{id:guid}/helpful")]
    public Task<IActionResult> DeleteArticleHelpful(Guid id, CancellationToken ct) => React(ReactionTargetType.ArticleHelpful, id, false, ct);

    // VideoLike: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [AllowAnonymous]
    [HttpGet("/api/videos/{id:guid}/like")]
    public Task<IActionResult> VideoLike(Guid id, CancellationToken ct) => React(ReactionTargetType.VideoLike, id, null, ct);

    // AddVideoLike: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    [Authorize(Roles = "User,Admin")]
    [HttpPut("/api/videos/{id:guid}/like")]
    public Task<IActionResult> AddVideoLike(Guid id, CancellationToken ct) => React(ReactionTargetType.VideoLike, id, true, ct);

    // DeleteVideoLike: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    [Authorize(Roles = "User,Admin")]
    [HttpDelete("/api/videos/{id:guid}/like")]
    public Task<IActionResult> DeleteVideoLike(Guid id, CancellationToken ct) => React(ReactionTargetType.VideoLike, id, false, ct);

    // CommentLike: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [AllowAnonymous]
    [HttpGet("/api/comments/{id:guid}/like")]
    public Task<IActionResult> CommentLike(Guid id, CancellationToken ct) => React(ReactionTargetType.CommentLike, id, null, ct);

    // AddCommentLike: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    [Authorize(Roles = "User,Admin")]
    [HttpPut("/api/comments/{id:guid}/like")]
    public Task<IActionResult> AddCommentLike(Guid id, CancellationToken ct) => React(ReactionTargetType.CommentLike, id, true, ct);

    // DeleteCommentLike: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    [Authorize(Roles = "User,Admin")]
    [HttpDelete("/api/comments/{id:guid}/like")]
    public Task<IActionResult> DeleteCommentLike(Guid id, CancellationToken ct) => React(ReactionTargetType.CommentLike, id, false, ct);

    // React: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private async Task<IActionResult> React(ReactionTargetType type, Guid id, bool? active, CancellationToken ct)
    {
        try { return Ok(await service.ReactionAsync(User.GetUserId(), type, id, active, ct)); }
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
