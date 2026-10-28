// Chức năng: bình luận và tương tác cộng đồng. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Entities;
using Domain.Enums;

namespace Application.Features.Comments;

// CommentService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed class CommentService(ICommentRepository repository, TimeProvider clock)
{
    // ListPublicAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<CommentPage> ListPublicAsync(CommentQuery query, CancellationToken ct)
    {
        ValidatePage(query);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (query.TargetType is not { } type || query.TargetId is not { } id ||
            !Enum.IsDefined(type) || id == Guid.Empty)
            throw new CommentException(CommentError.Validation, "Vui lòng chọn đúng bài viết hoặc video cần xem bình luận.");
        await RequirePublicTarget(type, id, ct);
        return await Page(query, null, false, false, ct);
    }

    // ListMineAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<CommentPage> ListMineAsync(string userId, CommentQuery query, CancellationToken ct)
    {
        ValidatePage(query);
        return await Page(query, userId, false, true, ct);
    }

    // GetPublicAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<CommentResponse> GetPublicAsync(Guid id, CancellationToken ct)
    {
        var comment = await repository.GetAsync(id, ct) ?? throw NotFound();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (comment.Status != CommentStatus.Visible) throw NotFound();
        await RequirePublicTarget(comment.TargetType, comment.TargetId, ct);
        return await Map(comment, false, ct);
    }

    // ListAdminAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<CommentPage> ListAdminAsync(CommentQuery query, CancellationToken ct)
    {
        ValidatePage(query);
        return await Page(query, null, true, true, ct);
    }

    // GetAdminAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<CommentResponse> GetAdminAsync(Guid id, CancellationToken ct)
    {
        var comment = await repository.GetAsync(id, ct) ?? throw NotFound();
        return await Map(comment, true, ct);
    }

    // CreateAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<CommentResponse> CreateAsync(string userId, CreateCommentRequest request, CancellationToken ct)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (!Enum.IsDefined(request.TargetType) || request.TargetId == Guid.Empty)
            throw new CommentException(CommentError.Validation, "Nội dung cần bình luận chưa hợp lệ. Vui lòng tải lại trang.");
        await RequirePublicTarget(request.TargetType, request.TargetId, ct);
        if (request.ParentId is { } parentId)
        {
            var parent = await repository.GetAsync(parentId, ct) ?? throw NotFound();
            if (parent.TargetType != request.TargetType || parent.TargetId != request.TargetId ||
                parent.Status != CommentStatus.Visible || parent.ParentId is not null)
                throw new CommentException(CommentError.Validation, "Bình luận bạn đang trả lời không còn khả dụng. Vui lòng tải lại danh sách bình luận.");
        }
        Comment comment;
        try { comment = new Comment(request.TargetType, request.TargetId, request.ParentId, userId, request.Body, clock.GetUtcNow()); }
        catch (ArgumentException ex) { throw new CommentException(CommentError.Validation, ex.Message); }
        repository.Add(comment);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
        return await Map(comment, false, ct);
    }

    // EditAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<CommentResponse> EditAsync(Guid id, string userId, EditCommentRequest request, CancellationToken ct)
    {
        var comment = await repository.GetAsync(id, ct) ?? throw NotFound();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (comment.AuthorId != userId) throw new CommentException(CommentError.Forbidden, "Bạn chỉ có thể chỉnh sửa bình luận của mình.");
        await RequirePublicTarget(comment.TargetType, comment.TargetId, ct);
        try { comment.Edit(request.Body, clock.GetUtcNow()); }
        catch (ArgumentException ex) { throw new CommentException(CommentError.Validation, ex.Message); }
        catch (InvalidOperationException ex) { throw new CommentException(CommentError.Conflict, ex.Message); }
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
        return await Map(comment, true, ct);
    }

    // DeleteAsync: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    public async Task DeleteAsync(Guid id, string userId, CancellationToken ct)
    {
        var comment = await repository.GetAsync(id, ct) ?? throw NotFound();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (comment.AuthorId != userId) throw new CommentException(CommentError.Forbidden, "Bạn chỉ có thể xóa bình luận của mình.");
        try { comment.RemoveByOwner(clock.GetUtcNow()); }
        catch (InvalidOperationException ex) { throw new CommentException(CommentError.Conflict, ex.Message); }
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
    }

    // ModerateAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<CommentResponse> ModerateAsync(Guid id, string adminId, CommentStatus status, string reason, CancellationToken ct)
    {
        var comment = await repository.GetAsync(id, ct) ?? throw NotFound();
        try { comment.Moderate(status, adminId, reason, clock.GetUtcNow()); }
        catch (ArgumentException ex) { throw new CommentException(CommentError.Validation, ex.Message); }
        catch (InvalidOperationException ex) { throw new CommentException(CommentError.Conflict, ex.Message); }
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
        return await Map(comment, true, ct);
    }

    // ReactionAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<ReactionResponse> ReactionAsync(string? userId, ReactionTargetType type, Guid id, bool? active, CancellationToken ct)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (!Enum.IsDefined(type) || id == Guid.Empty)
            throw new CommentException(CommentError.Validation, "Nội dung cần tương tác chưa hợp lệ. Vui lòng tải lại trang.");
        if (type == ReactionTargetType.CommentLike)
        {
            var comment = await repository.GetAsync(id, ct) ?? throw NotFound();
            if (comment.Status != CommentStatus.Visible) throw NotFound();
            await RequirePublicTarget(comment.TargetType, comment.TargetId, ct);
        }
        else
            await RequirePublicTarget(type == ReactionTargetType.ArticleHelpful ? CommentTargetType.Article : CommentTargetType.Video, id, ct);

        if (active is not null)
        {
            if (string.IsNullOrWhiteSpace(userId)) throw new CommentException(CommentError.Forbidden, "Vui lòng đăng nhập để tiếp tục.");
            var existing = await repository.GetReactionAsync(userId, type, id, ct);
            if (active.Value && existing is null) repository.Add(new ContentReaction(userId, type, id, clock.GetUtcNow()));
            if (!active.Value && existing is not null) repository.Remove(existing);
            if ((active.Value && existing is null) || (!active.Value && existing is not null)) await repository.SaveAsync(ct);
        }
        return await repository.ReactionStatusAsync(userId, type, id, ct);
    }

    // Page: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private async Task<CommentPage> Page(CommentQuery query, string? ownerId, bool admin, bool includeBody, CancellationToken ct)
    {
        var (items, total) = await repository.ListAsync(query, ownerId, admin, ct);
        var counts = await repository.LikeCountsAsync(items.Select(x => x.Id), ct);
        var names = await repository.AuthorNamesAsync(items.Select(x => x.AuthorId), ct);
        return new CommentPage(items.Select(x => ToResponse(x, names.GetValueOrDefault(x.AuthorId), includeBody,
            counts.GetValueOrDefault(x.Id))).ToArray(), total, query.Page, query.PageSize);
    }

    // Map: Chuyển dữ liệu nội bộ sang cấu trúc trả về cho bên gọi.
    private async Task<CommentResponse> Map(Comment comment, bool includeBody, CancellationToken ct)
    {
        var counts = await repository.LikeCountsAsync([comment.Id], ct);
        var names = await repository.AuthorNamesAsync([comment.AuthorId], ct);
        return ToResponse(comment, names.GetValueOrDefault(comment.AuthorId), includeBody, counts.GetValueOrDefault(comment.Id));
    }

    // ToResponse: Chuyển dữ liệu nội bộ sang cấu trúc trả về cho bên gọi.
    private static CommentResponse ToResponse(Comment c, string? authorName, bool includeBody, int likeCount) =>
        new(c.Id, c.TargetType, c.TargetId, c.ParentId, c.AuthorId, authorName,
            includeBody || c.Status == CommentStatus.Visible ? c.Body : null,
            c.Status, c.CreatedAt, c.UpdatedAt, likeCount,
            includeBody ? c.ModerationReason : null, includeBody ? c.ModeratedBy : null,
            includeBody ? c.ModeratedAt : null);

    // RequirePublicTarget: Kiểm tra dữ liệu và điều kiện nghiệp vụ; dừng xử lý khi không hợp lệ.
    private async Task RequirePublicTarget(CommentTargetType type, Guid id, CancellationToken ct)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (!await repository.IsPublicTargetAsync(type, id, ct)) throw NotFound();
    }
    // NotFound: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static CommentException NotFound() => new(CommentError.NotFound, "Không tìm thấy nội dung hoặc bình luận cần xem.");
    // ValidatePage: Kiểm tra dữ liệu và điều kiện nghiệp vụ; dừng xử lý khi không hợp lệ.
    private static void ValidatePage(CommentQuery q)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (q.Page < 1 || q.PageSize is < 1 or > 100 || (q.TargetType is { } type && !Enum.IsDefined(type)) ||
            (q.Status is { } status && !Enum.IsDefined(status)) || q.Search?.Length > 200)
            throw new CommentException(CommentError.Validation, "Bộ lọc chưa hợp lệ. Vui lòng kiểm tra lựa chọn hoặc tải lại danh sách.");
    }
}
