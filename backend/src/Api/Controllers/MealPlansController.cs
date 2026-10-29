// Chức năng: thực đơn bảy ngày và danh sách đi chợ. Tầng API nhận yêu cầu, kiểm tra quyền và chuyển xử lý cho Application.
using Api.Authorization;
using Application.Features.MealPlans;
using Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

// MealPlansController: cung cấp endpoint HTTP, kiểm tra danh tính và chuyển yêu cầu cho tầng Application.
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
    // List: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet]
    [ProducesResponseType<MealPlanPage>(StatusCodes.Status200OK)]
    public Task<IActionResult> List([FromQuery] MealPlanListQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListAsync(CurrentUserId, query, ct)));

    // Get: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet("{id:guid}")]
    [ProducesResponseType<MealPlanResponse>(StatusCodes.Status200OK)]
    public Task<IActionResult> Get(Guid id, CancellationToken ct) =>
        Execute(async () => Ok(await service.GetAsync(CurrentUserId, id, ct)));

    // Delete: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        Execute(async () =>
        {
            await service.DeleteAsync(CurrentUserId, id, ct);
            return NoContent();
        });

    // Generate: Tạo kết quả dựa trên đầu vào và các ràng buộc đang áp dụng.
    [HttpPost("generate")]
    [ProducesResponseType<MealPlanResponse>(StatusCodes.Status201Created)]
    public Task<IActionResult> Generate(MealPlanGenerateRequest request, CancellationToken ct) =>
        Execute(async () =>
        {
            var result = await service.GenerateAsync(CurrentUserId, request, ct);
            return CreatedAtAction(nameof(Get), new { id = result.Id }, result);
        });

    // Regenerate: Tạo kết quả dựa trên đầu vào và các ràng buộc đang áp dụng.
    [HttpPost("{id:guid}/regenerate")]
    [ProducesResponseType<MealPlanResponse>(StatusCodes.Status200OK)]
    public Task<IActionResult> Regenerate(Guid id, CancellationToken ct) =>
        Execute(async () => Ok(await service.RegenerateAsync(CurrentUserId, id, ct)));

    // ApplyToWeek: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [HttpPost("{id:guid}/apply-to-week")]
    [ProducesResponseType<MealPlanResponse>(StatusCodes.Status201Created)]
    public Task<IActionResult> ApplyToWeek(Guid id, MealPlanCopyToWeekRequest request, CancellationToken ct) =>
        Execute(async () =>
        {
            var result = await service.CopyToWeekAsync(CurrentUserId, id, request, ct);
            return CreatedAtAction(nameof(Get), new { id = result.Id }, result);
        });

    // ReplaceMeal: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [HttpPut("{id:guid}/meals/{day:int}/{slot}")]
    [ProducesResponseType<MealPlanResponse>(StatusCodes.Status200OK)]
    public Task<IActionResult> ReplaceMeal(Guid id, int day, MealSlot slot, MealReplacementRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await service.ReplaceMealAsync(CurrentUserId, id, day, slot, request, ct)));

    // ShoppingList: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [HttpGet("{id:guid}/shopping-list")]
    [ProducesResponseType<IReadOnlyList<ShoppingItemResponse>>(StatusCodes.Status200OK)]
    public Task<IActionResult> ShoppingList(Guid id, [FromQuery] int? day, CancellationToken ct) =>
        Execute(async () => Ok(await service.GetShoppingListAsync(CurrentUserId, id, day, ct)));

    // UpdatePurchase: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    [HttpPut("{id:guid}/shopping-list/{itemId:guid}/purchase")]
    [ProducesResponseType<IReadOnlyList<ShoppingItemResponse>>(StatusCodes.Status200OK)]
    public Task<IActionResult> UpdatePurchase(Guid id, Guid itemId, ShoppingPurchaseRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await service.UpdatePurchaseAsync(CurrentUserId, id, itemId, request, ct)));

    // ExportPdf: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
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
