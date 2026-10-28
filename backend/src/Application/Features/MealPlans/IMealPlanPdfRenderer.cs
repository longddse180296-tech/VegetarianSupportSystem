// Chức năng: thực đơn bảy ngày và danh sách đi chợ. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.MealPlans;

// IMealPlanPdfRenderer: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IMealPlanPdfRenderer
{
    // Render: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    byte[] Render(MealPlanResponse plan);
}
