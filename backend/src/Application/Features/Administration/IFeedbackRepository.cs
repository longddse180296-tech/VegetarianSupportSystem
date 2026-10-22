using Domain.Entities;

namespace Application.Features.Administration;

public interface IFeedbackRepository
{
    Task AddAsync(ContactFeedback feedback, CancellationToken ct);
    Task<FeedbackPage> ListAsync(bool? isRead, int page, int pageSize, CancellationToken ct);
    Task<bool> MarkReadAsync(Guid id, DateTimeOffset readAt, CancellationToken ct);
}
