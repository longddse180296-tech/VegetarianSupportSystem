// Chức năng: phân tích ảnh món ăn và nhãn thành phần. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Application.Abstractions.AI;
using Domain.Enums;
using Domain.Rules;
using Domain.Entities;
using System.Text.Json;

namespace Application.Features.FoodScanning;

// FoodScanningService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed class FoodScanningService(IGeminiService geminiService, IFoodScanRepository repository)
{
    // AnalyzeLabelAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<LabelImageScanResult> AnalyzeLabelAsync(byte[] imageBytes, string mimeType,
        CancellationToken cancellationToken)
    {
        var ai = await geminiService.ReadIngredientLabelAsync(
            new GeminiDishImageRequest(imageBytes, mimeType), cancellationToken);
        var suggestions = ai.IsAvailable ? ai.SuggestedIngredients ?? [] : [];
        var evidence = suggestions.Count > 0
            ? await repository.FindIngredientEvidenceAsync(suggestions.Select(item => item.Name).ToArray(), cancellationToken)
            : [];
        var ingredients = suggestions.Select(item => new LabelIngredientSuggestion(item.Name,
            evidence.FirstOrDefault(entry => entry.Name.Equals(item.Name,
                StringComparison.OrdinalIgnoreCase))?.Kind ?? item.Kind)).ToArray();
        return new LabelImageScanResult(ai.IsAvailable ? "NeedsConfirmation" : "AnalysisFailed",
            ai.ExtractedText, ai.IsIncomplete, ai.ErrorCode,
            "OCR chỉ chép phần đọc được. Loại nguyên liệu là gợi ý; hãy sửa và xác nhận trước khi đánh giá.",
            ingredients);
    }

    // EvaluateAndSaveAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<SavedFoodScan> EvaluateAndSaveAsync(string userId, string sourceType,
        IReadOnlyList<ConfirmedIngredient> ingredients, bool ingredientsComplete,
        string? correctedLabelText, bool labelIncomplete, IReadOnlyList<string> unknownAnswers,
        Guid? previousScanId, CancellationToken ct)
    {
        var profile = await repository.GetProfileAsync(userId, ct);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
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

    // GetOwnedAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<SavedFoodScan?> GetOwnedAsync(Guid id, string userId, CancellationToken ct)
    {
        var record = await repository.GetOwnedAsync(id, userId, ct);
        return record is null ? null : Map(record);
    }

    // ListOwnedAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<FoodScanPage> ListOwnedAsync(string userId, int page, int pageSize,
        CancellationToken ct)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (page < 1 || pageSize is < 1 or > 100) throw new ArgumentException("Thông tin phân trang chưa hợp lệ. Vui lòng tải lại danh sách.");
        var (items, total) = await repository.ListOwnedAsync(userId, page, pageSize, ct);
        return new FoodScanPage(items.Select(Map).ToArray(), total, page, pageSize);
    }

    // Map: Chuyển dữ liệu nội bộ sang cấu trúc trả về cho bên gọi.
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

    // BuildAllergyWarnings: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static IReadOnlyList<string> BuildAllergyWarnings(ScanProfileSnapshot profile,
        IReadOnlyList<ConfirmedIngredient> ingredients,
        IReadOnlyList<ScanIngredientEvidence> evidence) =>
        profile.Allergies.Where(allergy => ingredients.Any(ingredient =>
            ingredient.Name.Contains(allergy, StringComparison.OrdinalIgnoreCase)) ||
            evidence.Any(item => item.Allergens?.Contains(allergy,
                StringComparison.OrdinalIgnoreCase) == true))
            .Select(allergy => $"Thành phần đã xác nhận hoặc dữ liệu nguyên liệu có thể chứa dị nguyên: {allergy}.")
            .Distinct().ToArray();
    // AnalyzeDishAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<DishImageScanResult> AnalyzeDishAsync(
        byte[] imageBytes,
        string mimeType,
        CancellationToken cancellationToken)
    {
        var ai = await geminiService.AnalyzeDishImageAsync(
            new GeminiDishImageRequest(imageBytes, mimeType), cancellationToken);
        var evidence = ai.IsAvailable && ai.VisibleIngredients.Count > 0
            ? await repository.FindIngredientEvidenceAsync(ai.VisibleIngredients, cancellationToken)
            : [];
        var suggestedKinds = ai.VisibleIngredients.Select((ingredient, index) =>
            evidence.FirstOrDefault(item => item.Name.Equals(ingredient,
                StringComparison.OrdinalIgnoreCase))?.Kind
            ?? (ai.SuggestedIngredientKinds?.Count > index
                ? ai.SuggestedIngredientKinds[index] : IngredientKind.Unknown)).ToArray();
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
            "Hệ thống nhận diện sơ bộ qua hình ảnh. Loại nguyên liệu là gợi ý; vui lòng sửa và xác nhận trước khi đánh giá.",
            suggestedKinds);
    }

    // Evaluate: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
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
            "Kết quả phân tích dựa trên danh sách thành phần bạn đã kiểm tra và xác nhận. Do hình ảnh món ăn không thể hiện được các thành phần ẩn (như nước dùng, gia vị nêm, dầu mỡ), vui lòng đối chiếu thêm với người chế biến để đảm bảo chuẩn chay theo nhu cầu.");
    }
}

// DishImageScanResult: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record DishImageScanResult(
    string ProcessingStatus,
    string? SuggestedDishName,
    IReadOnlyList<string> VisibleIngredients,
    IReadOnlyList<string> UnknownFactors,
    IReadOnlyList<string> FollowUpQuestions,
    IReadOnlyList<DietAssessment> Assessments,
    string? ErrorCode,
    string Note,
    IReadOnlyList<IngredientKind> SuggestedIngredientKinds);

// ConfirmedIngredient: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ConfirmedIngredient(string Name, IngredientKind Kind,
    string Source = "UserConfirmed");
// DietAssessment: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record DietAssessment(VegetarianDiet Diet, FoodScanAssessmentStatus Status);
// FoodScanEvaluation: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record FoodScanEvaluation(IReadOnlyList<DietAssessment> Assessments, string Note,
    IReadOnlyList<ScanIngredientEvidence>? CatalogEvidence = null);
// LabelImageScanResult: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record LabelImageScanResult(string ProcessingStatus, string? ExtractedText,
    bool IsIncomplete, string? ErrorCode, string Note,
    IReadOnlyList<LabelIngredientSuggestion> SuggestedIngredients);
// LabelIngredientSuggestion: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record LabelIngredientSuggestion(string Name, IngredientKind Kind);
// SavedFoodScan: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record SavedFoodScan(Guid Id, DateTimeOffset CreatedAtUtc, int ResultVersion,
    Guid? PreviousScanId,
    string SourceType, IReadOnlyList<DietAssessment> Assessments, string Note,
    ScanProfileSnapshot ProfileSnapshot, IReadOnlyList<string> AllergyWarnings, string AllergyNote,
    IReadOnlyList<ConfirmedIngredient> Ingredients, string? CorrectedLabelText,
    bool LabelIncomplete, IReadOnlyList<string> UnknownAnswers, bool IngredientsComplete,
    IReadOnlyList<ScanIngredientEvidence> CatalogEvidence);
// FoodScanPage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record FoodScanPage(IReadOnlyList<SavedFoodScan> Items, int TotalCount, int Page, int PageSize);
