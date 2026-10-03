using Application;
using Infrastructure;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Seeding;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();

var app = builder.Build();

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
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthorization();

app.MapControllers();

app.Run();
