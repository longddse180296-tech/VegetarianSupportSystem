using Domain.Entities;
using Domain.Enums;

namespace Domain.Rules;

public sealed record ProfileNutritionEstimate(
    decimal? Bmi,
    AdultBmiCategory? AdultBmiCategory,
    int? EstimatedTdeeKcal);

public static class ProfileNutritionEstimator
{
    public static ProfileNutritionEstimate Calculate(UserProfile profile, DateOnly asOfDate)
    {
        if (profile.HeightCm is null || profile.WeightKg is null)
            return new ProfileNutritionEstimate(null, null, null);

        var heightM = profile.HeightCm.Value / 100m;
        var rawBmi = profile.WeightKg.Value / (heightM * heightM);
        var bmi = decimal.Round(rawBmi, 1, MidpointRounding.AwayFromZero);
        int? age = profile.BirthDate is null ? null : AgeOn(profile.BirthDate.Value, asOfDate);
        AdultBmiCategory? category = age >= 20 ? ClassifyAdultBmi(rawBmi) : null;

        if (age is null or < 19 or > 78 || profile.SexForEnergyEstimate is null ||
            profile.ActivityLevel is null)
            return new ProfileNutritionEstimate(bmi, category, null);

        // Mifflin-St Jeor estimates resting energy for adults; activity factors estimate daily expenditure.
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
        var tdee = decimal.ToInt32(decimal.Round(restingKcal * activityFactor, 0,
            MidpointRounding.AwayFromZero));
        return new ProfileNutritionEstimate(bmi, category, tdee);
    }

    private static int AgeOn(DateOnly birthDate, DateOnly asOfDate)
    {
        var age = asOfDate.Year - birthDate.Year;
        if (asOfDate < birthDate.AddYears(age)) age--;
        return age;
    }

    private static AdultBmiCategory ClassifyAdultBmi(decimal rawBmi) => rawBmi switch
    {
        < 18.5m => AdultBmiCategory.Underweight,
        < 25m => AdultBmiCategory.HealthyWeight,
        < 30m => AdultBmiCategory.Overweight,
        _ => AdultBmiCategory.Obesity
    };
}
