// Chức năng: kiểm tra hai trình duyệt độc lập, gia hạn cookie và thu hồi phiên bằng JWT thật trên database kiểm thử.
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Api.Controllers;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace CoreDataChecks;

internal static class AuthSessionChecks
{
    public static async Task RunAsync(Uri address, AppDbContext db, Action<bool, string> check)
    {
        using var aHandler = new HttpClientHandler { CookieContainer = new CookieContainer() };
        using var bHandler = new HttpClientHandler { CookieContainer = new CookieContainer() };
        using var a = new HttpClient(aHandler) { BaseAddress = address };
        using var b = new HttpClient(bHandler) { BaseAddress = address };
        const string email = "session-check@example.test";
        const string password = "SessionCheck123";
        var created = await a.PostAsJsonAsync("/api/auth/register", new { fullName = "Session test", email, password, confirmPassword = password });
        check(created.StatusCode == HttpStatusCode.Created, "register creates browser session");
        var first = (await created.Content.ReadFromJsonAsync<AuthController.AuthResponse>())!;
        var cookieHeader = string.Join(';', created.Headers.GetValues("Set-Cookie"));
        check(cookieHeader.Contains("httponly", StringComparison.OrdinalIgnoreCase) && cookieHeader.Contains("samesite=strict", StringComparison.OrdinalIgnoreCase) && cookieHeader.Contains("path=/api/auth"),
            "refresh cookie is HttpOnly, SameSite Strict and scoped to auth");
        var secretA = aHandler.CookieContainer.GetCookies(new Uri(address, "/api/auth"))["vegetarian_refresh"]!.Value;
        var stored = (await db.Users.AsNoTracking().SingleAsync(x => x.Id == first.User.Id));
        check(stored.RefreshTokenHash is { Length: 64 } && stored.RefreshTokenHash != secretA && !JsonSerializer.Serialize(first).Contains(secretA),
            "database stores only refresh hash and JSON does not expose secret");
        a.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", first.AccessToken);
        check((await a.GetAsync("/api/auth/me")).StatusCode == HttpStatusCode.OK, "first browser can access account");
        check((await a.PostAsync("/api/auth/refresh", null)).StatusCode == HttpStatusCode.BadRequest, "refresh rejects missing CSRF header");
        a.DefaultRequestHeaders.Add("X-Session-Refresh", "1");
        // Tạo JWT đã hết hạn với cùng session để kiểm tra cookie vẫn gia hạn được.
        var claims = new JwtSecurityTokenHandler().ReadJwtToken(first.AccessToken).Claims;
        var expired = new JwtSecurityToken("integration-tests", "integration-tests", claims.Where(x => x.Type != "exp"),
            expires: DateTime.UtcNow.AddMinutes(-1), signingCredentials: new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(new string('k', 32))), SecurityAlgorithms.HmacSha256));
        a.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", new JwtSecurityTokenHandler().WriteToken(expired));
        check((await a.GetAsync("/api/auth/me")).StatusCode == HttpStatusCode.Unauthorized, "expired access token is rejected");
        var refreshed = await a.PostAsync("/api/auth/refresh", null);
        check(refreshed.StatusCode == HttpStatusCode.OK, "valid cookie refreshes expired access token");
        var renewed = (await refreshed.Content.ReadFromJsonAsync<AuthController.AuthResponse>())!;
        a.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", renewed.AccessToken);
        check((await a.GetAsync("/api/auth/me")).IsSuccessStatusCode && renewed.AccessToken != first.AccessToken,
            "renewed access token grants access without login");
        var parallel = await Task.WhenAll(Enumerable.Range(0, 3).Select(_ => a.PostAsync("/api/auth/refresh", null)));
        check(parallel.All(x => x.IsSuccessStatusCode), "same-browser concurrent refreshes do not invalidate one another");

        var loginB = await b.PostAsJsonAsync("/api/auth/login", new { email, password, rememberMe = false });
        check(loginB.StatusCode == HttpStatusCode.OK, "second browser login succeeds");
        check(!string.Join(';', loginB.Headers.GetValues("Set-Cookie")).Contains("expires=", StringComparison.OrdinalIgnoreCase),
            "rememberMe false uses browser-session cookie");
        var second = (await loginB.Content.ReadFromJsonAsync<AuthController.AuthResponse>())!;
        b.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", second.AccessToken);
        b.DefaultRequestHeaders.Add("X-Session-Refresh", "1");
        check((await a.GetAsync("/api/auth/me")).StatusCode == HttpStatusCode.Unauthorized, "new login rejects old browser access token immediately");
        check((await a.PostAsync("/api/auth/refresh", null)).StatusCode == HttpStatusCode.Unauthorized, "old browser cannot regain access through refresh");
        check((await a.PostAsync("/api/auth/logout", null)).StatusCode == HttpStatusCode.NoContent && (await b.GetAsync("/api/auth/me")).IsSuccessStatusCode,
            "late logout from old browser cannot revoke new browser session");
        // Đăng xuất bằng cookie ngay cả khi JWT không còn hiệu lực.
        b.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", new JwtSecurityTokenHandler().WriteToken(expired));
        check((await b.PostAsync("/api/auth/logout", null)).StatusCode == HttpStatusCode.NoContent, "logout can revoke session with expired access token");
        b.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", second.AccessToken);
        check((await b.GetAsync("/api/auth/me")).StatusCode == HttpStatusCode.Unauthorized &&
            (await b.PostAsync("/api/auth/refresh", null)).StatusCode == HttpStatusCode.Unauthorized, "logout revokes both access and renewal");

        // Token đời cũ không có sid không được sống lại khi logout làm ActiveSessionId thành null.
        var legacyClaims = claims.Where(x => x.Type is not ("sid" or "ver" or "exp")).Append(new System.Security.Claims.Claim("ver", "0"));
        var legacy = new JwtSecurityToken("integration-tests", "integration-tests", legacyClaims, expires: DateTime.UtcNow.AddMinutes(5),
            signingCredentials: new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(new string('k', 32))), SecurityAlgorithms.HmacSha256));
        a.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", new JwtSecurityTokenHandler().WriteToken(legacy));
        check((await a.GetAsync("/api/auth/me")).StatusCode == HttpStatusCode.Unauthorized, "legacy token without sid cannot revive after logout");

        var concurrent = await Task.WhenAll(a.PostAsJsonAsync("/api/auth/login", new { email, password }), b.PostAsJsonAsync("/api/auth/login", new { email, password }));
        var tokens = await Task.WhenAll(concurrent.Select(async x => (await x.Content.ReadFromJsonAsync<AuthController.AuthResponse>())!));
        using var probe = new HttpClient { BaseAddress = address };
        var valid = 0;
        foreach (var token in tokens)
        {
            probe.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token.AccessToken);
            if ((await probe.GetAsync("/api/auth/me")).IsSuccessStatusCode) valid++;
        }
        check(valid == 1, "concurrent logins leave exactly one active session");
        // Cookie bị sửa không được dùng để gia hạn.
        using var tampered = new HttpClient { BaseAddress = address };
        tampered.DefaultRequestHeaders.Add("X-Session-Refresh", "1");
        tampered.DefaultRequestHeaders.Add("Cookie", "vegetarian_refresh=" + secretA[..33] + new string('0', 64));
        check((await tampered.PostAsync("/api/auth/refresh", null)).StatusCode == HttpStatusCode.Unauthorized, "tampered refresh cookie is rejected");
        // Hết hạn tuyệt đối và tài khoản khóa đều không được gia hạn.
        var winner = await db.Users.AsNoTracking().SingleAsync(x => x.Id == first.User.Id);
        await db.Users.Where(x => x.Id == winner.Id).ExecuteUpdateAsync(s => s.SetProperty(x => x.SessionExpiresAtUtc, DateTimeOffset.UtcNow.AddMinutes(-1)));
        check((await a.PostAsync("/api/auth/refresh", null)).StatusCode == HttpStatusCode.Unauthorized &&
            (await b.PostAsync("/api/auth/refresh", null)).StatusCode == HttpStatusCode.Unauthorized, "expired browser session cannot refresh");
        var relogin = await a.PostAsJsonAsync("/api/auth/login", new { email, password });
        check(relogin.IsSuccessStatusCode, "login creates new session after expiry");
        var user = await db.Users.SingleAsync(x => x.Id == first.User.Id);
        user.Lock("Test session revocation", DateTimeOffset.UtcNow);
        await db.SaveChangesAsync();
        check((await a.PostAsync("/api/auth/refresh", null)).StatusCode == HttpStatusCode.Unauthorized, "locked account cannot refresh");
        user.Unlock(DateTimeOffset.UtcNow);
        await db.SaveChangesAsync();
        check((await a.PostAsync("/api/auth/refresh", null)).StatusCode == HttpStatusCode.Unauthorized, "unlock does not restore revoked session");
        await a.PostAsJsonAsync("/api/auth/login", new { email, password });
        await db.Entry(user).ReloadAsync();
        user.ChangePasswordHash("changed-test-hash", DateTimeOffset.UtcNow);
        await db.SaveChangesAsync();
        check((await a.PostAsync("/api/auth/refresh", null)).StatusCode == HttpStatusCode.Unauthorized, "password change invalidates refresh session");
    }
}
