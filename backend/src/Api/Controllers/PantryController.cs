// Chức năng: tủ bếp và nguyên liệu sẵn có. Tầng API nhận yêu cầu, kiểm tra quyền và chuyển xử lý cho Application.
using Api.Authorization;
using Application.Features.Pantry;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

// PantryController: cung cấp endpoint HTTP, kiểm tra danh tính và chuyển yêu cầu cho tầng Application.
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
    // List: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet("items")]
    [ProducesResponseType<IReadOnlyList<PantryItemResponse>>(StatusCodes.Status200OK)]
    public Task<IActionResult> List(CancellationToken ct) =>
        Execute(async () => Ok(await service.ListAsync(CurrentUserId, ct)));

    // Get: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet("items/{id:guid}")]
    [ProducesResponseType<PantryItemResponse>(StatusCodes.Status200OK)]
    public Task<IActionResult> Get(Guid id, CancellationToken ct) =>
        Execute(async () => Ok(await service.GetAsync(CurrentUserId, id, ct)));

    // Create: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    [HttpPost("items")]
    [ProducesResponseType<PantryItemResponse>(StatusCodes.Status201Created)]
    public Task<IActionResult> Create(PantryItemRequest request, CancellationToken ct) =>
        Execute(async () =>
        {
            var result = await service.CreateAsync(CurrentUserId, request, ct);
            return CreatedAtAction(nameof(Get), new { id = result.Id }, result);
        });

    // Update: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    [HttpPut("items/{id:guid}")]
    [ProducesResponseType<PantryItemResponse>(StatusCodes.Status200OK)]
    public Task<IActionResult> Update(Guid id, PantryItemRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await service.UpdateAsync(CurrentUserId, id, request, ct)));

    // Delete: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    [HttpDelete("items/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        Execute(async () =>
        {
            await service.DeleteAsync(CurrentUserId, id, ct);
            return NoContent();
        });

    // RecipeSuggestions: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [HttpGet("recipe-suggestions")]
    [ProducesResponseType<IReadOnlyList<PantryRecipeSuggestionResponse>>(StatusCodes.Status200OK)]
    public Task<IActionResult> RecipeSuggestions([FromQuery] PantryRecipeSuggestionQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.GetRecipeSuggestionsAsync(CurrentUserId, query, ct)));

    // SubstitutionCandidates: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [HttpGet("items/{id:guid}/substitution-candidates")]
    [ProducesResponseType<IReadOnlyList<PantrySubstitutionCandidateResponse>>(StatusCodes.Status200OK)]
    public Task<IActionResult> SubstitutionCandidates(Guid id, CancellationToken ct) =>
        Execute(async () => Ok(await service.GetSubstitutionCandidatesAsync(CurrentUserId, id, ct)));

    private string CurrentUserId => User.FindFirst("sub")!.Value;
}
