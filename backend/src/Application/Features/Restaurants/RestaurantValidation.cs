// Chức năng: tra cứu và quản lý nhà hàng. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using System.ComponentModel.DataAnnotations;
using Application.Common.Validation;
using Domain.Enums;

namespace Application.Features.Restaurants;

// RestaurantValidation: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
internal static class RestaurantValidation
{
    // Validate: Kiểm tra dữ liệu và điều kiện nghiệp vụ; dừng xử lý khi không hợp lệ.
    public static void Validate(RestaurantRequest request)
    {
        RequestValidation.Validate(request);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(request.Name))
            Fail(nameof(request.Name), "Vui lòng nhập tên nhà hàng.");
        if (string.IsNullOrWhiteSpace(request.Address))
            Fail(nameof(request.Address), "Vui lòng nhập địa chỉ nhà hàng.");
        if (request.Latitude.HasValue != request.Longitude.HasValue)
            Fail(nameof(request.Latitude), "Vui lòng nhập đầy đủ cả vĩ độ và kinh độ, hoặc để trống cả hai.");
        if (request.PriceFromVnd.HasValue && request.PriceToVnd.HasValue && request.PriceFromVnd > request.PriceToVnd)
            Fail(nameof(request.PriceToVnd), "Mức giá cao nhất phải lớn hơn hoặc bằng mức giá thấp nhất.");
        if (!IsHttpUrl(request.WebsiteUrl))
            Fail(nameof(request.WebsiteUrl), "Đường dẫn website phải bắt đầu bằng http:// hoặc https://.");
        if (!IsHttpUrl(request.ImageUrl))
            Fail(nameof(request.ImageUrl), "Đường dẫn ảnh chưa hợp lệ. Vui lòng tải lại ảnh hoặc dùng đường dẫn bắt đầu bằng http:// hoặc https://.");
        GetSelectedDietaryTypes(request);
        ValidateNames(request.Amenities, nameof(request.Amenities), 120);
        ValidateFeaturedDishes(request.FeaturedDishes);
    }

    // Validate: Kiểm tra dữ liệu và điều kiện nghiệp vụ; dừng xử lý khi không hợp lệ.
    public static void Validate(RestaurantListQuery query)
    {
        RequestValidation.Validate(query);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (query.Latitude.HasValue != query.Longitude.HasValue)
            Fail(nameof(query.Latitude), "Vui lòng nhập đầy đủ cả vĩ độ và kinh độ, hoặc để trống cả hai.");
        if (query.MaxDistanceKm.HasValue && !query.Latitude.HasValue)
            Fail(nameof(query.MaxDistanceKm), "Vui lòng chọn vị trí trước khi lọc theo khoảng cách.");
    }

    // Chỉ lưu các loại nhà hàng thực sự khai báo; không tự mở rộng sang loại tương thích.
    public static DietaryType[] GetSelectedDietaryTypes(RestaurantRequest request)
    {
        var types = request.DietaryTypes ?? [];
        if (types.Length == 0 && request.DietaryType is DietaryType legacyType)
            types = [legacyType];
        if (types.Length == 0 || types.Any(type => !Enum.IsDefined(type)))
            Fail(nameof(request.DietaryTypes), "Vui lòng chọn ít nhất một chế độ ăn hợp lệ mà nhà hàng phục vụ.");
        if (types.Distinct().Count() != types.Length)
            Fail(nameof(request.DietaryTypes), "Mỗi chế độ ăn chỉ được chọn một lần.");
        if (request.DietaryType is DietaryType singleType && !types.Contains(singleType))
            Fail(nameof(request.DietaryTypes), "Thông tin chế độ ăn chưa thống nhất. Vui lòng chọn lại.");
        return types.OrderBy(type => type).ToArray();
    }

    // IsHttpUrl: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    private static bool IsHttpUrl(string? value) => string.IsNullOrWhiteSpace(value) ||
        Uri.TryCreate(value, UriKind.Absolute, out var uri) && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);

    // ValidateNames: Kiểm tra dữ liệu và điều kiện nghiệp vụ; dừng xử lý khi không hợp lệ.
    private static void ValidateNames(string[]? values, string field, int maxLength)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (values is null || values.Any(value => string.IsNullOrWhiteSpace(value) || value.Trim().Length > maxLength) ||
            values.Select(value => value.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Count() != values.Length)
            Fail(field, "Tên tiện ích không được để trống, bị trùng hoặc dài quá 120 ký tự.");
    }

    // ValidateFeaturedDishes: Kiểm tra dữ liệu và điều kiện nghiệp vụ; dừng xử lý khi không hợp lệ.
    private static void ValidateFeaturedDishes(RestaurantFeaturedDishRequest[]? dishes)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (dishes is null)
        {
            Fail(nameof(RestaurantRequest.FeaturedDishes), "Vui lòng nhập đủ 3 món nổi bật, mỗi món có tên và ảnh tải lên hợp lệ.");
            return;
        }

        if (dishes.Length != 3 || dishes.Any(dish => dish is null || string.IsNullOrWhiteSpace(dish.Name) ||
                dish.Name.Trim().Length > 120 || string.IsNullOrWhiteSpace(dish.ImageUrl) ||
                dish.ImageUrl.Trim().Length > 2048 || !IsHttpUrl(dish.ImageUrl)))
        {
            Fail(nameof(RestaurantRequest.FeaturedDishes), "Vui lòng nhập đủ 3 món nổi bật, mỗi món có tên và ảnh tải lên hợp lệ.");
            return;
        }

        if (dishes.Select(dish => dish.Name.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Count() != dishes.Length)
            Fail(nameof(RestaurantRequest.FeaturedDishes), "Tên các món nổi bật không được trùng nhau.");
    }

    // Fail: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public static void Fail(string member, string message) =>
        throw new ValidationException(new ValidationResult(message, [member]), null, null);
}
