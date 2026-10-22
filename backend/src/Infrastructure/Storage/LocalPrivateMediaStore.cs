using Application.Features.Videos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace Infrastructure.Storage;

public sealed class LocalPrivateMediaStore : IPrivateMediaStore
{
    private readonly string root;
    private readonly string[] legacyRoots;
    public LocalPrivateMediaStore(IConfiguration configuration, IHostEnvironment environment)
    {
        root = Path.GetFullPath(configuration["Storage:PrivateRoot"] ??
            Path.Combine(environment.ContentRootPath, ".local", "media"));
        legacyRoots = new[]
        {
            Path.Combine(environment.ContentRootPath, "bin", "Debug", "net10.0", ".local", "media"),
            Path.Combine(environment.ContentRootPath, "bin", "Release", "net10.0", ".local", "media"),
        }.Select(Path.GetFullPath).Where(path => !string.Equals(path, root, StringComparison.OrdinalIgnoreCase)).ToArray();
    }

    public async Task<string> SaveAsync(Stream source, string extension, long maxBytes, CancellationToken cancellationToken)
    {
        if (extension is not ("mp4" or "webm" or "jpg" or "png" or "webp"))
            throw new ArgumentException("Unsupported media type.", nameof(extension));
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
                if (total > maxBytes) throw new ArgumentException("Media exceeds the size limit.");
                await destination.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
            }
            if (total == 0) throw new ArgumentException("Media file is empty.");
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
        if (string.IsNullOrWhiteSpace(key) || key != Path.GetFileName(key) ||
            !Guid.TryParseExact(Path.GetFileNameWithoutExtension(key), "N", out _))
            return Task.FromResult<Stream?>(null);
        foreach (var candidateRoot in new[] { root }.Concat(legacyRoots))
        {
            var path = Path.GetFullPath(Path.Combine(candidateRoot, key));
            if (path.StartsWith(candidateRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) &&
                File.Exists(path))
            {
                return Task.FromResult<Stream?>(new FileStream(path, FileMode.Open, FileAccess.Read,
                    FileShare.Read, 81920, FileOptions.Asynchronous));
            }
        }
        return Task.FromResult<Stream?>(null);
    }
}
