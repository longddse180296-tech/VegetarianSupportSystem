// Chức năng: thực đơn bảy ngày và danh sách đi chợ. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using System.ComponentModel.DataAnnotations;
using Domain.Enums;

namespace Application.Features.MealPlans;
// MealPlanGenerateRequest: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class MealPlanGenerateRequest { [Required, StringLength(120)] public string? Name { get; init; } public DateOnly WeekStartDate { get; init; } }
// MealReplacementRequest: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class MealReplacementRequest { public Guid RecipeId { get; init; } [Range(1,20)] public int Servings { get; init; } = 1; }
// ShoppingPurchaseRequest: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class ShoppingPurchaseRequest { public bool IsPurchased { get; init; } }
// MealPlanCopyToWeekRequest: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class MealPlanCopyToWeekRequest { public DateOnly WeekStartDate { get; init; } [StringLength(120)] public string? Name { get; init; } }
// MealPlanListQuery: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class MealPlanListQuery { [Range(1, int.MaxValue)] public int Page { get; init; } = 1; [Range(1, 100)] public int PageSize { get; init; } = 20; }
// MealPlanMealResponse: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record MealPlanMealResponse(Guid Id, int DayNumber, MealSlot Slot, Guid RecipeId, string RecipeName, int Servings, int SwapCount, int TotalTimeMinutes, decimal? CaloriesPerServing, decimal? ProteinGramPerServing, decimal? CarbohydrateGramPerServing, decimal? FatGramPerServing, string? ImageUrl = null, IReadOnlyList<string>? IngredientNames = null);
// ShoppingItemResponse: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ShoppingItemResponse(Guid Id, Guid IngredientId, string IngredientName, decimal RequiredQuantity, decimal PantryQuantity, decimal QuantityToBuy, string Unit, bool IsPurchased);
// MealPlanNutritionSummary: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record MealPlanNutritionSummary(decimal Calories, decimal ProteinGrams, decimal CarbohydrateGrams, decimal FatGrams);
// MealPlanResponse: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record MealPlanResponse(Guid Id, string Name, DateOnly WeekStartDate, VegetarianDiet ProfileDiet, IReadOnlyList<MealPlanMealResponse> Meals, IReadOnlyList<ShoppingItemResponse> ShoppingItems, MealPlanNutritionSummary Nutrition, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt);
// MealPlanSummary: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record MealPlanSummary(Guid Id, string Name, DateOnly WeekStartDate, int MealCount, DateTimeOffset CreatedAt);
// MealPlanPage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record MealPlanPage(IReadOnlyList<MealPlanSummary> Items, int Page, int PageSize, int TotalCount);
