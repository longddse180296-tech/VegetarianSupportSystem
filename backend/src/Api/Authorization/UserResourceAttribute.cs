// Chức năng: kiểm tra quyền truy cập. Tầng API nhận yêu cầu, kiểm tra quyền và chuyển xử lý cho Application.
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Api.Authorization;

// UserResourceAttribute: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class UserResourceAttribute : Attribute, IAuthorizationFilter
{
    // OnAuthorization: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;
        var authenticated = user.Identity?.IsAuthenticated == true &&
            !string.IsNullOrWhiteSpace(user.FindFirst("sub")?.Value);
        int? status = !authenticated ? 401 : !user.IsInRole("User") && !user.IsInRole("Admin") ? 403 : null;
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (status is null)
            return;

        context.Result = new ObjectResult(new ProblemDetails
        {
            Status = status,
            Title = status == 401 ? "Vui lòng đăng nhập để tiếp tục." : "Tài khoản của bạn không có quyền thực hiện thao tác này."
        }) { StatusCode = status };
    }
}
