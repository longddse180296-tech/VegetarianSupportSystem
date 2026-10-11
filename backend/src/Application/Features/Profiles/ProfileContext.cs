using Domain.Enums;

namespace Application.Features.Profiles;

// Read-only profile data for application features that personalize their own results.
// Callers must pass the authenticated user's ID and copy the values they need into
// their own snapshot when the result must remain stable after a profile update.
public interface IProfileContextReader
{
    Task<ProfileContext?> GetContextAsync(string userId, CancellationToken cancellationToken);
}

public sealed record ProfileContext(
    string UserId,
    VegetarianDiet? Diet,
    DateOnly? BirthDate,
    SexForEnergyEstimate? SexForEnergyEstimate,
    decimal? HeightCm,
    decimal? WeightKg,
    ActivityLevel? ActivityLevel,
    WeightGoal? WeightGoal,
    decimal? Bmi,
    AdultBmiCategory? AdultBmiCategory,
    int? EstimatedTdeeKcal,
    string? RestaurantArea,
    IReadOnlyList<string> Allergies,
    IReadOnlyList<string> AvoidedFoods,
    DateTimeOffset UpdatedAtUtc);
