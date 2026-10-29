// Chức năng: tra cứu và quản lý nhà hàng. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Application.Common.Exceptions;
using Application.Features.Favorites;
using Domain.Entities;
using Domain.Enums;

namespace Application.Features.Restaurants;

// RestaurantService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed class RestaurantService(IRestaurantRepository repository, IFavoriteRepository? favorites = null)
{
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<RestaurantPage> ListAsync(RestaurantListQuery query, bool includeInactive, CancellationToken ct)
    {
        RestaurantValidation.Validate(query);
        var restaurants = await repository.ListAsync(query, includeInactive, ct);
        var items = restaurants
            .Select(restaurant => new RestaurantWithDistance(restaurant, GetDistanceKm(restaurant, query.Latitude, query.Longitude)))
            .Where(item => !query.MaxDistanceKm.HasValue ||
                (item.DistanceKm.HasValue && item.DistanceKm.Value <= query.MaxDistanceKm.Value))
            .OrderBy(item => query.Latitude.HasValue ? item.DistanceKm ?? decimal.MaxValue : 0)
            .ThenBy(item => item.Restaurant.Name)
            .ThenBy(item => item.Restaurant.Id)
            .ToArray();

        var totalCount = items.Length;
        var offset = ((long)query.PageNumber - 1) * query.PageSize;
        var page = offset >= totalCount
            ? Array.Empty<RestaurantWithDistance>()
            : items.Skip((int)offset).Take(query.PageSize).ToArray();

        return new RestaurantPage(
            page.Select(item => RestaurantMapping.ToSummary(item.Restaurant, item.DistanceKm)).ToArray(),
            query.PageNumber,
            query.PageSize,
            totalCount);
    }

    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<RestaurantResponse> GetAsync(Guid id, bool includeInactive, CancellationToken ct)
    {
        var entity = await FindAsync(id, ct);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (!includeInactive && !entity.IsActive)
            throw new KeyNotFoundException("Không tìm thấy nhà hàng hoặc nhà hàng không còn khả dụng.");
        return RestaurantMapping.ToResponse(entity, null);
    }

    // CreateAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<RestaurantResponse> CreateAsync(RestaurantRequest request, CancellationToken ct)
    {
        var entity = new Restaurant();
        await ApplyAsync(entity, request, ct);
        repository.Add(entity);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
        return RestaurantMapping.ToResponse(await FindAsync(entity.Id, ct), null);
    }

    // UpdateAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<RestaurantResponse> UpdateAsync(Guid id, RestaurantRequest request, CancellationToken ct)
    {
        var entity = await FindAsync(id, ct);
        await ApplyAsync(entity, request, ct);
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
        return RestaurantMapping.ToResponse(await FindAsync(entity.Id, ct), null);
    }

    // DeactivateAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task DeactivateAsync(Guid id, CancellationToken ct)
    {
        var entity = await FindAsync(id, ct);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (!entity.IsActive)
            return;

        entity.IsActive = false;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        favorites?.RemoveAllByTarget(FavoriteTargetType.Restaurant, entity.Id);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
    }

    // Mở khóa phải lưu trạng thái thật, chỉ thay trạng thái/giờ cập nhật và không khôi phục favorite đã gỡ.
    public async Task ActivateAsync(Guid id, CancellationToken ct)
    {
        var entity = await FindAsync(id, ct);
        if (entity.IsActive) return;
        entity.IsActive = true;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await repository.SaveAsync(ct);
    }

    // FindAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    private async Task<Restaurant> FindAsync(Guid id, CancellationToken ct) =>
        await repository.GetAsync(id, ct) ?? throw new KeyNotFoundException("Không tìm thấy nhà hàng hoặc nhà hàng không còn khả dụng.");

    // ApplyAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private async Task ApplyAsync(Restaurant entity, RestaurantRequest request, CancellationToken ct)
    {
        RestaurantValidation.Validate(request);
        var dietaryTypes = RestaurantValidation.GetSelectedDietaryTypes(request);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (await repository.NameExistsAsync(request.Name.Trim(), entity.Id, ct))
            throw new ConflictException("Tên nhà hàng đã tồn tại. Vui lòng kiểm tra cả nhà hàng đã ngừng sử dụng.");

        entity.Name = request.Name.Trim();
        entity.Description = request.Description?.Trim();
        entity.Address = request.Address.Trim();
        entity.District = request.District?.Trim();
        entity.Latitude = request.Latitude;
        entity.Longitude = request.Longitude;
        entity.ContactPhone = request.ContactPhone?.Trim();
        entity.WebsiteUrl = request.WebsiteUrl?.Trim();
        entity.OpeningHours = request.OpeningHours?.Trim();
        entity.PriceFromVnd = request.PriceFromVnd;
        entity.PriceToVnd = request.PriceToVnd;
        entity.ImageUrl = request.ImageUrl?.Trim();
        entity.Source = request.Source?.Trim();
        entity.DataUpdatedAt = DateTimeOffset.UtcNow;

        entity.DietaryTypes.Clear();
        // PUT thay toàn bộ danh sách: các loại bị bỏ chọn không còn hiển thị hoặc khớp bộ lọc.
        foreach (var dietaryType in dietaryTypes)
            entity.DietaryTypes.Add(new RestaurantDietaryType { RestaurantId = entity.Id, DietaryType = dietaryType });

        entity.Amenities.Clear();
        foreach (var amenity in request.Amenities.Select(value => value.Trim()).OrderBy(value => value, StringComparer.OrdinalIgnoreCase))
            entity.Amenities.Add(new RestaurantAmenity { RestaurantId = entity.Id, Name = amenity });

        entity.FeaturedDishes.Clear();
        foreach (var (dish, index) in request.FeaturedDishes.Select((dish, index) => (dish, index)))
        {
            entity.FeaturedDishes.Add(new RestaurantFeaturedDish
            {
                RestaurantId = entity.Id,
                Name = dish.Name.Trim(),
                ImageUrl = dish.ImageUrl.Trim(),
                DisplayOrder = index
            });
        }
    }

    // GetDistanceKm: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    private static decimal? GetDistanceKm(Restaurant restaurant, decimal? latitude, decimal? longitude)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (!latitude.HasValue || !longitude.HasValue || !restaurant.Latitude.HasValue || !restaurant.Longitude.HasValue)
            return null;

        const double earthRadiusKm = 6371.0088;
        var latitudeRadians = DegreesToRadians((double)latitude.Value);
        var latitudeDelta = DegreesToRadians((double)(restaurant.Latitude.Value - latitude.Value));
        var longitudeDelta = DegreesToRadians((double)(restaurant.Longitude.Value - longitude.Value));
        var sinLatitude = Math.Sin(latitudeDelta / 2);
        var sinLongitude = Math.Sin(longitudeDelta / 2);
        var haversine = sinLatitude * sinLatitude + Math.Cos(latitudeRadians) *
            Math.Cos(DegreesToRadians((double)restaurant.Latitude.Value)) * sinLongitude * sinLongitude;
        var distance = earthRadiusKm * 2 * Math.Atan2(Math.Sqrt(haversine), Math.Sqrt(1 - haversine));
        return decimal.Round((decimal)distance, 3, MidpointRounding.AwayFromZero);
    }

    // DegreesToRadians: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static double DegreesToRadians(double value) => value * Math.PI / 180d;

    // RestaurantWithDistance: định nghĩa dữ liệu trao đổi của tính năng.
    private sealed record RestaurantWithDistance(Restaurant Restaurant, decimal? DistanceKm);
}
