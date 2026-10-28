// Chức năng: hội thoại hỗ trợ ăn chay. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.AiChat;

// ChatRecipeSuggestion: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ChatRecipeSuggestion(Guid Id, string Name);

// IAiChatContextRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IAiChatContextRepository
{
    // GetProfileContextAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<string?> GetProfileContextAsync(string userId, CancellationToken ct);
    // GetActiveRecipesAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<IReadOnlyList<ChatRecipeSuggestion>> GetActiveRecipesAsync(CancellationToken ct);
}
