// Lịch sử cơ sở dữ liệu do EF Core sinh; giữ cấu trúc nâng cấp/hạ cấp và không chỉnh tay phần ánh xạ tự sinh.
// Chức năng: công thức và định lượng nguyên liệu. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
﻿using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRecipeDeclaredDietaryType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DeclaredDietaryType",
                table: "Recipes",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeclaredDietaryType",
                table: "Recipes");
        }
    }
}
