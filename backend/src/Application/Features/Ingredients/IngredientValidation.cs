// BE2-03 | Kiểm tra dữ liệu đầu vào theo quy tắc nghiệp vụ (nguyên liệu: nguồn gốc, dị nguyên và dinh dưỡng theo đơn vị).
// Kiểm tra dữ liệu đầu vào của nguyên liệu, nguồn gốc, đơn vị và dinh dưỡng trước khi thực hiện nghiệp vụ.
using Application.Common.Validation;

namespace Application.Features.Ingredients;

// IngredientValidation: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
internal static class IngredientValidation
{
    // Validate: Kiểm tra dữ liệu và điều kiện nghiệp vụ; dừng xử lý khi không hợp lệ.
    public static void Validate(IngredientRequest request)
    {
        RequestValidation.Validate(request);
    }
}
