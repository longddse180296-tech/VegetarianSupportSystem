namespace Application.Features.Media;

// Public image keys are opaque server-generated values, never client-provided file paths.
public interface IPublicImageStore
{
    Task<string> SaveAsync(Stream source, string extension, long maxBytes, CancellationToken cancellationToken);
    Task<Stream?> OpenReadAsync(string key, CancellationToken cancellationToken);
}
