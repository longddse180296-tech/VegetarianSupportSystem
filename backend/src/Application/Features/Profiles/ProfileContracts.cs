// Khai báo hợp đồng dữ liệu giữa các bước xử lý hồ sơ ăn uống và sức khỏe người dùng khai báo.
using Domain.Entities;
using Domain.Enums;
using Domain.Rules;

namespace Application.Features.Profiles;

// IUserProfileRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IUserProfileRepository
{
    // FindByIdAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<User?> FindByIdAsync(string userId, CancellationToken cancellationToken);
    // SaveChangesAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task SaveChangesAsync(CancellationToken cancellationToken);
}

// ProfileItem: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ProfileItem(Guid Id, string Name);

// ProfileDetails: định nghĩa dữ liệu trao đổi của tính năng.
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
    DateTimeOffset UpdatedAtUtc,
    DailyNutritionTarget? DailyNutritionTarget = null);

// UpdateProfile: định nghĩa dữ liệu trao đổi của tính năng.
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

// UpdatePersonalDetails: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record UpdatePersonalDetails(string? FullName, string? PhoneNumber, string? RestaurantArea);

// UpdateBodyDetails: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record UpdateBodyDetails(
    DateOnly? BirthDate,
    SexForEnergyEstimate? SexForEnergyEstimate,
    decimal? HeightCm,
    decimal? WeightKg,
    ActivityLevel? ActivityLevel,
    WeightGoal? WeightGoal);

// ProfileEstimate: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ProfileEstimate(
    decimal? Bmi,
    AdultBmiCategory? AdultBmiCategory,
    int? EstimatedTdeeKcal,
    DailyNutritionTarget? DailyNutritionTarget = null);

// ProfileConflictException: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class ProfileConflictException(string message) : Exception(message);
