using Api.Authorization;
using Application.Features.Pantry;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[UserResource]
[Route("api/pantry")]
[ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
public sealed class PantryController(PantryService service) : CoreDataControllerBase
{
    [HttpGet("items")]
    [ProducesResponseType<IReadOnlyList<PantryItemResponse>>(StatusCodes.Status200OK)]
    public Task<IActionResult> List(CancellationToken ct) =>
        Execute(async () => Ok(await service.ListAsync(CurrentUserId, ct)));

    [HttpGet("items/{id:guid}")]
    [ProducesResponseType<PantryItemResponse>(StatusCodes.Status200OK)]
    public Task<IActionResult> Get(Guid id, CancellationToken ct) =>
        Execute(async () => Ok(await service.GetAsync(CurrentUserId, id, ct)));

    [HttpPost("items")]
    [ProducesResponseType<PantryItemResponse>(StatusCodes.Status201Created)]
    public Task<IActionResult> Create(PantryItemRequest request, CancellationToken ct) =>
        Execute(async () =>
        {
            var result = await service.CreateAsync(CurrentUserId, request, ct);
            return CreatedAtAction(nameof(Get), new { id = result.Id }, result);
        });

    [HttpPut("items/{id:guid}")]
    [ProducesResponseType<PantryItemResponse>(StatusCodes.Status200OK)]
    public Task<IActionResult> Update(Guid id, PantryItemRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await service.UpdateAsync(CurrentUserId, id, request, ct)));

    [HttpDelete("items/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        Execute(async () =>
        {
            await service.DeleteAsync(CurrentUserId, id, ct);
            return NoContent();
        });

    [HttpGet("recipe-suggestions")]
    [ProducesResponseType<IReadOnlyList<PantryRecipeSuggestionResponse>>(StatusCodes.Status200OK)]
    public Task<IActionResult> RecipeSuggestions([FromQuery] PantryRecipeSuggestionQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.GetRecipeSuggestionsAsync(CurrentUserId, query, ct)));

    [HttpGet("items/{id:guid}/substitution-candidates")]
    [ProducesResponseType<IReadOnlyList<PantrySubstitutionCandidateResponse>>(StatusCodes.Status200OK)]
    public Task<IActionResult> SubstitutionCandidates(Guid id, CancellationToken ct) =>
        Execute(async () => Ok(await service.GetSubstitutionCandidatesAsync(CurrentUserId, id, ct)));

    private string CurrentUserId => User.FindFirst("sub")!.Value;
}
