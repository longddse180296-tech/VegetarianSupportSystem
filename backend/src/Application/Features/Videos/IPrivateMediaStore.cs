namespace Application.Features.Videos;

// Keys are opaque server-generated names; callers never supply a path.
public interface IPrivateMediaStore
{
    Task<string> SaveAsync(Stream source, string extension, long maxBytes, CancellationToken cancellationToken);
    Task<Stream?> OpenReadAsync(string key, CancellationToken cancellationToken);
}
