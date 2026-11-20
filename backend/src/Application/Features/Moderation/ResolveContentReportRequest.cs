// Nhận quyết định xử lý cùng lý do Admin nhập cho báo cáo vi phạm.
using Domain.Enums;

namespace Application.Features.Moderation;

// ResolveContentReportRequest: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ResolveContentReportRequest(ContentReportStatus Status, string? Note);
