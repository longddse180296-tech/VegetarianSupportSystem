// Đọc thời lượng và luồng âm thanh bằng FFprobe; chỉ phân tích tệp local đã được kiểm tra khóa.
using System.ComponentModel;
using System.Diagnostics;
using System.Globalization;
using System.Text.Json;
using Application.Features.Videos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace Infrastructure.Storage;

public sealed class FfprobeVideoMediaProbe(IPrivateMediaStore store, IConfiguration configuration,
    IHostEnvironment environment) : IVideoMediaProbe
{
    private readonly SemaphoreSlim slots = new(2);

    public async Task<VideoMediaInfo?> ReadAsync(string mediaKey, CancellationToken ct)
    {
        await using var stream = await store.OpenReadAsync(mediaKey, ct);
        if (stream is not FileStream file) return null;
        // Không chạy shell và không chấp nhận URL từ client. Chỉ cho phép giao thức file/pipe.
        var executable = configuration["VideoMetadata:FfprobePath"] ?? "ffprobe";
        if (executable != "ffprobe" && !Path.IsPathRooted(executable))
            executable = Path.GetFullPath(executable, environment.ContentRootPath);
        await slots.WaitAsync(ct);
        try
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeout.CancelAfter(TimeSpan.FromSeconds(20));
            using var process = new Process { StartInfo = new ProcessStartInfo(executable)
            { UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true } };
            foreach (var argument in new[] { "-v", "error", "-protocol_whitelist", "file,pipe", "-show_entries",
                "format=duration:stream=codec_type,duration", "-of", "json", file.Name })
                process.StartInfo.ArgumentList.Add(argument);
            try { process.Start(); }
            catch (Win32Exception ex) { throw new IOException("Công cụ đọc thông tin video chưa khả dụng.", ex); }
            // Đọc hai luồng đồng thời để tiến trình không bị treo khi ghi lỗi.
            var output = process.StandardOutput.ReadToEndAsync(timeout.Token);
            var errors = process.StandardError.ReadToEndAsync(timeout.Token);
            try
            {
                await process.WaitForExitAsync(timeout.Token);
                var json = await output;
                await errors;
                return process.ExitCode == 0 ? Parse(json) : null;
            }
            catch (OperationCanceledException)
            {
                if (!process.HasExited) process.Kill(entireProcessTree: true);
                try { await Task.WhenAll(output, errors); } catch (OperationCanceledException) { }
                ct.ThrowIfCancellationRequested();
                throw new IOException("Đọc thông tin video quá thời gian cho phép.");
            }
        }
        finally { slots.Release(); }
    }

    // Ưu tiên thời lượng container, dùng thời lượng stream khi container thiếu; không lấy tệp chỉ có audio.
    public static VideoMediaInfo? Parse(string json)
    {
        try
        {
            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;
            if (!root.TryGetProperty("streams", out var streams) || streams.ValueKind != JsonValueKind.Array) return null;
            var videoStreams = streams.EnumerateArray().Where(x => x.TryGetProperty("codec_type", out var type) && type.GetString() == "video").ToArray();
            if (videoStreams.Length == 0) return null;
            double? duration = root.TryGetProperty("format", out var format) ? ReadDuration(format) : null;
            duration ??= videoStreams.Select(ReadDuration).Where(x => x.HasValue).Max();
            if (duration is null) return null;
            return new(duration.Value, streams.EnumerateArray().Any(x => x.TryGetProperty("codec_type", out var type) && type.GetString() == "audio"));
        }
        catch (JsonException) { return null; }
    }

    private static double? ReadDuration(JsonElement element)
    {
        if (!element.TryGetProperty("duration", out var value)) return null;
        return double.TryParse(value.ToString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var seconds) &&
            double.IsFinite(seconds) && seconds > 0 ? seconds : null;
    }
}
