using Application.Features.AiChat;
using Application.Features.Profiles;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class AiChatContextRepository(AppDbContext db, IProfileContextReader profiles) : IAiChatContextRepository
{
    public async Task<string?> GetProfileContextAsync(string userId, CancellationToken ct)
    {
        var profile = await profiles.GetContextAsync(userId, ct);
        return AiChatProfileContext.Format(profile);
    }

    public async Task<IReadOnlyList<ChatRecipeSuggestion>> GetActiveRecipesAsync(CancellationToken ct) =>
        await db.Recipes.AsNoTracking().Where(x => x.IsActive)
            .OrderByDescending(x => x.CreatedAt).Take(3)
            .Select(x => new ChatRecipeSuggestion(x.Id, x.Name)).ToArrayAsync(ct);
}
