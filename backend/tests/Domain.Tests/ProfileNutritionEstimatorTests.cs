// Kiểm thử cách ước tính nhu cầu dinh dưỡng theo hồ sơ.
using Domain.Entities;
using Domain.Enums;
using Domain.Rules;

namespace Domain.Tests;

public sealed class ProfileNutritionEstimatorTests
{
    [Theory]
    [InlineData(ActivityLevel.Sedentary, WeightGoal.Maintain, 1682, 1682)]
    [InlineData(ActivityLevel.Sedentary, WeightGoal.Lose, 1682, 1514)]
    [InlineData(ActivityLevel.Sedentary, WeightGoal.Gain, 1682, 1850)]
    [InlineData(ActivityLevel.ModeratelyActive, WeightGoal.Maintain, 2172, 2172)]
    [InlineData(ActivityLevel.ModeratelyActive, WeightGoal.Lose, 2172, 1955)]
    [InlineData(ActivityLevel.ModeratelyActive, WeightGoal.Gain, 2172, 2389)]
    [InlineData(ActivityLevel.VeryActive, WeightGoal.Maintain, 2418, 2418)]
    [InlineData(ActivityLevel.VeryActive, WeightGoal.Lose, 2418, 2176)]
    [InlineData(ActivityLevel.VeryActive, WeightGoal.Gain, 2418, 2660)]
    public void ActivityAndWeightGoalProduceDailyTargets(ActivityLevel activity, WeightGoal goal, int tdee, int calories)
    {
        var profile = UserProfile.Create("daily-target", UpdatedAt);
        profile.SetBodyData(new DateOnly(1996, 1, 1), SexForEnergyEstimate.Female, 170, 65, activity, goal, UpdatedAt);
        var result = ProfileNutritionEstimator.Calculate(profile, AsOfDate);
        Assert.Equal(tdee, result.EstimatedTdeeKcal);
        Assert.Equal(calories, result.DailyNutritionTarget!.Calories);
        Assert.Equal(decimal.Round(calories * 0.2m / 4, 1), result.DailyNutritionTarget.ProteinGrams);
        Assert.Equal(decimal.Round(calories * 0.5m / 4, 1), result.DailyNutritionTarget.CarbohydrateGrams);
        Assert.Equal(decimal.Round(calories * 0.3m / 9, 1), result.DailyNutritionTarget.FatGrams);
    }

    [Fact]
    public void MissingGoalOrMissingBodyDataDoesNotInventTargets()
    {
        var profile = UserProfile.Create("missing-target", UpdatedAt);
        Assert.Null(ProfileNutritionEstimator.Calculate(profile, AsOfDate).DailyNutritionTarget);
        profile.SetBodyData(new DateOnly(1996, 1, 1), SexForEnergyEstimate.Female, 170, 65, ActivityLevel.Sedentary, null, UpdatedAt);
        var estimate = ProfileNutritionEstimator.Calculate(profile, AsOfDate);
        Assert.NotNull(estimate.EstimatedTdeeKcal);
        Assert.Null(estimate.DailyNutritionTarget);
    }

    [Theory]
    [InlineData(ActivityLevel.LightlyActive, ActivityLevel.ModeratelyActive)]
    [InlineData(ActivityLevel.ExtraActive, ActivityLevel.VeryActive)]
    public void LegacyActivityOptionsMapToThreeSupportedLevels(ActivityLevel old, ActivityLevel expected)
    {
        var profile = UserProfile.Create("legacy-activity", UpdatedAt);
        profile.SetBodyData(null, null, null, null, old, null, UpdatedAt);
        Assert.Equal(expected, profile.ActivityLevel);
    }
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
