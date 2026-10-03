using Application;
using Api.Controllers;
using CoreDataChecks;
using Infrastructure;
using Infrastructure.Persistence;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using System.Security.Claims;

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
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddControllers().AddApplicationPart(typeof(CategoriesController).Assembly);
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
await using var app = builder.Build();
app.UseExceptionHandler();

// Synthetic identities are confined to this test executable on loopback.
app.Use(async (context, next) =>
{
    if (context.Request.Headers.TryGetValue("Test-Role", out var role))
    {
        context.User = new ClaimsPrincipal(
            new ClaimsIdentity([new Claim(ClaimTypes.Role, role.ToString())], "Test"));
    }
    await next();
});
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
