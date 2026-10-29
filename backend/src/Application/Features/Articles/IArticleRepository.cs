// Chức năng: bài viết và phiên bản gửi duyệt. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Entities;
using Domain.Enums;

namespace Application.Features.Articles;

// IArticleRepository: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IArticleRepository
{
    Task<bool> HasDuplicatePublishedTitleAsync(Guid excludingArticleId, string title, CancellationToken ct);
    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<Article?> GetAsync(Guid id, CancellationToken ct);
    // ListMineAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<ArticlePage<Article>> ListMineAsync(string ownerId, MyArticleListQuery query, CancellationToken ct);
    // ListPublicAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<ArticlePage<ArticleVersion>> ListPublicAsync(ArticleListQuery query, CancellationToken ct);
    // GetPublicAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<ArticleVersion?> GetPublicAsync(Guid id, CancellationToken ct);
    // GetRelatedAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<IReadOnlyList<ArticleVersion>> GetRelatedAsync(Guid articleId, IReadOnlyCollection<string> categories, int count, CancellationToken ct);
    // AuthorNamesAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task<IReadOnlyDictionary<string, string>> AuthorNamesAsync(IEnumerable<string> authorIds, CancellationToken ct);
    // AddAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task AddAsync(Article article, CancellationToken ct);
    // Remove: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    void Remove(Article article);
    // SaveAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    Task SaveAsync(CancellationToken ct);
    // InTransactionAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task<T> InTransactionAsync<T>(Func<CancellationToken, Task<T>> action, CancellationToken ct);
}
