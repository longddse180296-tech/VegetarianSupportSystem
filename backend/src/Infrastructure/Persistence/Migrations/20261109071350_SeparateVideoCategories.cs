using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SeparateVideoCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Categories_ForArticles_Name",
                table: "Categories");

            migrationBuilder.AddColumn<int>(
                name: "Kind",
                table: "Categories",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql("""
                UPDATE [Categories] SET [Kind] = 1 WHERE [ForArticles] = 1;

                INSERT INTO [Categories] ([Id], [Name], [Description], [IsActive], [CreatedAt], [UpdatedAt], [Kind], [ForArticles])
                SELECT NEWID(), [Name], [Description], [IsActive], [CreatedAt], [UpdatedAt], 2, 0
                FROM [Categories] WHERE [Kind] = 0;

                UPDATE video SET [CategoryId] = separate.[Id]
                FROM [Videos] video
                JOIN [Categories] shared ON shared.[Id] = video.[CategoryId] AND shared.[Kind] = 0
                JOIN [Categories] separate ON separate.[Name] = shared.[Name] AND separate.[Kind] = 2;

                UPDATE video SET [PublishedCategoryId] = separate.[Id]
                FROM [Videos] video
                JOIN [Categories] shared ON shared.[Id] = video.[PublishedCategoryId] AND shared.[Kind] = 0
                JOIN [Categories] separate ON separate.[Name] = shared.[Name] AND separate.[Kind] = 2;
                """);

            migrationBuilder.DropColumn(
                name: "ForArticles",
                table: "Categories");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Kind_Name",
                table: "Categories",
                columns: new[] { "Kind", "Name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Categories_Kind_Name",
                table: "Categories");

            migrationBuilder.AddColumn<bool>(
                name: "ForArticles",
                table: "Categories",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql("""
                UPDATE [Categories] SET [ForArticles] = 1 WHERE [Kind] = 1;

                UPDATE video SET [CategoryId] = shared.[Id]
                FROM [Videos] video
                JOIN [Categories] separate ON separate.[Id] = video.[CategoryId] AND separate.[Kind] = 2
                JOIN [Categories] shared ON shared.[Name] = separate.[Name] AND shared.[Kind] = 0;

                UPDATE video SET [PublishedCategoryId] = shared.[Id]
                FROM [Videos] video
                JOIN [Categories] separate ON separate.[Id] = video.[PublishedCategoryId] AND separate.[Kind] = 2
                JOIN [Categories] shared ON shared.[Name] = separate.[Name] AND shared.[Kind] = 0;

                DELETE separate
                FROM [Categories] separate
                JOIN [Categories] shared ON shared.[Name] = separate.[Name] AND shared.[Kind] = 0
                WHERE separate.[Kind] = 2;
                """);

            migrationBuilder.DropColumn(
                name: "Kind",
                table: "Categories");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_ForArticles_Name",
                table: "Categories",
                columns: new[] { "ForArticles", "Name" },
                unique: true);
        }
    }
}
