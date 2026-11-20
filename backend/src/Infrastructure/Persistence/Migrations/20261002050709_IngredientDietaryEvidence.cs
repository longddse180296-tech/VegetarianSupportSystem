// BE2-07 | Thêm dữ liệu bằng chứng dùng để phân loại chế độ ăn của nguyên liệu.
// Lịch sử cơ sở dữ liệu do EF Core sinh; giữ cấu trúc nâng cấp/hạ cấp và không chỉnh tay phần ánh xạ tự sinh.
// Bổ sung bằng chứng về thành phần động vật để đánh giá chế độ ăn.
﻿using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class IngredientDietaryEvidence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ContainsOtherAnimalProducts",
                table: "Ingredients",
                type: "bit",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContainsOtherAnimalProducts",
                table: "Ingredients");
        }
    }
}
