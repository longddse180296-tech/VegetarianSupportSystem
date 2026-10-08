using Application.Common.Validation;
using System.ComponentModel.DataAnnotations;
using Domain.Enums;

namespace Application.Features.Ingredients;

internal static class IngredientValidation
{
    public static void Validate(IngredientRequest request)
    {
        RequestValidation.Validate(request);
        if (request.Origin == IngredientOrigin.Plant && (request.ContainsEgg || request.ContainsMilk || request.ContainsHoney || request.ContainsOtherAnimalProducts == true))
        {
            throw new ValidationException(new ValidationResult(
                "Plant origin cannot contain animal-derived components. Use Animal or Unknown.",
                [nameof(request.Origin)]), null, request.Origin);
        }
    }
}
