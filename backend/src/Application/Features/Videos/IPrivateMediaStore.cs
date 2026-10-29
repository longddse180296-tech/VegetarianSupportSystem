// Chức năng: video, bản nháp và nội dung công khai. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.Videos;

// Keys are opaque server-generated names; callers never supply a path.
// IPrivateMediaStore: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IPrivateMediaStore
{
    // SaveAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task<string> SaveAsync(Stream source, string extension, long maxBytes, CancellationToken cancellationToken);
    // OpenReadAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task<Stream?> OpenReadAsync(string key, CancellationToken cancellationToken);
    // Chỉ xóa tệp mới tải bị từ chối, không xóa media của phiên bản đang sử dụng.
    Task DeleteAsync(string key, CancellationToken cancellationToken);
}
