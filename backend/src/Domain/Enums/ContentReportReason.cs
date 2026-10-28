// Chức năng: báo cáo nội dung cần xem xét. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
namespace Domain.Enums;

// ContentReportReason: định nghĩa các giá trị trạng thái được phép.
public enum ContentReportReason { Spam = 1, Inappropriate = 2, Misleading = 3, Copyright = 4, Other = 5 }
