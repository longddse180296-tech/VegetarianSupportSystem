// Ước tính nhu cầu dinh dưỡng từ thông tin cơ thể, mức vận động và mục tiêu đã khai báo.
using Domain.Entities;
using Domain.Enums;

namespace Domain.Rules;

// ProfileNutritionEstimate: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ProfileNutritionEstimate(
    decimal? Bmi,
    AdultBmiCategory? AdultBmiCategory,
    int? EstimatedTdeeKcal,
    DailyNutritionTarget? DailyNutritionTarget = null);

// Mục tiêu tham khảo/ngày: 20% năng lượng từ đạm, 50% carb, 30% béo.
public sealed record DailyNutritionTarget(int Calories, decimal ProteinGrams, decimal CarbohydrateGrams, decimal FatGrams);

// ProfileNutritionEstimator: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public static class ProfileNutritionEstimator
{
    // Calculate: Tính kết quả từ dữ liệu đã khai báo; kiểm tra điều kiện trước khi trả chỉ số.
    public static ProfileNutritionEstimate Calculate(UserProfile profile, DateOnly asOfDate)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (profile.HeightCm is null || profile.WeightKg is null)
            return new ProfileNutritionEstimate(null, null, null);

        // BMI chỉ dùng cân nặng và chiều cao; tuổi không tham gia phép tính này.
        var heightM = profile.HeightCm.Value / 100m;
        var rawBmi = profile.WeightKg.Value / (heightM * heightM);
        var bmi = decimal.Round(rawBmi, 1, MidpointRounding.AwayFromZero);
        // Tuổi dùng để chọn phạm vi phân loại BMI và kiểm tra khả năng ước tính năng lượng nghỉ.
        int? age = profile.BirthDate is null ? null : AgeOn(profile.BirthDate.Value, asOfDate);
        AdultBmiCategory? category = age >= 20 ? ClassifyAdultBmi(rawBmi) : null;

        if (age is null or < 19 or > 78 || profile.SexForEnergyEstimate is null ||
            profile.ActivityLevel is null)
            return new ProfileNutritionEstimate(bmi, category, null);

        // Mifflin–St Jeor ước tính năng lượng nghỉ (kcal/ngày); không phải năng lượng cho từng bữa.
        var restingKcal = 10m * profile.WeightKg.Value + 6.25m * profile.HeightCm.Value
            - 5m * age.Value + (profile.SexForEnergyEstimate == SexForEnergyEstimate.Male ? 5m : -161m);
        if (restingKcal <= 0)
            return new ProfileNutritionEstimate(bmi, category, null);

        var activityFactor = profile.ActivityLevel.Value switch
        {
            ActivityLevel.Sedentary => 1.2m,
            ActivityLevel.LightlyActive => 1.55m, // Dữ liệu cũ quy về vận động vừa phải.
            ActivityLevel.ModeratelyActive => 1.55m,
            ActivityLevel.VeryActive => 1.725m,
            ActivityLevel.ExtraActive => 1.725m, // Dữ liệu cũ quy về vận động nhiều.
            _ => throw new ArgumentOutOfRangeException(nameof(profile))
        };
        // TDEE theo vận động; mục tiêu nạp điều chỉnh giảm/tăng 10% theo lựa chọn đã lưu.
        var tdee = decimal.ToInt32(decimal.Round(restingKcal * activityFactor, 0,
            MidpointRounding.AwayFromZero));
        DailyNutritionTarget? target = null;
        if (profile.WeightGoal is { } goal)
        {
            var factor = goal switch { WeightGoal.Lose => 0.9m, WeightGoal.Gain => 1.1m, _ => 1m };
            var calories = decimal.ToInt32(decimal.Round(tdee * factor, 0, MidpointRounding.AwayFromZero));
            target = new(calories, decimal.Round(calories * 0.2m / 4, 1),
                decimal.Round(calories * 0.5m / 4, 1), decimal.Round(calories * 0.3m / 9, 1));
        }
        return new ProfileNutritionEstimate(bmi, category, tdee, target);
    }

    // AgeOn: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static int AgeOn(DateOnly birthDate, DateOnly asOfDate)
    {
        var age = asOfDate.Year - birthDate.Year;
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (asOfDate < birthDate.AddYears(age)) age--;
        return age;
    }

    // ClassifyAdultBmi: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static AdultBmiCategory ClassifyAdultBmi(decimal rawBmi) => rawBmi switch
    {
        < 18.5m => AdultBmiCategory.Underweight,
        < 25m => AdultBmiCategory.HealthyWeight,
        < 30m => AdultBmiCategory.Overweight,
        _ => AdultBmiCategory.Obesity
    };
}
