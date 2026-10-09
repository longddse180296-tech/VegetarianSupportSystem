using Application.Abstractions.AI;
using Domain.Enums;
using Domain.Rules;
using Domain.Entities;
using System.Text.Json;

namespace Application.Features.FoodScanning;

public sealed class FoodScanningService(IGeminiService geminiService, IFoodScanRepository repository)
{
    public async Task<LabelImageScanResult> AnalyzeLabelAsync(byte[] imageBytes, string mimeType,
        CancellationToken cancellationToken)
    {
        var ai = await geminiService.ReadIngredientLabelAsync(
            new GeminiDishImageRequest(imageBytes, mimeType), cancellationToken);
        return new LabelImageScanResult(ai.IsAvailable ? "NeedsConfirmation" : "AnalysisFailed",
            ai.ExtractedText, ai.IsIncomplete, ai.ErrorCode,
            "OCR chỉ chép phần đọc được. Hãy sửa văn bản và xác nhận thành phần trước khi đánh giá.");
    }

    public async Task<SavedFoodScan> EvaluateAndSaveAsync(string userId, string sourceType,
        IReadOnlyList<ConfirmedIngredient> ingredients, bool ingredientsComplete,
        string? correctedLabelText, bool labelIncomplete, IReadOnlyList<string> unknownAnswers,
        Guid? previousScanId, CancellationToken ct)
    {
        var profile = await repository.GetProfileAsync(userId, ct);
        if (profile.Diet is null)
            throw new InvalidOperationException("Hãy thiết lập chế độ ăn trong hồ sơ trước khi đánh giá cá nhân.");
        var evidence = await repository.FindIngredientEvidenceAsync(
            ingredients.Select(x => x.Name).ToArray(), ct);
        var resolved = ingredients.Select(item =>
        {
            if (item.Source is not ("UserConfirmed" or "UserEdited"))
                return item with { Kind = IngredientKind.Unknown };
            var catalog = evidence.FirstOrDefault(x => x.Name.Equals(item.Name,
                StringComparison.OrdinalIgnoreCase));
            return catalog is not null &&
                catalog.Kind is (IngredientKind.Animal or IngredientKind.Egg or IngredientKind.Dairy or IngredientKind.Honey) &&
                item.Kind is (IngredientKind.Plant or IngredientKind.Unknown)
                ? item with { Kind = catalog.Kind } : item;
        }).ToArray();
        var complete = ingredientsComplete && !labelIncomplete && unknownAnswers.Count == 0;
        var evaluation = Evaluate(resolved, complete) with { CatalogEvidence = evidence };
        var warnings = BuildAllergyWarnings(profile, ingredients, evidence);
        var previous = previousScanId is { } previousId
            ? await repository.GetOwnedAsync(previousId, userId, ct) : null;
        if (previousScanId is not null && previous is null)
            throw new ArgumentException("Previous scan does not belong to this user.");
        if (previous is not null && previous.SourceType != sourceType)
            throw new ArgumentException("A revised scan must keep the same source type.");
        var record = FoodScanRecord.Create(userId, sourceType,
            JsonSerializer.Serialize(new { ingredients, ingredientsComplete, correctedLabelText,
                labelIncomplete, unknownAnswers }),
            JsonSerializer.Serialize(evaluation), JsonSerializer.Serialize(profile),
            previousScanId, previous is null ? 1 : checked(previous.ResultVersion + 1));
        await repository.AddAsync(record, ct);
        return new SavedFoodScan(record.Id, record.CreatedAtUtc, record.ResultVersion, record.PreviousScanId,
            sourceType, evaluation.Assessments, evaluation.Note, profile, warnings,
            "Không thấy dị nguyên trong thông tin cung cấp không có nghĩa là không có dị nguyên.",
            ingredients, correctedLabelText, labelIncomplete, unknownAnswers, ingredientsComplete,
            evidence);
    }

    public async Task<SavedFoodScan?> GetOwnedAsync(Guid id, string userId, CancellationToken ct)
    {
        var record = await repository.GetOwnedAsync(id, userId, ct);
        return record is null ? null : Map(record);
    }

    public async Task<FoodScanPage> ListOwnedAsync(string userId, int page, int pageSize,
        CancellationToken ct)
    {
        if (page < 1 || pageSize is < 1 or > 100) throw new ArgumentException("Invalid pagination.");
        var (items, total) = await repository.ListOwnedAsync(userId, page, pageSize, ct);
        return new FoodScanPage(items.Select(Map).ToArray(), total, page, pageSize);
    }

    private static SavedFoodScan Map(FoodScanRecord record)
    {
        var result = JsonSerializer.Deserialize<FoodScanEvaluation>(record.ResultJson)!;
        var profile = JsonSerializer.Deserialize<ScanProfileSnapshot>(record.ProfileSnapshotJson)!;
        using var input = JsonDocument.Parse(record.InputJson);
        var ingredients = input.RootElement.GetProperty("ingredients")
            .Deserialize<ConfirmedIngredient[]>() ?? [];
        var correctedText = input.RootElement.TryGetProperty("correctedLabelText", out var corrected) &&
            corrected.ValueKind == JsonValueKind.String ? corrected.GetString() : null;
        var labelIncomplete = input.RootElement.TryGetProperty("labelIncomplete", out var incomplete) &&
            incomplete.ValueKind == JsonValueKind.True;
        var complete = input.RootElement.TryGetProperty("ingredientsComplete", out var suppliedComplete) &&
            suppliedComplete.ValueKind == JsonValueKind.True;
        var unknown = input.RootElement.TryGetProperty("unknownAnswers", out var answers) &&
            answers.ValueKind == JsonValueKind.Array ? answers.Deserialize<string[]>() ?? [] : [];
        var warnings = BuildAllergyWarnings(profile, ingredients, result.CatalogEvidence ?? []);
        return new SavedFoodScan(record.Id, record.CreatedAtUtc, record.ResultVersion, record.PreviousScanId,
            record.SourceType, result.Assessments, result.Note, profile, warnings,
            "Không thấy dị nguyên trong thông tin cung cấp không có nghĩa là không có dị nguyên.",
            ingredients, correctedText, labelIncomplete, unknown, complete,
            result.CatalogEvidence ?? []);
    }

    private static IReadOnlyList<string> BuildAllergyWarnings(ScanProfileSnapshot profile,
        IReadOnlyList<ConfirmedIngredient> ingredients,
        IReadOnlyList<ScanIngredientEvidence> evidence) =>
        profile.Allergies.Where(allergy => ingredients.Any(ingredient =>
            ingredient.Name.Contains(allergy, StringComparison.OrdinalIgnoreCase)) ||
            evidence.Any(item => item.Allergens?.Contains(allergy,
                StringComparison.OrdinalIgnoreCase) == true))
            .Select(allergy => $"Thành phần đã xác nhận hoặc dữ liệu nguyên liệu có thể chứa dị nguyên: {allergy}.")
            .Distinct().ToArray();
    public async Task<DishImageScanResult> AnalyzeDishAsync(
        byte[] imageBytes,
        string mimeType,
        CancellationToken cancellationToken)
    {
        var ai = await geminiService.AnalyzeDishImageAsync(
            new GeminiDishImageRequest(imageBytes, mimeType), cancellationToken);
        return new DishImageScanResult(
            ai.IsAvailable ? "NeedsConfirmation" : "AnalysisFailed",
            ai.SuggestedDishName,
            ai.VisibleIngredients,
            ai.UnknownFactors,
            ai.FollowUpQuestions,
            Enum.GetValues<VegetarianDiet>()
                .Select(diet => new DietAssessment(diet, FoodScanAssessmentStatus.InsufficientInformation))
                .ToArray(),
            ai.ErrorCode,
            "AI chỉ gợi ý từ ảnh. Hãy xác nhận nguyên liệu và các thành phần ẩn trước khi đánh giá.");
    }

    public FoodScanEvaluation Evaluate(
        IReadOnlyList<ConfirmedIngredient> ingredients,
        bool ingredientsComplete)
    {
        var kinds = ingredients.Select(ingredient => ingredient.Kind).ToArray();
        var assessments = Enum.GetValues<VegetarianDiet>()
            .Select(diet => new DietAssessment(
                diet,
                FoodScanAssessment.Evaluate(diet, kinds, ingredientsComplete)))
            .ToArray();
        return new FoodScanEvaluation(
            assessments,
            "Đánh giá dựa trên nguyên liệu User xác nhận; không xác minh thành phần ẩn hay an toàn dị ứng.");
    }
}

public sealed record DishImageScanResult(
    string ProcessingStatus,
    string? SuggestedDishName,
    IReadOnlyList<string> VisibleIngredients,
    IReadOnlyList<string> UnknownFactors,
    IReadOnlyList<string> FollowUpQuestions,
    IReadOnlyList<DietAssessment> Assessments,
    string? ErrorCode,
    string Note);

public sealed record ConfirmedIngredient(string Name, IngredientKind Kind,
    string Source = "UserConfirmed");
public sealed record DietAssessment(VegetarianDiet Diet, FoodScanAssessmentStatus Status);
public sealed record FoodScanEvaluation(IReadOnlyList<DietAssessment> Assessments, string Note,
    IReadOnlyList<ScanIngredientEvidence>? CatalogEvidence = null);
public sealed record LabelImageScanResult(string ProcessingStatus, string? ExtractedText,
    bool IsIncomplete, string? ErrorCode, string Note);
public sealed record SavedFoodScan(Guid Id, DateTimeOffset CreatedAtUtc, int ResultVersion,
    Guid? PreviousScanId,
    string SourceType, IReadOnlyList<DietAssessment> Assessments, string Note,
    ScanProfileSnapshot ProfileSnapshot, IReadOnlyList<string> AllergyWarnings, string AllergyNote,
    IReadOnlyList<ConfirmedIngredient> Ingredients, string? CorrectedLabelText,
    bool LabelIncomplete, IReadOnlyList<string> UnknownAnswers, bool IngredientsComplete,
    IReadOnlyList<ScanIngredientEvidence> CatalogEvidence);
public sealed record FoodScanPage(IReadOnlyList<SavedFoodScan> Items, int TotalCount, int Page, int PageSize);
