using Application.Features.Media;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api")]
public sealed class PublicImagesController(IPublicImageStore images) : ControllerBase
{
    private const long MaxImageBytes = 10L * 1024 * 1024;

    [HttpPost("me/images")]
    [Authorize(Roles = "User,Admin")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxImageBytes + 1024 * 1024)]
    public async Task<ActionResult<PublicImageUploadResponse>> Upload([FromForm] IFormFile? image,
        CancellationToken cancellationToken)
    {
        if (image is null || image.Length is <= 0 or > MaxImageBytes)
            return ValidationError("Ảnh phải có dung lượng từ 1 byte đến 10 MB.");

        try
        {
            await using var stream = image.OpenReadStream();
            var header = new byte[12];
            var read = await stream.ReadAsync(header, cancellationToken);
            stream.Position = 0;
            var extension = DetectImage(header, read);
            if (extension is null)
                return ValidationError("Chỉ nhận ảnh JPG, PNG hoặc WEBP hợp lệ.");

            var key = await images.SaveAsync(stream, extension, MaxImageBytes, cancellationToken);
            var url = $"{Request.Scheme}://{Request.Host}{Request.PathBase}/api/public-images/{key}";
            return Ok(new PublicImageUploadResponse(key, url));
        }
        catch (ArgumentException ex)
        {
            return ValidationError(ex.Message);
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            return StatusCode(503, new ProblemDetails
            {
                Status = 503,
                Title = "Storage unavailable",
                Detail = "Không thể lưu ảnh lúc này. Vui lòng thử lại."
            });
        }
    }

    [HttpGet("public-images/{key}")]
    [AllowAnonymous]
    public async Task<IActionResult> Read(string key, CancellationToken cancellationToken)
    {
        var stream = await images.OpenReadAsync(key, cancellationToken);
        if (stream is null) return NotFound();
        return File(stream, MimeType(key), enableRangeProcessing: true);
    }

    private static ActionResult ValidationError(string message) => new BadRequestObjectResult(new ProblemDetails
    {
        Status = 400,
        Title = "Validation",
        Detail = message
    });

    private static string MimeType(string key) => Path.GetExtension(key).ToLowerInvariant() switch
    {
        ".jpg" => "image/jpeg",
        ".png" => "image/png",
        ".webp" => "image/webp",
        _ => "application/octet-stream"
    };

    private static string? DetectImage(byte[] bytes, int length) =>
        length >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF ? "jpg" :
        length >= 8 && bytes.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }) ? "png" :
        length >= 12 && bytes.AsSpan(0, 4).SequenceEqual("RIFF"u8) &&
        bytes.AsSpan(8, 4).SequenceEqual("WEBP"u8) ? "webp" : null;
}

public sealed record PublicImageUploadResponse(string Key, string Url);
