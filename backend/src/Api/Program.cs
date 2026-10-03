using Api.Configuration;
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

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var ids = context.Principal?.FindAll("sub").ToArray() ?? [];
                var roles = context.Principal?.FindAll("role").ToArray() ?? [];
                if (ids.Length != 1 || roles.Length != 1 ||
                    string.IsNullOrWhiteSpace(ids[0].Value) ||
                    roles[0].Value is not ("User" or "Admin"))
                {
                    context.Fail("Invalid account claims.");
                    return;
                }

                var accounts = context.HttpContext.RequestServices.GetRequiredService<IUserAccountRepository>();
                var user = await accounts.FindByIdAsync(ids[0].Value, context.HttpContext.RequestAborted);
                if (user is null || user.IsLocked || user.Role.ToString() != roles[0].Value)
                    context.Fail("Account is unavailable or role has changed.");
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
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();
await InitialAdminSeeder.SeedAsync(app.Services, app.Configuration, app.Lifetime.ApplicationStopping);
app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
        options.SwaggerEndpoint("/openapi/v1.json", "Vegetarian Support API v1"));
    app.MapGet("/", () => Results.Redirect("/swagger"))
        .ExcludeFromDescription();
    app.MapPost("/api/dev-auth/token", (
        DevelopmentTokenRequest request,
        DevelopmentTokenIssuer tokenIssuer) =>
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

        return Results.Ok(tokenIssuer.Issue(userId, role));
    }).WithTags("Development Auth");
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseRouting();
app.UseSession();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
