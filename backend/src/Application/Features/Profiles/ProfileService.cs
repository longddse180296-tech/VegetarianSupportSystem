// Đọc và cập nhật hồ sơ, dị ứng, thực phẩm muốn tránh và mục tiêu dinh dưỡng.
using Domain.Entities;
using Domain.Enums;
using Domain.Rules;
using Application.Features.Ingredients;

namespace Application.Features.Profiles;

// ProfileService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed class ProfileService(IUserProfileRepository profiles, IIngredientRepository? ingredients = null) : IProfileContextReader
{
    // GetContextAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<ProfileContext?> GetContextAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await profiles.FindByIdAsync(userId, cancellationToken);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (user?.Profile is null) return null;

        var profile = user.Profile;
        var estimate = ProfileNutritionEstimator.Calculate(profile,
            DateOnly.FromDateTime(DateTime.UtcNow));
        return new ProfileContext(user.Id, profile.Diet, profile.BirthDate,
            profile.SexForEnergyEstimate, profile.HeightCm, profile.WeightKg,
            profile.ActivityLevel, profile.WeightGoal, estimate.Bmi,
            estimate.AdultBmiCategory, estimate.EstimatedTdeeKcal,
            profile.Allergies.OrderBy(x => x.Name).Select(x => x.Name).ToArray(),
            profile.AvoidedFoods.OrderBy(x => x.Name).Select(x => x.Name).ToArray(),
            profile.UpdatedAtUtc, estimate.DailyNutritionTarget);
    }

    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<ProfileDetails?> GetAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await profiles.FindByIdAsync(userId, cancellationToken);
        return user?.Profile is null ? null : await MapWithCatalogAsync(user, cancellationToken);
    }

    // UpdateAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<ProfileDetails?> UpdateAsync(string userId, UpdateProfile request, CancellationToken cancellationToken)
    {
        var fullName = request.FullName?.Trim();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(fullName) || fullName.Length > 150)
            throw new ArgumentException("Họ tên phải dài từ 1 đến 150 ký tự.", nameof(request.FullName));

        var user = await profiles.FindByIdAsync(userId, cancellationToken);
        if (user?.Profile is null) return null;

        var now = DateTimeOffset.UtcNow;
        user.Profile.SetDiet(request.Diet, now);
        user.Profile.SetBodyData(request.BirthDate, request.SexForEnergyEstimate,
            request.HeightCm, request.WeightKg, request.ActivityLevel, request.WeightGoal, now);
        user.Profile.SetRestaurantArea(request.RestaurantArea, now);
        user.UpdateContact(fullName, user.Email, now);
        user.SetPhoneNumber(request.PhoneNumber, now);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await profiles.SaveChangesAsync(cancellationToken);
        return await MapWithCatalogAsync(user, cancellationToken);
    }

    // UpdatePersonalAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<ProfileDetails?> UpdatePersonalAsync(
        string userId, UpdatePersonalDetails request, CancellationToken cancellationToken)
    {
        var fullName = request.FullName?.Trim();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(fullName) || fullName.Length > 150)
            throw new ArgumentException("Họ tên phải dài từ 1 đến 150 ký tự.", nameof(request.FullName));

        var user = await profiles.FindByIdAsync(userId, cancellationToken);
        if (user?.Profile is null) return null;
        var now = DateTimeOffset.UtcNow;
        user.SetPhoneNumber(request.PhoneNumber, now);
        user.Profile.SetRestaurantArea(request.RestaurantArea, now);
        user.UpdateContact(fullName, user.Email, now);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await profiles.SaveChangesAsync(cancellationToken);
        return await MapWithCatalogAsync(user, cancellationToken);
    }

    // UpdateBodyAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<ProfileDetails?> UpdateBodyAsync(
        string userId, UpdateBodyDetails request, CancellationToken cancellationToken)
    {
        var user = await profiles.FindByIdAsync(userId, cancellationToken);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (user?.Profile is null) return null;
        user.Profile.SetBodyData(request.BirthDate, request.SexForEnergyEstimate,
            request.HeightCm, request.WeightKg, request.ActivityLevel, request.WeightGoal,
            DateTimeOffset.UtcNow);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await profiles.SaveChangesAsync(cancellationToken);
        return await MapWithCatalogAsync(user, cancellationToken);
    }

    // PreviewBodyAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<ProfileEstimate?> PreviewBodyAsync(
        string userId, UpdateBodyDetails request, CancellationToken cancellationToken)
    {
        var user = await profiles.FindByIdAsync(userId, cancellationToken);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (user?.Profile is null) return null;

        var now = DateTimeOffset.UtcNow;
        var candidate = UserProfile.Create(userId, now);
        candidate.SetBodyData(request.BirthDate, request.SexForEnergyEstimate,
            request.HeightCm, request.WeightKg, request.ActivityLevel, request.WeightGoal, now);
        var result = ProfileNutritionEstimator.Calculate(candidate,
            DateOnly.FromDateTime(now.UtcDateTime));
        return new ProfileEstimate(result.Bmi, result.AdultBmiCategory,
            result.EstimatedTdeeKcal, result.DailyNutritionTarget);
    }

    // SetDietAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<ProfileDetails?> SetDietAsync(
        string userId, VegetarianDiet? diet, CancellationToken cancellationToken)
    {
        var user = await profiles.FindByIdAsync(userId, cancellationToken);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (user?.Profile is null) return null;
        user.Profile.SetDiet(diet, DateTimeOffset.UtcNow);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await profiles.SaveChangesAsync(cancellationToken);
        return await MapWithCatalogAsync(user, cancellationToken);
    }

    // AddAllergyAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<ProfileItem?> AddAllergyAsync(string userId, string? name, CancellationToken cancellationToken)
    {
        var profile = await LoadProfileAsync(userId, cancellationToken);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (profile is null) return null;
        var item = profile.AddAllergy(name ?? string.Empty, DateTimeOffset.UtcNow);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await profiles.SaveChangesAsync(cancellationToken);
        return await CatalogItemAsync(item.Id, item.Name, true, cancellationToken);
    }

    // AddAvoidedFoodAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<ProfileItem?> AddAvoidedFoodAsync(string userId, string? name, CancellationToken cancellationToken)
    {
        var profile = await LoadProfileAsync(userId, cancellationToken);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (profile is null) return null;
        var item = profile.AddAvoidedFood(name ?? string.Empty, DateTimeOffset.UtcNow);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await profiles.SaveChangesAsync(cancellationToken);
        return await CatalogItemAsync(item.Id, item.Name, false, cancellationToken);
    }

    // RenameAllergyAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<bool> RenameAllergyAsync(string userId, Guid id, string? name, CancellationToken cancellationToken)
    {
        var profile = await LoadProfileAsync(userId, cancellationToken);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (profile is null || profile.Allergies.All(x => x.Id != id)) return false;
        profile.RenameAllergy(id, name ?? string.Empty, DateTimeOffset.UtcNow);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await profiles.SaveChangesAsync(cancellationToken);
        return true;
    }

    // RenameAvoidedFoodAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<bool> RenameAvoidedFoodAsync(string userId, Guid id, string? name, CancellationToken cancellationToken)
    {
        var profile = await LoadProfileAsync(userId, cancellationToken);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (profile is null || profile.AvoidedFoods.All(x => x.Id != id)) return false;
        profile.RenameAvoidedFood(id, name ?? string.Empty, DateTimeOffset.UtcNow);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await profiles.SaveChangesAsync(cancellationToken);
        return true;
    }

    // RemoveAllergyAsync: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    public async Task<bool> RemoveAllergyAsync(string userId, Guid id, CancellationToken cancellationToken)
    {
        var profile = await LoadProfileAsync(userId, cancellationToken);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (profile is null || profile.Allergies.All(x => x.Id != id)) return false;
        profile.RemoveAllergy(id, DateTimeOffset.UtcNow);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await profiles.SaveChangesAsync(cancellationToken);
        return true;
    }

    // RemoveAvoidedFoodAsync: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    public async Task<bool> RemoveAvoidedFoodAsync(string userId, Guid id, CancellationToken cancellationToken)
    {
        var profile = await LoadProfileAsync(userId, cancellationToken);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (profile is null || profile.AvoidedFoods.All(x => x.Id != id)) return false;
        profile.RemoveAvoidedFood(id, DateTimeOffset.UtcNow);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await profiles.SaveChangesAsync(cancellationToken);
        return true;
    }

    // LoadProfileAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private async Task<UserProfile?> LoadProfileAsync(string userId, CancellationToken cancellationToken) =>
        (await profiles.FindByIdAsync(userId, cancellationToken))?.Profile;

    // Map: Chuyển dữ liệu nội bộ sang cấu trúc trả về cho bên gọi.
    // Không từ chối tên chưa có trong catalog. Trạng thái nhận diện được tính lại khi đọc, nên Admin thêm/sửa sau vẫn được nhận ra.
    private async Task<ProfileItem> CatalogItemAsync(Guid id, string name, bool allergy, CancellationToken ct)
    {
        if (ingredients is null) return new(id, name);
        var catalog = await ingredients.GetRestrictionCatalogAsync(ct);
        return new(id, name, catalog.Any(x => allergy ? IngredientRestrictionRules.MatchesAllergy(x, name)
            : IngredientRestrictionRules.MatchesNameOrAlias(x, name)));
    }

    private async Task<ProfileDetails> MapWithCatalogAsync(User user, CancellationToken ct)
    {
        var details = Map(user);
        if (ingredients is null) return details;
        var catalog = await ingredients.GetRestrictionCatalogAsync(ct);
        return details with
        {
            Allergies = details.Allergies.Select(x => x with { IsKnownInCatalog = catalog.Any(i => IngredientRestrictionRules.MatchesAllergy(i, x.Name)) }).ToArray(),
            AvoidedFoods = details.AvoidedFoods.Select(x => x with { IsKnownInCatalog = catalog.Any(i => IngredientRestrictionRules.MatchesNameOrAlias(i, x.Name)) }).ToArray()
        };
    }

    private static ProfileDetails Map(User user)
    {
        var profile = user.Profile!;
        var estimate = ProfileNutritionEstimator.Calculate(profile,
            DateOnly.FromDateTime(DateTime.UtcNow));
        return new ProfileDetails(user.Id, user.FullName, user.Email, user.PhoneNumber,
            user.CreatedAtUtc,
            profile.Diet, profile.BirthDate, profile.SexForEnergyEstimate,
            profile.HeightCm, profile.WeightKg, estimate.Bmi, estimate.AdultBmiCategory,
            estimate.EstimatedTdeeKcal, profile.ActivityLevel, profile.WeightGoal,
            profile.RestaurantArea,
            profile.Allergies.OrderBy(x => x.Name).Select(x => new ProfileItem(x.Id, x.Name)).ToArray(),
            profile.AvoidedFoods.OrderBy(x => x.Name).Select(x => new ProfileItem(x.Id, x.Name)).ToArray(),
            profile.UpdatedAtUtc, estimate.DailyNutritionTarget);
    }
}
