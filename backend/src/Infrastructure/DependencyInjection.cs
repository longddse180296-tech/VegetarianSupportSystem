using Application.Abstractions.AI;
using Application.Features.AiChat;
using Application.Features.Articles;
using Application.Features.Administration;
using Application.Features.Auth;
using Application.Features.Moderation;
using Application.Features.Profiles;
using Infrastructure.AI;
using Infrastructure.AI.Gemini;
using Infrastructure.Identity;
using Application.Features.Categories;
using Application.Features.Ingredients;
using Application.Features.Recipes;
using Application.Features.Restaurants;
using Application.Features.Pantry;
using Application.Features.Favorites;
using Application.Features.MealPlans;
using Application.Features.Comments;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Repositories;
using Infrastructure.Documents;
using Infrastructure.BackgroundJobs;
using Application.Features.Videos;
using Application.Features.FoodScanning;
using Application.Features.Media;
using Infrastructure.Storage;
using Infrastructure.Email;
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
        services.AddScoped<IAiChatContextRepository, AiChatContextRepository>();
        services.AddScoped<IArticleRepository, ArticleRepository>();
        services.AddScoped<ICommentRepository, CommentRepository>();
        services.AddScoped<IUserAccountRepository, UserAccountRepository>();
        services.AddScoped<IMemberRepository, MemberRepository>();
        services.AddScoped<IDashboardRepository, DashboardRepository>();
        services.AddScoped<IFeaturedContentRepository, FeaturedContentRepository>();
        services.AddScoped<IUserProfileRepository, UserProfileRepository>();
        services.AddScoped<IRevokedAccessTokenRepository, RevokedAccessTokenRepository>();
        services.AddScoped<IPasswordResetRepository, PasswordResetRepository>();
        services.AddSingleton<IPasswordResetEmailSender, SmtpPasswordResetEmailSender>();
        services.AddSingleton<IPasswordResetFailureReporter, PasswordResetFailureReporter>();
        services.AddSingleton(new PasswordResetOptions(configuration["PasswordReset:ResetPageUrl"]));
        services.AddSingleton<IAccountPasswordHasher, Pbkdf2PasswordHasher>();
        services.AddScoped<IModerationRepository, ModerationRepository>();
        services.AddScoped<VideoRepository>();
        services.AddScoped<IVideoRepository>(sp => sp.GetRequiredService<VideoRepository>());
        services.AddScoped<IVideoPublication>(sp => sp.GetRequiredService<VideoRepository>());
        services.AddSingleton<IPrivateMediaStore, LocalPrivateMediaStore>();
        services.AddSingleton<IPublicImageStore, LocalPublicImageStore>();
        services.AddScoped<IFoodScanRepository, FoodScanRepository>();
        services.AddHostedService<ModerationAiWorker>();
        services.AddHttpClient<IGeminiService, GeminiService>(client =>
            client.Timeout = TimeSpan.FromSeconds(45));
        services.AddScoped<IAiChatAnswerService, GeminiAiChatAnswerService>();

        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IIngredientRepository, IngredientRepository>();
        services.AddScoped<IRecipeRepository, RecipeRepository>();
        services.AddScoped<IRestaurantRepository, RestaurantRepository>();
        services.AddScoped<IPantryRepository, PantryRepository>();
        services.AddScoped<IFavoriteRepository, FavoriteRepository>();
        services.AddScoped<IMealPlanRepository, MealPlanRepository>();
        services.AddSingleton<IMealPlanPdfRenderer, MealPlanPdfRenderer>();
        return services;
    }
}
