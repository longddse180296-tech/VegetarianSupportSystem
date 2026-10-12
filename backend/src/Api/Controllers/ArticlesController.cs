using System.Security.Claims;
using Application.Features.Articles;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
public sealed class ArticlesController(ArticleService service) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("/api/articles")]
    public Task<IActionResult> List([FromQuery] ArticleListQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListPublicAsync(query, ct)));

    [AllowAnonymous]
    [HttpGet("/api/articles/{id:guid}")]
    public Task<IActionResult> Get(Guid id, CancellationToken ct) =>
        Execute(async () => Ok(await service.GetPublicAsync(id, ct)));

    [Authorize(Roles = "User,Admin")]
    [HttpGet("/api/me/articles")]
    public Task<IActionResult> Mine([FromQuery] MyArticleListQuery query, CancellationToken ct) =>
        WithOwner(owner => service.ListMineAsync(owner, query, ct));

    [Authorize(Roles = "User,Admin")]
    [HttpGet("/api/me/articles/{id:guid}")]
    public Task<IActionResult> MyDetail(Guid id, CancellationToken ct) =>
        WithOwner(owner => service.GetMineAsync(id, owner, ct));

    [Authorize(Roles = "User,Admin")]
    [HttpPost("/api/me/articles")]
    public Task<IActionResult> Create([FromBody] ArticleDraftRequest request, CancellationToken ct) =>
        WithOwnerResult(async owner =>
        {
            var result = await service.CreateAsync(owner, request, ct);
            return CreatedAtAction(nameof(MyDetail), new { id = result.Id }, result);
        });

    [Authorize(Roles = "User,Admin")]
    [HttpPut("/api/me/articles/{id:guid}")]
    public Task<IActionResult> Update(Guid id, [FromBody] ArticleDraftRequest request, CancellationToken ct) =>
        WithOwner(owner => service.UpdateAsync(id, owner, request, ct));

    [Authorize(Roles = "User,Admin")]
    [HttpDelete("/api/me/articles/{id:guid}")]
    public Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        WithOwnerResult(async owner =>
        {
            await service.DeleteAsync(id, owner, ct);
            return NoContent();
        });

    [Authorize(Roles = "User,Admin")]
    [HttpPost("/api/me/articles/{id:guid}/submit")]
    public Task<IActionResult> Submit(Guid id, CancellationToken ct) =>
        WithOwner(owner => service.SubmitAsync(id, owner, ct));

    private Task<IActionResult> WithOwner<T>(Func<string, Task<T>> action) =>
        User.Identity?.IsAuthenticated == true && User.FindFirstValue("sub") is { Length: > 0 } ownerId
            ? Execute(async () => Ok(await action(ownerId)))
            : Task.FromResult<IActionResult>(Unauthorized());

    private Task<IActionResult> WithOwnerResult(Func<string, Task<IActionResult>> action) =>
        User.Identity?.IsAuthenticated == true && User.FindFirstValue("sub") is { Length: > 0 } ownerId
            ? Execute(() => action(ownerId))
            : Task.FromResult<IActionResult>(Unauthorized());

    private async Task<IActionResult> Execute(Func<Task<IActionResult>> action)
    {
        try { return await action(); }
        catch (ArticleException ex)
        {
            var status = ex.Error switch
            {
                ArticleError.Validation => 400,
                ArticleError.NotFound => 404,
                ArticleError.Conflict => 409,
                _ => 500
            };
            return Problem(statusCode: status, title: ex.Error.ToString(), detail: ex.Message);
        }
        catch (Application.Features.Moderation.ModerationException ex)
        {
            var status = ex.Error switch
            {
                Application.Features.Moderation.ModerationError.Validation => 400,
                Application.Features.Moderation.ModerationError.NotFound => 404,
                Application.Features.Moderation.ModerationError.Forbidden => 403,
                Application.Features.Moderation.ModerationError.Conflict => 409,
                _ => 500
            };
            return Problem(statusCode: status, title: ex.Error.ToString(), detail: ex.Message);
        }
    }
}
