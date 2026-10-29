// Chức năng: danh mục nội dung. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
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
