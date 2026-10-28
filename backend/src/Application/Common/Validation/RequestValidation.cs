// Chức năng: hạ tầng và quy tắc dùng chung. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using System.ComponentModel.DataAnnotations;

namespace Application.Common.Validation;

// RequestValidation: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public static class RequestValidation
{
    // Validate: Kiểm tra dữ liệu và điều kiện nghiệp vụ; dừng xử lý khi không hợp lệ.
    public static void Validate(object value) =>
        Validator.ValidateObject(value, new ValidationContext(value), validateAllProperties: true);
}
