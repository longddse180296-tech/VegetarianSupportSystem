using Application.Common.Exceptions;
using Application.Common.Validation;
using Domain.Entities;
using Application.Features.Categories;
using Application.Features.Ingredients;

namespace Application.Features.Recipes;

public sealed class RecipeService(
    IRecipeRepository repository,
    ICategoryRepository categories,
    IIngredientRepository ingredients)
{
    public async Task<RecipePage> ListAsync(RecipeListQuery query, bool includeInactive, CancellationToken ct)
    {
        RequestValidation.Validate(query);
        var (items, count) = await repository.ListAsync(query, includeInactive, ct);
        return new(items.Select(RecipeMapping.ToSummary).ToArray(), query.PageNumber, query.PageSize, count);
    }

    public async Task<RecipeResponse> GetAsync(Guid id, bool includeInactive, CancellationToken ct)
    {
        var entity = await FindAsync(id, ct);
        if (!includeInactive && !entity.IsActive)
        {
            throw new KeyNotFoundException("Recipe not found.");
        }
        return RecipeMapping.ToResponse(entity);
    }

    public async Task<RecipeResponse> CreateAsync(RecipeRequest request, CancellationToken ct)
    {
        var entity = new Recipe();
        await ApplyAsync(entity, request, ct);
        repository.Add(entity);
        await repository.SaveAsync(ct);
        return RecipeMapping.ToResponse(entity);
    }

    public async Task<RecipeResponse> UpdateAsync(Guid id, RecipeRequest request, CancellationToken ct)
    {
        var entity = await FindAsync(id, ct);
        await ApplyAsync(entity, request, ct);
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await repository.SaveAsync(ct);
        return RecipeMapping.ToResponse(entity);
    }

    public async Task DeactivateAsync(Guid id, CancellationToken ct)
    {
        var entity = await FindAsync(id, ct);
        if (!entity.IsActive)
        {
            return;
        }
        entity.IsActive = false;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await repository.SaveAsync(ct);
    }

    private async Task<Recipe> FindAsync(Guid id, CancellationToken ct) =>
        await repository.GetAsync(id, ct) ?? throw new KeyNotFoundException("Recipe not found.");

    private async Task ApplyAsync(Recipe entity, RecipeRequest request, CancellationToken ct)
    {
        RecipeValidation.Validate(request);
        if (await repository.NameExistsAsync(request.Name.Trim(), entity.Id, ct))
        {
            throw new ConflictException("Recipe name already exists.");
        }

        var category = await categories.GetAsync(request.CategoryId, ct);
        if (category is null || (!category.IsActive && entity.CategoryId != category.Id))
        {
            RecipeValidation.Fail(nameof(request.CategoryId), "Select an active category.");
        }
        var ids = request.Ingredients.Select(x => x.IngredientId).ToArray();
        var selected = await ingredients.GetManyAsync(ids, ct);
        var existingIds = entity.RecipeIngredients.Select(x => x.IngredientId).ToHashSet();
        if (selected.Count != ids.Length || selected.Any(x => !x.IsActive && !existingIds.Contains(x.Id)))
        {
            RecipeValidation.Fail(nameof(request.Ingredients), "Select existing, active ingredients.");
        }
        entity.Category = category;
        UpdateIngredients(entity, request.Ingredients, selected);

        entity.CategoryId = request.CategoryId;
        entity.Name = request.Name.Trim();
        entity.Description = request.Description?.Trim();
        entity.Servings = request.Servings;
        entity.Instructions = request.Instructions.Trim();
        entity.PrepTimeMinutes = request.PrepTimeMinutes;
        entity.CookTimeMinutes = request.CookTimeMinutes;
        entity.ImageUrl = request.ImageUrl?.Trim();
        entity.CaloriesPerServing = request.CaloriesPerServing;
        entity.ProteinGramPerServing = request.ProteinGramPerServing;
        entity.CarbohydrateGramPerServing = request.CarbohydrateGramPerServing;
        entity.FatGramPerServing = request.FatGramPerServing;
    }

    private static void UpdateIngredients(
        Recipe entity,
        IReadOnlyList<RecipeIngredientRequest> rows,
        IReadOnlyList<Ingredient> selected)
    {
        var ids = rows.Select(row => row.IngredientId).ToHashSet();
        // Update retained rows in place to avoid tracking two instances of the same composite key.
        foreach (var removed in entity.RecipeIngredients.Where(x => !ids.Contains(x.IngredientId)).ToArray())
        {
            entity.RecipeIngredients.Remove(removed);
        }
        foreach (var row in rows)
        {
            var link = entity.RecipeIngredients.SingleOrDefault(x => x.IngredientId == row.IngredientId);
            if (link is null)
            {
                link = new RecipeIngredient { RecipeId = entity.Id, IngredientId = row.IngredientId };
                entity.RecipeIngredients.Add(link);
            }
            link.Ingredient = selected.Single(x => x.Id == row.IngredientId);
            link.Quantity = row.Quantity;
            link.Unit = row.Unit.Trim();
            link.Note = row.Note?.Trim();
        }
    }
}
