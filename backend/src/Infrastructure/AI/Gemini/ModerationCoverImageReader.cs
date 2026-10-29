// Đọc ảnh đại diện đã upload để kiểm duyệt; không tải URL tùy ý hoặc đọc đường dẫn do người dùng cung cấp.
using Application.Abstractions.AI;
using Application.Features.Media;

namespace Infrastructure.AI.Gemini;

internal static class ModerationCoverImageReader
{
    private const int MaxBytes = 10 * 1024 * 1024;

    public static async Task<GeminiDishImageRequest?> ReadAsync(IPublicImageStore? store, string reference, CancellationToken ct)
    {
        if (store is null) return null;
        var path = Uri.TryCreate(reference, UriKind.Absolute, out var uri)
            && uri.Scheme is "http" or "https" ? uri.AbsolutePath : reference;
        const string prefix = "/api/public-images/";
        if (!path.StartsWith(prefix, StringComparison.Ordinal)) return null;
        var key = path[prefix.Length..];
        var extension = Path.GetExtension(key);
        if (key.Length != 32 + extension.Length || !Guid.TryParseExact(key[..32], "N", out _)
            || extension is not (".jpg" or ".png" or ".webp")) return null;
        try
        {
            await using var source = await store.OpenReadAsync(key, ct);
            if (source is null) return null;
            // Giới hạn cả stream không seek được; không nạp tệp quá lớn vào bộ nhớ hoặc gửi sang Gemini.
            using var buffer = new MemoryStream();
            var block = new byte[81920];
            int count;
            while ((count = await source.ReadAsync(block, ct)) > 0)
            {
                if (buffer.Length + count > MaxBytes) return null;
                buffer.Write(block, 0, count);
            }
            var bytes = buffer.ToArray();
            var mime = DetectMime(bytes);
            return mime is null ? null : new(bytes, mime);
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            return null;
        }
    }

    // Đối chiếu chữ ký tệp, không tin riêng đuôi tên ảnh hoặc Content-Type từ phía người gửi.
    private static string? DetectMime(byte[] bytes) =>
        bytes.Length >= 3 && bytes[0] == 255 && bytes[1] == 216 && bytes[2] == 255 ? "image/jpeg" :
        bytes.Length >= 8 && bytes.AsSpan(0, 8).SequenceEqual(new byte[] {137, 80, 78, 71, 13, 10, 26, 10}) ? "image/png" :
        bytes.Length >= 12 && bytes.AsSpan(0, 4).SequenceEqual("RIFF"u8) && bytes.AsSpan(8, 4).SequenceEqual("WEBP"u8) ? "image/webp" : null;
}
