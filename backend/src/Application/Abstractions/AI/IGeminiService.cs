using Domain.Enums;

namespace Application.Abstractions.AI;

// The application depends on this contract; only Infrastructure may talk to Gemini.
public interface IGeminiService
{
    Task<GeminiModerationResponse> CheckContentAsync(
        GeminiModerationRequest request,
        CancellationToken cancellationToken = default);

    Task<GeminiChatResponse> GenerateChatReplyAsync(
        GeminiChatRequest request,
        CancellationToken cancellationToken = default);

    Task<GeminiDishImageResponse> AnalyzeDishImageAsync(
        GeminiDishImageRequest request,
        CancellationToken cancellationToken = default);

    Task<GeminiLabelResponse> ReadIngredientLabelAsync(
        GeminiDishImageRequest request,
        CancellationToken cancellationToken = default);
}

public sealed record GeminiModerationRequest(
    ModeratedContentType ContentType,
    string Title,
    string Text,
    IReadOnlyList<string> MediaReferences);

// A status is deliberately absent when the provider has not completed a check.
public sealed record GeminiModerationResponse(
    bool IsAvailable,
    AiFlagStatus? AiFlagStatus,
    string? Summary,
    string? CheckedScope,
    string? UncheckedScope,
    string? ErrorCode = null,
    string? FlagReason = null,
    string? FlagType = null,
    string? Priority = null,
    string? Evidence = null);

public sealed record GeminiChatTurn(string Role, string Text);

public sealed record GeminiChatRequest(
    string Prompt,
    IReadOnlyList<GeminiChatTurn> History,
    string? ProfileContext = null);

public sealed record GeminiChatResponse(
    bool IsAvailable,
    string? Answer,
    string? ErrorCode = null);

public sealed record GeminiDishImageRequest(byte[] ImageBytes, string MimeType);

public sealed record GeminiDishImageResponse(
    bool IsAvailable,
    string? SuggestedDishName,
    IReadOnlyList<string> VisibleIngredients,
    IReadOnlyList<string> UnknownFactors,
    IReadOnlyList<string> FollowUpQuestions,
    string? ErrorCode = null);

public sealed record GeminiLabelResponse(bool IsAvailable, string? ExtractedText,
    bool IsIncomplete, string? ErrorCode = null);
