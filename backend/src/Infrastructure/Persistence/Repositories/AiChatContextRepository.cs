// Chức năng: hội thoại hỗ trợ ăn chay. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Application.Features.AiChat;
using Application.Features.Profiles;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

// AiChatContextRepository: thực hiện truy vấn và lưu dữ liệu của tính năng qua EF Core.
public sealed class AiChatContextRepository(AppDbContext db, IProfileContextReader profiles) : IAiChatContextRepository
{
    // GetProfileContextAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<string?> GetProfileContextAsync(string userId, CancellationToken ct)
    {
        var profile = await profiles.GetContextAsync(userId, ct);
        return AiChatProfileContext.Format(profile);
    }

    // GetActiveRecipesAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<IReadOnlyList<ChatRecipeSuggestion>> GetActiveRecipesAsync(CancellationToken ct) =>
        await db.Recipes.AsNoTracking().Where(x => x.IsActive)
            .OrderByDescending(x => x.CreatedAt).Take(3)
            .Select(x => new ChatRecipeSuggestion(x.Id, x.Name)).ToArrayAsync(ct);
}
