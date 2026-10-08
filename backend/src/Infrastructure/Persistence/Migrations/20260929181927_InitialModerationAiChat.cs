using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialModerationAiChat : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AiChatConversations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiChatConversations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ModerationSubmissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Version = table.Column<int>(type: "int", nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    OwnerUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    TextContent = table.Column<string>(type: "nvarchar(max)", maxLength: 50000, nullable: false),
                    MediaReference = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    AiFlagStatus = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    AdminReviewStatus = table.Column<string>(type: "nvarchar(24)", maxLength: 24, nullable: false),
                    AiSummary = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    AiCheckedScope = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    AiUncheckedScope = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    AiCheckedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    SubmittedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    IsCurrentPublished = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModerationSubmissions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AiChatMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ConversationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiChatMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AiChatMessages_AiChatConversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "AiChatConversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ModerationDecisions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SubmissionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Version = table.Column<int>(type: "int", nullable: false),
                    Decision = table.Column<string>(type: "nvarchar(24)", maxLength: 24, nullable: false),
                    AdminUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    DecidedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModerationDecisions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ModerationDecisions_ModerationSubmissions_SubmissionId",
                        column: x => x.SubmissionId,
                        principalTable: "ModerationSubmissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AiChatConversations_UserId_UpdatedAtUtc",
                table: "AiChatConversations",
                columns: new[] { "UserId", "UpdatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_AiChatMessages_ConversationId_CreatedAtUtc_Id",
                table: "AiChatMessages",
                columns: new[] { "ConversationId", "CreatedAtUtc", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_ModerationDecisions_SubmissionId_DecidedAt",
                table: "ModerationDecisions",
                columns: new[] { "SubmissionId", "DecidedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ModerationSubmissions_AdminReviewStatus_SubmittedAt",
                table: "ModerationSubmissions",
                columns: new[] { "AdminReviewStatus", "SubmittedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ModerationSubmissions_ContentId",
                table: "ModerationSubmissions",
                column: "ContentId",
                unique: true,
                filter: "[IsCurrentPublished] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_ModerationSubmissions_ContentId_Version",
                table: "ModerationSubmissions",
                columns: new[] { "ContentId", "Version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ModerationSubmissions_OwnerUserId_SubmittedAt",
                table: "ModerationSubmissions",
                columns: new[] { "OwnerUserId", "SubmittedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AiChatMessages");

            migrationBuilder.DropTable(
                name: "ModerationDecisions");

            migrationBuilder.DropTable(
                name: "AiChatConversations");

            migrationBuilder.DropTable(
                name: "ModerationSubmissions");
        }
    }
}
