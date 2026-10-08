using System.ComponentModel.DataAnnotations;
using Application.Common.Validation;

namespace Application.Features.Recipes;

internal static class RecipeValidation
{
    public static void Validate(RecipeRequest request)
    {
        RequestValidation.Validate(request);

        if (request.ImageUrl is not null &&
            (!Uri.TryCreate(request.ImageUrl, UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)))
        {
            Fail(nameof(request.ImageUrl), "Image URL must use http or https.");
        }

        for (var index = 0; index < request.Ingredients.Length; index++)
        {
            var row = request.Ingredients[index];
            if (row is null)
            {
                Fail($"Ingredients[{index}]", "Ingredient row cannot be null.");
            }

            try
            {
                RequestValidation.Validate(row!);
            }
            catch (ValidationException ex)
            {
                var field = ex.ValidationResult?.MemberNames.FirstOrDefault();
                Fail($"Ingredients[{index}].{field ?? "request"}", ex.Message);
            }
        }

        if (request.Ingredients.Select(row => row.IngredientId).Distinct().Count() != request.Ingredients.Length)
        {
            Fail(nameof(request.Ingredients), "Ingredient IDs must be unique.");
        }
    }

    public static void Fail(string field, string message) =>
        throw new ValidationException(new ValidationResult(message, [field]), null, null);
}
