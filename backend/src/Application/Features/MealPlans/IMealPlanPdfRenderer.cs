// BE2-09 | Hợp đồng xuất PDF từ dữ liệu thực đơn đã lưu (thực đơn tuần, dinh dưỡng, danh sách mua và PDF).
// Định nghĩa bộ kết xuất PDF thực đơn mà API gọi khi người dùng tải xuống.
namespace Application.Features.MealPlans;

// IMealPlanPdfRenderer: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IMealPlanPdfRenderer
{
    // Render: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    byte[] Render(MealPlanResponse plan);
}
