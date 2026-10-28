// Chức năng: đăng ký, đăng nhập và khôi phục mật khẩu. Tầng API nhận yêu cầu, kiểm tra quyền và chuyển xử lý cho Application.
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Text.Json.Serialization;
using Application.Features.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Api.Controllers;

// AuthController: cung cấp endpoint HTTP, kiểm tra danh tính và chuyển yêu cầu cho tầng Application.
[ApiController]
[Route("api/auth")]
public sealed class AuthController(AuthService authService, PasswordResetService passwordResetService,
    AccountSessionService sessions, IWebHostEnvironment environment) : ControllerBase
{
    private const string RefreshCookie = "vegetarian_refresh";
    // Cookie chỉ gửi đến endpoint xác thực; JavaScript không đọc được bí mật gia hạn.
    private CookieOptions CookieSettings(DateTimeOffset? expires = null) => new()
    {
        HttpOnly = true, Secure = Request.IsHttps || !environment.IsDevelopment(), SameSite = SameSiteMode.Strict,
        Path = "/api/auth", Expires = expires, IsEssential = true
    };
    private void SetSessionCookie(AuthResult result, bool rememberMe)
    {
        Response.Headers.CacheControl = "no-store";
        if (result.RefreshSecret is not null)
            Response.Cookies.Append(RefreshCookie, result.RefreshSecret,
                CookieSettings(rememberMe ? result.SessionExpiresAtUtc : null));
    }
    // Register: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register(
        [FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await authService.RegisterAsync(
                request.FullName, request.Email, request.Password, request.ConfirmPassword,
                cancellationToken);
            SetSessionCookie(result, true);
            return StatusCode(StatusCodes.Status201Created, AuthResponse.From(result));
        }
        catch (ArgumentException ex)
        {
            ModelState.AddModelError(ex.ParamName ?? "request", ex.Message);
            return ValidationProblem(ModelState);
        }
        catch (DuplicateEmailException)
        {
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Email đã được đăng ký."
            });
        }
    }

    // Login: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(
        [FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.LoginAsync(request.Email, request.Password, cancellationToken);
        if (result is not null) SetSessionCookie(result, request.RememberMe);
        return result is null
            ? Unauthorized(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Email hoặc mật khẩu không đúng, hoặc tài khoản đã bị khóa."
            })
            : Ok(AuthResponse.From(result));
    }

    // Access token hết hạn vẫn được gia hạn bằng cookie phiên; không cần JWT đã hết hạn.
    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Refresh(CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        if (Request.Headers["X-Session-Refresh"] != "1")
            return BadRequest(new ProblemDetails { Status = 400, Title = "Yêu cầu gia hạn phiên chưa hợp lệ." });
        var result = await sessions.RefreshAsync(Request.Cookies[RefreshCookie], cancellationToken);
        if (result is null)
            return Unauthorized(new ProblemDetails { Status = 401, Title = "Phiên đăng nhập đã kết thúc hoặc tài khoản đã đăng nhập trên trình duyệt khác. Vui lòng đăng nhập lại." });
        return Ok(AuthResponse.From(result));
    }

    // Me: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<AuthenticatedUser>> Me(CancellationToken cancellationToken)
    {
        var userId = User.FindFirst("sub")?.Value;
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();
        var user = await authService.GetCurrentUserAsync(userId, cancellationToken);
        return user is null ? Unauthorized() : Ok(user);
    }

    // Logout: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        var tokenId = User.FindFirst("jti")?.Value;
        var expiresAt = User.FindFirst("exp")?.Value;
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (User.Identity?.IsAuthenticated != true && Request.Headers["X-Session-Refresh"] != "1")
            return BadRequest(new ProblemDetails { Status = 400, Title = "Yêu cầu đăng xuất chưa hợp lệ." });
        if (!string.IsNullOrWhiteSpace(tokenId) &&
            long.TryParse(expiresAt, NumberStyles.None, CultureInfo.InvariantCulture, out var expirySeconds))
            await authService.LogoutAsync(tokenId, DateTimeOffset.FromUnixTimeSeconds(expirySeconds), cancellationToken);
        var sessionId = User.FindFirst("sid")?.Value;
        var userId = User.FindFirst("sub")?.Value;
        if (sessionId is not null && userId is not null)
            await sessions.EndAsync(userId, sessionId, cancellationToken);
        else
        {
            // Đăng xuất vẫn thu hồi cookie khi access token đã hết hạn.
            var current = await sessions.RefreshAsync(Request.Cookies[RefreshCookie], cancellationToken);
            var cookie = Request.Cookies[RefreshCookie];
            if (current is not null && cookie is not null)
                await sessions.EndAsync(current.User.Id, cookie[..32], cancellationToken);
        }
        Response.Cookies.Delete(RefreshCookie, CookieSettings());
        Response.Headers.CacheControl = "no-store";
        return NoContent();
    }

    // ForgotPassword: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [EnableRateLimiting("password-reset-request")]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (!passwordResetService.IsAvailable)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new ProblemDetails
            {
                Status = StatusCodes.Status503ServiceUnavailable,
                Title = "Chức năng đặt lại mật khẩu hiện chưa được cấu hình."
            });

        await passwordResetService.RequestAsync(request.Email, cancellationToken);
        return Accepted(new { message = "Nếu email có tài khoản hợp lệ, hướng dẫn đặt lại mật khẩu sẽ được gửi." });
    }

    // ResetPassword: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [HttpPost("reset-password")]
    [AllowAnonymous]
    [EnableRateLimiting("password-reset-submit")]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var reset = await passwordResetService.ResetAsync(request.Token, request.NewPassword,
                request.ConfirmPassword, cancellationToken);
            return reset ? NoContent() : BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."
            });
        }
        catch (ArgumentException ex)
        {
            ModelState.AddModelError(ex.ParamName ?? "request", ex.Message);
            return ValidationProblem(ModelState);
        }
    }

    // RegisterRequest: định nghĩa dữ liệu trao đổi của tính năng.
    [JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
    public sealed record RegisterRequest(string? FullName, string? Email, string? Password, string? ConfirmPassword);
    // LoginRequest: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
    [JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
    public sealed class LoginRequest
    {
        [Required(ErrorMessage = "Vui lòng nhập email.")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
        [MaxLength(254, ErrorMessage = "Email không được vượt quá 254 ký tự.")]
        public string? Email { get; init; }
        [Required(ErrorMessage = "Vui lòng nhập mật khẩu.")]
        public string? Password { get; init; }
        public bool RememberMe { get; init; } = true;
    }
    // ForgotPasswordRequest: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
    [JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
    public sealed class ForgotPasswordRequest
    {
        [Required(ErrorMessage = "Vui lòng nhập email.")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
        [MaxLength(254, ErrorMessage = "Email không được vượt quá 254 ký tự.")]
        public string? Email { get; init; }
    }
    // ResetPasswordRequest: định nghĩa dữ liệu trao đổi của tính năng.
    [JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
    public sealed record ResetPasswordRequest(string? Token, string? NewPassword, string? ConfirmPassword);

    // AuthResponse: định nghĩa dữ liệu trao đổi của tính năng.
    public sealed record AuthResponse(
        string AccessToken, string TokenType, DateTimeOffset ExpiresAtUtc,
        AuthenticatedUser User)
    {
        // From: Chuyển dữ liệu nội bộ sang cấu trúc trả về cho bên gọi.
        public static AuthResponse From(AuthResult result) =>
            new(result.Token.Value, "Bearer", result.Token.ExpiresAtUtc, result.User);
    }
}
