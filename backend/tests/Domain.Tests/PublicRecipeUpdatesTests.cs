using Api.Controllers;
using Api.Hubs;
using Application.Features.Categories;
using Application.Features.Ingredients;
using Application.Features.Recipes;
using Domain.Entities;
using Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging.Abstractions;

namespace Domain.Tests;

public sealed class PublicRecipeUpdatesTests
{
    [Theory]
    [InlineData("create")]
    [InlineData("update")]
    [InlineData("activate")]
    [InlineData("deactivate")]
    public async Task NotifiesPublicClientsOnlyAfterSuccessfulSave(string operation)
    {
        var fixture = new Fixture();
        var result = await fixture.Execute(operation);
        Assert.IsAssignableFrom<IActionResult>(result);
        Assert.Equal(new[] { "saved", "notified" }, fixture.Events);
    }

    [Theory]
    [InlineData("create")]
    [InlineData("update")]
    [InlineData("activate")]
    [InlineData("deactivate")]
    public async Task FailedSaveDoesNotBroadcast(string operation)
    {
        var fixture = new Fixture { FailSave = true };
        await Assert.ThrowsAsync<InvalidOperationException>(() => fixture.Execute(operation));
        Assert.Empty(fixture.Events);
    }

    [Fact]
    public async Task NotificationFailureDoesNotFailAnAlreadySavedRecipe()
    {
        var fixture = new Fixture { FailNotification = true };
        Assert.IsType<CreatedAtActionResult>(await fixture.Execute("create"));
        Assert.Equal(new[] { "saved", "notified" }, fixture.Events);
    }

    private sealed class Fixture : IRecipeRepository, ICategoryRepository, IIngredientRepository,
        IHubContext<PublicRecipesHub, IPublicRecipesClient>, IHubClients<IPublicRecipesClient>, IPublicRecipesClient
    {
        public List<string> Events { get; } = [];
        public bool FailSave { get; init; }
        public bool FailNotification { get; init; }
        private readonly Category category = new() { Name = "Danh mục test", Kind = CategoryKind.Recipe };
        private readonly Ingredient ingredient = new()
        {
            Name = "Nguyên liệu test", DefaultUnit = "g", Calories = 100,
            ProteinGram = 10, CarbohydrateGram = 10, FatGram = 1
        };
        private readonly Recipe recipe = new() { Name = "Công thức test" };

        public Task<IActionResult> Execute(string operation)
        {
            recipe.IsActive = operation != "activate";
            var service = new RecipeService(this, this, this);
            var updates = new PublicRecipeUpdates(this, NullLogger<PublicRecipeUpdates>.Instance);
            var controller = new RecipesController(service, updates);
            var request = new RecipeRequest
            {
                Name = "Công thức test", CategoryId = category.Id, Servings = 1,
                PrepTimeMinutes = 5, CookTimeMinutes = 10, Instructions = "Nấu chín.",
                ImageUrl = "https://example.com/recipe.png", DeclaredDietaryType = DietaryType.Vegan,
                Ingredients = [new() { IngredientId = ingredient.Id, Quantity = 100, Unit = "g" }]
            };
            return operation switch
            {
                "create" => controller.Create(request, default),
                "update" => controller.Update(recipe.Id, request, default),
                "activate" => controller.Activate(recipe.Id, default),
                _ => controller.Deactivate(recipe.Id, default)
            };
        }

        public Task RecipesChanged()
        {
            Events.Add("notified");
            return FailNotification ? Task.FromException(new IOException("Disconnected")) : Task.CompletedTask;
        }
        public IHubClients<IPublicRecipesClient> Clients => this;
        public IGroupManager Groups => throw new NotSupportedException();
        public IPublicRecipesClient All => this;
        public IPublicRecipesClient AllExcept(IReadOnlyList<string> ids) => throw new NotSupportedException();
        public IPublicRecipesClient Client(string id) => throw new NotSupportedException();
        IPublicRecipesClient IHubClients<IPublicRecipesClient>.Clients(IReadOnlyList<string> ids) => throw new NotSupportedException();
        public IPublicRecipesClient Group(string name) => throw new NotSupportedException();
        public IPublicRecipesClient GroupExcept(string name, IReadOnlyList<string> ids) => throw new NotSupportedException();
        IPublicRecipesClient IHubClients<IPublicRecipesClient>.Groups(IReadOnlyList<string> names) => throw new NotSupportedException();
        public IPublicRecipesClient User(string id) => throw new NotSupportedException();
        public IPublicRecipesClient Users(IReadOnlyList<string> ids) => throw new NotSupportedException();

        public Task SaveAsync(CancellationToken ct)
        {
            if (FailSave) throw new InvalidOperationException("Save failed");
            Events.Add("saved");
            return Task.CompletedTask;
        }
        public Task<int> CountRequiringReviewAsync(CancellationToken ct) => Task.FromResult(0);
        public Task<bool> NameExistsAsync(string name, Guid? exceptId, CancellationToken ct) => Task.FromResult(false);
        public Task<bool> NameExistsAsync(string name, Guid? exceptId, CategoryKind kind, CancellationToken ct) => Task.FromResult(false);
        Task<Recipe?> IRecipeRepository.GetAsync(Guid id, CancellationToken ct) => Task.FromResult<Recipe?>(recipe);
        Task<Category?> ICategoryRepository.GetAsync(Guid id, CancellationToken ct) => Task.FromResult<Category?>(category);
        Task<Ingredient?> IIngredientRepository.GetAsync(Guid id, CancellationToken ct) => Task.FromResult<Ingredient?>(ingredient);
        public Task<IReadOnlyList<Ingredient>> GetManyAsync(IReadOnlyCollection<Guid> ids, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<Ingredient>>([ingredient]);
        public Task<IReadOnlyList<Recipe>> GetDependentRecipesAsync(Guid id, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<Recipe>>([]);
        public void Add(Recipe entity) { }
        public void Add(Category entity) { }
        public void Add(Ingredient entity) { }
        public Task<(IReadOnlyList<Recipe>, int)> ListAsync(RecipeListQuery query, bool inactive, CancellationToken ct) => throw new NotSupportedException();
        public Task<(IReadOnlyList<Category>, int)> ListAsync(CategoryListQuery query, bool inactive, CategoryKind kind, CancellationToken ct) => throw new NotSupportedException();
        public Task<(IReadOnlyList<Ingredient>, int)> ListAsync(IngredientListQuery query, bool inactive, CancellationToken ct) => throw new NotSupportedException();
    }
}
