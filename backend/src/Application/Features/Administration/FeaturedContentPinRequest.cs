using System.ComponentModel.DataAnnotations;

namespace Application.Features.Administration;

public sealed class FeaturedContentPinRequest
{
    public FeaturedContentPinRequest() { }

    public FeaturedContentPinRequest(bool? isPinned) => IsPinned = isPinned;

    [Required]
    public bool? IsPinned { get; init; }
}
