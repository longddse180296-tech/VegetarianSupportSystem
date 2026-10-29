// Chức năng: kiểm tra quyền truy cập. Tầng API nhận yêu cầu, kiểm tra quyền và chuyển xử lý cho Application.
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace Api.Authorization;

// AccountAuthorization: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public static class AccountAuthorization
{
    public const string AdminPolicy = "ActiveAdmin";

    // AddAccountPolicies: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public static void AddAccountPolicies(AuthorizationOptions options)
    {
        options.AddPolicy(AdminPolicy, policy => policy.RequireAuthenticatedUser()
            .RequireAssertion(context => context.User.HasRole("Admin")));
    }

    // GetUserId: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public static string? GetUserId(this ClaimsPrincipal principal)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (principal.Identity?.IsAuthenticated != true) return null;
        var subjects = principal.FindAll("sub").ToArray();
        return subjects.Length == 1 && !string.IsNullOrWhiteSpace(subjects[0].Value)
            ? subjects[0].Value : null;
    }

    // HasRole: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    public static bool HasRole(this ClaimsPrincipal principal, string role) =>
        principal.GetUserId() is not null && principal.IsInRole(role);

    // Owns: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public static bool Owns(this ClaimsPrincipal principal, string ownerUserId) =>
        principal.GetUserId() is { } userId &&
        string.Equals(userId, ownerUserId, StringComparison.Ordinal);
}
