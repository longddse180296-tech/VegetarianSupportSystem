using System.Text.Json.Serialization;
using Application.Features.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/auth")]
public sealed class AuthController(AuthService authService) : ControllerBase
{
    [HttpPost("register")]
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
