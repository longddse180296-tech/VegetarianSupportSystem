using Application.Abstractions.AI;
using Application.Features.AiChat;
using Application.Features.Moderation;
using Infrastructure.AI.Gemini;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(connectionString));

        services.AddScoped<IAiChatRepository, AiChatRepository>();
        services.AddScoped<IModerationRepository, ModerationRepository>();
        services.AddScoped<IGeminiService, GeminiService>();
        services.AddScoped<IAiChatAnswerService, GeminiAiChatAnswerService>();

        return services;
    }
}
