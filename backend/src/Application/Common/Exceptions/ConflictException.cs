// Biểu diễn xung đột dữ liệu như tên đã tồn tại để API có thể trả HTTP 409.
namespace Application.Common.Exceptions;

// ConflictException: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class ConflictException(string message) : Exception(message);
