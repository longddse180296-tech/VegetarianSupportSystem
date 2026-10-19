using System.ComponentModel.DataAnnotations;
using Domain.Enums;

namespace Application.Features.Administration;

public sealed class FeaturedContentService(IFeaturedContentRepository repository, TimeProvider clock)
{
    public Task<FeaturedContentPage> ListAsync(FeaturedContentListQuery query, bool pinnedOnly, CancellationToken ct)
    {
        Validator.ValidateObject(query, new ValidationContext(query), true);
        if (query.Page > int.MaxValue / query.PageSize)
            throw new ValidationException("Số trang vượt giới hạn.");
        return repository.ListAsync(ParseContentType(query.ContentType),
            pinnedOnly ? null : query.Search?.Trim(), pinnedOnly, query.Page, query.PageSize, ct);
    }

    public Task SetPinnedAsync(string contentType, Guid id, FeaturedContentPinRequest request,
        string adminId, CancellationToken ct)
    {
        var type = ParseContentType(contentType);
        Validator.ValidateObject(request, new ValidationContext(request), true);
        if (id == Guid.Empty) throw new ValidationException("ID nội dung không hợp lệ.");
        if (string.IsNullOrWhiteSpace(adminId)) throw new ValidationException("Thiếu danh tính Admin.");
        return repository.SetPinnedAsync(type, id, request.IsPinned!.Value, adminId, clock.GetUtcNow(), ct);
    }

    private static FeaturedContentType ParseContentType(string value)
    {
        if (!Enum.TryParse<FeaturedContentType>(value, out var type) ||
            !Enum.IsDefined(type) || type.ToString() != value)
            throw new ValidationException("Loại nội dung phải là Restaurant, Video hoặc Article.");
        return type;
    }
}
