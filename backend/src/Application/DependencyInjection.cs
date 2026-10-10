using Application.Features.AiChat;
using Application.Features.Articles;
using Application.Features.Administration;
using Application.Features.Auth;
using Application.Features.FoodScanning;
using Application.Features.Moderation;
using Application.Features.Profiles;
using Application.Features.Categories;
using Application.Features.Ingredients;
using Application.Features.Recipes;
using Application.Features.Restaurants;
using Application.Features.Pantry;
using Application.Features.Favorites;
using Application.Features.MealPlans;
using Microsoft.Extensions.DependencyInjection;

namespace Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<AiChatService>();
        services.AddScoped<ArticleService>();
        services.AddScoped<AuthService>();
        services.AddScoped<PasswordResetService>();
        services.AddSingleton(TimeProvider.System);
        services.AddScoped<AiChatGuestService>();
        services.AddScoped<FoodScanningService>();
        services.AddScoped<ModerationService>();
        services.AddScoped<ProfileService>();
        services.AddScoped<IProfileContextReader>(provider => provider.GetRequiredService<ProfileService>());
        services.AddScoped<MemberService>();
        services.AddScoped<DashboardService>();
        services.AddScoped<CategoryService>();
        services.AddScoped<IngredientService>();
        services.AddScoped<RecipeService>();
        services.AddScoped<RestaurantService>();
        services.AddScoped<PantryService>();
        services.AddScoped<FavoriteService>();
        services.AddScoped<MealPlanService>();
        return services;
    }
}
