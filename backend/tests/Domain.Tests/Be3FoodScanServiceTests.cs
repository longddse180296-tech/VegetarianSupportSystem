using Application.Abstractions.AI;
using Application.Features.FoodScanning;
using Domain.Entities;
using Domain.Enums;

namespace Domain.Tests;

public sealed class Be3FoodScanServiceTests
{
    [Fact]
    public async Task ScanHistoryKeepsTheOriginalProfileAndReassessmentCreatesANewVersion()
    {
        var repository = new MemoryScanRepository();
        var service = new FoodScanningService(new UnusedAi(), repository);

        var unknown = await service.EvaluateAndSaveAsync("owner", "Dish",
            [new ConfirmedIngredient("Đậu hũ", IngredientKind.Plant)], true,
            null, false, ["Nguồn nước dùng"], null, CancellationToken.None);
        Assert.All(unknown.Assessments,
            x => Assert.Equal(FoodScanAssessmentStatus.InsufficientInformation, x.Status));

        repository.Profile = new ScanProfileSnapshot(VegetarianDiet.Ovo, ["đậu phộng"], DateTimeOffset.UtcNow);
        var revised = await service.EvaluateAndSaveAsync("owner", "Dish",
            [new ConfirmedIngredient("Nước mắm cá", IngredientKind.Animal)], true,
            null, false, [], unknown.Id, CancellationToken.None);
        Assert.All(revised.Assessments,
            x => Assert.Equal(FoodScanAssessmentStatus.Incompatible, x.Status));
        Assert.Equal(2, revised.ResultVersion);
        Assert.Equal(unknown.Id, revised.PreviousScanId);

        var original = await service.GetOwnedAsync(unknown.Id, "owner", CancellationToken.None);
        Assert.Equal(VegetarianDiet.Vegan, original!.ProfileSnapshot.Diet);
        Assert.Null(await service.GetOwnedAsync(unknown.Id, "another-user", CancellationToken.None));
    }

    [Theory]
    [InlineData("Dish", "AiSuggested")]
    [InlineData("Label", "LabelOcr")]
    public async Task UnconfirmedSuggestionIsNotTreatedAsConfirmedIngredient(string sourceType, string source)
    {
        var service = new FoodScanningService(new UnusedAi(), new MemoryScanRepository());
        var result = await service.EvaluateAndSaveAsync("owner", sourceType,
            [new ConfirmedIngredient("Đậu hũ", IngredientKind.Plant, source)],
            true, null, false, [], null, CancellationToken.None);

        Assert.All(result.Assessments,
            item => Assert.Equal(FoodScanAssessmentStatus.InsufficientInformation, item.Status));
    }

    [Fact]
    public async Task DishImagePrefillsKindsButLeavesConfirmationToTheUser()
    {
        var repository = new MemoryScanRepository
        {
            Evidence = [new ScanIngredientEvidence(Guid.NewGuid(), "Thịt xông khói",
                IngredientKind.Animal, null, null)]
        };
        var service = new FoodScanningService(new SuggestionAi(), repository);

        var result = await service.AnalyzeDishAsync([1], "image/png", CancellationToken.None);

        Assert.Equal("NeedsConfirmation", result.ProcessingStatus);
        Assert.Equal(["Cơm", "Thịt xông khói", "Gia vị không rõ"], result.VisibleIngredients);
        Assert.Equal([IngredientKind.Plant, IngredientKind.Animal, IngredientKind.Unknown],
            result.SuggestedIngredientKinds);
        Assert.All(result.Assessments,
            item => Assert.Equal(FoodScanAssessmentStatus.InsufficientInformation, item.Status));
    }

    [Fact]
    public async Task LabelPrefillsKindsFromAiAndCatalogWithoutHidingUnknownOrigins()
    {
        var repository = new MemoryScanRepository
        {
            Evidence = [new ScanIngredientEvidence(Guid.NewGuid(), "Sữa bò tươi",
                IngredientKind.Dairy, null, null)]
        };
        var service = new FoodScanningService(new SuggestionAi(), repository);

        var result = await service.AnalyzeLabelAsync([1], "image/png", CancellationToken.None);

        Assert.Equal("NeedsConfirmation", result.ProcessingStatus);
        Assert.Equal("Bí đỏ 500 g; Sữa bò tươi 350 g; Hương liệu", result.ExtractedText);
        Assert.Equal([IngredientKind.Plant, IngredientKind.Dairy, IngredientKind.Unknown],
            result.SuggestedIngredients.Select(item => item.Kind));
        Assert.Equal(["Bí đỏ", "Sữa bò tươi", "Hương liệu"],
            result.SuggestedIngredients.Select(item => item.Name));
    }

    private sealed class MemoryScanRepository : IFoodScanRepository
    {
        private readonly List<FoodScanRecord> records = [];
        public ScanProfileSnapshot Profile { get; set; } = new(VegetarianDiet.Vegan, [], DateTimeOffset.UtcNow);
        public IReadOnlyList<ScanIngredientEvidence> Evidence { get; set; } = [];
        public Task<ScanProfileSnapshot> GetProfileAsync(string userId, CancellationToken ct) => Task.FromResult(Profile);
        public Task<IReadOnlyList<ScanIngredientEvidence>> FindIngredientEvidenceAsync(
            IReadOnlyList<string> names, CancellationToken ct) =>
            Task.FromResult(Evidence);
        public Task AddAsync(FoodScanRecord record, CancellationToken ct)
        {
            records.Add(record);
            return Task.CompletedTask;
        }
        public Task<FoodScanRecord?> GetOwnedAsync(Guid id, string userId, CancellationToken ct) =>
            Task.FromResult(records.SingleOrDefault(x => x.Id == id && x.OwnerUserId == userId));
        public Task<(IReadOnlyList<FoodScanRecord> Items, int Total)> ListOwnedAsync(
            string userId, int page, int pageSize, CancellationToken ct)
        {
            var owned = records.Where(x => x.OwnerUserId == userId).ToArray();
            return Task.FromResult(((IReadOnlyList<FoodScanRecord>)owned.Skip((page - 1) * pageSize)
                .Take(pageSize).ToArray(), owned.Length));
        }
    }

    private sealed class SuggestionAi : IGeminiService
    {
        public Task<GeminiDishImageResponse> AnalyzeDishImageAsync(GeminiDishImageRequest request,
            CancellationToken cancellationToken = default) => Task.FromResult(new GeminiDishImageResponse(
            true, "Cơm thịt", ["Cơm", "Thịt xông khói", "Gia vị không rõ"],
            ["Nguồn gia vị"], [], SuggestedIngredientKinds:
            [IngredientKind.Plant, IngredientKind.Plant, IngredientKind.Unknown]));
        public Task<GeminiModerationResponse> CheckContentAsync(GeminiModerationRequest request,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<GeminiChatResponse> GenerateChatReplyAsync(GeminiChatRequest request,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<GeminiLabelResponse> ReadIngredientLabelAsync(GeminiDishImageRequest request,
            CancellationToken cancellationToken = default) => Task.FromResult(new GeminiLabelResponse(
            true, "Bí đỏ 500 g; Sữa bò tươi 350 g; Hương liệu", false,
            SuggestedIngredients: [new("Bí đỏ", IngredientKind.Plant),
                new("Sữa bò tươi", IngredientKind.Plant), new("Hương liệu", IngredientKind.Unknown)]));
    }

    private sealed class UnusedAi : IGeminiService
    {
        public Task<GeminiModerationResponse> CheckContentAsync(GeminiModerationRequest request,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<GeminiChatResponse> GenerateChatReplyAsync(GeminiChatRequest request,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<GeminiDishImageResponse> AnalyzeDishImageAsync(GeminiDishImageRequest request,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<GeminiLabelResponse> ReadIngredientLabelAsync(GeminiDishImageRequest request,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();
    }
}
