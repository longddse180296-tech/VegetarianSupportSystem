// Chức năng: kiểm tra quyền truy cập. Tầng API nhận yêu cầu, kiểm tra quyền và chuyển xử lý cho Application.
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Api.Authorization;

// Authorization runs before model binding. BE 1 supplies the authenticated principal.
// CoreDataAdminAttribute: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
[AttributeUsage(AttributeTargets.Method)]
public sealed class CoreDataAdminAttribute : Attribute, IAuthorizationFilter
{
    // OnAuthorization: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;
        int? status = user.Identity?.IsAuthenticated != true ? 401 : !user.IsInRole("Admin") ? 403 : null;
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (status is null)
        {
            return;
        }

        context.Result = new ObjectResult(new ProblemDetails
        {
            Status = status,
            Title = status == 401 ? "Vui lòng đăng nhập để tiếp tục." : "Bạn cần quyền Quản trị viên để thực hiện thao tác này."
        })
        { StatusCode = status };
    }
}
