// Trả mã và trạng thái của báo cáo vừa được tiếp nhận.
using Domain.Enums;

namespace Application.Features.Moderation;

// ContentReportReceipt: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ContentReportReceipt(Guid Id, ContentReportStatus Status);
