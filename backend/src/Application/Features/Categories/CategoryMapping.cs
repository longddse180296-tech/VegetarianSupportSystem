// BE2-02 | Chuyển dữ liệu nghiệp vụ sang dạng API trả về (danh mục: tên, mô tả và trạng thái sử dụng).
// Chuyển dữ liệu về danh mục theo loại nội dung từ entity sang cấu trúc API trả về.
using Domain.Entities;

namespace Application.Features.Categories;

// CategoryMapping: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
internal static class CategoryMapping
{
    // ToResponse: Chuyển dữ liệu nội bộ sang cấu trúc trả về cho bên gọi.
    public static CategoryResponse ToResponse(Category entity) => new(
        entity.Id,
        entity.Name,
        entity.Description,
        entity.IsActive,
        entity.CreatedAt,
        entity.UpdatedAt);
}
