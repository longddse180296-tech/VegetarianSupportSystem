using Domain.Enums;
using Domain.Rules;

namespace Domain.Tests;

public sealed class FoodScanAssessmentTests
{
    [Theory]
    [InlineData(VegetarianDiet.Vegan, FoodScanAssessmentStatus.Incompatible)]
    [InlineData(VegetarianDiet.Lacto, FoodScanAssessmentStatus.Incompatible)]
    [InlineData(VegetarianDiet.Ovo, FoodScanAssessmentStatus.SuitableBasedOnProvidedInformation)]
    [InlineData(VegetarianDiet.LactoOvo, FoodScanAssessmentStatus.SuitableBasedOnProvidedInformation)]
    public void ConfirmedEggRespectsDiet(
        VegetarianDiet diet,
        FoodScanAssessmentStatus expected)
    {
        var actual = FoodScanAssessment.Evaluate(
            diet, [IngredientKind.Plant, IngredientKind.Egg], true);
        Assert.Equal(expected, actual);
    }

    [Theory]
    [InlineData(VegetarianDiet.Vegan)]
    [InlineData(VegetarianDiet.Lacto)]
    [InlineData(VegetarianDiet.Ovo)]
    [InlineData(VegetarianDiet.LactoOvo)]
    public void ConfirmedFishSauceOverridesUnknowns(VegetarianDiet diet)
    {
        var actual = FoodScanAssessment.Evaluate(
            diet, [IngredientKind.Animal, IngredientKind.Unknown], false);
        Assert.Equal(FoodScanAssessmentStatus.Incompatible, actual);
    }

    [Fact]
    public void UnknownBrothStaysInsufficient()
    {
        var actual = FoodScanAssessment.Evaluate(
            VegetarianDiet.Vegan, [IngredientKind.Plant, IngredientKind.Unknown], true);
        Assert.Equal(FoodScanAssessmentStatus.InsufficientInformation, actual);
    }
}
