// Chức năng: kiểm duyệt nội dung và kết quả kiểm tra AI. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Enums;

namespace Application.Features.Moderation;

// CreateContentReportRequest: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record CreateContentReportRequest(ModeratedContentType TargetType, Guid TargetId,
    ContentReportReason Reason, string? Details);
