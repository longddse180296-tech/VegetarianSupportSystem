using Domain.Entities;
using Domain.Enums;

namespace Application.Features.Moderation;

public sealed record SubmitModerationCommand(
    Guid? ContentId,
    ModeratedContentType ContentType,
    string Title,
    string TextContent,
    string? MediaReference);

public sealed record ModerationAiResult(
    AiFlagStatus Status,
    string Summary,
    string? CheckedScope,
    string? UncheckedScope,
    string? FlagReason);

public sealed record ModerationSearch(
    string? OwnerUserId,
    ModeratedContentType? ContentType,
    AiFlagStatus? AiStatus,
    AdminReviewStatus? AdminStatus,
    int Page,
    int PageSize);

public sealed record ModerationPage(
    IReadOnlyList<ModerationSubmission> Items,
    int TotalCount,
    int Page,
    int PageSize);

public enum ModerationError
{
    Validation,
    NotFound,
    Forbidden,
    Conflict
}

public sealed class ModerationException(ModerationError error, string message) : Exception(message)
{
    public ModerationError Error { get; } = error;
}
