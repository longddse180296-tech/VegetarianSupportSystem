// Chức năng: danh mục nội dung. Tầng API nhận yêu cầu, kiểm tra quyền và chuyển xử lý cho Application.
using Api.Authorization;
using Application.Features.Categories;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

// CategoriesController: cung cấp endpoint HTTP, kiểm tra danh tính và chuyển yêu cầu cho tầng Application.
[ApiController]
[ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
public sealed class CategoriesController(CategoryService service) : CoreDataControllerBase
{
    // List: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet("/api/categories")]
    [ProducesResponseType<CategoryPage>(StatusCodes.Status200OK)]
    public Task<IActionResult> List([FromQuery] CategoryListQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListAsync(query, false, ct)));

    // Get: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet("/api/categories/{id:guid}")]
    [ProducesResponseType<CategoryResponse>(StatusCodes.Status200OK)]
    public Task<IActionResult> Get(Guid id, CancellationToken ct) =>
        Execute(async () => Ok(await service.GetAsync(id, false, ct)));

    // AdminList: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [CoreDataAdmin]
    [HttpGet("/api/admin/categories")]
    [ProducesResponseType<CategoryPage>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<IActionResult> AdminList([FromQuery] CategoryListQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListAsync(query, true, ct)));

    // AdminGet: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [CoreDataAdmin]
    [HttpGet("/api/admin/categories/{id:guid}")]
    [ProducesResponseType<CategoryResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<IActionResult> AdminGet(Guid id, CancellationToken ct) =>
        Execute(async () => Ok(await service.GetAsync(id, true, ct)));

    // Create: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    [CoreDataAdmin]
    [HttpPost("/api/admin/categories")]
    [ProducesResponseType<CategoryResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<IActionResult> Create(CategoryRequest request, CancellationToken ct) =>
        Execute(async () =>
        {
            var result = await service.CreateAsync(request, ct);
            return CreatedAtAction(nameof(AdminGet), new { id = result.Id }, result);
        });

    // Update: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    [CoreDataAdmin]
    [HttpPut("/api/admin/categories/{id:guid}")]
    [ProducesResponseType<CategoryResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<IActionResult> Update(Guid id, CategoryRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await service.UpdateAsync(id, request, ct)));

    // Deactivate: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [CoreDataAdmin]
    [HttpPatch("/api/admin/categories/{id:guid}/deactivate")]
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
