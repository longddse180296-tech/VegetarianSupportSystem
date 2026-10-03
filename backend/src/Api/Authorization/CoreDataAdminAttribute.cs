using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Api.Authorization;

// Authorization runs before model binding. BE 1 supplies the authenticated principal.
[AttributeUsage(AttributeTargets.Method)]
public sealed class CoreDataAdminAttribute : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;
        int? status = user.Identity?.IsAuthenticated != true ? 401 : !user.IsInRole("Admin") ? 403 : null;
        if (status is null)
        {
            return;
        }

        context.Result = new ObjectResult(new ProblemDetails
        {
            Status = status,
            Title = status == 401 ? "Authentication required." : "Admin role required."
        })
        { StatusCode = status };
    }
}
