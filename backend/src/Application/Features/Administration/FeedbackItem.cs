namespace Application.Features.Administration;

public sealed record FeedbackItem(Guid Id, string Name, string Email, string Subject,
    string Message, DateTimeOffset CreatedAt, DateTimeOffset? ReadAt);
