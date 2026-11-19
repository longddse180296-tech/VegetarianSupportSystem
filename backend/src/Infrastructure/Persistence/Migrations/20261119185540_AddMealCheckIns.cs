using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMealCheckIns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "CheckedInAt",
                table: "MealPlanMeals",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MealCheckIns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    MealId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RecipeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EatenOn = table.Column<DateOnly>(type: "date", nullable: false),
                    CheckedInAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MealCheckIns", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MealCheckIns_UserId_EatenOn_RecipeId",
                table: "MealCheckIns",
                columns: new[] { "UserId", "EatenOn", "RecipeId" });

            migrationBuilder.CreateIndex(
                name: "IX_MealCheckIns_UserId_MealId",
                table: "MealCheckIns",
                columns: new[] { "UserId", "MealId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MealCheckIns");

            migrationBuilder.DropColumn(
                name: "CheckedInAt",
                table: "MealPlanMeals");
        }
    }
}
