// Chức năng: hồ sơ và nhu cầu dinh dưỡng cá nhân. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
using Domain.Entities;
using Domain.Enums;

namespace Domain.Rules;

// ProfileNutritionEstimate: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ProfileNutritionEstimate(
    decimal? Bmi,
    AdultBmiCategory? AdultBmiCategory,
    int? EstimatedTdeeKcal);

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
            ActivityLevel.LightlyActive => 1.375m,
            ActivityLevel.ModeratelyActive => 1.55m,
            ActivityLevel.VeryActive => 1.725m,
            ActivityLevel.ExtraActive => 1.9m,
            _ => throw new ArgumentOutOfRangeException(nameof(profile))
        };
        // Nhân mức vận động để ra TDEE/ngày; chưa cộng hoặc trừ năng lượng theo mục tiêu cân nặng.
        var tdee = decimal.ToInt32(decimal.Round(restingKcal * activityFactor, 0,
            MidpointRounding.AwayFromZero));
        return new ProfileNutritionEstimate(bmi, category, tdee);
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
