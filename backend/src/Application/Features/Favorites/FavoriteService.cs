// Chức năng: danh sách nội dung yêu thích. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Application.Common.Exceptions;
using Domain.Entities;

namespace Application.Features.Favorites;

// FavoriteService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed class FavoriteService(IFavoriteRepository repository)
{
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<FavoritePage> ListAsync(string userId, FavoriteListQuery query, CancellationToken ct)
    {
        FavoriteValidation.Validate(query);
        var favorites = await repository.ListAsync(userId, query.TargetType, ct);
        var visible = new List<FavoriteResponse>();
        foreach (var favorite in favorites)
        {
            var target = await repository.GetPublicTargetAsync(favorite.TargetType, favorite.TargetId, ct);
            if (target is not null)
                visible.Add(ToResponse(favorite, target));
        }

        var start = (long)(query.PageNumber - 1) * query.PageSize;
        var items = start >= visible.Count
            ? []
            : visible.Skip((int)start).Take(query.PageSize).ToArray();
        return new FavoritePage(items, visible.Count, query.PageNumber, query.PageSize);
    }

    // CreateAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<FavoriteResponse> CreateAsync(string userId, FavoriteRequest request, CancellationToken ct)
    {
        FavoriteValidation.Validate(request);
        var targetType = request.TargetType!.Value;
        var target = await repository.GetPublicTargetAsync(targetType, request.TargetId, ct)
            ?? throw new KeyNotFoundException("Nội dung này không còn công khai hoặc chưa thể lưu yêu thích.");
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (await repository.ExistsAsync(userId, targetType, request.TargetId, ct))
            throw new ConflictException("Nội dung này đã có trong danh sách yêu thích của bạn.");

        var favorite = new Favorite
        {
            UserId = userId.Trim(),
            TargetType = targetType,
            TargetId = request.TargetId,
            SavedFrom = targetType == Domain.Enums.FavoriteTargetType.Recipe
                ? request.SavedFrom ?? Domain.Enums.FavoriteSaveSource.Recipe : null
        };
        repository.Add(favorite);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
        return ToResponse(favorite, target);
    }

    // DeleteAsync: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    public async Task DeleteAsync(string userId, Guid id, CancellationToken ct)
    {
        var favorite = await repository.GetAsync(id, userId, ct)
            ?? throw new KeyNotFoundException("Nội dung không còn trong danh sách yêu thích.");
        repository.Remove(favorite);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
    }

    // ToResponse: Chuyển dữ liệu nội bộ sang cấu trúc trả về cho bên gọi.
    private static FavoriteResponse ToResponse(Favorite favorite, FavoriteTargetInfo target) => new(
        favorite.Id, favorite.TargetType, favorite.TargetId, target.Name, target.ImageUrl, favorite.CreatedAt, favorite.SavedFrom, target.DurationSeconds);
}
