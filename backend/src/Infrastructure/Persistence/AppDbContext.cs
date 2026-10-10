using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Article> Articles => Set<Article>();
    public DbSet<ArticleVersion> ArticleVersions => Set<ArticleVersion>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<ContentReaction> ContentReactions => Set<ContentReaction>();
    public DbSet<MemberStatusChange> MemberStatusChanges => Set<MemberStatusChange>();
    public DbSet<RevokedAccessToken> RevokedAccessTokens => Set<RevokedAccessToken>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<UserAllergy> UserAllergies => Set<UserAllergy>();
    public DbSet<UserAvoidedFood> UserAvoidedFoods => Set<UserAvoidedFood>();
    public DbSet<ModerationSubmission> ModerationSubmissions => Set<ModerationSubmission>();
    public DbSet<ModerationDecision> ModerationDecisions => Set<ModerationDecision>();
    public DbSet<AiChatConversation> AiChatConversations => Set<AiChatConversation>();
    public DbSet<AiChatMessage> AiChatMessages => Set<AiChatMessage>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Ingredient> Ingredients => Set<Ingredient>();
    public DbSet<Recipe> Recipes => Set<Recipe>();
    public DbSet<RecipeIngredient> RecipeIngredients => Set<RecipeIngredient>();
    public DbSet<Restaurant> Restaurants => Set<Restaurant>();
    public DbSet<RestaurantDietaryType> RestaurantDietaryTypes => Set<RestaurantDietaryType>();
    public DbSet<RestaurantAmenity> RestaurantAmenities => Set<RestaurantAmenity>();
    public DbSet<RestaurantRecipe> RestaurantRecipes => Set<RestaurantRecipe>();
    public DbSet<PantryItem> PantryItems => Set<PantryItem>();
    public DbSet<Favorite> Favorites => Set<Favorite>();
    public DbSet<MealPlan> MealPlans => Set<MealPlan>();
    public DbSet<MealPlanMeal> MealPlanMeals => Set<MealPlanMeal>();
    public DbSet<MealPlanMealIngredient> MealPlanMealIngredients => Set<MealPlanMealIngredient>();
    public DbSet<MealPlanShoppingItem> MealPlanShoppingItems => Set<MealPlanShoppingItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
