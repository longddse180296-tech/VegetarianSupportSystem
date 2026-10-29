// Chức năng: quản trị tài khoản và thống kê hệ thống. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using System.ComponentModel.DataAnnotations;
using Domain.Entities;

namespace Application.Features.Administration;

// FeedbackService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed class FeedbackService(IFeedbackRepository repository, TimeProvider clock)
{
    // CreateAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<FeedbackReceipt> CreateAsync(CreateFeedbackRequest request, CancellationToken ct)
    {
        var name = Required(request.Name, 100, "Họ tên");
        var email = Required(request.Email, 254, "Email");
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (!new EmailAddressAttribute().IsValid(email))
            throw new ArgumentException("Email không hợp lệ.");
        var subject = Required(request.Subject, 150, "Tiêu đề");
        var message = Required(request.Message, 4000, "Nội dung");
        var feedback = new ContactFeedback
        {
            Id = Guid.NewGuid(), Name = name, Email = email, Subject = subject,
            Message = message, CreatedAt = clock.GetUtcNow()
        };
        await repository.AddAsync(feedback, ct);
        return new FeedbackReceipt(feedback.Id, feedback.CreatedAt);
    }

    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<FeedbackPage> ListAsync(bool? isRead, int page, int pageSize, CancellationToken ct)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (page < 1 || pageSize is < 1 or > 50 || (long)(page - 1) * pageSize > int.MaxValue)
            throw new ArgumentException("Phân trang không hợp lệ: page từ 1, pageSize từ 1 đến 50.");
        return repository.ListAsync(isRead, page, pageSize, ct);
    }

    // MarkReadAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public Task<bool> MarkReadAsync(Guid id, CancellationToken ct) =>
        repository.MarkReadAsync(id, clock.GetUtcNow(), ct);

    // Required: Kiểm tra dữ liệu và điều kiện nghiệp vụ; dừng xử lý khi không hợp lệ.
    private static string Required(string? value, int maxLength, string label)
    {
        var trimmed = value?.Trim();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (string.IsNullOrEmpty(trimmed) || trimmed.Length > maxLength)
            throw new ArgumentException($"{label} phải có từ 1 đến {maxLength} ký tự.");
        return trimmed;
    }
}
