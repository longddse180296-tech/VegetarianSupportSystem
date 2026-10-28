// Chức năng: hạ tầng và quy tắc dùng chung. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
namespace Application.Features.Media;

// Public image keys are opaque server-generated values, never client-provided file paths.
// IPublicImageStore: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IPublicImageStore
{
    // SaveAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task<string> SaveAsync(Stream source, string extension, long maxBytes, CancellationToken cancellationToken);
    // OpenReadAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task<Stream?> OpenReadAsync(string key, CancellationToken cancellationToken);
}
