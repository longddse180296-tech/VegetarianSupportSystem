using Application.Features.AiChat;
using Application.Features.Moderation;
using Microsoft.Extensions.DependencyInjection;

namespace Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<AiChatService>();
        services.AddScoped<AiChatGuestService>();
        services.AddScoped<ModerationService>();
        return services;
    }
}
