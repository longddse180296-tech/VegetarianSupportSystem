// Lưu góp ý gửi qua form liên hệ.
namespace Domain.Entities;

// ContactFeedback: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class ContactFeedback
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ReadAt { get; set; }
}
