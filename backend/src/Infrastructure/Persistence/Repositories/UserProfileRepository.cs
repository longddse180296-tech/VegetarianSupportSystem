// Chức năng: hồ sơ và nhu cầu dinh dưỡng cá nhân. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Application.Features.Profiles;
using Domain.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

// UserProfileRepository: thực hiện truy vấn và lưu dữ liệu của tính năng qua EF Core.
public sealed class UserProfileRepository(AppDbContext db) : IUserProfileRepository
{
    // FindByIdAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<User?> FindByIdAsync(string userId, CancellationToken cancellationToken) =>
        db.Users
            .Include(x => x.Profile!.Allergies)
            .Include(x => x.Profile!.AvoidedFoods)
            .AsSplitQuery()
            .FirstOrDefaultAsync(x => x.Id == userId, cancellationToken);

    // SaveChangesAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new ProfileConflictException("Giá trị này đã tồn tại trong hồ sơ.");
        }
    }
}
