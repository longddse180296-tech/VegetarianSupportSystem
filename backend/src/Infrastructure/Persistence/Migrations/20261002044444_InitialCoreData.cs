using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCoreData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false, collation: "Latin1_General_100_CI_AS"),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Ingredients",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false, collation: "Latin1_General_100_CI_AS"),
                    Aliases = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Origin = table.Column<int>(type: "int", nullable: false),
                    ContainsEgg = table.Column<bool>(type: "bit", nullable: false),
                    ContainsMilk = table.Column<bool>(type: "bit", nullable: false),
                    ContainsHoney = table.Column<bool>(type: "bit", nullable: false),
                    Allergens = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    DefaultUnit = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: true),
                    CaloriesPer100Gram = table.Column<decimal>(type: "decimal(12,3)", precision: 12, scale: 3, nullable: true),
                    ProteinGramPer100Gram = table.Column<decimal>(type: "decimal(12,3)", precision: 12, scale: 3, nullable: true),
                    CarbohydrateGramPer100Gram = table.Column<decimal>(type: "decimal(12,3)", precision: 12, scale: 3, nullable: true),
                    FatGramPer100Gram = table.Column<decimal>(type: "decimal(12,3)", precision: 12, scale: 3, nullable: true),
                    Source = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ingredients", x => x.Id);
                    table.CheckConstraint("CK_Ingredients_CaloriesPer100Gram", "[CaloriesPer100Gram] IS NULL OR [CaloriesPer100Gram] >= 0");
                    table.CheckConstraint("CK_Ingredients_CarbohydrateGramPer100Gram", "[CarbohydrateGramPer100Gram] IS NULL OR [CarbohydrateGramPer100Gram] >= 0");
                    table.CheckConstraint("CK_Ingredients_FatGramPer100Gram", "[FatGramPer100Gram] IS NULL OR [FatGramPer100Gram] >= 0");
                    table.CheckConstraint("CK_Ingredients_Origin", "[Origin] IN (0, 1, 2)");
                    table.CheckConstraint("CK_Ingredients_ProteinGramPer100Gram", "[ProteinGramPer100Gram] IS NULL OR [ProteinGramPer100Gram] >= 0");
                });

            migrationBuilder.CreateTable(
                name: "Recipes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false, collation: "Latin1_General_100_CI_AS"),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Servings = table.Column<int>(type: "int", nullable: false),
                    Instructions = table.Column<string>(type: "nvarchar(max)", maxLength: 20000, nullable: false),
                    PrepTimeMinutes = table.Column<int>(type: "int", nullable: false),
                    CookTimeMinutes = table.Column<int>(type: "int", nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                    CaloriesPerServing = table.Column<decimal>(type: "decimal(12,3)", precision: 12, scale: 3, nullable: true),
                    ProteinGramPerServing = table.Column<decimal>(type: "decimal(12,3)", precision: 12, scale: 3, nullable: true),
                    CarbohydrateGramPerServing = table.Column<decimal>(type: "decimal(12,3)", precision: 12, scale: 3, nullable: true),
                    FatGramPerServing = table.Column<decimal>(type: "decimal(12,3)", precision: 12, scale: 3, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Recipes", x => x.Id);
                    table.CheckConstraint("CK_Recipes_CaloriesPerServing", "[CaloriesPerServing] IS NULL OR [CaloriesPerServing] >= 0");
                    table.CheckConstraint("CK_Recipes_CarbohydrateGramPerServing", "[CarbohydrateGramPerServing] IS NULL OR [CarbohydrateGramPerServing] >= 0");
                    table.CheckConstraint("CK_Recipes_FatGramPerServing", "[FatGramPerServing] IS NULL OR [FatGramPerServing] >= 0");
                    table.CheckConstraint("CK_Recipes_ProteinGramPerServing", "[ProteinGramPerServing] IS NULL OR [ProteinGramPerServing] >= 0");
                    table.CheckConstraint("CK_Recipes_Servings", "[Servings] BETWEEN 1 AND 10000");
                    table.CheckConstraint("CK_Recipes_Times", "[PrepTimeMinutes] BETWEEN 0 AND 10080 AND [CookTimeMinutes] BETWEEN 0 AND 10080");
                    table.ForeignKey(
                        name: "FK_Recipes_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RecipeIngredients",
                columns: table => new
                {
                    RecipeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IngredientId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(12,3)", precision: 12, scale: 3, nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Note = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecipeIngredients", x => new { x.RecipeId, x.IngredientId });
                    table.CheckConstraint("CK_RecipeIngredients_Quantity", "[Quantity] > 0");
                    table.ForeignKey(
                        name: "FK_RecipeIngredients_Ingredients_IngredientId",
                        column: x => x.IngredientId,
                        principalTable: "Ingredients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RecipeIngredients_Recipes_RecipeId",
                        column: x => x.RecipeId,
                        principalTable: "Recipes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Name",
                table: "Categories",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Ingredients_Name",
                table: "Ingredients",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RecipeIngredients_IngredientId",
                table: "RecipeIngredients",
                column: "IngredientId");

            migrationBuilder.CreateIndex(
                name: "IX_Recipes_CategoryId",
                table: "Recipes",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Recipes_Name",
                table: "Recipes",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RecipeIngredients");

            migrationBuilder.DropTable(
                name: "Ingredients");

            migrationBuilder.DropTable(
                name: "Recipes");

            migrationBuilder.DropTable(
                name: "Categories");
        }
    }
}
