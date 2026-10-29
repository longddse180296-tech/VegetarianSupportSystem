// Chức năng: video, bản nháp và nội dung công khai. Tầng API nhận yêu cầu, kiểm tra quyền và chuyển xử lý cho Application.
using System.Security.Claims;
using Application.Features.Moderation;
using Application.Features.Videos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

// VideosController: cung cấp endpoint HTTP, kiểm tra danh tính và chuyển yêu cầu cho tầng Application.
[ApiController]
[Route("api")]
public sealed class VideosController(VideoService videos, ModerationService moderation,
    IPrivateMediaStore mediaStore) : ControllerBase
{
    private const long MaxVideoBytes = 200L * 1024 * 1024;
    private const long MaxImageBytes = 10L * 1024 * 1024;
    private string? UserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

    // ListPublic: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet("videos")]
    [AllowAnonymous]
    public async Task<ActionResult<VideoPage>> ListPublic(int page = 1, int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        try { return Ok(await videos.ListAsync(null, true, page, pageSize, cancellationToken)); }
        catch (ArgumentException ex) { return BadRequest(new ProblemDetails { Detail = ex.Message }); }
    }

    // GetPublic: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet("videos/{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<VideoDetails>> GetPublic(Guid id, CancellationToken cancellationToken)
    {
        var result = await videos.GetPublicAsync(id, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    // RecordView: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [HttpPost("videos/{id:guid}/views")]
    [AllowAnonymous]
    public async Task<IActionResult> RecordView(Guid id, CancellationToken cancellationToken)
    {
        var sessionKey = $"Video.View.{id:N}";
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (HttpContext.Session.GetInt32(sessionKey) == 1) return NoContent();
        if (!await videos.RecordViewAsync(id, cancellationToken)) return NotFound();
        HttpContext.Session.SetInt32(sessionKey, 1);
        return NoContent();
    }

    // ListMine: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet("me/videos")]
    [Authorize(Roles = "User,Admin")]
    public async Task<ActionResult<VideoPage>> ListMine(int page = 1, int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (UserId is null) return Unauthorized();
        try { return Ok(await videos.ListAsync(UserId, false, page, pageSize, cancellationToken)); }
        catch (ArgumentException ex) { return BadRequest(new ProblemDetails { Detail = ex.Message }); }
    }

    // GetMine: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet("me/videos/{id:guid}")]
    [Authorize(Roles = "User,Admin")]
    public async Task<ActionResult<VideoDetails>> GetMine(Guid id, CancellationToken cancellationToken)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (UserId is null) return Unauthorized();
        var result = await videos.GetMineAsync(id, UserId, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    // Create: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    [HttpPost("me/videos")]
    [Authorize(Roles = "User,Admin")]
    public async Task<ActionResult<VideoDetails>> Create(VideoMetadataRequest request, CancellationToken ct)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (UserId is null) return Unauthorized();
        try
        {
            var result = await videos.CreateAsync(UserId, request.Title, request.Description,
                request.CategoryId, ct);
            return CreatedAtAction(nameof(GetMine), new { id = result.Id }, result);
        }
        catch (ArgumentException ex) { return ValidationError(ex.Message); }
    }

    // Edit: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [HttpPut("me/videos/{id:guid}")]
    [Authorize(Roles = "User,Admin")]
    public async Task<ActionResult<VideoDetails>> Edit(Guid id, VideoMetadataRequest request, CancellationToken ct)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
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

    // Upload: Tiếp nhận và kiểm tra tệp trước khi lưu nội dung.
    [HttpPost("me/videos/{id:guid}/media")]
    [HttpPost("me/videos/{id:guid}/thumbnail")]
    [Authorize(Roles = "User,Admin")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxVideoBytes + 1024 * 1024)]
    public async Task<ActionResult<VideoDetails>> Upload(Guid id, [FromForm] IFormFile? file,
        CancellationToken ct)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
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
            return ValidationError($"Tệp không được để trống và không được vượt quá {(thumbnail ? 10 : 200)} MB.");
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
                return ValidationError("Vui lòng chọn video MP4/WEBM hoặc ảnh bìa JPG/PNG/WEBP.");
            }
            var key = await mediaStore.SaveAsync(stream, extension, max, ct);
            VideoDetails? result;
            try { result = await videos.SetMediaAsync(id, UserId, key, thumbnail, ct); }
            catch (Exception ex) when (ex is ArgumentException or IOException or UnauthorizedAccessException)
            {
                // Tệp mới không qua được kiểm tra; dọn riêng tệp đó, giữ media cũ và bản nháp.
                try { await mediaStore.DeleteAsync(key, CancellationToken.None); }
                catch (Exception cleanupError) when (cleanupError is IOException or UnauthorizedAccessException) { }
                throw;
            }
            return result is null ? NotFound() : Ok(result);
        }
        catch (ArgumentException ex)
        {
            if (!thumbnail) await videos.FailUploadAsync(id, UserId, ct);
            return ValidationError(ex.Message);
        }
        catch (InvalidOperationException ex) { return Conflict(new ProblemDetails { Detail = ex.Message }); }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            if (!thumbnail) await videos.FailUploadAsync(id, UserId, ct);
            return StatusCode(503, new ProblemDetails { Detail = "Chưa thể lưu hoặc đọc thông tin video lúc này. Bản nháp vẫn được giữ; vui lòng thử tải lên lại sau." });
        }
    }

    // Submit: Chuyển bản nội dung hợp lệ sang quy trình gửi duyệt.
    [HttpPost("me/videos/{id:guid}/submit")]
    [Authorize(Roles = "User,Admin")]
    public async Task<IActionResult> Submit(Guid id, CancellationToken ct)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (UserId is null) return Unauthorized();
        try
        {
            var result = await videos.SubmitAsync(id, UserId, moderation, ct);
            return result is null ? NotFound() : Ok(ModerationSubmissionResponse.From(result));
        }
        catch (InvalidOperationException ex) { return Conflict(new ProblemDetails { Detail = ex.Message }); }
        catch (ModerationException ex) { return ModerationHttpError.From(ex); }
    }

    // ReadMedia: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
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

    // ValidationError: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private ActionResult ValidationError(string message) => BadRequest(new ProblemDetails
    { Status = 400, Title = "Thông tin chưa hợp lệ", Detail = message });

    // DetectVideo: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static string? DetectVideo(byte[] bytes, int length) =>
        length >= 8 && bytes.AsSpan(4, 4).SequenceEqual("ftyp"u8) ? "mp4" :
        length >= 4 && bytes.AsSpan(0, 4).SequenceEqual(new byte[] { 0x1A, 0x45, 0xDF, 0xA3 }) ? "webm" : null;

    // DetectImage: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static string? DetectImage(byte[] bytes, int length) =>
        length >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF ? "jpg" :
        length >= 8 && bytes.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }) ? "png" :
        length >= 12 && bytes.AsSpan(0, 4).SequenceEqual("RIFF"u8) &&
        bytes.AsSpan(8, 4).SequenceEqual("WEBP"u8) ? "webp" : null;
}

// VideoMetadataRequest: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record VideoMetadataRequest(string Title, string Description, Guid? CategoryId);
