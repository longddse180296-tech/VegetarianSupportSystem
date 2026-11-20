// Đóng gói dữ liệu hồ sơ cho các tính năng cần lọc công thức theo người dùng.
using Domain.Enums;
using Domain.Rules;

namespace Application.Features.Profiles;

// Read-only profile data for application features that personalize their own results.
// Callers must pass the authenticated user's ID and copy the values they need into
// their own snapshot when the result must remain stable after a profile update.
// IProfileContextReader: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IProfileContextReader
{
    // GetContextAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<ProfileContext?> GetContextAsync(string userId, CancellationToken cancellationToken);
}

// ProfileContext: định nghĩa dữ liệu trao đổi của tính năng.
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
    IReadOnlyList<string> Allergies,
    IReadOnlyList<string> AvoidedFoods,
    DateTimeOffset UpdatedAtUtc,
    DailyNutritionTarget? DailyNutritionTarget = null);
