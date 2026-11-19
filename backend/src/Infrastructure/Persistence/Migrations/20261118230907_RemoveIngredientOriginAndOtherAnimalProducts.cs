using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveIngredientOriginAndOtherAnimalProducts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Ingredients_Origin",
                table: "Ingredients");

            migrationBuilder.DropColumn(
                name: "ContainsOtherAnimalProducts",
                table: "Ingredients");

            migrationBuilder.DropColumn(
                name: "Origin",
                table: "Ingredients");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ContainsOtherAnimalProducts",
                table: "Ingredients",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Origin",
                table: "Ingredients",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Ingredients_Origin",
                table: "Ingredients",
                sql: "[Origin] IN (0, 1, 2)");
        }
    }
}
