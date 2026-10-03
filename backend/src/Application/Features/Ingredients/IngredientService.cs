using System.ComponentModel.DataAnnotations;
using Application.Common.Exceptions;
using Application.Common.Validation;
using Domain.Entities;

namespace Application.Features.Ingredients;

public sealed class IngredientService(IIngredientRepository repository)
{
    public async Task<IngredientPage> ListAsync(IngredientListQuery query, bool includeInactive, CancellationToken ct)
    {
        RequestValidation.Validate(query);
        var (items, count) = await repository.ListAsync(query, includeInactive, ct);
        return new(items.Select(IngredientMapping.ToResponse).ToArray(), query.PageNumber, query.PageSize, count);
    }

    public async Task<IngredientResponse> GetAsync(Guid id, bool includeInactive, CancellationToken ct)
    {
        var entity = await FindAsync(id, ct);
        if (!includeInactive && !entity.IsActive)
        {
            throw new KeyNotFoundException("Ingredient not found.");
        }
        return IngredientMapping.ToResponse(entity);
    }

    public async Task<IngredientResponse> CreateAsync(IngredientRequest request, CancellationToken ct)
    {
        var entity = new Ingredient();
        await ApplyAsync(entity, request, ct);
        repository.Add(entity);
        await repository.SaveAsync(ct);
        return IngredientMapping.ToResponse(entity);
    }

    public async Task<IngredientResponse> UpdateAsync(Guid id, IngredientRequest request, CancellationToken ct)
    {
        var entity = await FindAsync(id, ct);
        await ApplyAsync(entity, request, ct);
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await repository.SaveAsync(ct);
        return IngredientMapping.ToResponse(entity);
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

    private async Task<Ingredient> FindAsync(Guid id, CancellationToken ct) =>
        await repository.GetAsync(id, ct) ?? throw new KeyNotFoundException("Ingredient not found.");

    private async Task ApplyAsync(Ingredient entity, IngredientRequest request, CancellationToken ct)
    {
        IngredientValidation.Validate(request);
        if (await repository.NameExistsAsync(request.Name.Trim(), entity.Id, ct))
        {
            throw new ConflictException("Ingredient name already exists.");
        }

        entity.Name = request.Name.Trim();
        entity.Aliases = request.Aliases?.Trim();
        entity.Origin = request.Origin;
        entity.ContainsEgg = request.ContainsEgg;
        entity.ContainsMilk = request.ContainsMilk;
        entity.ContainsHoney = request.ContainsHoney;
        entity.ContainsOtherAnimalProducts = request.ContainsOtherAnimalProducts;
        entity.Allergens = request.Allergens?.Trim();
        entity.DefaultUnit = request.DefaultUnit?.Trim();
        entity.CaloriesPer100Gram = request.CaloriesPer100Gram;
        entity.ProteinGramPer100Gram = request.ProteinGramPer100Gram;
        entity.CarbohydrateGramPer100Gram = request.CarbohydrateGramPer100Gram;
        entity.FatGramPer100Gram = request.FatGramPer100Gram;
        entity.Source = request.Source?.Trim();
    }
}
