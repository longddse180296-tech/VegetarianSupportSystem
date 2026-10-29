// Lịch sử cơ sở dữ liệu do EF Core sinh; giữ cấu trúc nâng cấp/hạ cấp và không chỉnh tay phần ánh xạ tự sinh.
// Chức năng: bài viết và phiên bản gửi duyệt. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
﻿using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FailedArticleAdminReview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE submission
                SET [AdminReviewStatus] = N'PendingAdminReview',
                    [UpdatedAtUtc] = SYSDATETIMEOFFSET()
                FROM [ModerationSubmissions] AS submission
                WHERE submission.[ContentType] = N'Article'
                  AND submission.[AiFlagStatus] = N'Failed'
                  AND submission.[AdminReviewStatus] = N'Submitted'
                  AND NOT EXISTS (
                      SELECT 1
                      FROM [ModerationSubmissions] AS newer
                      WHERE newer.[ContentId] = submission.[ContentId]
                        AND newer.[Version] > submission.[Version]
                  );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // A decision may already have been made after a submission entered the queue.
            // Reverting the policy cannot safely restore its earlier review state.
        }
    }
}
