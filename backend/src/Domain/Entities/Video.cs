namespace Domain.Entities;

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

    public static Video Create(string owner, string title, string description, Guid? categoryId)
    {
        var video = new Video { OwnerUserId = owner };
        video.Edit(title, description, categoryId);
        return video;
    }

    public void Edit(string title, string description, Guid? categoryId)
    {
        if (string.IsNullOrWhiteSpace(title) || title.Length > 200 ||
            string.IsNullOrWhiteSpace(description) || description.Length > 5000)
            throw new ArgumentException("Title and description are required (200 and 5000 characters maximum).");
        Title = title.Trim();
        Description = description.Trim();
        CategoryId = categoryId;
        UpdatedAtUtc = DateTimeOffset.UtcNow;
    }

    public void SetMedia(string key)
    {
        MediaKey = key;
        UploadStatus = "Ready";
        UpdatedAtUtc = DateTimeOffset.UtcNow;
    }
    public void BeginUpload()
    {
        UploadStatus = "Processing";
        UpdatedAtUtc = DateTimeOffset.UtcNow;
    }
    public void SetThumbnail(string key)
    {
        ThumbnailKey = key;
        UpdatedAtUtc = DateTimeOffset.UtcNow;
    }
    public void FailUpload()
    {
        UploadStatus = "Failed";
        UpdatedAtUtc = DateTimeOffset.UtcNow;
    }
    public void Publish(Guid submissionId)
    {
        PublishedSubmissionId = submissionId;
        PublishedCategoryId = CategoryId;
        PublishedThumbnailKey = ThumbnailKey;
        UpdatedAtUtc = DateTimeOffset.UtcNow;
    }
    public void RemovePublication()
    {
        PublishedSubmissionId = null;
        UpdatedAtUtc = DateTimeOffset.UtcNow;
    }
    public void CountView() => ViewCount++;
}
