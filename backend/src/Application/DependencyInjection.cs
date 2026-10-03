using Application.Features.AiChat;
using Application.Features.Administration;
using Application.Features.Auth;
using Application.Features.FoodScanning;
using Application.Features.Moderation;
using Application.Features.Profiles;
using Microsoft.Extensions.DependencyInjection;

namespace Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<AiChatService>();
        services.AddScoped<AuthService>();
        services.AddScoped<AiChatGuestService>();
        services.AddScoped<FoodScanningService>();
        services.AddScoped<ModerationService>();
        services.AddScoped<ProfileService>();
        services.AddScoped<MemberService>();
        return services;
    }
}
