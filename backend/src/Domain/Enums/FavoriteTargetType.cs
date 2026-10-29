// Chức năng: danh sách nội dung yêu thích. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
namespace Domain.Enums;

// FavoriteTargetType: định nghĩa các giá trị trạng thái được phép.
public enum FavoriteTargetType
{
    Recipe = 1,
    Video = 2,
    Restaurant = 3,
    Article = 4
}
