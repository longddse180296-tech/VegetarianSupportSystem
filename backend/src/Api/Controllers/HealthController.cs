using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/health")]
public sealed class HealthController : ControllerBase
{
    [HttpGet]
    public ActionResult<HealthResponse> Get() => Ok(new HealthResponse(
        "ok", "API", DateTimeOffset.UtcNow));
}

public sealed record HealthResponse(string Status, string Service, DateTimeOffset Timestamp);
