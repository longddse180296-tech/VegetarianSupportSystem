using System.ComponentModel.DataAnnotations;
using Domain.Entities;

namespace Application.Features.Administration;

public sealed class FeedbackService(IFeedbackRepository repository, TimeProvider clock)
{
    public async Task<FeedbackReceipt> CreateAsync(CreateFeedbackRequest request, CancellationToken ct)
    {
        var name = Required(request.Name, 100, "Họ tên");
        var email = Required(request.Email, 254, "Email");
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

    public Task<FeedbackPage> ListAsync(bool? isRead, int page, int pageSize, CancellationToken ct)
    {
        if (page < 1 || pageSize is < 1 or > 50 || (long)(page - 1) * pageSize > int.MaxValue)
            throw new ArgumentException("Phân trang không hợp lệ: page từ 1, pageSize từ 1 đến 50.");
        return repository.ListAsync(isRead, page, pageSize, ct);
    }

    public Task<bool> MarkReadAsync(Guid id, CancellationToken ct) =>
        repository.MarkReadAsync(id, clock.GetUtcNow(), ct);

    private static string Required(string? value, int maxLength, string label)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrEmpty(trimmed) || trimmed.Length > maxLength)
            throw new ArgumentException($"{label} phải có từ 1 đến {maxLength} ký tự.");
        return trimmed;
    }
}
