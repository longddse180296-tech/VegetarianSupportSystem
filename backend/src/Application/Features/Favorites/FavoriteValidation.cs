// Chức năng: danh sách nội dung yêu thích. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using System.ComponentModel.DataAnnotations;
using Application.Common.Validation;

namespace Application.Features.Favorites;

// FavoriteValidation: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
internal static class FavoriteValidation
{
    // Validate: Kiểm tra dữ liệu và điều kiện nghiệp vụ; dừng xử lý khi không hợp lệ.
    public static void Validate(FavoriteRequest request)
    {
        RequestValidation.Validate(request);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (request.TargetType is null || !Enum.IsDefined(request.TargetType.Value))
            Fail(nameof(request.TargetType), "Loại nội dung cần lưu yêu thích chưa hợp lệ.");
        if (request.TargetId == Guid.Empty)
            Fail(nameof(request.TargetId), "Vui lòng chọn nội dung cần lưu yêu thích.");
        if (request.SavedFrom is { } source &&
            (!Enum.IsDefined(source) || request.TargetType != Domain.Enums.FavoriteTargetType.Recipe))
            Fail(nameof(request.SavedFrom), "Nguồn lưu chưa hợp lệ. Chỉ công thức mới có nguồn từ trang Công thức hoặc Tủ bếp AI.");
    }

    // Validate: Kiểm tra dữ liệu và điều kiện nghiệp vụ; dừng xử lý khi không hợp lệ.
    public static void Validate(FavoriteListQuery query)
    {
        RequestValidation.Validate(query);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (query.TargetType.HasValue && !Enum.IsDefined(query.TargetType.Value))
            Fail(nameof(query.TargetType), "Loại nội dung cần lưu yêu thích chưa hợp lệ.");
    }

    // Fail: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static void Fail(string member, string message) =>
        throw new ValidationException(new ValidationResult(message, [member]), null, null);
}
