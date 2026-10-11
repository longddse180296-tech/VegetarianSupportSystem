using Domain.Entities;
using Domain.Enums;

namespace Application.Features.Profiles;

public interface IUserProfileRepository
{
    Task<User?> FindByIdAsync(string userId, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public sealed record ProfileItem(Guid Id, string Name);

public sealed record ProfileDetails(
    string UserId,
    string FullName,
    string Email,
    string? PhoneNumber,
    DateTimeOffset MemberSinceUtc,
    VegetarianDiet? Diet,
    DateOnly? BirthDate,
    SexForEnergyEstimate? SexForEnergyEstimate,
    decimal? HeightCm,
    decimal? WeightKg,
    decimal? Bmi,
    AdultBmiCategory? AdultBmiCategory,
    int? EstimatedTdeeKcal,
    ActivityLevel? ActivityLevel,
    WeightGoal? WeightGoal,
    string? RestaurantArea,
    IReadOnlyList<ProfileItem> Allergies,
    IReadOnlyList<ProfileItem> AvoidedFoods,
    DateTimeOffset UpdatedAtUtc);

public sealed record UpdateProfile(
    string? FullName,
    string? PhoneNumber,
    VegetarianDiet? Diet,
    DateOnly? BirthDate,
    SexForEnergyEstimate? SexForEnergyEstimate,
    decimal? HeightCm,
    decimal? WeightKg,
    ActivityLevel? ActivityLevel,
    WeightGoal? WeightGoal,
    string? RestaurantArea);

public sealed record UpdatePersonalDetails(string? FullName, string? PhoneNumber, string? RestaurantArea);

public sealed record UpdateBodyDetails(
    DateOnly? BirthDate,
    SexForEnergyEstimate? SexForEnergyEstimate,
    decimal? HeightCm,
    decimal? WeightKg,
    ActivityLevel? ActivityLevel,
    WeightGoal? WeightGoal);

public sealed record ProfileEstimate(
    decimal? Bmi,
    AdultBmiCategory? AdultBmiCategory,
    int? EstimatedTdeeKcal);

public sealed class ProfileConflictException(string message) : Exception(message);
