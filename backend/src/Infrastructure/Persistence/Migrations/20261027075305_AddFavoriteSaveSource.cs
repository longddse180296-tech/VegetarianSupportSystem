// BE2-07 | Ghi nguồn lưu công thức từ trang Recipes hoặc Pantry.
// Bổ sung nguồn lưu yêu thích để giao diện phân nhóm các mục đã lưu.
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFavoriteSaveSource : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SavedFrom",
                table: "Favorites",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Favorites_SavedFrom",
                table: "Favorites",
                sql: "[SavedFrom] IS NULL OR ([TargetType] = 'Recipe' AND [SavedFrom] IN ('Recipe', 'Pantry'))");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Favorites_SavedFrom",
                table: "Favorites");

            migrationBuilder.DropColumn(
                name: "SavedFrom",
                table: "Favorites");
        }
    }
}
