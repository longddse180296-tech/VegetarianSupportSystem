using System.Globalization;
using System.Text.Json.Serialization;
using Application.Features.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(AuthService authService) : ControllerBase
{
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

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(
        [FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.LoginAsync(request.Email, request.Password, cancellationToken);
        return result is null
            ? Unauthorized(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Email hoặc mật khẩu không đúng, hoặc tài khoản đã bị khóa."
            })
            : Ok(AuthResponse.From(result));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<AuthenticatedUser>> Me(CancellationToken cancellationToken)
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();
        var user = await authService.GetCurrentUserAsync(userId, cancellationToken);
        return user is null ? Unauthorized() : Ok(user);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        var tokenId = User.FindFirst("jti")?.Value;
        var expiresAt = User.FindFirst("exp")?.Value;
        if (string.IsNullOrWhiteSpace(tokenId) ||
            !long.TryParse(expiresAt, NumberStyles.None, CultureInfo.InvariantCulture, out var expirySeconds))
            return Unauthorized();

        await authService.LogoutAsync(tokenId, DateTimeOffset.FromUnixTimeSeconds(expirySeconds), cancellationToken);
        return NoContent();
    }

    [JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
    public sealed record RegisterRequest(string? FullName, string? Email, string? Password, string? ConfirmPassword);
    public sealed record LoginRequest(string? Email, string? Password);

    public sealed record AuthResponse(
        string AccessToken, string TokenType, DateTimeOffset ExpiresAtUtc,
        AuthenticatedUser User)
    {
        public static AuthResponse From(AuthResult result) =>
            new(result.Token.Value, "Bearer", result.Token.ExpiresAtUtc, result.User);
    }
}
