// Lịch sử cơ sở dữ liệu do EF Core sinh; giữ cấu trúc nâng cấp/hạ cấp và không chỉnh tay phần ánh xạ tự sinh.
// Chức năng: video, bản nháp và nội dung công khai. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
﻿using Microsoft.EntityFrameworkCore.Migrations;

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
