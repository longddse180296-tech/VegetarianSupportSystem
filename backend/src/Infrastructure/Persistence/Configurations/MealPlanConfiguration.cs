using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public sealed class MealPlanConfiguration : IEntityTypeConfiguration<MealPlan>
{
    public void Configure(EntityTypeBuilder<MealPlan> builder)
    {
        builder.ToTable("MealPlans"); builder.HasKey(x => x.Id); builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.UserId).HasMaxLength(450).IsRequired(); builder.Property(x => x.Name).HasMaxLength(120).IsRequired();
        builder.Property(x => x.ProfileDiet).HasConversion<string>().HasMaxLength(16); builder.Property(x => x.ProfileSnapshot).HasMaxLength(4000);
        builder.HasIndex(x => new { x.UserId, x.WeekStartDate });
        builder.HasMany(x => x.Meals).WithOne(x => x.MealPlan).HasForeignKey(x => x.MealPlanId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(x => x.ShoppingItems).WithOne(x => x.MealPlan).HasForeignKey(x => x.MealPlanId).OnDelete(DeleteBehavior.Cascade);
    }
}
public sealed class MealPlanMealConfiguration : IEntityTypeConfiguration<MealPlanMeal>
{
    public void Configure(EntityTypeBuilder<MealPlanMeal> builder)
    {
        builder.ToTable("MealPlanMeals", t => t.HasCheckConstraint("CK_MealPlanMeals_Day", "[DayNumber] BETWEEN 1 AND 7"));
        builder.HasKey(x => x.Id); builder.Property(x => x.Id).ValueGeneratedNever(); builder.Property(x => x.Slot).HasConversion<string>().HasMaxLength(16);
        builder.Property(x => x.RecipeName).HasMaxLength(120).IsRequired(); foreach (var p in new[] { "CaloriesPerServing", "ProteinGramPerServing", "CarbohydrateGramPerServing", "FatGramPerServing" }) builder.Property(p).HasPrecision(12, 3);
        builder.HasIndex(x => new { x.MealPlanId, x.DayNumber, x.Slot }).IsUnique(); builder.HasMany(x => x.Ingredients).WithOne(x => x.MealPlanMeal).HasForeignKey(x => x.MealPlanMealId).OnDelete(DeleteBehavior.Cascade);
    }
}
public sealed class MealPlanMealIngredientConfiguration : IEntityTypeConfiguration<MealPlanMealIngredient>
{ public void Configure(EntityTypeBuilder<MealPlanMealIngredient> b) { b.ToTable("MealPlanMealIngredients"); b.HasKey(x => x.Id); b.Property(x => x.Id).ValueGeneratedNever(); b.Property(x => x.IngredientName).HasMaxLength(120).IsRequired(); b.Property(x => x.Unit).HasMaxLength(40).IsRequired(); b.Property(x => x.Quantity).HasPrecision(12,3); b.HasIndex(x => new { x.MealPlanMealId, x.IngredientId, x.Unit }).IsUnique(); } }
public sealed class MealPlanShoppingItemConfiguration : IEntityTypeConfiguration<MealPlanShoppingItem>
{ public void Configure(EntityTypeBuilder<MealPlanShoppingItem> b) { b.ToTable("MealPlanShoppingItems"); b.HasKey(x => x.Id); b.Property(x => x.Id).ValueGeneratedNever(); b.Property(x => x.IngredientName).HasMaxLength(120).IsRequired(); b.Property(x => x.Unit).HasMaxLength(40).IsRequired(); b.Property(x => x.RequiredQuantity).HasPrecision(12,3); b.Property(x => x.PantryQuantity).HasPrecision(12,3); b.Property(x => x.QuantityToBuy).HasPrecision(12,3); b.HasIndex(x => new { x.MealPlanId, x.IngredientId, x.Unit }).IsUnique(); } }
