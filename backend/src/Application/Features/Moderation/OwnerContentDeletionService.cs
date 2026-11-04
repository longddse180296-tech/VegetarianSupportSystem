// Chức năng: chủ sở hữu xóa bài viết/video; hạ tầng bảo đảm toàn bộ thay đổi trong một giao dịch.
using Domain.Enums;

namespace Application.Features.Moderation;

public interface IOwnerContentDeletionRepository
{
    Task<bool> DeleteOwnedAsync(ModeratedContentType type, Guid id, string ownerId, CancellationToken ct);
}

public sealed class OwnerContentDeletionService(IOwnerContentDeletionRepository repository)
{
    public async Task DeleteAsync(ModeratedContentType type, Guid id, string ownerId, CancellationToken ct)
    {
        if (!Enum.IsDefined(type) || id == Guid.Empty || string.IsNullOrWhiteSpace(ownerId))
            throw new ModerationException(ModerationError.NotFound, "Không tìm thấy nội dung hoặc bạn không có quyền xóa.");
        if (!await repository.DeleteOwnedAsync(type, id, ownerId, ct))
            throw new ModerationException(ModerationError.NotFound, "Không tìm thấy nội dung hoặc bạn không có quyền xóa.");
    }
}
