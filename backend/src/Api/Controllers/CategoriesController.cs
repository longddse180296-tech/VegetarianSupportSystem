using Api.Authorization;
using Application.Features.Categories;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
public sealed class CategoriesController(CategoryService service) : CoreDataControllerBase
{
    [HttpGet("/api/categories")]
    [ProducesResponseType<CategoryPage>(StatusCodes.Status200OK)]
    public Task<IActionResult> List([FromQuery] CategoryListQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListAsync(query, false, ct)));

    [HttpGet("/api/categories/{id:guid}")]
    [ProducesResponseType<CategoryResponse>(StatusCodes.Status200OK)]
    public Task<IActionResult> Get(Guid id, CancellationToken ct) =>
        Execute(async () => Ok(await service.GetAsync(id, false, ct)));

    [CoreDataAdmin]
    [HttpGet("/api/admin/categories")]
    [ProducesResponseType<CategoryPage>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<IActionResult> AdminList([FromQuery] CategoryListQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListAsync(query, true, ct)));

    [CoreDataAdmin]
    [HttpGet("/api/admin/categories/{id:guid}")]
    [ProducesResponseType<CategoryResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<IActionResult> AdminGet(Guid id, CancellationToken ct) =>
        Execute(async () => Ok(await service.GetAsync(id, true, ct)));

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

    [CoreDataAdmin]
    [HttpPut("/api/admin/categories/{id:guid}")]
    [ProducesResponseType<CategoryResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<IActionResult> Update(Guid id, CategoryRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await service.UpdateAsync(id, request, ct)));

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
