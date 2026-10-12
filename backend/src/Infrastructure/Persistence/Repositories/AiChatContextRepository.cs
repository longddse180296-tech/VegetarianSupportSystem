using Application.Features.AiChat;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class AiChatContextRepository(AppDbContext db) : IAiChatContextRepository
{
    public async Task<string?> GetProfileContextAsync(string userId, CancellationToken ct)
    {
        var profile = await db.UserProfiles.AsNoTracking().Include(x => x.Allergies)
            .FirstOrDefaultAsync(x => x.UserId == userId, ct);
        if (profile is null) return null;
        return $"Chế độ ăn: {profile.Diet?.ToString() ?? "chưa khai báo"}; " +
            $"dị ứng do người dùng khai báo: {string.Join(", ", profile.Allergies.Select(x => x.Name))}. " +
            "Không suy đoán các chỉ số chưa khai báo.";
    }

    public async Task<IReadOnlyList<ChatRecipeSuggestion>> GetActiveRecipesAsync(CancellationToken ct) =>
        await db.Recipes.AsNoTracking().Where(x => x.IsActive)
            .OrderByDescending(x => x.CreatedAt).Take(3)
            .Select(x => new ChatRecipeSuggestion(x.Id, x.Name)).ToArrayAsync(ct);
}
