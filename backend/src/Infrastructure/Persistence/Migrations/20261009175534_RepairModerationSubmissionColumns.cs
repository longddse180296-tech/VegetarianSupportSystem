using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RepairModerationSubmissionColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // These properties were already in the model snapshot but never appeared in
            // the original CREATE TABLE migration. Existing submissions need timestamps.
            migrationBuilder.AddColumn<string>(
                name: "AiFlagReason",
                table: "ModerationSubmissions",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "CreatedAtUtc",
                table: "ModerationSubmissions",
                type: "datetimeoffset",
                nullable: false,
                defaultValueSql: "SYSDATETIMEOFFSET()");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "UpdatedAtUtc",
                table: "ModerationSubmissions",
                type: "datetimeoffset",
                nullable: false,
                defaultValueSql: "SYSDATETIMEOFFSET()");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "AiFlagReason", table: "ModerationSubmissions");
            migrationBuilder.DropColumn(name: "CreatedAtUtc", table: "ModerationSubmissions");
            migrationBuilder.DropColumn(name: "UpdatedAtUtc", table: "ModerationSubmissions");
        }
    }
}
