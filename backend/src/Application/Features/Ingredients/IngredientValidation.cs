// Chức năng: danh mục nguyên liệu và dữ liệu dinh dưỡng. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Application.Common.Validation;
using System.ComponentModel.DataAnnotations;
using Domain.Enums;

namespace Application.Features.Ingredients;

// IngredientValidation: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
internal static class IngredientValidation
{
    // Validate: Kiểm tra dữ liệu và điều kiện nghiệp vụ; dừng xử lý khi không hợp lệ.
    public static void Validate(IngredientRequest request)
    {
        RequestValidation.Validate(request);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (request.Origin == IngredientOrigin.Plant && (request.ContainsEgg || request.ContainsMilk || request.ContainsHoney || request.ContainsOtherAnimalProducts == true))
        {
            throw new ValidationException(new ValidationResult(
                "Nguyên liệu có thành phần từ động vật không thể chọn nguồn gốc thực vật. Vui lòng kiểm tra nguồn gốc nguyên liệu.",
                [nameof(request.Origin)]), null, request.Origin);
        }
    }
}
