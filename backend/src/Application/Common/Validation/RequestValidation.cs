using System.ComponentModel.DataAnnotations;

namespace Application.Common.Validation;

public static class RequestValidation
{
    public static void Validate(object value) =>
        Validator.ValidateObject(value, new ValidationContext(value), validateAllProperties: true);
}
