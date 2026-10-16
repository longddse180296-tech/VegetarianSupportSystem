using System;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261016143000_AddArticleDietaryTypes")]
    public partial class AddArticleDietaryTypes : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ArticleDietaryTypes",
                columns: table => new
                {
                    ArticleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DietaryType = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArticleDietaryTypes", x => new { x.ArticleId, x.DietaryType });
                    table.ForeignKey(
                        name: "FK_ArticleDietaryTypes_Articles_ArticleId",
                        column: x => x.ArticleId,
                        principalTable: "Articles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ArticleVersionDietaryTypes",
                columns: table => new
                {
                    ArticleVersionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DietaryType = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArticleVersionDietaryTypes", x => new { x.ArticleVersionId, x.DietaryType });
                    table.ForeignKey(
                        name: "FK_ArticleVersionDietaryTypes_ArticleVersions_ArticleVersionId",
                        column: x => x.ArticleVersionId,
                        principalTable: "ArticleVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "ArticleDietaryTypes");
            migrationBuilder.DropTable(name: "ArticleVersionDietaryTypes");
        }
    }
}
