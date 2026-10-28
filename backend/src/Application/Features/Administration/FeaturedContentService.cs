// Chức năng: quản trị tài khoản và thống kê hệ thống. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using System.ComponentModel.DataAnnotations;
using Domain.Enums;

namespace Application.Features.Administration;

// FeaturedContentService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed class FeaturedContentService(IFeaturedContentRepository repository, TimeProvider clock)
{
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<FeaturedContentPage> ListAsync(FeaturedContentListQuery query, bool pinnedOnly, CancellationToken ct)
    {
        Validator.ValidateObject(query, new ValidationContext(query), true);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (query.Page > int.MaxValue / query.PageSize)
            throw new ValidationException("Số trang vượt giới hạn.");
        return repository.ListAsync(ParseContentType(query.ContentType),
            pinnedOnly ? null : query.Search?.Trim(), pinnedOnly, query.Page, query.PageSize, ct);
    }

    // SetPinnedAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public Task SetPinnedAsync(string contentType, Guid id, FeaturedContentPinRequest request,
        string adminId, CancellationToken ct)
    {
        var type = ParseContentType(contentType);
        Validator.ValidateObject(request, new ValidationContext(request), true);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (id == Guid.Empty) throw new ValidationException("ID nội dung không hợp lệ.");
        if (string.IsNullOrWhiteSpace(adminId)) throw new ValidationException("Chưa xác định được Quản trị viên. Vui lòng đăng nhập lại.");
        return repository.SetPinnedAsync(type, id, request.IsPinned!.Value, adminId, clock.GetUtcNow(), ct);
    }

    // ParseContentType: Chuẩn hóa hoặc chuyển đổi dữ liệu giữa các bước xử lý.
    private static FeaturedContentType ParseContentType(string value)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (!Enum.TryParse<FeaturedContentType>(value, out var type) ||
            !Enum.IsDefined(type) || type.ToString() != value)
            throw new ValidationException("Vui lòng chọn nhà hàng, video hoặc bài viết để ghim nổi bật.");
        return type;
    }
}
