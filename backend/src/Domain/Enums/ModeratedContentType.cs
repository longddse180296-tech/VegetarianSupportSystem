// Chức năng: hạ tầng và quy tắc dùng chung. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
namespace Domain.Enums;

// ModeratedContentType: định nghĩa các giá trị trạng thái được phép.
public enum ModeratedContentType
{
    Article = 1,
    Video = 2
}
