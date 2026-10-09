using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPantry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PantryItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    IngredientId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CustomName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true, collation: "Latin1_General_100_CI_AS"),
                    Quantity = table.Column<decimal>(type: "decimal(12,3)", precision: 12, scale: 3, nullable: true),
                    Unit = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PantryItems", x => x.Id);
                    table.CheckConstraint("CK_PantryItems_Identity", "([IngredientId] IS NOT NULL AND [CustomName] IS NULL) OR ([IngredientId] IS NULL AND [CustomName] IS NOT NULL)");
                    table.ForeignKey(
                        name: "FK_PantryItems_Ingredients_IngredientId",
                        column: x => x.IngredientId,
                        principalTable: "Ingredients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PantryItems_IngredientId",
                table: "PantryItems",
                column: "IngredientId");

            migrationBuilder.CreateIndex(
                name: "IX_PantryItems_UserId_CustomName",
                table: "PantryItems",
                columns: new[] { "UserId", "CustomName" },
                unique: true,
                filter: "[IngredientId] IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PantryItems_UserId_IngredientId",
                table: "PantryItems",
                columns: new[] { "UserId", "IngredientId" },
                unique: true,
                filter: "[IngredientId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PantryItems");
        }
    }
}
