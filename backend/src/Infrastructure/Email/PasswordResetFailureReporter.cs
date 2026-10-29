// Chức năng: gửi thư khôi phục tài khoản. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Application.Features.Auth;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Email;

// PasswordResetFailureReporter: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class PasswordResetFailureReporter(ILogger<PasswordResetFailureReporter> logger)
    : IPasswordResetFailureReporter
{
    // EmailDeliveryFailed: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public void EmailDeliveryFailed(string errorType) =>
        logger.LogError("Password reset email delivery failed ({ErrorType}).", errorType);
}
