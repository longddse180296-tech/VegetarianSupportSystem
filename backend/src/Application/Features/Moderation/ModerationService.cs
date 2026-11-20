// Quản lý các lần gửi duyệt, ghi kết quả AI và áp dụng quyết định của Admin đối với bài viết hoặc video.
using Domain.Entities;
using Domain.Enums;
using Application.Features.Favorites;
using Application.Features.Videos;

namespace Application.Features.Moderation;

// ModerationService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed class ModerationService(IModerationRepository repository, IVideoPublication videos,
    IFavoriteRepository? favorites = null)
{
    // GetAuthorNamesAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<IReadOnlyDictionary<string, string>> GetAuthorNamesAsync(IEnumerable<string> userIds, CancellationToken ct) =>
        repository.AuthorNamesAsync(userIds, ct);

    // SubmitFirstVideoAsync: Chuyển bản nội dung hợp lệ sang quy trình gửi duyệt.
    public async Task<ModerationSubmission> SubmitFirstVideoAsync(Guid videoId, string ownerUserId,
        string title, string description, string mediaKey, CancellationToken ct)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (await repository.GetLatestForContentAsync(videoId, ct) is not null)
            throw new ModerationException(ModerationError.Conflict, "Video này đã được gửi duyệt. Bạn có thể theo dõi trạng thái trong Video của tôi.");
        var submission = ModerationSubmission.Submit(videoId, 1, ModeratedContentType.Video,
            ownerUserId, title, description, mediaKey, DateTimeOffset.UtcNow);
        await repository.AddAsync(submission, ct);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveChangesAsync(ct);
        return submission;
    }
    // Tạo một lần gửi duyệt có số phiên bản. Áp dụng luồng kiểm tra phù hợp với bài viết hoặc video.
    public async Task<ModerationSubmission> SubmitAsync(
        string ownerUserId,
        SubmitModerationCommand command,
        CancellationToken cancellationToken)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(ownerUserId) || ownerUserId.Length > 450)
            throw new ModerationException(ModerationError.Forbidden, "Vui lòng đăng nhập để tiếp tục.");

        if (!Enum.IsDefined(command.ContentType)
            || string.IsNullOrWhiteSpace(command.Title)
            || command.Title.Length > 200
            || string.IsNullOrWhiteSpace(command.TextContent)
            || command.TextContent.Length > 50_000
            || command.MediaReference?.Length > 2_000)
        {
            throw new ModerationException(ModerationError.Validation, "Vui lòng nhập loại nội dung, tiêu đề và nội dung theo giới hạn hiển thị trên biểu mẫu.");
        }

        if (command.ContentType == ModeratedContentType.Video
            && string.IsNullOrWhiteSpace(command.MediaReference))
        {
            throw new ModerationException(ModerationError.Validation, "Vui lòng tải video lên thành công trước khi gửi duyệt.");
        }

        Guid contentId;
        int version;
        if (command.ContentId is { } existingId)
        {
            if (existingId == Guid.Empty)
                throw new ModerationException(ModerationError.Validation, "Vui lòng chọn nội dung cần thao tác.");

            var latest = await repository.GetLatestForContentAsync(existingId, cancellationToken)
                ?? throw new ModerationException(ModerationError.NotFound, "Không tìm thấy nội dung hoặc nội dung không còn khả dụng.");

            if (latest.OwnerUserId != ownerUserId)
                throw new ModerationException(ModerationError.Forbidden, "Bạn chỉ có thể quản lý nội dung của mình.");

            if (latest.ContentType != command.ContentType)
                throw new ModerationException(ModerationError.Validation, "Không thể đổi loại nội dung giữa các phiên bản.");

            if (latest.AdminReviewStatus is AdminReviewStatus.Rejected or AdminReviewStatus.RevisionRequested or AdminReviewStatus.Removed)
            {
                throw new ModerationException(ModerationError.Conflict, "Nội dung đã bị từ chối hoặc gỡ, chỉ được xem và không thể gửi lại.");
            }
            latest.WithdrawPendingForEdit(DateTimeOffset.UtcNow);

            contentId = existingId;
            version = checked(latest.Version + 1);
        }
        else
        {
            contentId = Guid.NewGuid();
            version = 1;
        }

        var submission = ModerationSubmission.Submit(
            contentId,
            version,
            command.ContentType,
            ownerUserId,
            command.Title,
            command.TextContent,
            command.MediaReference,
            DateTimeOffset.UtcNow);

        await repository.AddAsync(submission, cancellationToken);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveChangesAsync(cancellationToken);
        return submission;
    }

    // GetOwnedAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<ModerationSubmission> GetOwnedAsync(
        Guid submissionId,
        string ownerUserId,
        CancellationToken cancellationToken)
    {
        var submission = await repository.GetByIdAsync(submissionId, cancellationToken)
            ?? throw new ModerationException(ModerationError.NotFound, "Không tìm thấy bản nội dung đã gửi hoặc bạn không có quyền xem.");

        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (submission.OwnerUserId != ownerUserId)
            throw new ModerationException(ModerationError.NotFound, "Không tìm thấy bản nội dung đã gửi hoặc bạn không có quyền xem.");

        return submission;
    }

    // GetOwnedPageAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<ModerationPage> GetOwnedPageAsync(
        string ownerUserId,
        ModeratedContentType? contentType,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(ownerUserId) || ownerUserId.Length > 450)
            throw new ModerationException(ModerationError.Forbidden, "Vui lòng đăng nhập để tiếp tục.");

        ValidatePage(page, pageSize);
        if (contentType is { } type && !Enum.IsDefined(type))
            throw new ModerationException(ModerationError.Validation, "Loại nội dung chưa hợp lệ. Vui lòng chọn lại.");
        return repository.SearchAsync(
            new ModerationSearch(ownerUserId, contentType, null, null, page, pageSize),
            cancellationToken);
    }

    // Admin yêu cầu worker kiểm tra lại đúng phiên bản mới nhất, chưa có quyết định duyệt.
    public async Task<ModerationSubmission> RetryAiForAdminAsync(Guid id, CancellationToken cancellationToken)
    {
        var submission = await GetForAdminAsync(id, cancellationToken);
        return await RetryAiAsync(id, submission.OwnerUserId, cancellationToken, allowCompleted: true);
    }
    // Đưa bài viết đủ điều kiện trở lại bước kiểm tra sau khi AI gặp lỗi.
    public async Task<ModerationSubmission> RetryAiAsync(
        Guid submissionId,
        string ownerUserId,
        CancellationToken cancellationToken, bool allowCompleted = false)
    {
        var submission = await GetOwnedAsync(submissionId, ownerUserId, cancellationToken);
        var latest = await repository.GetLatestForContentAsync(submission.ContentId, cancellationToken);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (latest?.Id != submission.Id)
            throw new ModerationException(ModerationError.Conflict, "Hệ thống chỉ có thể kiểm tra lại phiên bản mới nhất.");

        try
        {
            submission.RetryAiCheck(DateTimeOffset.UtcNow, allowCompleted);
        }
        catch (InvalidOperationException ex)
        {
            throw new ModerationException(ModerationError.Conflict, ex.Message);
        }

        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveChangesAsync(cancellationToken);
        return submission;
    }

    // Called by a trusted backend AI worker after it has performed a real check.
    // It is intentionally not exposed as an HTTP endpoint.
    // RecordAiResultAsync: Ghi kết quả AI độc lập với quyết định xuất bản của Admin.
    // BE2-10 | Ghi cờ, lý do và phạm vi kiểm tra AI độc lập với quyết định duyệt của Admin.
    // Ghi kết quả kiểm tra tự động và đưa hồ sơ sang trạng thái tiếp theo theo quy tắc duyệt.
    public async Task<ModerationSubmission> RecordAiResultAsync(
        Guid submissionId,
        ModerationAiResult result,
        CancellationToken cancellationToken)
    {
        var submission = await repository.GetByIdAsync(submissionId, cancellationToken)
            ?? throw new ModerationException(ModerationError.NotFound, "Không tìm thấy bản nội dung đã gửi hoặc bạn không có quyền xem.");

        var latest = await repository.GetLatestForContentAsync(submission.ContentId, cancellationToken);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (latest?.Id != submission.Id)
            throw new ModerationException(ModerationError.Conflict, "Kết quả kiểm tra của Hệ thống thuộc phiên bản cũ. Vui lòng tải lại bản mới nhất.");

        try
        {
            submission.RecordAiResult(
                result.Status,
                result.Summary,
                result.CheckedScope,
                result.UncheckedScope,
                DateTimeOffset.UtcNow,
                result.FlagReason,
                result.FlagType,
                result.Priority,
                result.Evidence);
        }
        catch (ArgumentException ex)
        {
            throw new ModerationException(ModerationError.Validation, ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            throw new ModerationException(ModerationError.Conflict, ex.Message);
        }

        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveChangesAsync(cancellationToken);
        return submission;
    }

    // GetForAdminAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<ModerationSubmission> GetForAdminAsync(
        Guid submissionId,
        CancellationToken cancellationToken)
    {
        return await repository.GetByIdAsync(submissionId, cancellationToken)
            ?? throw new ModerationException(ModerationError.NotFound, "Không tìm thấy bản nội dung đã gửi hoặc bạn không có quyền xem.");
    }

    // GetAdminPageAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<ModerationPage> GetAdminPageAsync(
        ModeratedContentType? contentType,
        AiFlagStatus? aiStatus,
        AdminReviewStatus? adminStatus,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        ValidatePage(page, pageSize);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if ((contentType is { } type && !Enum.IsDefined(type))
            || (aiStatus is { } ai && !Enum.IsDefined(ai))
            || (adminStatus is { } admin && !Enum.IsDefined(admin)))
        {
            throw new ModerationException(ModerationError.Validation, "Invalid moderation filter.");
        }

        return repository.SearchAsync(
            new ModerationSearch(null, contentType, aiStatus, adminStatus, page, pageSize),
            cancellationToken);
    }

    // Ghi quyết định của Admin và đồng bộ bản đang công khai hoặc việc gỡ nội dung.
    public async Task<ModerationSubmission> DecideAsync(
        Guid submissionId,
        ModerationDecisionType decision,
        string adminUserId,
        string? reason,
        CancellationToken cancellationToken)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(adminUserId) || adminUserId.Length > 450)
            throw new ModerationException(ModerationError.Forbidden, "Thao tác này cần tài khoản Quản trị viên.");

        if (!Enum.IsDefined(decision) || reason?.Length > 2_000)
            throw new ModerationException(ModerationError.Validation, "Vui lòng chọn kết quả xử lý hợp lệ.");
        // Không yêu cầu Admin nhập phản hồi; vẫn ghi mô tả quyết định để giữ lịch sử xử lý nhất quán.
        reason = string.IsNullOrWhiteSpace(reason) ? decision switch
        {
            ModerationDecisionType.Approve => "Đã được chấp nhận",
            ModerationDecisionType.Reject => "Đã bị từ chối",
            ModerationDecisionType.RequestRevision => "Yêu cầu chỉnh sửa",
            _ => "Đã gỡ nội dung"
        } : reason.Trim();

        var submission = await repository.GetByIdAsync(submissionId, cancellationToken)
            ?? throw new ModerationException(ModerationError.NotFound, "Không tìm thấy bản nội dung đã gửi hoặc bạn không có quyền xem.");

        if (decision == ModerationDecisionType.Approve)
        {
            var latest = await repository.GetLatestForContentAsync(submission.ContentId, cancellationToken);
            if (latest?.Id != submission.Id)
                throw new ModerationException(ModerationError.Conflict, "Chỉ có thể duyệt phiên bản mới nhất. Vui lòng tải lại nội dung.");
            var readyForAdmin = submission.ContentType == ModeratedContentType.Video
                ? submission.AiFlagStatus == AiFlagStatus.NotSubmitted
                : submission.AiFlagStatus is AiFlagStatus.Passed or AiFlagStatus.Flagged or AiFlagStatus.Partial or AiFlagStatus.Failed;
            if (submission.AdminReviewStatus != AdminReviewStatus.PendingAdminReview
                || !readyForAdmin)
            {
                throw new ModerationException(ModerationError.Conflict, "Nội dung chưa ở trạng thái có thể xử lý. Vui lòng tải lại để kiểm tra.");
            }

            await repository.ExecuteInTransactionAsync(async ct =>
            {
                var previous = await repository.GetCurrentPublishedAsync(submission.ContentId, ct);
                if (previous is not null && previous.Id != submission.Id)
                {
                    previous.SupersedePublishedVersion(DateTimeOffset.UtcNow);
                    await repository.SaveChangesAsync(ct);
                }

                submission.Decide(decision, adminUserId, reason, DateTimeOffset.UtcNow);
                await repository.SaveChangesAsync(ct);
                if (submission.ContentType == ModeratedContentType.Video)
                    await videos.ApplyDecisionAsync(submission.ContentId, submission.Id, true, ct);
            }, cancellationToken);
        }
        else
        {
            try
            {
                submission.Decide(decision, adminUserId, reason, DateTimeOffset.UtcNow);
            }
            catch (InvalidOperationException ex)
            {
                throw new ModerationException(ModerationError.Conflict, ex.Message);
            }

            if (decision == ModerationDecisionType.Remove)
                favorites?.RemoveAllByTarget(ToFavoriteTargetType(submission.ContentType), submission.ContentId);

            if (decision == ModerationDecisionType.Remove && submission.ContentType == ModeratedContentType.Video)
            {
                await repository.ExecuteInTransactionAsync(async ct =>
                {
                    await repository.SaveChangesAsync(ct);
                    await videos.ApplyDecisionAsync(submission.ContentId, submission.Id, false, ct);
                }, cancellationToken);
            }
            else await repository.SaveChangesAsync(cancellationToken);
        }
        return submission;
    }

    // ToFavoriteTargetType: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static FavoriteTargetType ToFavoriteTargetType(ModeratedContentType contentType) => contentType switch
    {
        ModeratedContentType.Article => FavoriteTargetType.Article,
        ModeratedContentType.Video => FavoriteTargetType.Video,
        _ => throw new ArgumentOutOfRangeException(nameof(contentType), contentType, "Unsupported favorite target.")
    };

    // ValidatePage: Kiểm tra dữ liệu và điều kiện nghiệp vụ; dừng xử lý khi không hợp lệ.
    private static void ValidatePage(int page, int pageSize)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (page < 1 || pageSize is < 1 or > 100
            || (long)(page - 1) * pageSize > int.MaxValue)
            throw new ModerationException(ModerationError.Validation, "Trang phải từ 1 trở lên và số mục mỗi trang phải từ 1 đến 100.");
    }
}
