using Application.Features.FoodScanning;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Authorize(Roles = "User,Admin")]
[Route("api/food-scans")]
public sealed class FoodScansController(FoodScanningService scanningService) : ControllerBase
{
    private const int MaxImageBytes = 10 * 1024 * 1024;

    [HttpPost("dish-image")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(11 * 1024 * 1024)]
    public async Task<ActionResult<DishImageScanResult>> AnalyzeDishImage(
        [FromForm] IFormFile? image,
        CancellationToken cancellationToken)
    {
        if (image is null || image.Length is <= 0 or > MaxImageBytes)
        {
            ModelState.AddModelError("image", "Chọn ảnh JPG, PNG hoặc WEBP có dung lượng từ 1 byte đến 10 MB.");
            return ValidationProblem(ModelState);
        }

        using var stream = new MemoryStream();
        await image.CopyToAsync(stream, cancellationToken);
        var bytes = stream.ToArray();
        var mimeType = DetectImageMimeType(bytes);
        if (mimeType is null)
        {
            ModelState.AddModelError("image", "Tệp không phải ảnh JPG, PNG hoặc WEBP hợp lệ.");
            return ValidationProblem(ModelState);
        }

        var result = await scanningService.AnalyzeDishAsync(bytes, mimeType, cancellationToken);
        if (result.ErrorCode == "UnrecognizableImage")
            return UnprocessableEntity(result);
        return result.ProcessingStatus == "AnalysisFailed"
            ? StatusCode(StatusCodes.Status503ServiceUnavailable, result)
            : Ok(result);
    }

    [HttpPost("evaluate")]
    public ActionResult<FoodScanEvaluation> Evaluate([FromBody] EvaluateDishRequest request)
    {
        if (request.Ingredients is null || request.Ingredients.Count > 100)
        {
            ModelState.AddModelError("ingredients", "Cần danh sách tối đa 100 nguyên liệu.");
            return ValidationProblem(ModelState);
        }

        if (request.Ingredients.Any(item => item is null
            || string.IsNullOrWhiteSpace(item.Name)
            || item.Name.Length > 200
            || item.Kind is null
            || !Enum.IsDefined(item.Kind.Value)))
        {
            ModelState.AddModelError("ingredients", "Mỗi nguyên liệu cần tên từ 1 đến 200 ký tự và loại hợp lệ.");
            return ValidationProblem(ModelState);
        }

        var ingredients = request.Ingredients
            .Select(item => new ConfirmedIngredient(item.Name!.Trim(), item.Kind!.Value))
            .ToArray();
        return Ok(scanningService.Evaluate(ingredients, request.IngredientsComplete));
    }

    private static string? DetectImageMimeType(byte[] bytes)
    {
        if (bytes.Length >= 3 && bytes[0] == 0xff && bytes[1] == 0xd8 && bytes[2] == 0xff)
            return "image/jpeg";
        if (bytes.Length >= 8 && bytes.AsSpan(0, 8).SequenceEqual(
                new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }))
            return "image/png";
        if (bytes.Length >= 12
            && bytes.AsSpan(0, 4).SequenceEqual("RIFF"u8)
            && bytes.AsSpan(8, 4).SequenceEqual("WEBP"u8))
            return "image/webp";
        return null;
    }

    public sealed record EvaluateDishRequest(
        IReadOnlyList<ConfirmedIngredientRequest>? Ingredients,
        bool IngredientsComplete);

    public sealed record ConfirmedIngredientRequest(string? Name, IngredientKind? Kind);
}
