// Chức năng: hạ tầng và quy tắc dùng chung. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using System.ComponentModel.DataAnnotations;

namespace Application.Common.Validation;

// DecimalPrecisionAttribute: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
[AttributeUsage(AttributeTargets.Property)]
public sealed class DecimalPrecisionAttribute(int scale) : ValidationAttribute
{
    // IsValid: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    public override bool IsValid(object? value) =>
        value is null || value is decimal number && decimal.Round(number, scale) == number;

    // FormatErrorMessage: Chuẩn hóa hoặc chuyển đổi dữ liệu giữa các bước xử lý.
    public override string FormatErrorMessage(string name) =>
        $"{name} allows at most {scale} decimal places.";
}
