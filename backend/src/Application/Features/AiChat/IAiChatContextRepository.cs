namespace Application.Features.AiChat;

public sealed record ChatRecipeSuggestion(Guid Id, string Name);

public interface IAiChatContextRepository
{
    Task<string?> GetProfileContextAsync(string userId, CancellationToken ct);
    Task<IReadOnlyList<ChatRecipeSuggestion>> GetActiveRecipesAsync(CancellationToken ct);
}
