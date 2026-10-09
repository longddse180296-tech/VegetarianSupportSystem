using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Application.Common.Exceptions;
using Application.Common.Validation;
using Domain.Entities;
using Domain.Enums;
using Domain.Rules;

namespace Application.Features.MealPlans;
public sealed class MealPlanService(IMealPlanRepository repository)
{
    public async Task<MealPlanResponse> GenerateAsync(string userId, MealPlanGenerateRequest request, CancellationToken ct)
    {
        RequestValidation.Validate(request);
        if (string.IsNullOrWhiteSpace(request.Name) || request.WeekStartDate == default) throw new ValidationException("Name and week start date are required.");
        var profile = await repository.GetProfileAsync(userId, ct) ?? throw new ConflictException("Set a dietary profile before generating a meal plan.");
        if (profile.Diet is null) throw new ConflictException("Set a dietary profile before generating a meal plan.");
        var snapshot = ProfileSnapshot.From(profile);
        var recipes = (await repository.GetActiveRecipesAsync(ct)).Where(r => IsUsable(r, snapshot)).OrderBy(r => r.Name).ToArray();
        if (recipes.Length == 0) throw new ConflictException("No active recipes meet the mandatory dietary and allergy conditions.");
        var plan = new MealPlan { UserId = userId, Name = request.Name.Trim(), WeekStartDate = request.WeekStartDate, ProfileDiet = snapshot.Diet, ProfileSnapshot = JsonSerializer.Serialize(snapshot) };
        var slots = Enum.GetValues<MealSlot>(); var index = 0;
        for (var day = 1; day <= 7; day++) foreach (var slot in slots) plan.Meals.Add(Snapshot(recipes[index++ % recipes.Length], day, slot, 1));
        await RebuildShoppingAsync(plan, userId, ct); repository.Add(plan); await repository.SaveAsync(ct); return Map(plan);
    }
    public async Task<MealPlanPage> ListAsync(string userId, MealPlanListQuery query, CancellationToken ct)
    {
        RequestValidation.Validate(query);
        var result = await repository.ListAsync(userId, query, ct);
        return new MealPlanPage(result.Items.Select(x => new MealPlanSummary(x.Id, x.Name, x.WeekStartDate, x.Meals.Count, x.CreatedAt)).ToArray(), query.Page, query.PageSize, result.TotalCount);
    }
    public async Task<MealPlanResponse> GetAsync(string userId, Guid id, CancellationToken ct) => Map(await FindAsync(userId,id,ct));
    public async Task<MealPlanResponse> ReplaceMealAsync(string userId, Guid id, int day, MealSlot slot, MealReplacementRequest request, CancellationToken ct)
    {
        RequestValidation.Validate(request); if (day is < 1 or > 7 || !Enum.IsDefined(slot) || request.RecipeId == Guid.Empty) throw new ValidationException("Invalid meal position or recipe.");
        var plan = await FindAsync(userId,id,ct); var recipe = await repository.GetUsableRecipeAsync(request.RecipeId,ct) ?? throw new KeyNotFoundException("Recipe not found or inactive.");
        if (!IsUsable(recipe, ReadSnapshot(plan))) throw new ConflictException("Recipe does not meet the dietary or allergy conditions saved with this meal plan.");
        var old = plan.Meals.SingleOrDefault(x=>x.DayNumber==day&&x.Slot==slot) ?? throw new KeyNotFoundException("Meal not found."); plan.Meals.Remove(old); plan.Meals.Add(Snapshot(recipe,day,slot,request.Servings)); plan.UpdatedAt=DateTimeOffset.UtcNow; await RebuildShoppingAsync(plan,userId,ct); await repository.SaveAsync(ct); return Map(plan);
    }
    public async Task<MealPlanResponse> RegenerateAsync(string userId, Guid id, CancellationToken ct)
    {
        var plan = await FindAsync(userId, id, ct);
        var snapshot = ReadSnapshot(plan);
        var recipes = (await repository.GetActiveRecipesAsync(ct)).Where(recipe => IsUsable(recipe, snapshot)).OrderBy(recipe => recipe.Name).ToArray();
        if (recipes.Length == 0) throw new ConflictException("No active recipes meet the dietary and allergy conditions saved with this meal plan.");
        plan.Meals.Clear();
        var index = 0;
        for (var day = 1; day <= 7; day++) foreach (var slot in Enum.GetValues<MealSlot>()) plan.Meals.Add(Snapshot(recipes[index++ % recipes.Length], day, slot, 1));
        plan.UpdatedAt = DateTimeOffset.UtcNow;
        await RebuildShoppingAsync(plan, userId, ct);
        await repository.SaveAsync(ct);
        return Map(plan);
    }
    public async Task<MealPlanResponse> CopyToWeekAsync(string userId, Guid id, MealPlanCopyToWeekRequest request, CancellationToken ct)
    {
        RequestValidation.Validate(request);
        if (request.WeekStartDate == default) throw new ValidationException("Week start date is required.");
        var source = await FindAsync(userId, id, ct);
        var copy = new MealPlan
        {
            UserId = userId,
            Name = string.IsNullOrWhiteSpace(request.Name) ? source.Name : request.Name.Trim(),
            WeekStartDate = request.WeekStartDate,
            ProfileDiet = source.ProfileDiet,
            ProfileSnapshot = source.ProfileSnapshot,
            Meals = source.Meals.Select(meal => new MealPlanMeal
            {
                DayNumber = meal.DayNumber, Slot = meal.Slot, RecipeId = meal.RecipeId, RecipeName = meal.RecipeName,
                ImageUrl = meal.ImageUrl, Servings = meal.Servings, TotalTimeMinutes = meal.TotalTimeMinutes,
                CaloriesPerServing = meal.CaloriesPerServing, ProteinGramPerServing = meal.ProteinGramPerServing,
                CarbohydrateGramPerServing = meal.CarbohydrateGramPerServing, FatGramPerServing = meal.FatGramPerServing,
                Ingredients = meal.Ingredients.Select(ingredient => new MealPlanMealIngredient
                {
                    IngredientId = ingredient.IngredientId, IngredientName = ingredient.IngredientName,
                    Quantity = ingredient.Quantity, Unit = ingredient.Unit
                }).ToList()
            }).ToList()
        };
        await RebuildShoppingAsync(copy, userId, ct);
        repository.Add(copy);
        await repository.SaveAsync(ct);
        return Map(copy);
    }
    public async Task<IReadOnlyList<ShoppingItemResponse>> UpdatePurchaseAsync(string userId, Guid planId, Guid itemId, ShoppingPurchaseRequest request, CancellationToken ct)
    { var plan=await FindAsync(userId,planId,ct); var item=plan.ShoppingItems.SingleOrDefault(x=>x.Id==itemId)??throw new KeyNotFoundException("Shopping item not found."); item.IsPurchased=request.IsPurchased; plan.UpdatedAt=DateTimeOffset.UtcNow; await repository.SaveAsync(ct); return plan.ShoppingItems.Select(Map).ToArray(); }
    private async Task<MealPlan> FindAsync(string u,Guid id,CancellationToken ct)=>await repository.GetAsync(id,u,ct)??throw new KeyNotFoundException("Meal plan not found.");
    private async Task RebuildShoppingAsync(MealPlan plan,string user,CancellationToken ct) { plan.ShoppingItems.Clear(); var pantry=(await repository.GetPantryAsync(user,ct)).Where(x=>x.IngredientId.HasValue&&x.Quantity.HasValue).GroupBy(x=>new{x.IngredientId,x.Unit}).ToDictionary(x=>x.Key,x=>x.Sum(y=>y.Quantity!.Value)); foreach(var g in plan.Meals.SelectMany(x=>x.Ingredients).GroupBy(x=>new{x.IngredientId,x.IngredientName,x.Unit})) { pantry.TryGetValue(new { IngredientId=(Guid?)g.Key.IngredientId, Unit=(string?)g.Key.Unit },out var have); var need=g.Sum(x=>x.Quantity); plan.ShoppingItems.Add(new MealPlanShoppingItem{IngredientId=g.Key.IngredientId,IngredientName=g.Key.IngredientName,Unit=g.Key.Unit,RequiredQuantity=need,PantryQuantity=have,QuantityToBuy=Math.Max(0,need-have)}); } }
    private static MealPlanMeal Snapshot(Recipe r,int day,MealSlot slot,int servings)=>new(){DayNumber=day,Slot=slot,RecipeId=r.Id,RecipeName=r.Name,ImageUrl=r.ImageUrl,Servings=servings,TotalTimeMinutes=r.PrepTimeMinutes+r.CookTimeMinutes,CaloriesPerServing=r.CaloriesPerServing,ProteinGramPerServing=r.ProteinGramPerServing,CarbohydrateGramPerServing=r.CarbohydrateGramPerServing,FatGramPerServing=r.FatGramPerServing,Ingredients=r.RecipeIngredients.Select(x=>new MealPlanMealIngredient{IngredientId=x.IngredientId,IngredientName=x.Ingredient!.Name,Quantity=x.Quantity*servings,Unit=x.Unit}).ToList()};
    private static bool IsUsable(Recipe recipe, ProfileSnapshot profile) => recipe.RecipeIngredients.All(ingredient => ingredient.Ingredient is not null &&
        DietaryRules.Classify([ingredient.Ingredient]).Single(assessment => assessment.DietaryType == ToDiet(profile.Diet)).Status == DietaryCompatibility.Compatible &&
        !profile.Allergies.Any(allergy => Terms(ingredient.Ingredient.Allergens, allergy)) &&
        !profile.AvoidedFoods.Any(avoided => Terms(ingredient.Ingredient.Name, avoided) || Terms(ingredient.Ingredient.Aliases, avoided)));
    private static DietaryType ToDiet(VegetarianDiet d)=>d switch {VegetarianDiet.Vegan=>DietaryType.Vegan,VegetarianDiet.Lacto=>DietaryType.LactoVegetarian,VegetarianDiet.Ovo=>DietaryType.OvoVegetarian,_=>DietaryType.LactoOvoVegetarian};
    private static bool Terms(string? s,string term)=>!string.IsNullOrWhiteSpace(s)&&s.Split([',',';','|'],StringSplitOptions.TrimEntries|StringSplitOptions.RemoveEmptyEntries).Any(x=>string.Equals(x,term,StringComparison.OrdinalIgnoreCase));
    private static ProfileSnapshot ReadSnapshot(MealPlan plan)
    {
        var snapshot = JsonSerializer.Deserialize<ProfileSnapshot>(plan.ProfileSnapshot);
        return snapshot is { Diet: var diet } && Enum.IsDefined(diet) ? snapshot : new ProfileSnapshot(plan.ProfileDiet, [], []);
    }
    private static MealPlanResponse Map(MealPlan p)
    {
        var meals = p.Meals.OrderBy(x => x.DayNumber).ThenBy(x => x.Slot).Select(x => new MealPlanMealResponse(x.Id, x.DayNumber, x.Slot, x.RecipeId, x.RecipeName, x.Servings, x.TotalTimeMinutes, x.CaloriesPerServing, x.ProteinGramPerServing, x.CarbohydrateGramPerServing, x.FatGramPerServing)).ToArray();
        return new MealPlanResponse(p.Id, p.Name, p.WeekStartDate, p.ProfileDiet, meals, p.ShoppingItems.OrderBy(x => x.IngredientName).Select(Map).ToArray(), new MealPlanNutritionSummary(meals.Sum(x => (x.CaloriesPerServing ?? 0) * x.Servings), meals.Sum(x => (x.ProteinGramPerServing ?? 0) * x.Servings), meals.Sum(x => (x.CarbohydrateGramPerServing ?? 0) * x.Servings), meals.Sum(x => (x.FatGramPerServing ?? 0) * x.Servings)), p.CreatedAt, p.UpdatedAt);
    }
    private static ShoppingItemResponse Map(MealPlanShoppingItem x)=>new(x.Id,x.IngredientId,x.IngredientName,x.RequiredQuantity,x.PantryQuantity,x.QuantityToBuy,x.Unit,x.IsPurchased);
    private sealed record ProfileSnapshot(VegetarianDiet Diet, IReadOnlyList<string> Allergies, IReadOnlyList<string> AvoidedFoods)
    {
        public static ProfileSnapshot From(UserProfile profile) => new(profile.Diet!.Value, profile.Allergies.Select(x => x.NormalizedName).ToArray(), profile.AvoidedFoods.Select(x => x.NormalizedName).ToArray());
    }
}
