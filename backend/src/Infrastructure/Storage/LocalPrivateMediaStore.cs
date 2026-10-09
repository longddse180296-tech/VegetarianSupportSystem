using Application.Features.Videos;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Storage;

public sealed class LocalPrivateMediaStore : IPrivateMediaStore
{
    private readonly string root;
    public LocalPrivateMediaStore(IConfiguration configuration)
    {
        root = Path.GetFullPath(configuration["Storage:PrivateRoot"] ??
            Path.Combine(AppContext.BaseDirectory, ".local", "media"));
        Directory.CreateDirectory(root);
    }

    public async Task<string> SaveAsync(Stream source, string extension, long maxBytes, CancellationToken cancellationToken)
    {
        if (extension is not ("mp4" or "webm" or "jpg" or "png" or "webp"))
            throw new ArgumentException("Unsupported media type.", nameof(extension));
        var key = $"{Guid.NewGuid():N}.{extension}";
        var path = Path.Combine(root, key);
        try
        {
            await using var destination = new FileStream(path, FileMode.CreateNew, FileAccess.Write,
                FileShare.None, 81920, FileOptions.Asynchronous);
            var buffer = new byte[81920];
            long total = 0;
            int read;
            while ((read = await source.ReadAsync(buffer, cancellationToken)) > 0)
            {
                total += read;
                if (total > maxBytes) throw new ArgumentException("Media exceeds the size limit.");
                await destination.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
            }
            if (total == 0) throw new ArgumentException("Media file is empty.");
            return key;
        }
        catch
        {
            File.Delete(path);
            throw;
        }
    }

    public Task<Stream?> OpenReadAsync(string key, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (string.IsNullOrWhiteSpace(key) || key != Path.GetFileName(key) ||
            !Guid.TryParseExact(Path.GetFileNameWithoutExtension(key), "N", out _))
            return Task.FromResult<Stream?>(null);
        var path = Path.GetFullPath(Path.Combine(root, key));
        if (!path.StartsWith(root + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) ||
            !File.Exists(path)) return Task.FromResult<Stream?>(null);
        return Task.FromResult<Stream?>(new FileStream(path, FileMode.Open, FileAccess.Read,
            FileShare.Read, 81920, FileOptions.Asynchronous));
    }
}
