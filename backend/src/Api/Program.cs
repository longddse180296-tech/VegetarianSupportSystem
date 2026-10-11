using Api.Configuration;
using Api.Authorization;
using Application;
using Application.Features.Auth;
using Infrastructure;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Serialization;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Seeding;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddJsonFile(
        "appsettings.Local.json",
        optional: true,
        reloadOnChange: true);
}

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddControllers().AddJsonOptions(options =>
    options.JsonSerializerOptions.Converters.Add(
        new JsonStringEnumConverter(allowIntegerValues: false)));
builder.Services.AddOpenApi(options =>
    options.AddDocumentTransformer<BearerOpenApiTransformer>());
builder.Services.AddProblemDetails();
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.IdleTimeout = TimeSpan.FromMinutes(30);
});

var jwtIssuer = builder.Configuration["Authentication:Jwt:Issuer"];
var jwtAudience = builder.Configuration["Authentication:Jwt:Audience"];
var jwtSigningKey = builder.Configuration["Authentication:Jwt:SigningKey"];
if (builder.Environment.IsDevelopment())
{
    jwtIssuer = string.IsNullOrWhiteSpace(jwtIssuer)
        ? "VegetarianSupport.Development"
        : jwtIssuer;
    jwtAudience = string.IsNullOrWhiteSpace(jwtAudience)
        ? "VegetarianSupport.Swagger"
        : jwtAudience;
    jwtSigningKey = string.IsNullOrWhiteSpace(jwtSigningKey)
        ? Convert.ToHexString(RandomNumberGenerator.GetBytes(32))
        : jwtSigningKey;
    builder.Services.AddSingleton(new DevelopmentTokenIssuer(
        jwtIssuer, jwtAudience, jwtSigningKey));
}
if (!string.IsNullOrEmpty(jwtSigningKey) && Encoding.UTF8.GetByteCount(jwtSigningKey) < 32)
{
    throw new InvalidOperationException("Authentication:Jwt:SigningKey must contain at least 32 UTF-8 bytes.");
}
if (string.IsNullOrWhiteSpace(jwtIssuer) || string.IsNullOrWhiteSpace(jwtAudience)
    || string.IsNullOrWhiteSpace(jwtSigningKey))
{
    throw new InvalidOperationException("Authentication:Jwt:Issuer, Audience and SigningKey must be configured.");
}
builder.Services.AddSingleton<IAccessTokenIssuer>(
    new JwtAccessTokenIssuer(jwtIssuer, jwtAudience, jwtSigningKey));
builder.Services.AddScoped<AccountTokenValidator>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var validator = context.HttpContext.RequestServices.GetRequiredService<AccountTokenValidator>();
                if (!await validator.IsValidAsync(context.Principal, context.HttpContext.RequestAborted))
                    context.Fail("Token is no longer valid for this account.");
            }
        };
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = string.IsNullOrEmpty(jwtSigningKey)
                ? null
                : new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSigningKey)),
            NameClaimType = "sub",
            RoleClaimType = "role",
            ClockSkew = TimeSpan.Zero
        };
    });
builder.Services.AddAuthorization(AccountAuthorization.AddAccountPolicies);
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("password-reset-request", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(15),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
    options.AddPolicy("password-reset-submit", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(15),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
});

var app = builder.Build();
await InitialAdminSeeder.SeedAsync(app.Services, app.Configuration, app.Lifetime.ApplicationStopping);

if (args.Contains("--seed-core-data", StringComparer.Ordinal))
{
    if (!app.Environment.IsDevelopment())
    {
        throw new InvalidOperationException("Sample data can only be seeded in Development.");
    }

    await using var scope = app.Services.CreateAsyncScope();
    await CoreDataSeeder.SeedAsync(scope.ServiceProvider.GetRequiredService<AppDbContext>());
    app.Logger.LogInformation("Core Data sample seed completed.");
    return;
}

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
        options.SwaggerEndpoint("/openapi/v1.json", "Vegetarian Support API v1"));
    app.MapGet("/", () => Results.Redirect("/swagger"))
        .ExcludeFromDescription();
    app.MapPost("/api/dev-auth/token", async (
        DevelopmentTokenRequest request,
        DevelopmentTokenIssuer tokenIssuer,
        IUserAccountRepository accounts,
        CancellationToken cancellationToken) =>
    {
        var userId = request.UserId?.Trim();
        var role = request.Role?.Trim();
        if (string.IsNullOrWhiteSpace(userId) || userId.Length > 450
            || role is not ("User" or "Admin"))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["userId"] = ["User ID phải dài từ 1 đến 450 ký tự."],
                ["role"] = ["Role phải là User hoặc Admin."]
            });
        }

        var user = await accounts.FindByIdAsync(userId, cancellationToken);
        if (user is null || user.IsLocked || user.Role.ToString() != role)
            return Results.BadRequest(new { message = "User ID and role must match an active account." });
        return Results.Ok(tokenIssuer.Issue(userId, role, user.TokenVersion));
    }).WithTags("Development Auth");
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseRouting();
app.UseRateLimiter();
app.UseSession();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
