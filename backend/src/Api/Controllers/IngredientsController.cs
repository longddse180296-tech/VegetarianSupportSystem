using Api.Authorization;
using Application.Features.Ingredients;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
public sealed class IngredientsController(IngredientService service) : CoreDataControllerBase
{
    [HttpGet("/api/ingredients")]
    [ProducesResponseType<IngredientPage>(StatusCodes.Status200OK)]
    public Task<IActionResult> List([FromQuery] IngredientListQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListAsync(query, false, ct)));

    [HttpGet("/api/ingredients/{id:guid}")]
    [ProducesResponseType<IngredientResponse>(StatusCodes.Status200OK)]
    public Task<IActionResult> Get(Guid id, CancellationToken ct) =>
        Execute(async () => Ok(await service.GetAsync(id, false, ct)));

    [CoreDataAdmin]
    [HttpGet("/api/admin/ingredients")]
    [ProducesResponseType<IngredientPage>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<IActionResult> AdminList([FromQuery] IngredientListQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListAsync(query, true, ct)));

    [CoreDataAdmin]
    [HttpGet("/api/admin/ingredients/{id:guid}")]
    [ProducesResponseType<IngredientResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<IActionResult> AdminGet(Guid id, CancellationToken ct) =>
        Execute(async () => Ok(await service.GetAsync(id, true, ct)));

    [CoreDataAdmin]
    [HttpPost("/api/admin/ingredients")]
    [ProducesResponseType<IngredientResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<IActionResult> Create(IngredientRequest request, CancellationToken ct) =>
        Execute(async () =>
        {
            var result = await service.CreateAsync(request, ct);
            return CreatedAtAction(nameof(AdminGet), new { id = result.Id }, result);
        });

    [CoreDataAdmin]
    [HttpPut("/api/admin/ingredients/{id:guid}")]
    [ProducesResponseType<IngredientResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<IActionResult> Update(Guid id, IngredientRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await service.UpdateAsync(id, request, ct)));

    [CoreDataAdmin]
    [HttpPost("/api/admin/ingredients/{id:guid}/deactivate")]
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
