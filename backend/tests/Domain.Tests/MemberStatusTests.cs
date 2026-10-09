using Domain.Entities;

namespace Domain.Tests;

public sealed class MemberStatusTests
{
    [Fact]
    public void LockAndUnlockRequireValidTransitionsAndPreserveAuditFacts()
    {
        var now = DateTimeOffset.UtcNow;
        var user = User.Register("Member", "member@example.com", "hash", now);
        var admin = User.CreateInitialAdmin("Admin", "admin@example.com", "hash", now);

        user.Lock(" Vi phạm quy định ", now.AddMinutes(1));
        var locked = MemberStatusChange.Create(user.Id, admin.Id, true, " Vi phạm quy định ", now.AddMinutes(1));
        Assert.True(user.IsLocked);
        Assert.Equal("Vi phạm quy định", user.LockReason);
        Assert.Equal(admin.Id, locked.AdminId);
        Assert.Equal(user.Id, locked.UserId);
        Assert.Equal("Vi phạm quy định", locked.Reason);
        Assert.Throws<InvalidOperationException>(() => user.Lock("Again", now.AddMinutes(2)));

        user.Unlock(now.AddMinutes(3));
        var unlocked = MemberStatusChange.Create(user.Id, admin.Id, false, " Đã giải quyết ", now.AddMinutes(3));
        Assert.False(user.IsLocked);
        Assert.Null(user.LockReason);
        Assert.Null(user.LockedAtUtc);
        Assert.False(unlocked.IsLocked);
        Assert.Equal("Đã giải quyết", unlocked.Reason);
        Assert.Throws<InvalidOperationException>(() => user.Unlock(now.AddMinutes(4)));
    }

    [Fact]
    public void AuditEventRejectsMissingReasonOrActor()
    {
        Assert.Throws<ArgumentException>(() => MemberStatusChange.Create("user", "admin", true, " ", DateTimeOffset.UtcNow));
        Assert.Throws<ArgumentException>(() => MemberStatusChange.Create("user", "", true, "Reason", DateTimeOffset.UtcNow));
    }
}
