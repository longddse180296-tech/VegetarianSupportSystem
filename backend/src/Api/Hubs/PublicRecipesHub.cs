using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Api.Hubs;

public interface IPublicRecipesClient
{
    Task RecipesChanged();
}

// Guest và User chỉ nhận tín hiệu tải lại API public, không nhận dữ liệu quản trị.
[AllowAnonymous]
public sealed class PublicRecipesHub : Hub<IPublicRecipesClient>
{
}

public sealed class PublicRecipeUpdates(
    IHubContext<PublicRecipesHub, IPublicRecipesClient> hub,
    ILogger<PublicRecipeUpdates> logger)
{
    public async Task PublishAsync()
    {
        try
        {
            // Database đã lưu thành công; lỗi kết nối không được biến thao tác lưu thành thất bại.
            await hub.Clients.All.RecipesChanged().WaitAsync(TimeSpan.FromSeconds(3));
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Không thể gửi thông báo cập nhật danh sách công thức public.");
        }
    }
}
