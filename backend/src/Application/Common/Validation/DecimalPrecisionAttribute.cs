using System.ComponentModel.DataAnnotations;

namespace Application.Common.Validation;

[AttributeUsage(AttributeTargets.Property)]
public sealed class DecimalPrecisionAttribute(int scale) : ValidationAttribute
{
    public override bool IsValid(object? value) =>
        value is null || value is decimal number && decimal.Round(number, scale) == number;

    public override string FormatErrorMessage(string name) =>
        $"{name} allows at most {scale} decimal places.";
}
