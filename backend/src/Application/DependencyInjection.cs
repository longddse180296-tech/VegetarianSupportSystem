// Chức năng: hạ tầng và quy tắc dùng chung. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
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
using Application.Features.Videos;
using Application.Features.Comments;
using Microsoft.Extensions.DependencyInjection;

namespace Application;

// DependencyInjection: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public static class DependencyInjection
{
    // AddApplication: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<AiChatService>();
        services.AddScoped<ArticleService>();
        services.AddScoped<CommentService>();
        services.AddScoped<AuthService>();
        services.AddScoped<AccountSessionService>();
        services.AddScoped<PasswordResetService>();
        services.AddSingleton(TimeProvider.System);
        services.AddScoped<AiChatGuestService>();
        services.AddScoped<FoodScanningService>();
        services.AddScoped<ModerationService>();
        services.AddScoped<ContentReportService>();
        services.AddScoped<ProfileService>();
        services.AddScoped<IProfileContextReader>(provider => provider.GetRequiredService<ProfileService>());
        services.AddScoped<MemberService>();
        services.AddScoped<FeedbackService>();
        services.AddScoped<DashboardService>();
        services.AddScoped<FeaturedContentService>();
        services.AddScoped<CategoryService>();
        services.AddScoped<IngredientService>();
        services.AddScoped<RecipeService>();
        services.AddScoped<RecipeNutritionService>();
        services.AddScoped<RestaurantService>();
        services.AddScoped<PantryService>();
        services.AddScoped<FavoriteService>();
        services.AddScoped<MealPlanService>();
        services.AddScoped<VideoService>();
        return services;
    }
}
