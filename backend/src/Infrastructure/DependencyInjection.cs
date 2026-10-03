using Application.Abstractions.AI;
using Application.Features.AiChat;
using Application.Features.Administration;
using Application.Features.Auth;
using Application.Features.Moderation;
using Application.Features.Profiles;
using Infrastructure.AI;
using Infrastructure.AI.Gemini;
using Infrastructure.Identity;
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
        services.AddScoped<IUserAccountRepository, UserAccountRepository>();
        services.AddScoped<IMemberRepository, MemberRepository>();
        services.AddScoped<IUserProfileRepository, UserProfileRepository>();
        services.AddScoped<IRevokedAccessTokenRepository, RevokedAccessTokenRepository>();
        services.AddSingleton<IAccountPasswordHasher, Pbkdf2PasswordHasher>();
        services.AddScoped<IModerationRepository, ModerationRepository>();
        services.AddHttpClient<IGeminiService, GeminiService>(client =>
            client.Timeout = TimeSpan.FromSeconds(45));
        if (bool.TryParse(configuration["AiChat:UseMockResponses"], out var useMockResponses)
            && useMockResponses)
        {
            services.AddScoped<IAiChatAnswerService, MockAiChatAnswerService>();
        }
        else
        {
            services.AddScoped<IAiChatAnswerService, GeminiAiChatAnswerService>();
        }

        return services;
    }
}
