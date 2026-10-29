// Chức năng: công thức và định lượng nguyên liệu. Tầng API nhận yêu cầu, kiểm tra quyền và chuyển xử lý cho Application.
using Api.Authorization;
using Application.Features.Recipes;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

// RecipesController: cung cấp endpoint HTTP, kiểm tra danh tính và chuyển yêu cầu cho tầng Application.
[ApiController]
[ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
public sealed class RecipesController(RecipeService service) : CoreDataControllerBase
{
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
            return CreatedAtAction(nameof(AdminGet), new { id = result.Id }, result);
        });

    // Update: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    [CoreDataAdmin]
    [HttpPut("/api/admin/recipes/{id:guid}")]
    [ProducesResponseType<RecipeResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<IActionResult> Update(Guid id, RecipeRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await service.UpdateAsync(id, request, ct)));

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
            return NoContent();
        });
}
