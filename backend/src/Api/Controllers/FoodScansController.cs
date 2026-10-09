using Application.Features.FoodScanning;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers;

[ApiController]
[Authorize(Roles = "User,Admin")]
[Route("api/food-scans")]
public sealed class FoodScansController(FoodScanningService scanningService) : ControllerBase
{
    private const int MaxImageBytes = 10 * 1024 * 1024;
    private string? UserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

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

    [HttpPost("label-image")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(11 * 1024 * 1024)]
    public async Task<ActionResult<LabelImageScanResult>> AnalyzeLabelImage(
        [FromForm] IFormFile? image, CancellationToken cancellationToken)
    {
        if (image is null || image.Length is <= 0 or > MaxImageBytes)
        {
            ModelState.AddModelError("image", "Chọn ảnh JPG, PNG hoặc WEBP tối đa 10 MB.");
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
        var result = await scanningService.AnalyzeLabelAsync(bytes, mimeType, cancellationToken);
        return result.ProcessingStatus == "AnalysisFailed"
            ? StatusCode(StatusCodes.Status503ServiceUnavailable, result) : Ok(result);
    }

    [HttpPost("evaluate")]
    public async Task<ActionResult<SavedFoodScan>> Evaluate([FromBody] EvaluateDishRequest request,
        CancellationToken cancellationToken)
    {
        if (UserId is null) return Unauthorized();
        if (request.SourceType is not ("Dish" or "Label") ||
            request.CorrectedLabelText?.Length > 10_000 ||
            request.UnknownAnswers is { Count: > 30 } ||
            request.UnknownAnswers?.Any(x => x.Length > 200) == true)
        {
            ModelState.AddModelError("sourceType", "SourceType phải là Dish hoặc Label; văn bản và câu trả lời phải trong giới hạn.");
            return ValidationProblem(ModelState);
        }
        if (request.Ingredients is null || request.Ingredients.Count > 100)
        {
            ModelState.AddModelError("ingredients", "Cần danh sách tối đa 100 nguyên liệu.");
            return ValidationProblem(ModelState);
        }

        if (request.Ingredients.Any(item => item is null
            || string.IsNullOrWhiteSpace(item.Name)
            || item.Name.Length > 200
            || item.Kind is null
            || !Enum.IsDefined(item.Kind.Value)
            || item.Source is not (null or "AiSuggested" or "LabelOcr" or "UserConfirmed" or "UserEdited")))
        {
            ModelState.AddModelError("ingredients", "Mỗi nguyên liệu cần tên từ 1 đến 200 ký tự và loại hợp lệ.");
            return ValidationProblem(ModelState);
        }

        var ingredients = request.Ingredients
            .Select(item => new ConfirmedIngredient(item.Name!.Trim(), item.Kind!.Value,
                item.Source ?? "UserConfirmed"))
            .ToArray();
        try
        {
            return Ok(await scanningService.EvaluateAndSaveAsync(UserId, request.SourceType,
                ingredients, request.IngredientsComplete, request.CorrectedLabelText,
                request.LabelIncomplete, request.UnknownAnswers ?? [], request.PreviousScanId,
                cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ProblemDetails { Detail = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new ProblemDetails { Detail = ex.Message });
        }
    }

    [HttpGet("history")]
    public async Task<ActionResult<FoodScanPage>> History(int page = 1, int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (UserId is null) return Unauthorized();
        try { return Ok(await scanningService.ListOwnedAsync(UserId, page, pageSize, cancellationToken)); }
        catch (ArgumentException ex) { return BadRequest(new ProblemDetails { Detail = ex.Message }); }
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SavedFoodScan>> Get(Guid id, CancellationToken cancellationToken)
    {
        if (UserId is null) return Unauthorized();
        var result = await scanningService.GetOwnedAsync(id, UserId, cancellationToken);
        return result is null ? NotFound() : Ok(result);
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
        bool IngredientsComplete,
        string SourceType = "Dish",
        string? CorrectedLabelText = null,
        bool LabelIncomplete = false,
        IReadOnlyList<string>? UnknownAnswers = null,
        Guid? PreviousScanId = null);

    public sealed record ConfirmedIngredientRequest(string? Name, IngredientKind? Kind,
        string? Source = null);
}
