// Chức năng: hạ tầng và quy tắc dùng chung. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Application.Features.Auth;
using Domain.Entities;
using Domain.Enums;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

// UserAccountRepository: thực hiện truy vấn và lưu dữ liệu của tính năng qua EF Core.
public sealed class UserAccountRepository(AppDbContext db) : IUserAccountRepository
{
    // FindByEmailAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<User?> FindByEmailAsync(string normalizedEmail, CancellationToken cancellationToken) =>
        db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.NormalizedEmail == normalizedEmail, cancellationToken);

    // FindByIdAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<User?> FindByIdAsync(string id, CancellationToken cancellationToken) =>
        db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    // HasAdminAsync: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    public Task<bool> HasAdminAsync(CancellationToken cancellationToken) =>
        db.Users.AnyAsync(x => x.Role == UserRole.Admin, cancellationToken);

    // AddAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task AddAsync(User user, CancellationToken cancellationToken)
    {
        db.Users.Add(user);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new DuplicateEmailException();
        }
    }
}
