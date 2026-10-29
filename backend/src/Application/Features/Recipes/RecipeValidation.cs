// Chức năng: công thức và định lượng nguyên liệu. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using System.ComponentModel.DataAnnotations;
using Application.Common.Validation;
using Domain.Enums;

namespace Application.Features.Recipes;

// RecipeValidation: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
internal static class RecipeValidation
{
    // Validate: Kiểm tra dữ liệu và điều kiện nghiệp vụ; dừng xử lý khi không hợp lệ.
    public static void Validate(RecipeRequest request)
    {
        RequestValidation.Validate(request);

        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (request.DeclaredDietaryType is not DietaryType dietaryType || !Enum.IsDefined(dietaryType))
        {
            Fail(nameof(request.DeclaredDietaryType), "Vui lòng chọn một chế độ ăn hợp lệ.");
        }

        if (request.ImageUrl is not null &&
            (!Uri.TryCreate(request.ImageUrl, UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)))
        {
            Fail(nameof(request.ImageUrl), "Đường dẫn ảnh chưa hợp lệ. Vui lòng tải lại ảnh hoặc dùng đường dẫn bắt đầu bằng http:// hoặc https://.");
        }

        for (var index = 0; index < request.Ingredients.Length; index++)
        {
            var row = request.Ingredients[index];
            if (row is null)
            {
                Fail($"Ingredients[{index}]", "Vui lòng chọn đầy đủ nguyên liệu cho từng dòng.");
            }

            try
            {
                RequestValidation.Validate(row!);
            }
            catch (ValidationException ex)
            {
                var field = ex.ValidationResult?.MemberNames.FirstOrDefault();
                Fail($"Ingredients[{index}].{field ?? "request"}", ex.Message);
            }
        }

        if (request.Ingredients.Select(row => row.IngredientId).Distinct().Count() != request.Ingredients.Length)
        {
            Fail(nameof(request.Ingredients), "Mỗi nguyên liệu chỉ được xuất hiện một lần trong công thức.");
        }
    }

    // Fail: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public static void Fail(string field, string message) =>
        throw new ValidationException(new ValidationResult(message, [field]), null, null);
}
