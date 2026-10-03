using System.Linq.Expressions;
using Domain.Entities;
using Domain.Enums;
using Domain.ValueObjects;

namespace Domain.Rules;

public static class DietaryRules
{
    // Expressions are shared by in-memory classification and SQL filtering.
    public static Expression<Func<Ingredient, bool>> UnknownIngredient =>
        ingredient => ingredient.Origin == IngredientOrigin.Unknown ||
            (ingredient.Origin == IngredientOrigin.Animal &&
                (ingredient.ContainsOtherAnimalProducts == null ||
                    (!ingredient.ContainsEgg && !ingredient.ContainsMilk && !ingredient.ContainsHoney &&
                        ingredient.ContainsOtherAnimalProducts == false)));

    public static Expression<Func<Ingredient, bool>> IncompatibleIngredient(DietaryType diet) => diet switch
    {
        DietaryType.Vegan => ingredient => ingredient.ContainsOtherAnimalProducts == true ||
            ingredient.ContainsEgg || ingredient.ContainsMilk || ingredient.ContainsHoney,
        DietaryType.LactoVegetarian => ingredient => ingredient.ContainsOtherAnimalProducts == true || ingredient.ContainsEgg,
        DietaryType.OvoVegetarian => ingredient => ingredient.ContainsOtherAnimalProducts == true || ingredient.ContainsMilk,
        DietaryType.LactoOvoVegetarian => ingredient => ingredient.ContainsOtherAnimalProducts == true,
        _ => throw new ArgumentOutOfRangeException(nameof(diet))
    };

    private static readonly Func<Ingredient, bool> IsUnknown = UnknownIngredient.Compile();
    private static readonly IReadOnlyDictionary<DietaryType, Func<Ingredient, bool>> IsIncompatible =
        Enum.GetValues<DietaryType>().ToDictionary(diet => diet, diet => IncompatibleIngredient(diet).Compile());

    public static IReadOnlyList<DietaryAssessment> Classify(IEnumerable<Ingredient> ingredients)
    {
        var items = ingredients.ToArray();
        var hasUnknown = items.Length == 0 || items.Any(IsUnknown);

        return Enum.GetValues<DietaryType>()
            .Select(diet => new DietaryAssessment(diet,
                items.Any(IsIncompatible[diet])
                    ? DietaryCompatibility.Incompatible
                    : hasUnknown ? DietaryCompatibility.Unknown : DietaryCompatibility.Compatible))
            .ToArray();
    }
}
