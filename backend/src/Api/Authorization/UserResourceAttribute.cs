using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Api.Authorization;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class UserResourceAttribute : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;
        var authenticated = user.Identity?.IsAuthenticated == true &&
            !string.IsNullOrWhiteSpace(user.FindFirst("sub")?.Value);
        int? status = !authenticated ? 401 : !user.IsInRole("User") && !user.IsInRole("Admin") ? 403 : null;
        if (status is null)
            return;

        context.Result = new ObjectResult(new ProblemDetails
        {
            Status = status,
            Title = status == 401 ? "Authentication required." : "User or Admin role required."
        }) { StatusCode = status };
    }
}
