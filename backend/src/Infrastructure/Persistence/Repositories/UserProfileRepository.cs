using Application.Features.Profiles;
using Domain.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public sealed class UserProfileRepository(AppDbContext db) : IUserProfileRepository
{
    public Task<User?> FindByIdAsync(string userId, CancellationToken cancellationToken) =>
        db.Users
            .Include(x => x.Profile!.Allergies)
            .Include(x => x.Profile!.AvoidedFoods)
            .AsSplitQuery()
            .FirstOrDefaultAsync(x => x.Id == userId, cancellationToken);

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
