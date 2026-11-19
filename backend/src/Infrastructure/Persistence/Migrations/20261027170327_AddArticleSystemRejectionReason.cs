// Bổ sung lý do hệ thống tự từ chối bài viết để hiển thị trong lịch sử duyệt.
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable
// Bổ sung nơi lưu lý do từ chối ở bước tiền kiểm tiêu đề, tách khỏi kết quả AI và quyết định Admin.

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddArticleSystemRejectionReason : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SystemRejectionReason",
                table: "ModerationSubmissions",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SystemRejectionReason",
                table: "ModerationSubmissions");
        }
    }
}
