using System.ComponentModel.DataAnnotations;
using Application.Common.Validation;

namespace Application.Features.Favorites;

internal static class FavoriteValidation
{
    public static void Validate(FavoriteRequest request)
    {
        RequestValidation.Validate(request);
        if (request.TargetType is null || !Enum.IsDefined(request.TargetType.Value))
            Fail(nameof(request.TargetType), "Favorite target type is invalid.");
        if (request.TargetId == Guid.Empty)
            Fail(nameof(request.TargetId), "Favorite target ID must not be empty.");
    }

    public static void Validate(FavoriteListQuery query)
    {
        RequestValidation.Validate(query);
        if (query.TargetType.HasValue && !Enum.IsDefined(query.TargetType.Value))
            Fail(nameof(query.TargetType), "Favorite target type is invalid.");
    }

    private static void Fail(string member, string message) =>
        throw new ValidationException(new ValidationResult(message, [member]), null, null);
}
