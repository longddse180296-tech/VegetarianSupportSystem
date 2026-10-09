using Api.Authorization;
using Application.Features.Favorites;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

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
    [HttpGet]
    [ProducesResponseType<FavoritePage>(StatusCodes.Status200OK)]
    public Task<IActionResult> List([FromQuery] FavoriteListQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListAsync(CurrentUserId, query, ct)));

    [HttpPost]
    [ProducesResponseType<FavoriteResponse>(StatusCodes.Status201Created)]
    public Task<IActionResult> Create(FavoriteRequest request, CancellationToken ct) =>
        Execute(async () =>
        {
            var result = await service.CreateAsync(CurrentUserId, request, ct);
            return CreatedAtAction(nameof(List), result);
        });

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
