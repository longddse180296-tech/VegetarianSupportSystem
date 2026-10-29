// Lịch sử cơ sở dữ liệu do EF Core sinh; giữ cấu trúc nâng cấp/hạ cấp và không chỉnh tay phần ánh xạ tự sinh.
// Chức năng: bài viết và phiên bản gửi duyệt. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
﻿using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddArticleCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ArticleCategories",
                columns: table => new
                {
                    ArticleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArticleCategories", x => new { x.ArticleId, x.Category });
                    table.ForeignKey(
                        name: "FK_ArticleCategories_Articles_ArticleId",
                        column: x => x.ArticleId,
                        principalTable: "Articles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ArticleVersionCategories",
                columns: table => new
                {
                    ArticleVersionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArticleVersionCategories", x => new { x.ArticleVersionId, x.Category });
                    table.ForeignKey(
                        name: "FK_ArticleVersionCategories_ArticleVersions_ArticleVersionId",
                        column: x => x.ArticleVersionId,
                        principalTable: "ArticleVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Preserve each existing article's former single category as its first category.
            migrationBuilder.Sql("""
                INSERT INTO [ArticleCategories] ([ArticleId], [Category])
                SELECT [Id], [DraftCategory]
                FROM [Articles]
                WHERE LEN(LTRIM(RTRIM([DraftCategory]))) > 0;
                """);
            migrationBuilder.Sql("""
                INSERT INTO [ArticleVersionCategories] ([ArticleVersionId], [Category])
                SELECT [Id], [Category]
                FROM [ArticleVersions]
                WHERE LEN(LTRIM(RTRIM([Category]))) > 0;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_ArticleCategories_ArticleId",
                table: "ArticleCategories",
                column: "ArticleId");

            migrationBuilder.CreateIndex(
                name: "IX_ArticleVersionCategories_ArticleVersionId",
                table: "ArticleVersionCategories",
                column: "ArticleVersionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ArticleCategories");

            migrationBuilder.DropTable(
                name: "ArticleVersionCategories");
        }
    }
}
