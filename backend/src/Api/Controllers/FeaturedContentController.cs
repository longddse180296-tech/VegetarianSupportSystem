// Chức năng: hạ tầng và quy tắc dùng chung. Tầng API nhận yêu cầu, kiểm tra quyền và chuyển xử lý cho Application.
using Api.Authorization;
using Application.Features.Administration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

// FeaturedContentController: cung cấp endpoint HTTP, kiểm tra danh tính và chuyển yêu cầu cho tầng Application.
[ApiController]
[AllowAnonymous]
[Route("api/featured-content")]
public sealed class FeaturedContentController(FeaturedContentService service) : CoreDataControllerBase
{
    // List: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet]
    [ProducesResponseType<FeaturedContentPage>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public Task<IActionResult> List([FromQuery] FeaturedContentListQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListAsync(query, true, ct)));
}

// AdminFeaturedContentController: cung cấp endpoint HTTP, kiểm tra danh tính và chuyển yêu cầu cho tầng Application.
[ApiController]
[Authorize(Policy = AccountAuthorization.AdminPolicy)]
[Route("api/admin/featured-content")]
[ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class AdminFeaturedContentController(FeaturedContentService service) : CoreDataControllerBase
{
    // List: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet]
    [ProducesResponseType<FeaturedContentPage>(StatusCodes.Status200OK)]
    public Task<IActionResult> List([FromQuery] FeaturedContentListQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await service.ListAsync(query, false, ct)));

    // SetPinned: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    [HttpPut("{contentType}/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public Task<IActionResult> SetPinned(string contentType, Guid id, [FromBody] FeaturedContentPinRequest request,
        CancellationToken ct) => Execute(async () =>
        {
            await service.SetPinnedAsync(contentType, id, request, User.GetUserId()!, ct);
            return NoContent();
        });
}
