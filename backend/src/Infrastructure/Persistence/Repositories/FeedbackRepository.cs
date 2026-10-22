using Application.Features.Administration;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class FeedbackRepository(AppDbContext db) : IFeedbackRepository
{
    public async Task AddAsync(ContactFeedback feedback, CancellationToken ct)
    {
        db.ContactFeedback.Add(feedback);
        await db.SaveChangesAsync(ct);
    }

    public async Task<FeedbackPage> ListAsync(bool? isRead, int page, int pageSize, CancellationToken ct)
    {
        var query = db.ContactFeedback.AsNoTracking();
        if (isRead.HasValue) query = query.Where(x => (x.ReadAt != null) == isRead.Value);
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new FeedbackItem(x.Id, x.Name, x.Email, x.Subject, x.Message, x.CreatedAt, x.ReadAt))
            .ToListAsync(ct);
        return new FeedbackPage(items, total, page, pageSize);
    }

    public async Task<bool> MarkReadAsync(Guid id, DateTimeOffset readAt, CancellationToken ct)
    {
        var feedback = await db.ContactFeedback.FindAsync([id], ct);
        if (feedback is null) return false;
        feedback.ReadAt ??= readAt;
        await db.SaveChangesAsync(ct);
        return true;
    }
}
