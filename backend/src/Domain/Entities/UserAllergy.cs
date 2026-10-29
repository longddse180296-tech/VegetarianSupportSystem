// Chức năng: hạ tầng và quy tắc dùng chung. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
namespace Domain.Entities;

// UserAllergy: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class UserAllergy
{
    private UserAllergy() { }

    private UserAllergy(string userId, string name, DateTimeOffset createdAtUtc)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        Name = name;
        NormalizedName = name.ToUpperInvariant();
        CreatedAtUtc = createdAtUtc;
    }

    public Guid Id { get; private set; }
    public string UserId { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string NormalizedName { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; private set; }

    // Create: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public static UserAllergy Create(string userId, string name, DateTimeOffset createdAtUtc)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("A user ID is required.", nameof(userId));
        if (string.IsNullOrWhiteSpace(name) || name.Trim().Length > 150)
            throw new ArgumentException("Allergy name must be 1 to 150 characters.", nameof(name));

        return new UserAllergy(userId.Trim(), name.Trim(), createdAtUtc);
    }

    // Rename: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    internal void Rename(string name)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(name) || name.Trim().Length > 150)
            throw new ArgumentException("Allergy name must be 1 to 150 characters.", nameof(name));

        Name = name.Trim();
        NormalizedName = Name.ToUpperInvariant();
    }
}
