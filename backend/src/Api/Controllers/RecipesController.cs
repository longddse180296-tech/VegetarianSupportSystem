using Api.Authorization;
using Application.Features.Recipes;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
public sealed class RecipesController(RecipeService service) : CoreDataControllerBase
{
    [HttpGet("/api/recipes")]
    [ProducesResponseType<RecipePage>(StatusCodes.Status200OK)]
    public Task<IActionResult> List([FromQuery] RecipeListQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListAsync(query, false, ct)));

    [HttpGet("/api/recipes/{id:guid}")]
    [ProducesResponseType<RecipeResponse>(StatusCodes.Status200OK)]
    public Task<IActionResult> Get(Guid id, CancellationToken ct) =>
        Execute(async () => Ok(await service.GetAsync(id, false, ct)));

    [CoreDataAdmin]
    [HttpGet("/api/admin/recipes")]
    [ProducesResponseType<RecipePage>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<IActionResult> AdminList([FromQuery] RecipeListQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListAsync(query, true, ct)));

    [CoreDataAdmin]
    [HttpGet("/api/admin/recipes/{id:guid}")]
    [ProducesResponseType<RecipeResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<IActionResult> AdminGet(Guid id, CancellationToken ct) =>
        Execute(async () => Ok(await service.GetAsync(id, true, ct)));

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

    [CoreDataAdmin]
    [HttpPut("/api/admin/recipes/{id:guid}")]
    [ProducesResponseType<RecipeResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<IActionResult> Update(Guid id, RecipeRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await service.UpdateAsync(id, request, ct)));

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
