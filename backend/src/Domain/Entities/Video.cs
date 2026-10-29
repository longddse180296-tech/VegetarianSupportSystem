// Chức năng: video, bản nháp và nội dung công khai. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
namespace Domain.Entities;

// Video: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class Video
{
    private Video() { }
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string OwnerUserId { get; private set; } = string.Empty;
    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public Guid? CategoryId { get; private set; }
    public string? MediaKey { get; private set; }
    public string? ThumbnailKey { get; private set; }
    public string UploadStatus { get; private set; } = "AwaitingUpload";
    public Guid? PublishedSubmissionId { get; private set; }
    public Guid? PublishedCategoryId { get; private set; }
    public string? PublishedThumbnailKey { get; private set; }
    public long ViewCount { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAtUtc { get; private set; } = DateTimeOffset.UtcNow;

    // Create: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public static Video Create(string owner, string title, string description, Guid? categoryId)
    {
        var video = new Video { OwnerUserId = owner };
        video.Edit(title, description, categoryId);
        return video;
    }

    // Edit: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public void Edit(string title, string description, Guid? categoryId)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(title) || title.Length > 200 ||
            string.IsNullOrWhiteSpace(description) || description.Length > 5000)
            throw new ArgumentException("Vui lòng nhập tiêu đề tối đa 200 ký tự và mô tả tối đa 5.000 ký tự.");
        Title = title.Trim();
        Description = description.Trim();
        CategoryId = categoryId;
        UpdatedAtUtc = DateTimeOffset.UtcNow;
    }

    // SetMedia: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public void SetMedia(string key)
    {
        MediaKey = key;
        UploadStatus = "Ready";
        UpdatedAtUtc = DateTimeOffset.UtcNow;
    }
    // BeginUpload: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public void BeginUpload()
    {
        UploadStatus = "Processing";
        UpdatedAtUtc = DateTimeOffset.UtcNow;
    }
    // SetThumbnail: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public void SetThumbnail(string key)
    {
        ThumbnailKey = key;
        UpdatedAtUtc = DateTimeOffset.UtcNow;
    }
    // FailUpload: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public void FailUpload()
    {
        UploadStatus = "Failed";
        UpdatedAtUtc = DateTimeOffset.UtcNow;
    }
    // Publish: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public void Publish(Guid submissionId)
    {
        PublishedSubmissionId = submissionId;
        PublishedCategoryId = CategoryId;
        PublishedThumbnailKey = ThumbnailKey;
        UpdatedAtUtc = DateTimeOffset.UtcNow;
    }
    // RemovePublication: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    public void RemovePublication()
    {
        PublishedSubmissionId = null;
        UpdatedAtUtc = DateTimeOffset.UtcNow;
    }
    // CountView: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public void CountView() => ViewCount++;
}
