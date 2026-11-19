// BE2-05 | Hợp đồng đọc và ghi dữ liệu mà service sử dụng (nhà hàng: danh mục public và quản trị, vị trí và chế độ ăn).
// Quy định các thao tác truy xuất nhà hàng chay, vị trí, khoảng giá và tiện ích mà nghiệp vụ sử dụng.
using Domain.Entities;

namespace Application.Features.Restaurants;

// IRestaurantRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IRestaurantRepository
{
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<IReadOnlyList<Restaurant>> ListAsync(RestaurantListQuery query, bool includeInactive, CancellationToken ct);
    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<Restaurant?> GetAsync(Guid id, CancellationToken ct);
    // NameExistsAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task<bool> NameExistsAsync(string name, Guid? exceptId, CancellationToken ct);
    // Add: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    void Add(Restaurant entity);
    // SaveAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task SaveAsync(CancellationToken ct);
}
