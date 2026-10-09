using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Be3ModerationEvidence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AiEvidence",
                table: "ModerationSubmissions",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AiFlagType",
                table: "ModerationSubmissions",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AiPriority",
                table: "ModerationSubmissions",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AiEvidence",
                table: "ModerationSubmissions");

            migrationBuilder.DropColumn(
                name: "AiFlagType",
                table: "ModerationSubmissions");

            migrationBuilder.DropColumn(
                name: "AiPriority",
                table: "ModerationSubmissions");
        }
    }
}
