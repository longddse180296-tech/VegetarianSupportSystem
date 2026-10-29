// Chức năng: kiểm duyệt nội dung và kết quả kiểm tra AI. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Entities;
using Domain.Enums;

namespace Application.Features.Moderation;

// SubmitModerationCommand: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record SubmitModerationCommand(
    Guid? ContentId,
    ModeratedContentType ContentType,
    string Title,
    string TextContent,
    string? MediaReference);

// ModerationAiResult: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ModerationAiResult(
    AiFlagStatus Status,
    string Summary,
    string? CheckedScope,
    string? UncheckedScope,
    string? FlagReason,
    string? FlagType = null,
    string? Priority = null,
    string? Evidence = null);

// ModerationSearch: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ModerationSearch(
    string? OwnerUserId,
    ModeratedContentType? ContentType,
    AiFlagStatus? AiStatus,
    AdminReviewStatus? AdminStatus,
    int Page,
    int PageSize);

// ModerationPage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ModerationPage(
    IReadOnlyList<ModerationSubmission> Items,
    int TotalCount,
    int Page,
    int PageSize);

// ModerationError: định nghĩa các giá trị trạng thái được phép.
public enum ModerationError
{
    Validation,
    NotFound,
    Forbidden,
    Conflict
}

// ModerationException: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class ModerationException(ModerationError error, string message) : Exception(message)
{
    public ModerationError Error { get; } = error;
}
