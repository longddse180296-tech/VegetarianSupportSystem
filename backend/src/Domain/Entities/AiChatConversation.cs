// Chức năng: hội thoại hỗ trợ ăn chay. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
namespace Domain.Entities;

// AiChatConversation: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class AiChatConversation
{
    private AiChatConversation() { }

    private AiChatConversation(Guid id, string userId, DateTimeOffset createdAtUtc)
    {
        Id = id;
        UserId = userId;
        CreatedAtUtc = createdAtUtc;
        UpdatedAtUtc = createdAtUtc;
    }

    public Guid Id { get; private set; }
    public string UserId { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public DateTimeOffset UpdatedAtUtc { get; private set; }

    // Create: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public static AiChatConversation Create(string userId, DateTimeOffset createdAtUtc)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("A user ID is required.", nameof(userId));
        }

        return new AiChatConversation(Guid.NewGuid(), userId, createdAtUtc);
    }

    // RecordMessageAt: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public void RecordMessageAt(DateTimeOffset createdAtUtc)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (createdAtUtc > UpdatedAtUtc)
        {
            UpdatedAtUtc = createdAtUtc;
        }
    }
}
