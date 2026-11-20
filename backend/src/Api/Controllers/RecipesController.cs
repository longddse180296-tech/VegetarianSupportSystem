// BE2-01/04 | Khai báo endpoint, kiểm tra quyền và chuyển yêu cầu sang service (công thức: bộ lọc public, định lượng và dinh dưỡng theo khẩu phần).
// Cung cấp API xem công thức công khai và API quản trị tạo, sửa hoặc ngừng sử dụng công thức.
using Api.Authorization;
using Api.Hubs;
using Application.Features.Recipes;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

// RecipesController: cung cấp endpoint HTTP, kiểm tra danh tính và chuyển yêu cầu cho tầng Application.
[ApiController]
[ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
public sealed class RecipesController(RecipeService service, PublicRecipeUpdates updates) : CoreDataControllerBase
{
    [CoreDataAdmin]
    [HttpGet("/api/admin/recipes/review-count")]
    public Task<IActionResult> ReviewCount(CancellationToken ct) =>
        Execute(async () => Ok(new { count = await service.CountRequiringReviewAsync(ct) }));
    // List: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet("/api/recipes")]
    [ProducesResponseType<RecipePage>(StatusCodes.Status200OK)]
    public Task<IActionResult> List([FromQuery] RecipeListQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListAsync(query, false, ct)));

    // Get: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet("/api/recipes/{id:guid}")]
    [ProducesResponseType<RecipeResponse>(StatusCodes.Status200OK)]
    public Task<IActionResult> Get(Guid id, CancellationToken ct) =>
        Execute(async () => Ok(await service.GetAsync(id, false, ct)));

    // AdminList: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [CoreDataAdmin]
    [HttpGet("/api/admin/recipes")]
    [ProducesResponseType<RecipePage>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<IActionResult> AdminList([FromQuery] RecipeListQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListAsync(query, true, ct)));

    // AdminGet: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [CoreDataAdmin]
    [HttpGet("/api/admin/recipes/{id:guid}")]
    [ProducesResponseType<RecipeResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<IActionResult> AdminGet(Guid id, CancellationToken ct) =>
        Execute(async () => Ok(await service.GetAsync(id, true, ct)));

    // Create: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    [CoreDataAdmin]
    [HttpPost("/api/admin/recipes")]
    [ProducesResponseType<RecipeResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<IActionResult> Create(RecipeRequest request, CancellationToken ct) =>
        Execute(async () =>
        {
            var result = await service.CreateAsync(request, ct);
            await updates.PublishAsync();
            return CreatedAtAction(nameof(AdminGet), new { id = result.Id }, result);
        });

    // Update: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    [CoreDataAdmin]
    [HttpPut("/api/admin/recipes/{id:guid}")]
    [ProducesResponseType<RecipeResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<IActionResult> Update(Guid id, RecipeRequest request, CancellationToken ct) =>
        Execute(async () =>
        {
            var result = await service.UpdateAsync(id, request, ct);
            await updates.PublishAsync();
            return Ok(result);
        });

    // BE2-04 | Mở lại công thức đã ngừng sử dụng và lưu trạng thái thật xuống database.
    [CoreDataAdmin]
    [HttpPost("/api/admin/recipes/{id:guid}/activate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<IActionResult> Activate(Guid id, CancellationToken ct) =>
        Execute(async () =>
        {
            await service.ActivateAsync(id, ct);
            await updates.PublishAsync();
            return NoContent();
        });

    // Deactivate: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [CoreDataAdmin]
    [HttpPost("/api/admin/recipes/{id:guid}/deactivate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<IActionResult> Deactivate(Guid id, CancellationToken ct) =>
        Execute(async () =>
        {
            await service.DeactivateAsync(id, ct);
            await updates.PublishAsync();
            return NoContent();
        });
}
