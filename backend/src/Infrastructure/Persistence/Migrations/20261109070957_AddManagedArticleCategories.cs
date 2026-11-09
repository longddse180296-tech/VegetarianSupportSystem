using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddManagedArticleCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Categories_Name",
                table: "Categories");

            migrationBuilder.AddColumn<bool>(
                name: "ForArticles",
                table: "Categories",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Categories_ForArticles_Name",
                table: "Categories",
                columns: new[] { "ForArticles", "Name" },
                unique: true);

            // Move the editor's built-in choices and previously used labels into the managed catalog.
            migrationBuilder.Sql("""
                WITH Labels AS (
                    SELECT [Name] COLLATE Latin1_General_100_CI_AS AS [Name]
                    FROM (VALUES (N'Dinh dưỡng'), (N'Sức khỏe'), (N'Ẩm thực'), (N'Lối sống'),
                        (N'Mẹo vặt'), (N'Thể thao'), (N'Kiến thức'), (N'Kinh nghiệm')) AS defaults([Name])
                    UNION
                    SELECT LTRIM(RTRIM([Category])) COLLATE Latin1_General_100_CI_AS FROM [ArticleCategories]
                    UNION
                    SELECT LTRIM(RTRIM([Category])) COLLATE Latin1_General_100_CI_AS FROM [ArticleVersionCategories]
                )
                INSERT INTO [Categories] ([Id], [Name], [ForArticles], [IsActive], [CreatedAt])
                SELECT NEWID(), [Name], 1, 1, SYSDATETIMEOFFSET() FROM Labels WHERE [Name] <> N'';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM [Categories] WHERE [ForArticles] = 1;");

            migrationBuilder.DropIndex(
                name: "IX_Categories_ForArticles_Name",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "ForArticles",
                table: "Categories");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Name",
                table: "Categories",
                column: "Name",
                unique: true);
        }
    }
}
