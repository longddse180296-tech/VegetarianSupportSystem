// Chức năng: hội thoại hỗ trợ ăn chay. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
namespace Domain.Enums;

// AiChatMessageRole: định nghĩa các giá trị trạng thái được phép.
public enum AiChatMessageRole
{
    User = 1,
    Assistant = 2
}
