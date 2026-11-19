// BE2-09 | Mô hình nghiệp vụ lưu lịch tuần và bản chụp món, nguyên liệu, số lượng mua.
// Lưu thực đơn theo ngày và bữa cùng danh sách mua sắm.
using Domain.Enums;

namespace Domain.Entities;

// MealPlan: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
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

// MealPlanMeal: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
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
    public int SwapCount { get; set; }
    public int TotalTimeMinutes { get; set; }
    public decimal? CaloriesPerServing { get; set; }
    public decimal? ProteinGramPerServing { get; set; }
    public decimal? CarbohydrateGramPerServing { get; set; }
    public decimal? FatGramPerServing { get; set; }
    public ICollection<MealPlanMealIngredient> Ingredients { get; set; } = new List<MealPlanMealIngredient>();
}

// MealPlanMealIngredient: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
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

// MealPlanShoppingItem: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class MealPlanShoppingItem
{
    // Lưu đối soát và trạng thái mua riêng từng ngày. Null cho lịch cũ chỉ lưu tổng tuần.
    public string? DailyShoppingJson { get; set; }
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
