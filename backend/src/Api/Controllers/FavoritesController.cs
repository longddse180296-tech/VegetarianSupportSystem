// Chức năng: danh sách nội dung yêu thích. Tầng API nhận yêu cầu, kiểm tra quyền và chuyển xử lý cho Application.
using Api.Authorization;
using Application.Features.Favorites;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

// FavoritesController: cung cấp endpoint HTTP, kiểm tra danh tính và chuyển yêu cầu cho tầng Application.
[ApiController]
[UserResource]
[Route("api/favorites")]
[ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
public sealed class FavoritesController(FavoriteService service) : CoreDataControllerBase
{
    // List: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet]
    [ProducesResponseType<FavoritePage>(StatusCodes.Status200OK)]
    public Task<IActionResult> List([FromQuery] FavoriteListQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListAsync(CurrentUserId, query, ct)));

    // Create: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    [HttpPost]
    [ProducesResponseType<FavoriteResponse>(StatusCodes.Status201Created)]
    public Task<IActionResult> Create(FavoriteRequest request, CancellationToken ct) =>
        Execute(async () =>
        {
            var result = await service.CreateAsync(CurrentUserId, request, ct);
            return CreatedAtAction(nameof(List), result);
        });

    // Delete: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        Execute(async () =>
        {
            await service.DeleteAsync(CurrentUserId, id, ct);
            return NoContent();
        });

    private string CurrentUserId => User.FindFirst("sub")!.Value;
}
