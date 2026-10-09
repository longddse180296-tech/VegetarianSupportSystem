using Application.Features.Moderation;
using Domain.Entities;
using Domain.Enums;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class ModerationRepository(AppDbContext dbContext) : IModerationRepository
{
    public Task<ModerationSubmission?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return dbContext.Set<ModerationSubmission>()
            .Include(x => x.Decisions)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public Task<ModerationSubmission?> GetLatestForContentAsync(
        Guid contentId,
        CancellationToken cancellationToken)
    {
        return dbContext.Set<ModerationSubmission>()
            .Include(x => x.Decisions)
            .OrderByDescending(x => x.Version)
            .FirstOrDefaultAsync(x => x.ContentId == contentId, cancellationToken);
    }

    public Task<ModerationSubmission?> GetCurrentPublishedAsync(
        Guid contentId,
        CancellationToken cancellationToken)
    {
        return dbContext.Set<ModerationSubmission>()
            .FirstOrDefaultAsync(
                x => x.ContentId == contentId && x.IsCurrentPublished,
                cancellationToken);
    }

    public async Task<IReadOnlyList<Guid>> GetCheckingIdsAsync(int count, CancellationToken cancellationToken) =>
        await dbContext.ModerationSubmissions.AsNoTracking()
            .Where(x => x.AiFlagStatus == AiFlagStatus.Checking &&
                !dbContext.ModerationSubmissions.Any(newer =>
                    newer.ContentId == x.ContentId && newer.Version > x.Version))
            .OrderBy(x => x.SubmittedAt).Select(x => x.Id).Take(count)
            .ToArrayAsync(cancellationToken);

    public async Task<ModerationPage> SearchAsync(
        ModerationSearch search,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Set<ModerationSubmission>().AsNoTracking().AsQueryable();

        if (search.OwnerUserId is not null)
            query = query.Where(x => x.OwnerUserId == search.OwnerUserId);
        if (search.ContentType is { } contentType)
            query = query.Where(x => x.ContentType == contentType);
        if (search.AiStatus is { } aiStatus)
            query = query.Where(x => x.AiFlagStatus == aiStatus);
        if (search.AdminStatus is { } adminStatus)
            query = query.Where(x => x.AdminReviewStatus == adminStatus);
        if (search.AdminStatus == AdminReviewStatus.Published)
            query = query.Where(x => x.IsCurrentPublished);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.SubmittedAt)
            .ThenByDescending(x => x.Id)
            .Skip((search.Page - 1) * search.PageSize)
            .Take(search.PageSize)
            .Include(x => x.Decisions)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);

        return new ModerationPage(items, totalCount, search.Page, search.PageSize);
    }

    public async Task AddAsync(
        ModerationSubmission submission,
        CancellationToken cancellationToken)
    {
        await dbContext.Set<ModerationSubmission>().AddAsync(submission, cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ModerationException(
                ModerationError.Conflict,
                "This submission changed during the request. Reload it and try again.");
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new ModerationException(
                ModerationError.Conflict,
                "A newer version or another published version already exists.");
        }
    }

    public async Task ExecuteInTransactionAsync(
        Func<CancellationToken, Task> operation,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        await operation(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }
}
