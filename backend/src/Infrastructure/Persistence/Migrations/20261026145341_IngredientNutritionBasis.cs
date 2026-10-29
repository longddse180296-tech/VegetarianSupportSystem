// Lịch sử cơ sở dữ liệu do EF Core sinh; giữ cấu trúc nâng cấp/hạ cấp và không chỉnh tay phần ánh xạ tự sinh.
// Chức năng: danh mục nguyên liệu và dữ liệu dinh dưỡng. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
﻿using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class IngredientNutritionBasis : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "NutritionBasisQuantity",
                table: "Ingredients",
                type: "decimal(12,3)",
                precision: 12,
                scale: 3,
                nullable: false,
                defaultValue: 100m);

            migrationBuilder.AddColumn<string>(
                name: "NutritionBasisUnit",
                table: "Ingredients",
                type: "nvarchar(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "g");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Ingredients_NutritionBasisQuantity",
                table: "Ingredients",
                sql: "[NutritionBasisQuantity] > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Ingredients_NutritionBasisUnit",
                table: "Ingredients",
                sql: "[NutritionBasisUnit] IN (N'g', N'kg', N'ml', N'đơn vị')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Ingredients_NutritionBasisQuantity",
                table: "Ingredients");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Ingredients_NutritionBasisUnit",
                table: "Ingredients");

            migrationBuilder.DropColumn(
                name: "NutritionBasisQuantity",
                table: "Ingredients");

            migrationBuilder.DropColumn(
                name: "NutritionBasisUnit",
                table: "Ingredients");
        }
    }
}
