using Application.Features.Media;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Storage;

public sealed class LocalPublicImageStore : IPublicImageStore
{
    private readonly string root;

    public LocalPublicImageStore(IConfiguration configuration)
    {
        root = Path.GetFullPath(configuration["Storage:PublicImageRoot"] ??
            Path.Combine(AppContext.BaseDirectory, ".local", "public-images"));
    }

    public async Task<string> SaveAsync(Stream source, string extension, long maxBytes, CancellationToken cancellationToken)
    {
        if (extension is not ("jpg" or "png" or "webp"))
            throw new ArgumentException("Unsupported image type.", nameof(extension));

        var key = $"{Guid.NewGuid():N}.{extension}";
        var path = Path.Combine(root, key);
        try
        {
            Directory.CreateDirectory(root);
            await using var destination = new FileStream(path, FileMode.CreateNew, FileAccess.Write,
                FileShare.None, 81920, FileOptions.Asynchronous);
            var buffer = new byte[81920];
            long total = 0;
            int read;
            while ((read = await source.ReadAsync(buffer, cancellationToken)) > 0)
            {
                total += read;
                if (total > maxBytes) throw new ArgumentException("Image exceeds the 10 MB size limit.");
                await destination.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
            }
            if (total == 0) throw new ArgumentException("Image file is empty.");
            return key;
        }
        catch
        {
            try { File.Delete(path); }
            catch (IOException) { }
            catch (UnauthorizedAccessException) { }
            throw;
        }
    }

    public Task<Stream?> OpenReadAsync(string key, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var extension = Path.GetExtension(key).TrimStart('.').ToLowerInvariant();
        if (extension is not ("jpg" or "png" or "webp") || key != Path.GetFileName(key) ||
            !Guid.TryParseExact(Path.GetFileNameWithoutExtension(key), "N", out _))
            return Task.FromResult<Stream?>(null);

        var path = Path.GetFullPath(Path.Combine(root, key));
        if (!path.StartsWith(root + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) ||
            !File.Exists(path))
            return Task.FromResult<Stream?>(null);

        return Task.FromResult<Stream?>(new FileStream(path, FileMode.Open, FileAccess.Read,
            FileShare.Read, 81920, FileOptions.Asynchronous));
    }
}
