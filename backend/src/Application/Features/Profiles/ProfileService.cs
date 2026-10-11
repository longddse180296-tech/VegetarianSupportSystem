using Domain.Entities;
using Domain.Enums;
using Domain.Rules;

namespace Application.Features.Profiles;

public sealed class ProfileService(IUserProfileRepository profiles) : IProfileContextReader
{
    public async Task<ProfileContext?> GetContextAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await profiles.FindByIdAsync(userId, cancellationToken);
        if (user?.Profile is null) return null;

        var profile = user.Profile;
        var estimate = ProfileNutritionEstimator.Calculate(profile,
            DateOnly.FromDateTime(DateTime.UtcNow));
        return new ProfileContext(user.Id, profile.Diet, profile.BirthDate,
            profile.SexForEnergyEstimate, profile.HeightCm, profile.WeightKg,
            profile.ActivityLevel, profile.WeightGoal, estimate.Bmi,
            estimate.AdultBmiCategory, estimate.EstimatedTdeeKcal,
            profile.RestaurantArea,
            profile.Allergies.OrderBy(x => x.Name).Select(x => x.Name).ToArray(),
            profile.AvoidedFoods.OrderBy(x => x.Name).Select(x => x.Name).ToArray(),
            profile.UpdatedAtUtc);
    }

    public async Task<ProfileDetails?> GetAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await profiles.FindByIdAsync(userId, cancellationToken);
        return user?.Profile is null ? null : Map(user);
    }

    public async Task<ProfileDetails?> UpdateAsync(string userId, UpdateProfile request, CancellationToken cancellationToken)
    {
        var fullName = request.FullName?.Trim();
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
        await profiles.SaveChangesAsync(cancellationToken);
        return Map(user);
    }

    public async Task<ProfileDetails?> UpdatePersonalAsync(
        string userId, UpdatePersonalDetails request, CancellationToken cancellationToken)
    {
        var fullName = request.FullName?.Trim();
        if (string.IsNullOrWhiteSpace(fullName) || fullName.Length > 150)
            throw new ArgumentException("Họ tên phải dài từ 1 đến 150 ký tự.", nameof(request.FullName));

        var user = await profiles.FindByIdAsync(userId, cancellationToken);
        if (user?.Profile is null) return null;
        var now = DateTimeOffset.UtcNow;
        user.SetPhoneNumber(request.PhoneNumber, now);
        user.Profile.SetRestaurantArea(request.RestaurantArea, now);
        user.UpdateContact(fullName, user.Email, now);
        await profiles.SaveChangesAsync(cancellationToken);
        return Map(user);
    }

    public async Task<ProfileDetails?> UpdateBodyAsync(
        string userId, UpdateBodyDetails request, CancellationToken cancellationToken)
    {
        var user = await profiles.FindByIdAsync(userId, cancellationToken);
        if (user?.Profile is null) return null;
        user.Profile.SetBodyData(request.BirthDate, request.SexForEnergyEstimate,
            request.HeightCm, request.WeightKg, request.ActivityLevel, request.WeightGoal,
            DateTimeOffset.UtcNow);
        await profiles.SaveChangesAsync(cancellationToken);
        return Map(user);
    }

    public async Task<ProfileEstimate?> PreviewBodyAsync(
        string userId, UpdateBodyDetails request, CancellationToken cancellationToken)
    {
        var user = await profiles.FindByIdAsync(userId, cancellationToken);
        if (user?.Profile is null) return null;

        var now = DateTimeOffset.UtcNow;
        var candidate = UserProfile.Create(userId, now);
        candidate.SetBodyData(request.BirthDate, request.SexForEnergyEstimate,
            request.HeightCm, request.WeightKg, request.ActivityLevel, request.WeightGoal, now);
        var result = ProfileNutritionEstimator.Calculate(candidate,
            DateOnly.FromDateTime(now.UtcDateTime));
        return new ProfileEstimate(result.Bmi, result.AdultBmiCategory,
            result.EstimatedTdeeKcal);
    }

    public async Task<ProfileDetails?> SetDietAsync(
        string userId, VegetarianDiet? diet, CancellationToken cancellationToken)
    {
        var user = await profiles.FindByIdAsync(userId, cancellationToken);
        if (user?.Profile is null) return null;
        user.Profile.SetDiet(diet, DateTimeOffset.UtcNow);
        await profiles.SaveChangesAsync(cancellationToken);
        return Map(user);
    }

    public async Task<ProfileItem?> AddAllergyAsync(string userId, string? name, CancellationToken cancellationToken)
    {
        var profile = await LoadProfileAsync(userId, cancellationToken);
        if (profile is null) return null;
        var item = profile.AddAllergy(name ?? string.Empty, DateTimeOffset.UtcNow);
        await profiles.SaveChangesAsync(cancellationToken);
        return new ProfileItem(item.Id, item.Name);
    }

    public async Task<ProfileItem?> AddAvoidedFoodAsync(string userId, string? name, CancellationToken cancellationToken)
    {
        var profile = await LoadProfileAsync(userId, cancellationToken);
        if (profile is null) return null;
        var item = profile.AddAvoidedFood(name ?? string.Empty, DateTimeOffset.UtcNow);
        await profiles.SaveChangesAsync(cancellationToken);
        return new ProfileItem(item.Id, item.Name);
    }

    public async Task<bool> RenameAllergyAsync(string userId, Guid id, string? name, CancellationToken cancellationToken)
    {
        var profile = await LoadProfileAsync(userId, cancellationToken);
        if (profile is null || profile.Allergies.All(x => x.Id != id)) return false;
        profile.RenameAllergy(id, name ?? string.Empty, DateTimeOffset.UtcNow);
        await profiles.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> RenameAvoidedFoodAsync(string userId, Guid id, string? name, CancellationToken cancellationToken)
    {
        var profile = await LoadProfileAsync(userId, cancellationToken);
        if (profile is null || profile.AvoidedFoods.All(x => x.Id != id)) return false;
        profile.RenameAvoidedFood(id, name ?? string.Empty, DateTimeOffset.UtcNow);
        await profiles.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> RemoveAllergyAsync(string userId, Guid id, CancellationToken cancellationToken)
    {
        var profile = await LoadProfileAsync(userId, cancellationToken);
        if (profile is null || profile.Allergies.All(x => x.Id != id)) return false;
        profile.RemoveAllergy(id, DateTimeOffset.UtcNow);
        await profiles.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> RemoveAvoidedFoodAsync(string userId, Guid id, CancellationToken cancellationToken)
    {
        var profile = await LoadProfileAsync(userId, cancellationToken);
        if (profile is null || profile.AvoidedFoods.All(x => x.Id != id)) return false;
        profile.RemoveAvoidedFood(id, DateTimeOffset.UtcNow);
        await profiles.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task<UserProfile?> LoadProfileAsync(string userId, CancellationToken cancellationToken) =>
        (await profiles.FindByIdAsync(userId, cancellationToken))?.Profile;

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
            profile.UpdatedAtUtc);
    }
}
