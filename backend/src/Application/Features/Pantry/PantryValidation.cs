// Chức năng: tủ bếp và nguyên liệu sẵn có. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using System.ComponentModel.DataAnnotations;
using Application.Common.Validation;

namespace Application.Features.Pantry;

// PantryValidation: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
internal static class PantryValidation
{
    // Validate: Kiểm tra dữ liệu và điều kiện nghiệp vụ; dừng xử lý khi không hợp lệ.
    public static void Validate(PantryItemRequest request)
    {
        RequestValidation.Validate(request);
        var hasIngredient = request.IngredientId.HasValue && request.IngredientId.Value != Guid.Empty;
        var hasName = !string.IsNullOrWhiteSpace(request.Name);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (hasIngredient == hasName)
            Fail(nameof(request.IngredientId), "Vui lòng chọn nguyên liệu trong danh sách hoặc nhập tên riêng, không dùng đồng thời cả hai.");
        if (request.IngredientId == Guid.Empty)
            Fail(nameof(request.IngredientId), "Vui lòng chọn nguyên liệu hợp lệ.");
        if (hasName && request.Name!.Trim().Length > 120)
            Fail(nameof(request.Name), "Tên nguyên liệu không được vượt quá 120 ký tự.");
        if (request.Quantity.HasValue != !string.IsNullOrWhiteSpace(request.Unit))
            Fail(nameof(request.Quantity), "Vui lòng nhập cả số lượng và đơn vị, hoặc để trống cả hai nếu chưa xác định.");
    }

    // Validate: Kiểm tra dữ liệu và điều kiện nghiệp vụ; dừng xử lý khi không hợp lệ.
    public static void Validate(PantryRecipeSuggestionQuery query) => RequestValidation.Validate(query);

    // Fail: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public static void Fail(string member, string message) =>
        throw new ValidationException(new ValidationResult(message, [member]), null, null);
}
