// Chức năng: quản trị tài khoản và thống kê hệ thống. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
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
