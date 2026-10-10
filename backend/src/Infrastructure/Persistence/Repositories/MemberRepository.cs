using System.Data;
using Application.Features.Administration;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class MemberRepository(AppDbContext db) : IMemberRepository
{
    public async Task<MemberPage> ListAsync(string? search, bool? isLocked, int page, int pageSize, CancellationToken cancellationToken)
    {
        var users = db.Users.AsNoTracking();
        var totalCount = await users.CountAsync(cancellationToken);
        var lockedCount = await users.CountAsync(x => x.IsLocked, cancellationToken);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{EscapeLike(search)}%";
            users = users.Where(x => EF.Functions.Like(EF.Functions.Collate(x.FullName, "Latin1_General_100_CI_AI"), pattern, "\\") ||
                EF.Functions.Like(EF.Functions.Collate(x.Email, "Latin1_General_100_CI_AI"), pattern, "\\"));
        }
        if (isLocked.HasValue) users = users.Where(x => x.IsLocked == isLocked.Value);
        var filteredCount = await users.CountAsync(cancellationToken);
        var rows = await users.OrderByDescending(x => x.CreatedAtUtc).ThenByDescending(x => x.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new { x.Id, x.FullName, x.Email, x.Role, x.CreatedAtUtc, x.IsLocked })
            .ToListAsync(cancellationToken);
        var items = rows.Select(x => new MemberSummary(x.Id, x.FullName, x.Email, x.Role.ToString(), x.CreatedAtUtc, x.IsLocked)).ToList();
        return new MemberPage(items, page, pageSize, filteredCount, totalCount - lockedCount, lockedCount);
    }

    public async Task<MemberDetail?> FindAsync(string id, CancellationToken cancellationToken)
    {
        var row = await db.Users.AsNoTracking().Where(x => x.Id == id)
            .Select(x => new { x.Id, x.FullName, x.Email, x.Role, x.CreatedAtUtc, x.IsLocked, x.LockReason, x.LockedAtUtc })
            .FirstOrDefaultAsync(cancellationToken);
        return row is null ? null : new MemberDetail(row.Id, row.FullName, row.Email, row.Role.ToString(),
            row.CreatedAtUtc, row.IsLocked, row.LockReason, row.LockedAtUtc);
    }

    public async Task<MemberStatusPage?> HistoryAsync(string id, int page, int pageSize, CancellationToken cancellationToken)
    {
        if (!await db.Users.AnyAsync(x => x.Id == id, cancellationToken)) return null;
        var changes = db.MemberStatusChanges.AsNoTracking().Where(x => x.UserId == id);
        var count = await changes.CountAsync(cancellationToken);
        var items = await (from change in changes
                           join admin in db.Users.AsNoTracking() on change.AdminId equals admin.Id
                           orderby change.OccurredAtUtc descending, change.Id descending
                           select new MemberStatusEntry(change.Id, change.IsLocked, change.Reason,
                               change.AdminId, admin.FullName, change.OccurredAtUtc))
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        return new MemberStatusPage(items, page, pageSize, count);
    }

    public async Task<MemberStatusUpdateResult> ChangeStatusAsync(
        string id, string adminId, bool lockAccount, string reason, DateTimeOffset now, CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        // Serialize member status changes before reading either the actor or the active Admin count.
        // The lock belongs to this transaction, so the account update and audit row commit together.
        await db.Database.ExecuteSqlRawAsync("""
            DECLARE @result int;
            EXEC @result = sp_getapplock
                @Resource = 'AdminMemberStatus',
                @LockMode = 'Exclusive',
                @LockOwner = 'Transaction',
                @LockTimeout = 30000;
            IF @result < 0 THROW 51000, 'Could not acquire the member status lock.', 1;
            """, cancellationToken);

        var actorIsActiveAdmin = await db.Users.AsNoTracking()
            .AnyAsync(x => x.Id == adminId && x.Role == UserRole.Admin && !x.IsLocked, cancellationToken);
        if (!actorIsActiveAdmin) return MemberStatusUpdateResult.ActorInactive;

        var user = await db.Users.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (user is null) return MemberStatusUpdateResult.NotFound;
        if (user.IsLocked == lockAccount) return MemberStatusUpdateResult.AlreadyInState;
        if (lockAccount && id == adminId) return MemberStatusUpdateResult.SelfLock;
        if (lockAccount && user.Role == UserRole.Admin &&
            await db.Users.CountAsync(x => x.Role == UserRole.Admin && !x.IsLocked, cancellationToken) <= 1)
            return MemberStatusUpdateResult.LastAdmin;

        if (lockAccount) user.Lock(reason, now);
        else user.Unlock(now);
        db.MemberStatusChanges.Add(MemberStatusChange.Create(id, adminId, lockAccount, reason, now));
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return MemberStatusUpdateResult.Updated;
    }

    private static string EscapeLike(string text) => text.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_").Replace("[", "\\[");
}
