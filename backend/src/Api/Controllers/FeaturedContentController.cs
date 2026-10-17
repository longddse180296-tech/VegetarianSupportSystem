using Api.Authorization;
using Application.Features.Administration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/featured-content")]
public sealed class FeaturedContentController(FeaturedContentService service) : CoreDataControllerBase
{
    [HttpGet]
    [ProducesResponseType<FeaturedContentPage>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public Task<IActionResult> List([FromQuery] FeaturedContentListQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListAsync(query, true, ct)));
}

[ApiController]
[Authorize(Policy = AccountAuthorization.AdminPolicy)]
[Route("api/admin/featured-content")]
[ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class AdminFeaturedContentController(FeaturedContentService service) : CoreDataControllerBase
{
    [HttpGet]
    [ProducesResponseType<FeaturedContentPage>(StatusCodes.Status200OK)]
    public Task<IActionResult> List([FromQuery] FeaturedContentListQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListAsync(query, false, ct)));

    [HttpPut("{contentType}/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public Task<IActionResult> SetPinned(string contentType, Guid id, FeaturedContentPinRequest request,
        CancellationToken ct) => Execute(async () =>
        {
            await service.SetPinnedAsync(contentType, id, request, User.GetUserId()!, ct);
            return NoContent();
        });
}
