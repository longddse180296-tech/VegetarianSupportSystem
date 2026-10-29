// Chức năng: ánh xạ/lưu phiên bản lược đồ EF Core; tệp sinh tự động.
using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddVideoMediaMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "VideoMediaMetadata",
                columns: table => new
                {
                    MediaKey = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    DurationSeconds = table.Column<double>(type: "float", nullable: true),
                    HasAudio = table.Column<bool>(type: "bit", nullable: true),
                    CheckedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VideoMediaMetadata", x => x.MediaKey);
                    table.CheckConstraint("CK_VideoMediaMetadata_Duration", "[DurationSeconds] IS NULL OR [DurationSeconds] > 0");
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VideoMediaMetadata");
        }
    }
}
