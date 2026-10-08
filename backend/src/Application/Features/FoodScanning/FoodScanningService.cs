using Application.Abstractions.AI;
using Domain.Enums;
using Domain.Rules;

namespace Application.Features.FoodScanning;

public sealed class FoodScanningService(IGeminiService geminiService)
{
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

public sealed record ConfirmedIngredient(string Name, IngredientKind Kind);
public sealed record DietAssessment(VegetarianDiet Diet, FoodScanAssessmentStatus Status);
public sealed record FoodScanEvaluation(IReadOnlyList<DietAssessment> Assessments, string Note);
