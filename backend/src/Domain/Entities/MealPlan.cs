using Domain.Enums;

namespace Domain.Entities;

public sealed class MealPlan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateOnly WeekStartDate { get; set; }
    public VegetarianDiet ProfileDiet { get; set; }
    public string ProfileSnapshot { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }
    public ICollection<MealPlanMeal> Meals { get; set; } = new List<MealPlanMeal>();
    public ICollection<MealPlanShoppingItem> ShoppingItems { get; set; } = new List<MealPlanShoppingItem>();
}

public sealed class MealPlanMeal
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MealPlanId { get; set; }
    public MealPlan? MealPlan { get; set; }
    public int DayNumber { get; set; }
    public MealSlot Slot { get; set; }
    public Guid RecipeId { get; set; }
    public string RecipeName { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int Servings { get; set; } = 1;
    public int TotalTimeMinutes { get; set; }
    public decimal? CaloriesPerServing { get; set; }
    public decimal? ProteinGramPerServing { get; set; }
    public decimal? CarbohydrateGramPerServing { get; set; }
    public decimal? FatGramPerServing { get; set; }
    public ICollection<MealPlanMealIngredient> Ingredients { get; set; } = new List<MealPlanMealIngredient>();
}

public sealed class MealPlanMealIngredient
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MealPlanMealId { get; set; }
    public MealPlanMeal? MealPlanMeal { get; set; }
    public Guid IngredientId { get; set; }
    public string IngredientName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
}

public sealed class MealPlanShoppingItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MealPlanId { get; set; }
    public MealPlan? MealPlan { get; set; }
    public Guid IngredientId { get; set; }
    public string IngredientName { get; set; } = string.Empty;
    public decimal RequiredQuantity { get; set; }
    public decimal PantryQuantity { get; set; }
    public decimal QuantityToBuy { get; set; }
    public string Unit { get; set; } = string.Empty;
    public bool IsPurchased { get; set; }
}
