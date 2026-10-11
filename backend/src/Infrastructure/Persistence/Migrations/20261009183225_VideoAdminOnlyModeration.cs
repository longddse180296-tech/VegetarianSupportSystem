using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class VideoAdminOnlyModeration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE [ModerationSubmissions]
                SET [AiFlagStatus] = N'NotSubmitted',
                    [AdminReviewStatus] = CASE
                        WHEN [AdminReviewStatus] = N'Submitted' THEN N'PendingAdminReview'
                        ELSE [AdminReviewStatus]
                    END,
                    [AiSummary] = NULL,
                    [AiFlagReason] = NULL,
                    [AiFlagType] = NULL,
                    [AiPriority] = NULL,
                    [AiEvidence] = NULL,
                    [AiCheckedScope] = NULL,
                    [AiUncheckedScope] = NULL,
                    [AiCheckedAt] = NULL,
                    [UpdatedAtUtc] = SYSDATETIMEOFFSET()
                WHERE [ContentType] = N'Video';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Prior AI results cannot be reconstructed after the one-way policy change.
        }
    }
}
