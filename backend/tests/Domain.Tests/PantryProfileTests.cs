// Tủ bếp đối chiếu chế độ ăn/dị ứng mà không yêu cầu BMI hoặc dữ liệu cơ thể.
using Application.Features.Pantry;
using Domain.Entities;
using Domain.Enums;
namespace Domain.Tests;
public sealed class PantryProfileTests
{
    [Theory]
    [InlineData("Đậu phộng",null,null)]
    [InlineData("Lạc","đậu phộng",null)]
    [InlineData("Bột hỗn hợp",null,"đậu phộng")]
    public async Task DeclaredAllergyMatchesNameAliasOrAllergenWithoutBodyData(string name,string? aliases,string? allergens)
    {
        var profile=UserProfile.Create("owner",DateTimeOffset.UtcNow);
        profile.SetDiet(VegetarianDiet.Vegan,DateTimeOffset.UtcNow);
        profile.AddAllergy("Đậu phộng",DateTimeOffset.UtcNow);
        var ingredient=new Ingredient {Name=name,Aliases=aliases,Allergens=allergens,Origin=IngredientOrigin.Plant,ContainsOtherAnimalProducts=false};
        var repo=new Repository(profile,ingredient);
        var service=new PantryService(repo);
        var item=Assert.Single(await service.ListAsync("owner",default));
        Assert.Contains("Đậu phộng",item.AllergenWarnings);
        Assert.Empty(await service.GetRecipeSuggestionsAsync("owner",new(),default));
        profile.RemoveAllergy(profile.Allergies.Single().Id,DateTimeOffset.UtcNow);
        Assert.Single(await service.GetRecipeSuggestionsAsync("owner",new(),default));
        ingredient.ContainsMilk=true;
        Assert.Empty(await service.GetRecipeSuggestionsAsync("owner",new(),default));
        profile.SetDiet(VegetarianDiet.Lacto,DateTimeOffset.UtcNow);
        Assert.Single(await service.GetRecipeSuggestionsAsync("owner",new(),default));
        Assert.Null(profile.HeightCm); Assert.Null(profile.WeightKg);
    }
    private sealed class Repository(UserProfile profile,Ingredient ingredient):IPantryRepository
    {
        public Task<UserProfile?> GetProfileAsync(string id,CancellationToken ct)=>Task.FromResult<UserProfile?>(profile);
        public Task<IReadOnlyList<PantryItem>> ListAsync(string id,CancellationToken ct)=>Task.FromResult<IReadOnlyList<PantryItem>>([new(){UserId=id,IngredientId=ingredient.Id,Ingredient=ingredient}]);
        public Task<IReadOnlyList<Recipe>> GetActiveRecipesAsync(CancellationToken ct)=>Task.FromResult<IReadOnlyList<Recipe>>([new(){Name="Món kiểm thử",RecipeIngredients=[new(){IngredientId=ingredient.Id,Ingredient=ingredient,Quantity=1,Unit="g"}]}]);
        public Task<PantryItem?> GetAsync(Guid id,string user,CancellationToken ct)=>throw new NotSupportedException();
        public Task<Ingredient?> GetActiveIngredientAsync(Guid id,CancellationToken ct)=>throw new NotSupportedException();
        public Task<Ingredient?> FindActiveIngredientByNameOrAliasAsync(string name,CancellationToken ct)=>throw new NotSupportedException();
        public Task<bool> HasIngredientAsync(string user,Guid id,Guid? except,CancellationToken ct)=>throw new NotSupportedException();
        public Task<bool> HasCustomNameAsync(string user,string name,Guid? except,CancellationToken ct)=>throw new NotSupportedException();
        public Task<IReadOnlyList<Ingredient>> GetActiveIngredientsWithUnitAsync(string unit,CancellationToken ct)=>throw new NotSupportedException();
        public void Add(PantryItem item)=>throw new NotSupportedException();
        public void Remove(PantryItem item)=>throw new NotSupportedException();
        public Task SaveAsync(CancellationToken ct)=>throw new NotSupportedException();
    }
}
