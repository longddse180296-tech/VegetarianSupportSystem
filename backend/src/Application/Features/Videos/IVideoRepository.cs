using Domain.Entities;

namespace Application.Features.Videos;

public interface IVideoRepository
{
    Task<Video?> GetAsync(Guid id, CancellationToken cancellationToken);
    Task<bool> CategoryExistsAsync(Guid id, CancellationToken cancellationToken);
    Task<(IReadOnlyList<Video> Items, int Total)> ListAsync(string? owner, bool publishedOnly,
        int page, int pageSize, CancellationToken cancellationToken);
    Task AddAsync(Video video, CancellationToken cancellationToken);
    Task SaveAsync(CancellationToken cancellationToken);
    Task<int> FavoriteCountAsync(Guid id, CancellationToken cancellationToken);
    Task IncrementViewAsync(Guid id, CancellationToken cancellationToken);
}

public interface IVideoPublication
{
    Task ApplyDecisionAsync(Guid videoId, Guid submissionId, bool published,
        CancellationToken cancellationToken);
}
