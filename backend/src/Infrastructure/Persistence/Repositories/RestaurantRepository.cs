// Chức năng: tra cứu và quản lý nhà hàng. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Application.Common.Exceptions;
using Application.Features.Restaurants;
using Domain.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Infrastructure.Persistence.Repositories;

// RestaurantRepository: thực hiện truy vấn và lưu dữ liệu của tính năng qua EF Core.
public sealed class RestaurantRepository(AppDbContext db) : IRestaurantRepository
{
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<IReadOnlyList<Restaurant>> ListAsync(RestaurantListQuery request, bool includeInactive, CancellationToken ct)
    {
        var query = db.Restaurants.AsNoTracking().AsQueryable();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (!includeInactive)
            query = query.Where(restaurant => restaurant.IsActive);
        if (request.DietaryType.HasValue)
            query = query.Where(restaurant => restaurant.DietaryTypes.Any(type => type.DietaryType == request.DietaryType.Value));

        var restaurants = await query
            .Include(restaurant => restaurant.DietaryTypes)
            .Include(restaurant => restaurant.Amenities)
            .Include(restaurant => restaurant.FeaturedDishes)
            .AsSplitQuery()
            .ToListAsync(ct);

        // District data entered by Admin is free text ("Quận 3", "Q.3", ...).
        // Normalize both sides after loading so location search remains predictable
        // regardless of case, accents, punctuation, or the abbreviated district form.
        return restaurants
            .Where(restaurant => MatchesSearch(restaurant, request.Search))
            .Where(restaurant => MatchesDistrict(restaurant, request.District))
            .ToArray();
    }

    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<Restaurant?> GetAsync(Guid id, CancellationToken ct) => db.Restaurants
        .Include(restaurant => restaurant.DietaryTypes)
        .Include(restaurant => restaurant.Amenities)
        .Include(restaurant => restaurant.FeaturedDishes)
        .SingleOrDefaultAsync(restaurant => restaurant.Id == id, ct);

    // NameExistsAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public Task<bool> NameExistsAsync(string name, Guid? exceptId, CancellationToken ct) =>
        db.Restaurants.AnyAsync(restaurant => restaurant.Name == name && restaurant.Id != exceptId, ct);

    // Add: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public void Add(Restaurant entity) => db.Restaurants.Add(entity);

    // SaveAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task SaveAsync(CancellationToken ct)
    {
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new ConflictException("Tên nhà hàng hoặc tiện ích bị trùng. Vui lòng kiểm tra lại thông tin đã nhập.");
        }
    }

    // MatchesSearch: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static bool MatchesSearch(Restaurant restaurant, string? value)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(value)) return true;
        var search = Normalize(value);
        return Normalize(restaurant.Name).Contains(search, StringComparison.Ordinal) ||
            Normalize(restaurant.Address).Contains(search, StringComparison.Ordinal) ||
            Normalize(restaurant.District).Contains(search, StringComparison.Ordinal);
    }

    // MatchesDistrict: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static bool MatchesDistrict(Restaurant restaurant, string? value) =>
        string.IsNullOrWhiteSpace(value) ||
        Normalize(restaurant.District).Contains(Normalize(value), StringComparison.Ordinal) ||
        Normalize(restaurant.Address).Contains(Normalize(value), StringComparison.Ordinal);

    // Normalize: Chuẩn hóa hoặc chuyển đổi dữ liệu giữa các bước xử lý.
    private static string Normalize(string? value)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        var decomposed = value.Normalize(NormalizationForm.FormD);
        var plain = new string(decomposed.Where(character => CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark).ToArray())
            .ToLowerInvariant();
        plain = Regex.Replace(plain, @"\bq\s*\.?\s*(\d+)\b", "quan $1");
        return Regex.Replace(plain, @"[^a-z0-9]+", " ").Trim();
    }
}
