using Application.Features.Categories;
using Application.Features.Ingredients;
using Application.Features.Recipes;
using Microsoft.Extensions.DependencyInjection;

namespace Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<CategoryService>();
        services.AddScoped<IngredientService>();
        services.AddScoped<RecipeService>();
        return services;
    }
}
