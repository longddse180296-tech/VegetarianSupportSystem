using System.ComponentModel.DataAnnotations;
using Domain.Enums;

namespace Application.Features.MealPlans;
public sealed class MealPlanGenerateRequest { [Required, StringLength(120)] public string? Name { get; init; } public DateOnly WeekStartDate { get; init; } }
public sealed class MealReplacementRequest { public Guid RecipeId { get; init; } [Range(1,20)] public int Servings { get; init; } = 1; }
public sealed class ShoppingPurchaseRequest { public bool IsPurchased { get; init; } }
public sealed class MealPlanCopyToWeekRequest { public DateOnly WeekStartDate { get; init; } [StringLength(120)] public string? Name { get; init; } }
public sealed class MealPlanListQuery { [Range(1, int.MaxValue)] public int Page { get; init; } = 1; [Range(1, 100)] public int PageSize { get; init; } = 20; }
public sealed record MealPlanMealResponse(Guid Id, int DayNumber, MealSlot Slot, Guid RecipeId, string RecipeName, int Servings, int TotalTimeMinutes, decimal? CaloriesPerServing, decimal? ProteinGramPerServing, decimal? CarbohydrateGramPerServing, decimal? FatGramPerServing);
public sealed record ShoppingItemResponse(Guid Id, Guid IngredientId, string IngredientName, decimal RequiredQuantity, decimal PantryQuantity, decimal QuantityToBuy, string Unit, bool IsPurchased);
public sealed record MealPlanNutritionSummary(decimal Calories, decimal ProteinGrams, decimal CarbohydrateGrams, decimal FatGrams);
public sealed record MealPlanResponse(Guid Id, string Name, DateOnly WeekStartDate, VegetarianDiet ProfileDiet, IReadOnlyList<MealPlanMealResponse> Meals, IReadOnlyList<ShoppingItemResponse> ShoppingItems, MealPlanNutritionSummary Nutrition, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt);
public sealed record MealPlanSummary(Guid Id, string Name, DateOnly WeekStartDate, int MealCount, DateTimeOffset CreatedAt);
public sealed record MealPlanPage(IReadOnlyList<MealPlanSummary> Items, int Page, int PageSize, int TotalCount);
