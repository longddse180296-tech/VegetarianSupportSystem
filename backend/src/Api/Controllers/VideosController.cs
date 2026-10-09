using System.Security.Claims;
using Application.Features.Moderation;
using Application.Features.Videos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api")]
public sealed class VideosController(VideoService videos, ModerationService moderation,
    IPrivateMediaStore mediaStore) : ControllerBase
{
    private const long MaxVideoBytes = 200L * 1024 * 1024;
    private const long MaxImageBytes = 10L * 1024 * 1024;
    private string? UserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

    [HttpGet("videos")]
    [AllowAnonymous]
    public async Task<ActionResult<VideoPage>> ListPublic(int page = 1, int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        try { return Ok(await videos.ListAsync(null, true, page, pageSize, cancellationToken)); }
        catch (ArgumentException ex) { return BadRequest(new ProblemDetails { Detail = ex.Message }); }
    }

    [HttpGet("videos/{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<VideoDetails>> GetPublic(Guid id, CancellationToken cancellationToken)
    {
        var result = await videos.GetPublicAsync(id, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("videos/{id:guid}/views")]
    [AllowAnonymous]
    public async Task<IActionResult> RecordView(Guid id, CancellationToken cancellationToken)
    {
        var sessionKey = $"Video.View.{id:N}";
        if (HttpContext.Session.GetInt32(sessionKey) == 1) return NoContent();
        if (!await videos.RecordViewAsync(id, cancellationToken)) return NotFound();
        HttpContext.Session.SetInt32(sessionKey, 1);
        return NoContent();
    }

    [HttpGet("me/videos")]
    [Authorize(Roles = "User,Admin")]
    public async Task<ActionResult<VideoPage>> ListMine(int page = 1, int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (UserId is null) return Unauthorized();
        try { return Ok(await videos.ListAsync(UserId, false, page, pageSize, cancellationToken)); }
        catch (ArgumentException ex) { return BadRequest(new ProblemDetails { Detail = ex.Message }); }
    }

    [HttpGet("me/videos/{id:guid}")]
    [Authorize(Roles = "User,Admin")]
    public async Task<ActionResult<VideoDetails>> GetMine(Guid id, CancellationToken cancellationToken)
    {
        if (UserId is null) return Unauthorized();
        var result = await videos.GetMineAsync(id, UserId, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("me/videos")]
    [Authorize(Roles = "User,Admin")]
    public async Task<ActionResult<VideoDetails>> Create(VideoMetadataRequest request, CancellationToken ct)
    {
        if (UserId is null) return Unauthorized();
        try
        {
            var result = await videos.CreateAsync(UserId, request.Title, request.Description,
                request.CategoryId, ct);
            return CreatedAtAction(nameof(GetMine), new { id = result.Id }, result);
        }
        catch (ArgumentException ex) { return ValidationError(ex.Message); }
    }

    [HttpPut("me/videos/{id:guid}")]
    [Authorize(Roles = "User,Admin")]
    public async Task<ActionResult<VideoDetails>> Edit(Guid id, VideoMetadataRequest request, CancellationToken ct)
    {
        if (UserId is null) return Unauthorized();
        try
        {
            var result = await videos.EditAsync(id, UserId, request.Title, request.Description,
                request.CategoryId, ct);
            return result is null ? NotFound() : Ok(result);
        }
        catch (ArgumentException ex) { return ValidationError(ex.Message); }
        catch (InvalidOperationException ex) { return Conflict(new ProblemDetails { Detail = ex.Message }); }
    }

    [HttpPost("me/videos/{id:guid}/media")]
    [HttpPost("me/videos/{id:guid}/thumbnail")]
    [Authorize(Roles = "User,Admin")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxVideoBytes + 1024 * 1024)]
    public async Task<ActionResult<VideoDetails>> Upload(Guid id, [FromForm] IFormFile? file,
        CancellationToken ct)
    {
        if (UserId is null) return Unauthorized();
        try
        {
            if (!await videos.CanEditAsync(id, UserId, ct)) return NotFound();
        }
        catch (InvalidOperationException ex) { return Conflict(new ProblemDetails { Detail = ex.Message }); }
        var thumbnail = Request.Path.Value?.EndsWith("/thumbnail", StringComparison.OrdinalIgnoreCase) == true;
        var max = thumbnail ? MaxImageBytes : MaxVideoBytes;
        if (file is null || file.Length is <= 0 || file.Length > max)
        {
            if (!thumbnail) await videos.FailUploadAsync(id, UserId, ct);
            return ValidationError($"File must be 1 byte to {(thumbnail ? 10 : 200)} MB.");
        }
        try
        {
            if (!thumbnail && !await videos.BeginMediaUploadAsync(id, UserId, ct)) return NotFound();
            await using var stream = file.OpenReadStream();
            var header = new byte[12];
            var read = await stream.ReadAsync(header, ct);
            stream.Position = 0;
            var extension = thumbnail ? DetectImage(header, read) : DetectVideo(header, read);
            if (extension is null)
            {
                if (!thumbnail) await videos.FailUploadAsync(id, UserId, ct);
                return ValidationError("Only MP4/WEBM video or JPG/PNG/WEBP thumbnail is accepted.");
            }
            var key = await mediaStore.SaveAsync(stream, extension, max, ct);
            var result = await videos.SetMediaAsync(id, UserId, key, thumbnail, ct);
            return result is null ? NotFound() : Ok(result);
        }
        catch (ArgumentException ex) { return ValidationError(ex.Message); }
        catch (InvalidOperationException ex) { return Conflict(new ProblemDetails { Detail = ex.Message }); }
        catch (IOException)
        {
            if (!thumbnail) await videos.FailUploadAsync(id, UserId, ct);
            return StatusCode(503, new ProblemDetails { Detail = "Media storage is unavailable. Retry upload." });
        }
    }

    [HttpPost("me/videos/{id:guid}/submit")]
    [Authorize(Roles = "User,Admin")]
    public async Task<IActionResult> Submit(Guid id, CancellationToken ct)
    {
        if (UserId is null) return Unauthorized();
        try
        {
            var result = await videos.SubmitAsync(id, UserId, moderation, ct);
            return result is null ? NotFound() : Ok(ModerationSubmissionResponse.From(result));
        }
        catch (InvalidOperationException ex) { return Conflict(new ProblemDetails { Detail = ex.Message }); }
        catch (ModerationException ex) { return ModerationHttpError.From(ex); }
    }

    [HttpGet("videos/{id:guid}/media")]
    [HttpGet("videos/{id:guid}/thumbnail")]
    [AllowAnonymous]
    public async Task<IActionResult> ReadMedia(Guid id, [FromQuery] Guid? submissionId,
        CancellationToken ct)
    {
        var thumbnail = Request.Path.Value?.EndsWith("/thumbnail", StringComparison.OrdinalIgnoreCase) == true;
        var asset = await videos.OpenMediaAsync(id, UserId, User.IsInRole("Admin"),
            thumbnail, submissionId, mediaStore, ct);
        return asset is null ? NotFound() : File(asset.Value.Stream, asset.Value.MimeType,
            enableRangeProcessing: true);
    }

    private ActionResult ValidationError(string message) => BadRequest(new ProblemDetails
    { Status = 400, Title = "Validation", Detail = message });

    private static string? DetectVideo(byte[] bytes, int length) =>
        length >= 8 && bytes.AsSpan(4, 4).SequenceEqual("ftyp"u8) ? "mp4" :
        length >= 4 && bytes.AsSpan(0, 4).SequenceEqual(new byte[] { 0x1A, 0x45, 0xDF, 0xA3 }) ? "webm" : null;

    private static string? DetectImage(byte[] bytes, int length) =>
        length >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF ? "jpg" :
        length >= 8 && bytes.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }) ? "png" :
        length >= 12 && bytes.AsSpan(0, 4).SequenceEqual("RIFF"u8) &&
        bytes.AsSpan(8, 4).SequenceEqual("WEBP"u8) ? "webp" : null;
}

public sealed record VideoMetadataRequest(string Title, string Description, Guid? CategoryId);
