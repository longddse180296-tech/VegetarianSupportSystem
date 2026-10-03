using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<RevokedAccessToken> RevokedAccessTokens => Set<RevokedAccessToken>();
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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
