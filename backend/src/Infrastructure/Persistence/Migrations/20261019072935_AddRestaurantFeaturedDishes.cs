// Lịch sử cơ sở dữ liệu do EF Core sinh; giữ cấu trúc nâng cấp/hạ cấp và không chỉnh tay phần ánh xạ tự sinh.
// Chức năng: tra cứu và quản lý nhà hàng. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
﻿using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRestaurantFeaturedDishes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RestaurantFeaturedDishes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RestaurantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false, collation: "Latin1_General_100_CI_AS"),
                    ImageUrl = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RestaurantFeaturedDishes", x => x.Id);
                    table.CheckConstraint("CK_RestaurantFeaturedDishes_DisplayOrder", "[DisplayOrder] BETWEEN 0 AND 2");
                    table.ForeignKey(
                        name: "FK_RestaurantFeaturedDishes_Restaurants_RestaurantId",
                        column: x => x.RestaurantId,
                        principalTable: "Restaurants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql(@"
                ;WITH RankedLegacyDishes AS
                (
                    SELECT
                        links.RestaurantId,
                        recipes.Name,
                        COALESCE(NULLIF(recipes.ImageUrl, N''), NULLIF(restaurants.ImageUrl, N''),
                            N'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80') AS ImageUrl,
                        ROW_NUMBER() OVER (PARTITION BY links.RestaurantId ORDER BY recipes.Name, recipes.Id) - 1 AS DisplayOrder
                    FROM RestaurantRecipes AS links
                    INNER JOIN Recipes AS recipes ON recipes.Id = links.RecipeId
                    INNER JOIN Restaurants AS restaurants ON restaurants.Id = links.RestaurantId
                )
                INSERT INTO RestaurantFeaturedDishes (Id, RestaurantId, Name, ImageUrl, DisplayOrder)
                SELECT NEWID(), RestaurantId, Name, ImageUrl, DisplayOrder
                FROM RankedLegacyDishes
                WHERE DisplayOrder BETWEEN 0 AND 2;");

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantFeaturedDishes_RestaurantId_DisplayOrder",
                table: "RestaurantFeaturedDishes",
                columns: new[] { "RestaurantId", "DisplayOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantFeaturedDishes_RestaurantId_Name",
                table: "RestaurantFeaturedDishes",
                columns: new[] { "RestaurantId", "Name" },
                unique: true);

            migrationBuilder.DropTable(
                name: "RestaurantRecipes");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RestaurantFeaturedDishes");

            migrationBuilder.CreateTable(
                name: "RestaurantRecipes",
                columns: table => new
                {
                    RestaurantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RecipeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RestaurantRecipes", x => new { x.RestaurantId, x.RecipeId });
                    table.ForeignKey(
                        name: "FK_RestaurantRecipes_Recipes_RecipeId",
                        column: x => x.RecipeId,
                        principalTable: "Recipes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RestaurantRecipes_Restaurants_RestaurantId",
                        column: x => x.RestaurantId,
                        principalTable: "Restaurants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantRecipes_RecipeId",
                table: "RestaurantRecipes",
                column: "RecipeId");
        }
    }
}
