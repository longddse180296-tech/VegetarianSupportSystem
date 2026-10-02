using Domain.Enums;

namespace Domain.Rules;

public static class FoodScanAssessment
{
    public static FoodScanAssessmentStatus Evaluate(
        VegetarianDiet diet,
        IReadOnlyCollection<IngredientKind> ingredients,
        bool ingredientsComplete)
    {
        if (ingredients.Any(kind => IsIncompatible(diet, kind)))
            return FoodScanAssessmentStatus.Incompatible;

        if (!ingredientsComplete || ingredients.Count == 0
            || ingredients.Contains(IngredientKind.Unknown))
            return FoodScanAssessmentStatus.InsufficientInformation;

        return FoodScanAssessmentStatus.SuitableBasedOnProvidedInformation;
    }

    private static bool IsIncompatible(VegetarianDiet diet, IngredientKind ingredient) =>
        ingredient == IngredientKind.Animal
        || (ingredient == IngredientKind.Egg && diet is VegetarianDiet.Vegan or VegetarianDiet.Lacto)
        || (ingredient == IngredientKind.Dairy && diet is VegetarianDiet.Vegan or VegetarianDiet.Ovo)
        || (ingredient == IngredientKind.Honey && diet == VegetarianDiet.Vegan);
}
