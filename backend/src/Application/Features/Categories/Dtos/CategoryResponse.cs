// BE2-02 | Dữ liệu trả về cho giao diện (danh mục: tên, mô tả và trạng thái sử dụng).
// Định nghĩa các trường API trả về cho danh mục theo loại nội dung.
namespace Application.Features.Categories;

// CategoryResponse: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record CategoryResponse(
    Guid Id,
    string Name,
    string? Description,
    bool IsActive, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt);
