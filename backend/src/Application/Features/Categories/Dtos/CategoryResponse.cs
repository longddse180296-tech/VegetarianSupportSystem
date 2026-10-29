// Chức năng: danh mục nội dung. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.Categories;

// CategoryResponse: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record CategoryResponse(
    Guid Id,
    string Name,
    string? Description,
    bool IsActive, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt);
