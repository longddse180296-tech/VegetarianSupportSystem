// Chức năng: hạ tầng và quy tắc dùng chung. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Common.Exceptions;

// ConflictException: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class ConflictException(string message) : Exception(message);
