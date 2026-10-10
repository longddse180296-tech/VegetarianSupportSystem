using Domain.Enums;

namespace Domain.Entities;

public sealed class Comment
{
    private Comment() { }

    public Comment(CommentTargetType targetType, Guid targetId, Guid? parentId, string authorId, string body, DateTimeOffset now)
    {
        Id = Guid.NewGuid();
        TargetType = targetType;
        TargetId = targetId;
        ParentId = parentId;
        AuthorId = authorId;
        Body = ValidateBody(body);
        CreatedAt = UpdatedAt = now;
        Status = CommentStatus.Visible;
    }

    public Guid Id { get; private set; }
    public CommentTargetType TargetType { get; private set; }
    public Guid TargetId { get; private set; }
    public Guid? ParentId { get; private set; }
    public string AuthorId { get; private set; } = string.Empty;
    public string Body { get; private set; } = string.Empty;
    public CommentStatus Status { get; private set; }
    public string? ModerationReason { get; private set; }
    public string? ModeratedBy { get; private set; }
    public DateTimeOffset? ModeratedAt { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public byte[] RowVersion { get; private set; } = [];

    public void Edit(string body, DateTimeOffset now)
    {
        if (Status != CommentStatus.Visible) throw new InvalidOperationException("Comment is not visible.");
        Body = ValidateBody(body);
        UpdatedAt = now;
    }

    public void RemoveByOwner(DateTimeOffset now)
    {
        if (Status != CommentStatus.Visible) throw new InvalidOperationException("Comment is not visible.");
        Status = CommentStatus.Removed;
        UpdatedAt = now;
    }

    public void Moderate(CommentStatus status, string adminId, string reason, DateTimeOffset now)
    {
        if (status is not (CommentStatus.Hidden or CommentStatus.Removed) ||
            Status == CommentStatus.Removed || Status == status)
            throw new InvalidOperationException("Comment cannot transition to the requested status.");
        if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length > 1_000)
            throw new ArgumentException("Reason must be 1 to 1000 characters.", nameof(reason));
        Status = status;
        ModerationReason = reason.Trim();
        ModeratedBy = adminId;
        ModeratedAt = UpdatedAt = now;
    }

    private static string ValidateBody(string body)
    {
        if (string.IsNullOrWhiteSpace(body) || body.Trim().Length > 2_000)
            throw new ArgumentException("Body must be 1 to 2000 characters.", nameof(body));
        return body.Trim();
    }
}
