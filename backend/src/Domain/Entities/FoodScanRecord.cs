// Chức năng: phân tích ảnh món ăn và nhãn thành phần. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
namespace Domain.Entities;

// FoodScanRecord: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class FoodScanRecord
{
    private FoodScanRecord() { }
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string OwnerUserId { get; private set; } = string.Empty;
    public string SourceType { get; private set; } = string.Empty;
    public string InputJson { get; private set; } = string.Empty;
    public string ResultJson { get; private set; } = string.Empty;
    public string ProfileSnapshotJson { get; private set; } = string.Empty;
    public int ResultVersion { get; private set; } = 1;
    public Guid? PreviousScanId { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; } = DateTimeOffset.UtcNow;

    // Create: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public static FoodScanRecord Create(string owner, string sourceType, string input,
        string result, string profile, Guid? previousScanId = null, int resultVersion = 1)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(owner)) throw new ArgumentException("Owner required.");
        return new FoodScanRecord { OwnerUserId = owner, SourceType = sourceType,
            InputJson = input, ResultJson = result, ProfileSnapshotJson = profile,
            PreviousScanId = previousScanId, ResultVersion = resultVersion };
    }
}
