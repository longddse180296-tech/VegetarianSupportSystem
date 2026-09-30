using Application.Abstractions.AI;

namespace Infrastructure.AI.Gemini;

// Integration seam only. Until an API key, model, prompts and response validation are
// implemented, callers get an explicit unavailable result rather than invented output.
public sealed class GeminiService : IGeminiService
{
    public Task<GeminiModerationResponse> CheckContentAsync(
        GeminiModerationRequest request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(new GeminiModerationResponse(false, null, null, null, null));
    }

    public Task<GeminiChatResponse> GenerateChatReplyAsync(
        GeminiChatRequest request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(new GeminiChatResponse(false, null));
    }
}
