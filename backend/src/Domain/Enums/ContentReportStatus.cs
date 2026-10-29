// Chức năng: báo cáo nội dung cần xem xét. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
namespace Domain.Enums;

// ContentReportStatus: định nghĩa các giá trị trạng thái được phép.
public enum ContentReportStatus { Pending = 1, Resolved = 2, Dismissed = 3 }
