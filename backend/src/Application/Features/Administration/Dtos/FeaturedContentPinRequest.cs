// BE2-06 | Hợp đồng API cho truy vấn, hiển thị hoặc cập nhật nội dung nổi bật.
// Nhận loại và mã nội dung cần ghim ở khu vực nổi bật.
using System.ComponentModel.DataAnnotations;

namespace Application.Features.Administration;

// FeaturedContentPinRequest: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class FeaturedContentPinRequest
{
    public FeaturedContentPinRequest() { }

    public FeaturedContentPinRequest(bool? isPinned) => IsPinned = isPinned;

    [Required]
    public bool? IsPinned { get; init; }
}
