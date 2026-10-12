using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMealPlans : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MealPlans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    WeekStartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    ProfileDiet = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    ProfileSnapshot = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MealPlans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MealPlanMeals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MealPlanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DayNumber = table.Column<int>(type: "int", nullable: false),
                    Slot = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    RecipeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RecipeName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Servings = table.Column<int>(type: "int", nullable: false),
                    TotalTimeMinutes = table.Column<int>(type: "int", nullable: false),
                    CaloriesPerServing = table.Column<decimal>(type: "decimal(12,3)", precision: 12, scale: 3, nullable: true),
                    ProteinGramPerServing = table.Column<decimal>(type: "decimal(12,3)", precision: 12, scale: 3, nullable: true),
                    CarbohydrateGramPerServing = table.Column<decimal>(type: "decimal(12,3)", precision: 12, scale: 3, nullable: true),
                    FatGramPerServing = table.Column<decimal>(type: "decimal(12,3)", precision: 12, scale: 3, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MealPlanMeals", x => x.Id);
                    table.CheckConstraint("CK_MealPlanMeals_Day", "[DayNumber] BETWEEN 1 AND 7");
                    table.ForeignKey(
                        name: "FK_MealPlanMeals_MealPlans_MealPlanId",
                        column: x => x.MealPlanId,
                        principalTable: "MealPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MealPlanShoppingItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MealPlanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IngredientId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IngredientName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    RequiredQuantity = table.Column<decimal>(type: "decimal(12,3)", precision: 12, scale: 3, nullable: false),
                    PantryQuantity = table.Column<decimal>(type: "decimal(12,3)", precision: 12, scale: 3, nullable: false),
                    QuantityToBuy = table.Column<decimal>(type: "decimal(12,3)", precision: 12, scale: 3, nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    IsPurchased = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MealPlanShoppingItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MealPlanShoppingItems_MealPlans_MealPlanId",
                        column: x => x.MealPlanId,
                        principalTable: "MealPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MealPlanMealIngredients",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MealPlanMealId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IngredientId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IngredientName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(12,3)", precision: 12, scale: 3, nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MealPlanMealIngredients", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MealPlanMealIngredients_MealPlanMeals_MealPlanMealId",
                        column: x => x.MealPlanMealId,
                        principalTable: "MealPlanMeals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MealPlanMealIngredients_MealPlanMealId_IngredientId_Unit",
                table: "MealPlanMealIngredients",
                columns: new[] { "MealPlanMealId", "IngredientId", "Unit" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MealPlanMeals_MealPlanId_DayNumber_Slot",
                table: "MealPlanMeals",
                columns: new[] { "MealPlanId", "DayNumber", "Slot" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MealPlans_UserId_WeekStartDate",
                table: "MealPlans",
                columns: new[] { "UserId", "WeekStartDate" });

            migrationBuilder.CreateIndex(
                name: "IX_MealPlanShoppingItems_MealPlanId_IngredientId_Unit",
                table: "MealPlanShoppingItems",
                columns: new[] { "MealPlanId", "IngredientId", "Unit" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MealPlanMealIngredients");

            migrationBuilder.DropTable(
                name: "MealPlanShoppingItems");

            migrationBuilder.DropTable(
                name: "MealPlanMeals");

            migrationBuilder.DropTable(
                name: "MealPlans");
        }
    }
}
