// BE2-06 | Hợp đồng API cho truy vấn, hiển thị hoặc cập nhật nội dung nổi bật.
// Trả một trang nội dung được Admin ghim nổi bật kèm thông tin phân trang.
namespace Application.Features.Administration;

// FeaturedContentPage: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record FeaturedContentPage(IReadOnlyList<FeaturedContentItem> Items, int TotalCount, int Page, int PageSize);
