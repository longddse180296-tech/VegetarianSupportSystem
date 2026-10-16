using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FeaturedContentPins : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FeaturedContent",
                columns: table => new
                {
                    ContentType = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    ContentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PinnedByUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    PinnedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeaturedContent", x => new { x.ContentType, x.ContentId });
                });

            migrationBuilder.CreateIndex(
                name: "IX_FeaturedContent_ContentType_PinnedAt",
                table: "FeaturedContent",
                columns: new[] { "ContentType", "PinnedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FeaturedContent");
        }
    }
}
