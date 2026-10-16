using System.ComponentModel.DataAnnotations;

namespace Application.Features.Administration;

public sealed record FeaturedContentPinRequest([property: Required] bool? IsPinned);
