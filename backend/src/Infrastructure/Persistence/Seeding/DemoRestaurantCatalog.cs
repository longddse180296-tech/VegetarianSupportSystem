using Domain.Entities;
using Domain.Enums;

namespace Infrastructure.Persistence.Seeding;

internal static class DemoRestaurantCatalog
{
    internal static Restaurant[] Restaurants() =>
    [
        Make(301, "Bếp Lá Quận 1", "Quận 1, TP.HCM", 10.776889m, 106.700806m, 45000, 120000,
            "Hằng ngày 07:00 - 21:00", [DietaryType.Vegan], ["Wi-Fi", "Chỗ đỗ xe", "Máy lạnh"], [206, 211, 215]),
        Make(302, "Cơm Chay Mộc Quận 3", "Quận 3, TP.HCM", 10.784100m, 106.686800m, 35000, 85000,
            "Thứ Hai - Thứ Bảy 10:00 - 20:00; Chủ Nhật nghỉ", [DietaryType.Vegan], ["Mang đi", "Chỗ đỗ xe máy"], [208, 209, 212]),
        Make(303, "Vườn Rau Thủ Đức", "Thủ Đức, TP.HCM", 10.850000m, 106.771700m, 65000, 180000,
            "Hằng ngày 09:00 - 22:00", [DietaryType.Vegan, DietaryType.LactoVegetarian], ["Wi-Fi", "Sân vườn", "Chỗ đỗ xe"], [215, 216, 228]),
        Make(304, "Bữa Sáng Xanh Quận 7", "Quận 7, TP.HCM", 10.729500m, 106.721900m, 40000, 95000,
            "Hằng ngày 06:30 - 14:00", [DietaryType.OvoVegetarian, DietaryType.LactoOvoVegetarian], ["Wi-Fi", "Mang đi"], [203, 222, 226]),
        Make(305, "Bếp Sen Ba Đình", "Ba Đình, Hà Nội", 21.035900m, 105.819800m, 50000, 150000,
            "Hằng ngày 08:00 - 21:30", [DietaryType.Vegan], ["Wi-Fi", "Máy lạnh"], [207, 213, 218]),
        Make(306, "Chay An Hoàn Kiếm", "Hoàn Kiếm, Hà Nội", 21.028500m, 105.854200m, 80000, 220000,
            "Hằng ngày 10:00 - 22:00", [DietaryType.LactoVegetarian, DietaryType.LactoOvoVegetarian], ["Wi-Fi", "Máy lạnh", "Chỗ đỗ xe"], [224, 225, 228]),
        Make(307, "Đậu Và Nấm Tây Hồ", "Tây Hồ, Hà Nội", 21.067300m, 105.824100m, 55000, 140000,
            "Thứ Ba - Chủ Nhật 09:00 - 21:00; Thứ Hai nghỉ", [DietaryType.Vegan], ["Sân vườn", "Mang đi"], [205, 210, 212]),
        Make(308, "Bếp Trứng Long Biên", "Long Biên, Hà Nội", 21.046200m, 105.894000m, 45000, 110000,
            "Hằng ngày 07:00 - 20:00", [DietaryType.OvoVegetarian], ["Wi-Fi", "Chỗ đỗ xe máy"], [222, 223]),
        Make(309, "Rau Biển Hải Châu", "Hải Châu, Đà Nẵng", 16.047100m, 108.206800m, 40000, 130000,
            "Hằng ngày 08:00 - 21:00", [DietaryType.Vegan], ["Wi-Fi", "Máy lạnh"], [211, 214, 217]),
        Make(310, "Góc Chay Sơn Trà", "Sơn Trà, Đà Nẵng", 16.070000m, 108.235000m, 60000, 160000,
            "Hằng ngày 09:00 - 22:00", [DietaryType.Vegan, DietaryType.LactoVegetarian, DietaryType.OvoVegetarian, DietaryType.LactoOvoVegetarian],
            ["Wi-Fi", "Sân vườn", "Chỗ đỗ xe"], [206, 222, 225, 226]),
        MissingDetails(),
        Inactive()
    ];

    private static Restaurant Make(int id, string name, string district, decimal? latitude, decimal? longitude,
        int? priceFrom, int? priceTo, string? hours, DietaryType[] diets, string[] amenities, int[] recipes) => new()
    {
        Id = DemoDataCatalog.Id(id), Name = $"[Demo] {name}", District = district,
        Address = $"{id - 300} Đường Demo, {district} (địa chỉ giả lập)",
        Description = "Nhà hàng giả lập để demo tìm kiếm, bản đồ và quản trị. Tọa độ, giá và giờ mở cửa chỉ minh họa. Chế độ ăn do dữ liệu mẫu khai báo, không chứng nhận món ăn thực tế.",
        Latitude = latitude, Longitude = longitude, PriceFromVnd = priceFrom, PriceToVnd = priceTo,
        OpeningHours = hours,
        Source = "Dữ liệu demo giả lập; không phải địa điểm kinh doanh thật. Không có số liên hệ hoặc website thực tế.",
        DietaryTypes = diets.Select(diet => new RestaurantDietaryType
        {
            RestaurantId = DemoDataCatalog.Id(id), DietaryType = diet
        }).ToList(),
        Amenities = amenities.Select((name, index) => new RestaurantAmenity
        {
            Id = DemoDataCatalog.Id(id * 10 + index), RestaurantId = DemoDataCatalog.Id(id), Name = name
        }).ToList(),
        RelatedRecipes = recipes.Select(recipe => new RestaurantRecipe
        {
            RestaurantId = DemoDataCatalog.Id(id), RecipeId = DemoDataCatalog.Id(recipe)
        }).ToList()
    };

    private static Restaurant MissingDetails() => Make(311, "Quán Chay Chưa Có Tọa Độ", "Ngũ Hành Sơn, Đà Nẵng",
        null, null, null, null, null, [DietaryType.Vegan], [], [207]);

    private static Restaurant Inactive()
    {
        var restaurant = Make(312, "Nhà Hàng Đã Ngừng", "Quận 10, TP.HCM", 10.773400m, 106.667900m,
            30000, 70000, "Đã ngừng sử dụng trong dữ liệu demo", [DietaryType.Vegan], ["Mang đi"], [206]);
        restaurant.IsActive = false;
        return restaurant;
    }
}
