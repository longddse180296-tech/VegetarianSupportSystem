// Chuyển mã lỗi provider thành thông báo kiểm duyệt rõ nguyên nhân; không kết luận ảnh vi phạm từ lỗi dịch vụ.
namespace Infrastructure.AI.Gemini;

public static class ModerationFailureMessage
{
    public static string For(string? errorCode) => errorCode switch
    {
        "ProviderHttp429" => "Hệ thống kiểm tra đang giới hạn lượt gọi hoặc đã chạm hạn mức sử dụng. Chưa có kết quả đánh giá cho lần kiểm tra này; đây không phải kết luận ảnh vi phạm. Vui lòng chờ hạn mức hồi lại rồi thử lại, hoặc để Quản trị viên kiểm tra trực tiếp.",
        "ProviderSafetyBlocked" => "Yêu cầu kiểm tra bị bộ lọc an toàn của Hệ thống chặn nên chưa có kết quả đầy đủ. Quản trị viên cần xem trực tiếp văn bản và ảnh đại diện.",
        "Timeout" or "NetworkError" => "Kết nối đến dịch vụ kiểm tra bị gián đoạn hoặc quá thời gian chờ. Chưa có kết quả kiểm tra; vui lòng thử lại sau hoặc để Quản trị viên kiểm tra trực tiếp.",
        _ => "Hệ thống hiện không thể kiểm tra nội dung. Quản trị viên cần xem trực tiếp văn bản và ảnh đại diện."
    };
}
