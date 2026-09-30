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
    string? UncheckedScope);

public sealed record GeminiChatTurn(string Role, string Text);

public sealed record GeminiChatRequest(
    string Prompt,
    IReadOnlyList<GeminiChatTurn> History);

public sealed record GeminiChatResponse(bool IsAvailable, string? Answer);
