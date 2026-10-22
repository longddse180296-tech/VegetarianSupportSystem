using Domain.Enums;

namespace Application.Features.Moderation;

public sealed record ContentReportReceipt(Guid Id, ContentReportStatus Status);
