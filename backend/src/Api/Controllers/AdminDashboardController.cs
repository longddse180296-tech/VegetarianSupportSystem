using Api.Authorization;
using Application.Features.Administration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Authorize(Policy = AccountAuthorization.AdminPolicy)]
[Route("api/admin/dashboard")]
public sealed class AdminDashboardController(DashboardService dashboard) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<DashboardOverview>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<DashboardOverview>> Get(CancellationToken cancellationToken) =>
        Ok(await dashboard.GetOverviewAsync(cancellationToken));
}
