// Chức năng: kiểm duyệt nội dung và kết quả kiểm tra AI. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
using Domain.Enums;

namespace Domain.Entities;

// ModerationSubmission: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class ModerationSubmission
{
    private ModerationSubmission() { }

    private ModerationSubmission(
        Guid contentId,
        int version,
        ModeratedContentType contentType,
        string ownerUserId,
        string title,
        string textContent,
        string? mediaReference,
        DateTimeOffset submittedAt)
    {
        Id = Guid.NewGuid();
        ContentId = contentId;
        Version = version;
        ContentType = contentType;
        OwnerUserId = ownerUserId;
        Title = title;
        TextContent = textContent;
        MediaReference = mediaReference;
        SubmittedAt = submittedAt;
        CreatedAtUtc = submittedAt;
        UpdatedAtUtc = submittedAt;
        AiFlagStatus = contentType == ModeratedContentType.Video
            ? AiFlagStatus.NotSubmitted : AiFlagStatus.Checking;
        AdminReviewStatus = contentType == ModeratedContentType.Video
            ? AdminReviewStatus.PendingAdminReview : AdminReviewStatus.Submitted;
    }

    public Guid Id { get; private set; }
    public Guid ContentId { get; private set; }
    public int Version { get; private set; }
    public ModeratedContentType ContentType { get; private set; }
    public string OwnerUserId { get; private set; } = string.Empty;
    public string Title { get; private set; } = string.Empty;
    public string TextContent { get; private set; } = string.Empty;
    public string? MediaReference { get; private set; }
    public AiFlagStatus AiFlagStatus { get; private set; }
    public AdminReviewStatus AdminReviewStatus { get; private set; }
    public string? AiSummary { get; private set; }
    public string? SystemRejectionReason { get; private set; }
    public string? AiFlagReason { get; private set; }
    public string? AiFlagType { get; private set; }
    public string? AiPriority { get; private set; }
    public string? AiEvidence { get; private set; }
    public string? AiCheckedScope { get; private set; }
    public string? AiUncheckedScope { get; private set; }
    public DateTimeOffset? AiCheckedAt { get; private set; }
    public DateTimeOffset SubmittedAt { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public DateTimeOffset UpdatedAtUtc { get; private set; }
    public bool IsCurrentPublished { get; private set; }
    public byte[] RowVersion { get; private set; } = [];
    public ICollection<ModerationDecision> Decisions { get; private set; } = new List<ModerationDecision>();

    // Submit: Chuyển bản nội dung hợp lệ sang quy trình gửi duyệt.
    public static ModerationSubmission Submit(
        Guid contentId,
        int version,
        ModeratedContentType contentType,
        string ownerUserId,
        string title,
        string textContent,
        string? mediaReference,
        DateTimeOffset submittedAt)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (contentId == Guid.Empty || version < 1 || string.IsNullOrWhiteSpace(ownerUserId)
            || string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(textContent)
            || !Enum.IsDefined(contentType))
        {
            throw new ArgumentException("Thông tin nội dung gửi duyệt chưa hợp lệ. Vui lòng kiểm tra lại.");
        }

        return new ModerationSubmission(
            contentId, version, contentType, ownerUserId.Trim(), title.Trim(),
            textContent.Trim(), mediaReference?.Trim(), submittedAt);
    }

    // Từ chối ở bước tiền kiểm tiêu đề, không giả kết quả AI hoặc quyết định của một Admin.
    public void RejectDuplicateTitle(string reason, DateTimeOffset now)
    {
        if (ContentType != ModeratedContentType.Article || AiFlagStatus != AiFlagStatus.Checking
            || AdminReviewStatus != AdminReviewStatus.Submitted)
            throw new InvalidOperationException("Chỉ tiền kiểm bản bài viết vừa gửi.");
        if (string.IsNullOrWhiteSpace(reason) || reason.Length > 2000)
            throw new ArgumentException("Cần lý do từ chối hợp lệ.", nameof(reason));
        SystemRejectionReason = reason.Trim();
        AiFlagStatus = AiFlagStatus.NotSubmitted;
        AdminReviewStatus = AdminReviewStatus.Rejected;
        UpdatedAtUtc = now;
    }

    // RecordAiResult: Ghi kết quả AI độc lập với quyết định xuất bản của Admin.
    public void RecordAiResult(
        AiFlagStatus status,
        string summary,
        string? checkedScope,
        string? uncheckedScope,
        DateTimeOffset checkedAt,
        string? flagReason = null,
        string? flagType = null,
        string? priority = null,
        string? evidence = null)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (ContentType == ModeratedContentType.Video)
            throw new InvalidOperationException("Video do Quản trị viên xem trực tiếp và quyết định, không qua kiểm tra tự động.");

        if (AiFlagStatus != AiFlagStatus.Checking)
            throw new InvalidOperationException("Chỉ có thể ghi kết quả khi Hệ thống đang kiểm tra nội dung.");

        if (status is not (AiFlagStatus.Passed or AiFlagStatus.Flagged or AiFlagStatus.Partial or AiFlagStatus.Failed))
            throw new ArgumentException("Kết quả kiểm tra của Hệ thống chưa hợp lệ.", nameof(status));

        if (string.IsNullOrWhiteSpace(summary) || summary.Length > 2_000)
            throw new ArgumentException("Cần có tóm tắt kết quả kiểm tra, tối đa 2.000 ký tự.", nameof(summary));

        if (checkedScope?.Length > 2_000 || uncheckedScope?.Length > 2_000)
            throw new ArgumentException("Mô tả phạm vi kiểm tra không được vượt quá 2.000 ký tự.");

        if (flagReason?.Length > 2_000)
            throw new ArgumentException("Lý do cảnh báo không được vượt quá 2.000 ký tự.", nameof(flagReason));
        if (flagType?.Length > 100 || priority?.Length > 20 || evidence?.Length > 2_000)
            throw new ArgumentException("Thông tin cảnh báo vượt quá giới hạn cho phép.");

        if (status == AiFlagStatus.Flagged && string.IsNullOrWhiteSpace(flagReason))
            throw new ArgumentException("Kết quả có cảnh báo cần nêu rõ lý do.", nameof(flagReason));

        if (status is (AiFlagStatus.Passed or AiFlagStatus.Failed)
            && !string.IsNullOrWhiteSpace(flagReason))
            throw new ArgumentException("Lý do cảnh báo chỉ áp dụng khi phát hiện vấn đề hoặc chưa kiểm tra đầy đủ.", nameof(flagReason));

        if (status != AiFlagStatus.Failed && string.IsNullOrWhiteSpace(checkedScope))
            throw new ArgumentException("Cần ghi rõ phạm vi đã được Hệ thống kiểm tra.", nameof(checkedScope));

        if (status == AiFlagStatus.Partial && string.IsNullOrWhiteSpace(uncheckedScope))
            throw new ArgumentException("Kết quả kiểm tra một phần cần nêu rõ phạm vi chưa được kiểm tra.", nameof(uncheckedScope));

        if (status is (AiFlagStatus.Passed or AiFlagStatus.Flagged)
            && !string.IsNullOrWhiteSpace(uncheckedScope))
            throw new ArgumentException("Cần ghi nhận kiểm tra một phần khi còn phạm vi chưa được kiểm tra.", nameof(uncheckedScope));

        AiFlagStatus = status;
        AiSummary = summary.Trim();
        AiFlagReason = string.IsNullOrWhiteSpace(flagReason) ? null : flagReason.Trim();
        AiFlagType = string.IsNullOrWhiteSpace(flagType) ? null : flagType.Trim();
        AiPriority = string.IsNullOrWhiteSpace(priority) ? null : priority.Trim();
        AiEvidence = string.IsNullOrWhiteSpace(evidence) ? null : evidence.Trim();
        AiCheckedScope = checkedScope?.Trim();
        AiUncheckedScope = uncheckedScope?.Trim();
        AiCheckedAt = checkedAt;
        UpdatedAtUtc = checkedAt;

        AdminReviewStatus = AdminReviewStatus.PendingAdminReview;
    }

    // RetryAiCheck: Thử lại thao tác khi trạng thái hiện tại cho phép.
    public void RetryAiCheck(DateTimeOffset retriedAt)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (ContentType == ModeratedContentType.Video)
            throw new InvalidOperationException("Video không thuộc luồng kiểm tra tự động; Quản trị viên sẽ xem trực tiếp.");

        if (AiFlagStatus != AiFlagStatus.Failed || AdminReviewStatus != AdminReviewStatus.Submitted)
            throw new InvalidOperationException("Hệ thống chưa thể kiểm tra lại bản này. Vui lòng xem trạng thái kiểm duyệt hiện tại.");

        AiFlagStatus = AiFlagStatus.Checking;
        AiSummary = null;
        AiFlagReason = null;
        AiFlagType = null;
        AiPriority = null;
        AiEvidence = null;
        AiCheckedScope = null;
        AiUncheckedScope = null;
        AiCheckedAt = null;
        UpdatedAtUtc = retriedAt;
    }

    // Decide: Áp dụng quyết định Admin lên đúng phiên bản và ghi lại lịch sử xử lý.
    public ModerationDecision Decide(
        ModerationDecisionType decision,
        string adminUserId,
        string reason,
        DateTimeOffset decidedAt)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(adminUserId) || string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Cần xác định Quản trị viên thực hiện và nhập lý do quyết định.");

        if (decision == ModerationDecisionType.Remove)
        {
            if (AdminReviewStatus != AdminReviewStatus.Published || !IsCurrentPublished)
                throw new InvalidOperationException("Chỉ có thể gỡ phiên bản đang được hiển thị công khai.");

            AdminReviewStatus = AdminReviewStatus.Removed;
            IsCurrentPublished = false;
        }
        else
        {
            var readyForAdmin = ContentType == ModeratedContentType.Video
                ? AiFlagStatus == AiFlagStatus.NotSubmitted
                : AiFlagStatus is AiFlagStatus.Passed or AiFlagStatus.Flagged or AiFlagStatus.Partial or AiFlagStatus.Failed;
            if (AdminReviewStatus != AdminReviewStatus.PendingAdminReview
                || !readyForAdmin)
            {
                throw new InvalidOperationException("Nội dung chưa ở trạng thái có thể xử lý. Vui lòng tải lại để kiểm tra.");
            }

            AdminReviewStatus = decision switch
            {
                ModerationDecisionType.Approve => AdminReviewStatus.Published,
                ModerationDecisionType.RequestRevision => AdminReviewStatus.RevisionRequested,
                ModerationDecisionType.Reject => AdminReviewStatus.Rejected,
                _ => throw new ArgumentOutOfRangeException(nameof(decision))
            };

            IsCurrentPublished = decision == ModerationDecisionType.Approve;
        }

        UpdatedAtUtc = decidedAt;

        var record = new ModerationDecision(
            Id, Version, decision, adminUserId.Trim(), reason.Trim(), decidedAt);
        Decisions.Add(record);
        return record;
    }

    // SupersedePublishedVersion: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public void SupersedePublishedVersion(DateTimeOffset supersededAt)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (AdminReviewStatus != AdminReviewStatus.Published || !IsCurrentPublished)
            throw new InvalidOperationException("Chỉ có thể thay thế phiên bản đang được công khai.");

        IsCurrentPublished = false;
        UpdatedAtUtc = supersededAt;
    }
}
