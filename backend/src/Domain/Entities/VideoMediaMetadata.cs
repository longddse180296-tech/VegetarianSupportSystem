// Lưu thông tin kỹ thuật theo từng tệp video; bản công khai và bản sửa không dùng nhầm thời lượng.
namespace Domain.Entities;

public sealed class VideoMediaMetadata
{
    private VideoMediaMetadata() { }
    public string MediaKey { get; private set; } = string.Empty;
    public double? DurationSeconds { get; private set; }
    public bool? HasAudio { get; private set; }
    public DateTimeOffset CheckedAtUtc { get; private set; }

    // Không suy đoán âm thanh hoặc thời lượng khi tệp thiếu/hỏng; null biểu thị chưa đọc được.
    public static VideoMediaMetadata Create(string key, double? duration, bool? hasAudio)
    {
        if (string.IsNullOrWhiteSpace(key)) throw new ArgumentException("Thiếu khóa tệp video.");
        if (duration is { } value && (!double.IsFinite(value) || value <= 0))
            throw new ArgumentException("Thời lượng video phải lớn hơn 0.");
        return new() { MediaKey = key, DurationSeconds = duration, HasAudio = hasAudio, CheckedAtUtc = DateTimeOffset.UtcNow };
    }
}
