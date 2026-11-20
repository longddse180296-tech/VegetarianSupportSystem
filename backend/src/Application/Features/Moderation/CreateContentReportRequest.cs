// Nhận loại nội dung, mã nội dung, lý do và mô tả khi gửi báo cáo vi phạm.
using Domain.Enums;

namespace Application.Features.Moderation;

// CreateContentReportRequest: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record CreateContentReportRequest(ModeratedContentType TargetType, Guid TargetId,
    ContentReportReason Reason, string? Details);
