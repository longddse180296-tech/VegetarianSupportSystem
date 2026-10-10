using Application;
using Api.Controllers;
using Api.Configuration;
using Api.Authorization;
using CoreDataChecks;
using Infrastructure;
using Infrastructure.Persistence;
using Application.Features.Auth;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

var database = "CoreDataChecks_" + Guid.NewGuid().ToString("N");
var connection = new SqlConnectionStringBuilder(
    Environment.GetEnvironmentVariable("CORE_DATA_TEST_CONNECTION") ??
    @"Server=(localdb)\MSSQLLocalDB;Integrated Security=true;TrustServerCertificate=true")
{
    InitialCatalog = database
};
var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
builder.Configuration["ConnectionStrings:DefaultConnection"] = connection.ConnectionString;
builder.Configuration["PasswordReset:ResetPageUrl"] = "http://localhost:5173/#/auth/reset-password";
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddSingleton<IAccessTokenIssuer>(
    new JwtAccessTokenIssuer("integration-tests", "integration-tests", new string('k', 32)));
builder.Services.AddSingleton<CapturingResetEmailSender>();
builder.Services.AddSingleton<IPasswordResetEmailSender>(provider =>
    provider.GetRequiredService<CapturingResetEmailSender>());
builder.Services.AddControllers().AddApplicationPart(typeof(CategoriesController).Assembly);
builder.Services.AddAuthentication("Test")
    .AddScheme<Microsoft.AspNetCore.Authentication.AuthenticationSchemeOptions, TestAuthenticationHandler>(
        "Test", _ => { });
builder.Services.AddAuthorization(AccountAuthorization.AddAccountPolicies);
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
await using var app = builder.Build();
app.UseExceptionHandler();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapOpenApi();
app.Urls.Add("http://127.0.0.1:0");

await using var scope = app.Services.CreateAsyncScope();
var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
var checks = 0;
void Check(bool condition, string name)
{
    if (!condition)
    {
        throw new InvalidOperationException("FAILED: " + name);
    }
    checks++;
    Console.WriteLine("PASS: " + name);
}

try
{
    if (args.Contains("--dashboard-only", StringComparer.Ordinal))
    {
        await db.Database.EnsureCreatedAsync();
        await app.StartAsync();
        using var dashboardClient = new HttpClient { BaseAddress = new Uri(app.Urls.Single()) };
        await DashboardApiChecks.RunAsync(dashboardClient, app.Services, Check);
        Console.WriteLine($"ALL {checks} DASHBOARD CHECKS PASSED");
        return;
    }

    DietaryChecks.Run(Check);
    await db.GetService<IMigrator>().MigrateAsync("20261002044444_InitialCoreData");
    var legacyId = Guid.NewGuid();
    await db.Database.ExecuteSqlInterpolatedAsync($@"
        INSERT INTO Ingredients
            (Id, Name, Origin, ContainsEgg, ContainsMilk, ContainsHoney, IsActive, CreatedAt)
        VALUES ({legacyId}, {"Legacy animal"}, {2}, {true}, {false}, {false}, {false}, {DateTimeOffset.UtcNow})");
    await db.Database.MigrateAsync();
    var legacy = await db.Ingredients.AsNoTracking().SingleAsync(x => x.Id == legacyId);
    Check(legacy.ContainsOtherAnimalProducts is null, "upgrade preserves unverified legacy evidence");
    Check(Domain.Rules.DietaryRules.Classify([legacy]).Single(x =>
        x.DietaryType == Domain.Enums.DietaryType.OvoVegetarian).Status == Domain.Enums.DietaryCompatibility.Unknown,
        "legacy animal ingredient is not silently marked compatible");
    Check(!(await db.Database.GetPendingMigrationsAsync()).Any(), "all migrations applied");
    await app.StartAsync();
    using var client = new HttpClient { BaseAddress = new Uri(app.Urls.Single()) };
    await CoreDataApiChecks.RunAsync(client, db, Check);
    await SeedFilterChecks.RunAsync(client, db, Check);
    await PasswordResetApiChecks.RunAsync(client,
        app.Services.GetRequiredService<CapturingResetEmailSender>(), Check);
    await SmtpTransportChecks.RunAsync(Check);
    await PasswordResetChecks.RunAsync(db, Check);
    await DashboardApiChecks.RunAsync(client, app.Services, Check);
    await MemberApiChecks.RunAsync(client, app.Services, Check);

    await app.StopAsync();
    await db.GetService<IMigrator>().MigrateAsync("0");
    Check(!(await db.Database.GetAppliedMigrationsAsync()).Any(), "migration rollback");
    await db.Database.MigrateAsync();
    Check(await db.Categories.CountAsync() == 0, "migration reapply without automatic sample data");
    Console.WriteLine($"ALL {checks} CHECKS PASSED");
}
finally
{
    await app.StopAsync();
    // InitialCatalog is always replaced with the unique test DB; never delete the supplied DB.
    await db.Database.EnsureDeletedAsync();
    Console.WriteLine("Temporary test database removed: " + database);
}
