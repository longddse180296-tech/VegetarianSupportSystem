// Chức năng: công thức và định lượng nguyên liệu. Tầng API nhận yêu cầu, kiểm tra quyền và chuyển xử lý cho Application.
using System.ComponentModel.DataAnnotations;
using Application.Features.Recipes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Api.Authorization;

namespace Api.Hubs;

// RecipeNutritionHub: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
[Authorize(Roles = "Admin")]
public sealed class RecipeNutritionHub(RecipeNutritionService nutrition, AccountTokenValidator tokens) : Hub
{
    // Calculate: Tính kết quả từ dữ liệu đã khai báo; kiểm tra điều kiện trước khi trả chỉ số.
    public async Task<RecipeNutritionResponse> Calculate(RecipeNutritionRequest request)
    {
        // Kết nối SignalR đang mở cũng phải dừng khi phiên bị thay thế hoặc tài khoản bị khóa.
        if (!await tokens.IsValidAsync(Context.User, Context.ConnectionAborted))
        {
            Context.Abort();
            throw new HubException("Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.");
        }
        try { return await nutrition.CalculateAsync(request, Context.ConnectionAborted); }
        catch (ValidationException ex) { throw new HubException(ex.Message); }
    }
}
