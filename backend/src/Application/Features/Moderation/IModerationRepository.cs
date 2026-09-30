using Domain.Entities;

namespace Application.Features.Moderation;

public interface IModerationRepository
{
    Task<ModerationSubmission?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<ModerationSubmission?> GetLatestForContentAsync(Guid contentId, CancellationToken cancellationToken);
    Task<ModerationSubmission?> GetCurrentPublishedAsync(Guid contentId, CancellationToken cancellationToken);
    Task<ModerationPage> SearchAsync(ModerationSearch search, CancellationToken cancellationToken);
    Task AddAsync(ModerationSubmission submission, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
    Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken);
}
