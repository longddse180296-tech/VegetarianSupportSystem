using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using Api.Authorization;
using Application.Features.Administration;
using Domain.Entities;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CoreDataChecks;

internal static class MemberApiChecks
{
    public static async Task RunAsync(HttpClient client, IServiceProvider services, Action<bool, string> check)
    {
        await using var setup = services.CreateAsyncScope();
        var db = setup.ServiceProvider.GetRequiredService<AppDbContext>();
        var now = DateTimeOffset.UtcNow;
        var actor = User.CreateInitialAdmin("Member API actor", "member-actor@example.test", "hash", now);
        var otherAdmin = User.CreateInitialAdmin("Member API admin 2", "member-admin2@example.test", "hash", now);
        var thirdAdmin = User.CreateInitialAdmin("Member API admin 3", "member-admin3@example.test", "hash", now);
        var member = User.Register("Member %_unique", "member-unique@example.test", "hash", now);
        db.Users.AddRange(actor, otherAdmin, thirdAdmin, member);
        await db.SaveChangesAsync();

        const string route = "/api/admin/members";
        client.DefaultRequestHeaders.Remove("Test-Role");
        client.DefaultRequestHeaders.Remove("Test-UserId");
        check((await client.GetAsync(route)).StatusCode == HttpStatusCode.Unauthorized,
            "members Guest receives 401");
        client.DefaultRequestHeaders.Add("Test-Role", "User");
        check((await client.GetAsync(route)).StatusCode == HttpStatusCode.Forbidden,
            "members User receives 403");
        check((await client.PostAsJsonAsync($"{route}/{member.Id}/lock", new { reason = "test" })).StatusCode == HttpStatusCode.Forbidden,
            "members User cannot lock");
        client.DefaultRequestHeaders.Remove("Test-Role");
        client.DefaultRequestHeaders.Add("Test-Role", "Admin");
        client.DefaultRequestHeaders.Add("Test-UserId", actor.Id);

        var filtered = await client.GetFromJsonAsync<MemberPage>(route + "?search=%25%5Funique&page=1&pageSize=1");
        check(filtered is { TotalCount: 1, Page: 1, PageSize: 1 } && filtered.Items.Single().Id == member.Id,
            "members filter treats SQL wildcards as literal text and pages at DB");
        check((await client.GetAsync(route + "?pageSize=101")).StatusCode == HttpStatusCode.BadRequest,
            "members invalid page rejected");
        check((await client.GetAsync($"{route}/{member.Id}")).StatusCode == HttpStatusCode.OK,
            "members detail exists");
        check((await client.GetAsync($"{route}/{Guid.NewGuid():N}")).StatusCode == HttpStatusCode.NotFound,
            "members missing detail returns 404");
        check((await client.PostAsJsonAsync($"{route}/{member.Id}/lock", new { reason = "  " })).StatusCode == HttpStatusCode.BadRequest,
            "members lock requires reason");
        check((await client.PostAsJsonAsync($"{route}/{actor.Id}/lock", new { reason = "self" })).StatusCode == HttpStatusCode.Conflict,
            "members Admin cannot lock self");

        var lockResponse = await client.PostAsJsonAsync($"{route}/{member.Id}/lock", new { reason = "  Review violation  " });
        check(lockResponse.StatusCode == HttpStatusCode.NoContent, "members lock succeeds");
        var locked = await client.GetFromJsonAsync<MemberDetail>($"{route}/{member.Id}");
        check(locked is { IsLocked: true, CurrentLockReason: "Review violation", LockedAtUtc: not null },
            "members lock detail stores reason and time");
        var lockedPage = await client.GetFromJsonAsync<MemberPage>(route + "?search=%25%5Funique&isLocked=true");
        check(lockedPage is { TotalCount: 1 } && lockedPage.Items.Single().Id == member.Id,
            "members locked filter uses current account status");
        check((await client.PostAsJsonAsync($"{route}/{member.Id}/lock", new { reason = "again" })).StatusCode == HttpStatusCode.Conflict,
            "members duplicate lock returns 409");

        var principal = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim("sub", member.Id),
            new Claim("role", "User"),
            new Claim("jti", Guid.NewGuid().ToString("N")),
            new Claim("ver", "0")
        ], "Bearer"));
        var validator = new AccountTokenValidator(
            new UserAccountRepository(db), new RevokedAccessTokenRepository(db));
        check(!await validator.IsValidAsync(principal, CancellationToken.None),
            "locked member's existing JWT is rejected by request validator");

        check((await client.PostAsJsonAsync($"{route}/{member.Id}/unlock", new { reason = "  Appeal accepted  " })).StatusCode == HttpStatusCode.NoContent,
            "members unlock succeeds");
        check((await client.PostAsJsonAsync($"{route}/{member.Id}/unlock", new { reason = "again" })).StatusCode == HttpStatusCode.Conflict,
            "members duplicate unlock returns 409");
        check(await validator.IsValidAsync(principal, CancellationToken.None),
            "unlocked member's unexpired JWT is accepted again");
        var history = await client.GetFromJsonAsync<MemberStatusPage>($"{route}/{member.Id}/status-history?page=1&pageSize=1");
        check(history is { TotalCount: 2, PageSize: 1 } && history.Items.Single() is
            { IsLocked: false, Reason: "Appeal accepted" } entry && entry.AdminId == actor.Id &&
            entry.AdminName == actor.FullName && entry.OccurredAtUtc != default,
            "members history persists actor, UTC time, reason and pagination");

        await using var firstScope = services.CreateAsyncScope();
        await using var secondScope = services.CreateAsyncScope();
        var first = firstScope.ServiceProvider.GetRequiredService<IMemberRepository>();
        var second = secondScope.ServiceProvider.GetRequiredService<IMemberRepository>();
        var outcomes = await Task.WhenAll(
            first.ChangeStatusAsync(otherAdmin.Id, actor.Id, true, "review 2", now, CancellationToken.None),
            second.ChangeStatusAsync(thirdAdmin.Id, actor.Id, true, "review 3", now, CancellationToken.None));
        check(outcomes.Count(x => x == MemberStatusUpdateResult.Updated) == 1 &&
              outcomes.Count(x => x == MemberStatusUpdateResult.LastAdmin) == 1,
            "concurrent locks cannot remove the last active Admin");
        check(await db.Users.AsNoTracking().CountAsync(x => x.Role == Domain.Enums.UserRole.Admin && !x.IsLocked) == 1,
            "one active Admin remains after concurrent locks");
        check(await db.MemberStatusChanges.AsNoTracking().CountAsync(x =>
            x.UserId == otherAdmin.Id || x.UserId == thirdAdmin.Id) == 1,
            "only the committed concurrent status change has an audit row");
        var inactiveActor = outcomes[0] == MemberStatusUpdateResult.Updated ? otherAdmin : thirdAdmin;
        check(await first.ChangeStatusAsync(member.Id, inactiveActor.Id, true, "not allowed", now, CancellationToken.None)
              == MemberStatusUpdateResult.ActorInactive,
            "locked Admin cannot act after another request changes their status");

        client.DefaultRequestHeaders.Remove("Test-Role");
        client.DefaultRequestHeaders.Remove("Test-UserId");
    }
}
