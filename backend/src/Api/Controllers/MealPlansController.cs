using Api.Authorization;
using Application.Features.MealPlans;
using Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[UserResource]
[Route("api/meal-plans")]
[ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
public sealed class MealPlansController(MealPlanService service, IMealPlanPdfRenderer pdfRenderer) : CoreDataControllerBase
{
    [HttpGet]
    [ProducesResponseType<MealPlanPage>(StatusCodes.Status200OK)]
    public Task<IActionResult> List([FromQuery] MealPlanListQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListAsync(CurrentUserId, query, ct)));

    [HttpGet("{id:guid}")]
    [ProducesResponseType<MealPlanResponse>(StatusCodes.Status200OK)]
    public Task<IActionResult> Get(Guid id, CancellationToken ct) =>
        Execute(async () => Ok(await service.GetAsync(CurrentUserId, id, ct)));

    [HttpPost("generate")]
    [ProducesResponseType<MealPlanResponse>(StatusCodes.Status201Created)]
    public Task<IActionResult> Generate(MealPlanGenerateRequest request, CancellationToken ct) =>
        Execute(async () =>
        {
            var result = await service.GenerateAsync(CurrentUserId, request, ct);
            return CreatedAtAction(nameof(Get), new { id = result.Id }, result);
        });

    [HttpPost("{id:guid}/regenerate")]
    [ProducesResponseType<MealPlanResponse>(StatusCodes.Status200OK)]
    public Task<IActionResult> Regenerate(Guid id, CancellationToken ct) =>
        Execute(async () => Ok(await service.RegenerateAsync(CurrentUserId, id, ct)));

    [HttpPost("{id:guid}/apply-to-week")]
    [ProducesResponseType<MealPlanResponse>(StatusCodes.Status201Created)]
    public Task<IActionResult> ApplyToWeek(Guid id, MealPlanCopyToWeekRequest request, CancellationToken ct) =>
        Execute(async () =>
        {
            var result = await service.CopyToWeekAsync(CurrentUserId, id, request, ct);
            return CreatedAtAction(nameof(Get), new { id = result.Id }, result);
        });

    [HttpPut("{id:guid}/meals/{day:int}/{slot}")]
    [ProducesResponseType<MealPlanResponse>(StatusCodes.Status200OK)]
    public Task<IActionResult> ReplaceMeal(Guid id, int day, MealSlot slot, MealReplacementRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await service.ReplaceMealAsync(CurrentUserId, id, day, slot, request, ct)));

    [HttpGet("{id:guid}/shopping-list")]
    [ProducesResponseType<IReadOnlyList<ShoppingItemResponse>>(StatusCodes.Status200OK)]
    public Task<IActionResult> ShoppingList(Guid id, CancellationToken ct) =>
        Execute(async () => Ok((await service.GetAsync(CurrentUserId, id, ct)).ShoppingItems));

    [HttpPut("{id:guid}/shopping-list/{itemId:guid}/purchase")]
    [ProducesResponseType<IReadOnlyList<ShoppingItemResponse>>(StatusCodes.Status200OK)]
    public Task<IActionResult> UpdatePurchase(Guid id, Guid itemId, ShoppingPurchaseRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await service.UpdatePurchaseAsync(CurrentUserId, id, itemId, request, ct)));

    [HttpGet("{id:guid}/pdf")]
    [Produces("application/pdf")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public Task<IActionResult> ExportPdf(Guid id, CancellationToken ct) =>
        Execute(async () =>
        {
            var plan = await service.GetAsync(CurrentUserId, id, ct);
            return File(pdfRenderer.Render(plan), "application/pdf", "meal-plan-" + plan.WeekStartDate.ToString("yyyy-MM-dd") + ".pdf");
        });

    private string CurrentUserId => User.FindFirst("sub")!.Value;
}
