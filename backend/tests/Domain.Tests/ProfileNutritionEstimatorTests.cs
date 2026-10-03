using Domain.Entities;
using Domain.Enums;
using Domain.Rules;

namespace Domain.Tests;

public sealed class ProfileNutritionEstimatorTests
{
    private static readonly DateTimeOffset UpdatedAt = new(2026, 10, 3, 0, 0, 0, TimeSpan.Zero);
    private static readonly DateOnly AsOfDate = new(2026, 10, 3);

    [Fact]
    public void CalculatesAdultBmiAndDailyEnergyFromConfirmedInputs()
    {
        var profile = UserProfile.Create("user-1", UpdatedAt);
        profile.SetBodyData(new DateOnly(1996, 1, 1), SexForEnergyEstimate.Female,
            170m, 65m, ActivityLevel.ModeratelyActive, WeightGoal.Maintain, UpdatedAt);

        var result = ProfileNutritionEstimator.Calculate(profile, AsOfDate);

        Assert.Equal(22.5m, result.Bmi);
        Assert.Equal(AdultBmiCategory.HealthyWeight, result.AdultBmiCategory);
        Assert.Equal(2172, result.EstimatedTdeeKcal);
    }

    [Fact]
    public void LeavesDailyEnergyUnknownWithoutAgeSexOrActivity()
    {
        var profile = UserProfile.Create("user-1", UpdatedAt);
        profile.SetBodyData(null, null, 170m, 65m, null, null, UpdatedAt);

        var result = ProfileNutritionEstimator.Calculate(profile, AsOfDate);

        Assert.Equal(22.5m, result.Bmi);
        Assert.Null(result.AdultBmiCategory);
        Assert.Null(result.EstimatedTdeeKcal);
    }

    [Fact]
    public void DoesNotApplyAdultLabelsOrEnergyEquationToChild()
    {
        var profile = UserProfile.Create("user-1", UpdatedAt);
        profile.SetBodyData(new DateOnly(2010, 1, 1), SexForEnergyEstimate.Male,
            170m, 65m, ActivityLevel.Sedentary, null, UpdatedAt);

        var result = ProfileNutritionEstimator.Calculate(profile, AsOfDate);

        Assert.Equal(22.5m, result.Bmi);
        Assert.Null(result.AdultBmiCategory);
        Assert.Null(result.EstimatedTdeeKcal);
    }

    [Fact]
    public void UsesUnroundedBmiAtAdultCategoryBoundary()
    {
        var profile = UserProfile.Create("user-1", UpdatedAt);
        profile.SetBodyData(new DateOnly(1996, 1, 1), null,
            200m, 99.99m, null, null, UpdatedAt);

        var result = ProfileNutritionEstimator.Calculate(profile, AsOfDate);

        Assert.Equal(25.0m, result.Bmi);
        Assert.Equal(AdultBmiCategory.HealthyWeight, result.AdultBmiCategory);
    }
}
