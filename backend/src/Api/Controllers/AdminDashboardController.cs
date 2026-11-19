// Trả thống kê dashboard cho tài khoản có quyền Admin.
using Api.Authorization;
using Application.Features.Administration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

// AdminDashboardController: cung cấp endpoint HTTP, kiểm tra danh tính và chuyển yêu cầu cho tầng Application.
[ApiController]
[Authorize(Policy = AccountAuthorization.AdminPolicy)]
[Route("api/admin/dashboard")]
public sealed class AdminDashboardController(DashboardService dashboard) : ControllerBase
{
    // Get: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet]
    [ProducesResponseType<DashboardOverview>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<DashboardOverview>> Get(CancellationToken cancellationToken) =>
        Ok(await dashboard.GetOverviewAsync(cancellationToken));
}
