// Chức năng: hạ tầng và quy tắc dùng chung. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Application.Features.Administration;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

// FeedbackRepository: thực hiện truy vấn và lưu dữ liệu của tính năng qua EF Core.
public sealed class FeedbackRepository(AppDbContext db) : IFeedbackRepository
{
    // AddAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task AddAsync(ContactFeedback feedback, CancellationToken ct)
    {
        db.ContactFeedback.Add(feedback);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await db.SaveChangesAsync(ct);
    }

    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<FeedbackPage> ListAsync(bool? isRead, int page, int pageSize, CancellationToken ct)
    {
        var query = db.ContactFeedback.AsNoTracking();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (isRead.HasValue) query = query.Where(x => (x.ReadAt != null) == isRead.Value);
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new FeedbackItem(x.Id, x.Name, x.Email, x.Subject, x.Message, x.CreatedAt, x.ReadAt))
            .ToListAsync(ct);
        return new FeedbackPage(items, total, page, pageSize);
    }

    // MarkReadAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task<bool> MarkReadAsync(Guid id, DateTimeOffset readAt, CancellationToken ct)
    {
        var feedback = await db.ContactFeedback.FindAsync([id], ct);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (feedback is null) return false;
        feedback.ReadAt ??= readAt;
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await db.SaveChangesAsync(ct);
        return true;
    }
}
