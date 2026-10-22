using Domain.Entities;
using Domain.Enums;

namespace Application.Features.Moderation;

public sealed class ContentReportService(IContentReportRepository repository, TimeProvider clock)
{
    public async Task<ContentReportReceipt> CreateAsync(string reporterId, CreateContentReportRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(reporterId))
            throw new ModerationException(ModerationError.Forbidden, "Vui lòng đăng nhập để báo cáo.");
        var details = request.Details?.Trim();
        if (!Enum.IsDefined(request.TargetType) || request.TargetId == Guid.Empty || !Enum.IsDefined(request.Reason) ||
            details?.Length > 2000 || (request.Reason == ContentReportReason.Other && string.IsNullOrWhiteSpace(details)))
            throw new ModerationException(ModerationError.Validation, "Chọn lý do hợp lệ và nhập mô tả tối đa 2000 ký tự; lý do Khác cần có mô tả.");
        var content = await repository.GetPublicContentAsync(request.TargetType, request.TargetId, ct)
            ?? throw new ModerationException(ModerationError.NotFound, "Nội dung không tồn tại hoặc không còn công khai.");
        if (await repository.HasPendingAsync(reporterId, request.TargetType, request.TargetId, ct))
            throw new ModerationException(ModerationError.Conflict, "Bạn đã gửi báo cáo cho nội dung này và đang chờ Admin xem xét.");
        var report = new ContentReport
        {
            TargetType = request.TargetType, TargetId = request.TargetId, ReporterId = reporterId,
            SubmissionId = content.SubmissionId, ContentTitle = content.Title, ContentVersion = content.Version,
            Reason = request.Reason, Details = string.IsNullOrEmpty(details) ? null : details, CreatedAt = clock.GetUtcNow()
        };
        await repository.AddAsync(report, ct);
        return new ContentReportReceipt(report.Id, report.Status);
    }

    public Task<ContentReportPage> ListAsync(ContentReportStatus? status, ModeratedContentType? type,
        int page, int pageSize, CancellationToken ct)
    {
        if ((status.HasValue && !Enum.IsDefined(status.Value)) || (type.HasValue && !Enum.IsDefined(type.Value)) ||
            page < 1 || pageSize is < 1 or > 50 || (long)(page - 1) * pageSize > int.MaxValue)
            throw new ModerationException(ModerationError.Validation, "Bộ lọc hoặc phân trang không hợp lệ.");
        return repository.ListAsync(status, type, page, pageSize, ct);
    }

    public async Task ResolveAsync(Guid id, string adminId, ResolveContentReportRequest request, CancellationToken ct)
    {
        var report = await repository.GetAsync(id, ct)
            ?? throw new ModerationException(ModerationError.NotFound, "Không tìm thấy báo cáo.");
        try { report.Resolve(request.Status, adminId, request.Note ?? "", clock.GetUtcNow()); }
        catch (ArgumentException ex) { throw new ModerationException(ModerationError.Validation, ex.Message); }
        catch (InvalidOperationException ex) { throw new ModerationException(ModerationError.Conflict, ex.Message); }
        await repository.SaveAsync(ct);
    }

    public Task<IReadOnlyDictionary<(ModeratedContentType Type, Guid TargetId), int>> GetPendingCountsAsync(
        IReadOnlyCollection<Guid> targetIds, CancellationToken ct) => repository.GetPendingCountsAsync(targetIds, ct);
}
