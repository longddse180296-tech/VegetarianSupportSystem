// Chức năng: danh mục nguyên liệu và dữ liệu dinh dưỡng. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Application.Common.Exceptions;
using Application.Features.Ingredients;
using Domain.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

// IngredientRepository: thực hiện truy vấn và lưu dữ liệu của tính năng qua EF Core.
public sealed class IngredientRepository(AppDbContext db) : IIngredientRepository
{
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<(IReadOnlyList<Ingredient> Items, int TotalCount)> ListAsync(IngredientListQuery request, bool includeInactive, CancellationToken ct)
    {
        var query = db.Ingredients.AsNoTracking();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (!includeInactive)
        {
            query = query.Where(x => x.IsActive);
        }
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(x => x.Name.Contains(search) || (x.Aliases != null && x.Aliases.Contains(search)));
        }

        var count = await query.CountAsync(ct);
        var offset = ((long)request.PageNumber - 1) * request.PageSize;
        if (offset >= count)
        {
            return (Array.Empty<Ingredient>(), count);
        }
        var items = await query.OrderBy(x => x.Name).ThenBy(x => x.Id)
            .Skip((int)offset).Take(request.PageSize).ToListAsync(ct);
        return (items, count);
    }

    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public Task<Ingredient?> GetAsync(Guid id, CancellationToken ct) =>
        db.Ingredients.SingleOrDefaultAsync(x => x.Id == id, ct);

    // NameExistsAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public Task<bool> NameExistsAsync(string name, Guid? exceptId, CancellationToken ct) =>
        db.Ingredients.AnyAsync(x => x.Name == name && x.Id != exceptId, ct);

    // Add: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public void Add(Ingredient entity) => db.Ingredients.Add(entity);

    // SaveAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task SaveAsync(CancellationToken ct)
    {
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new ConflictException("Tên nguyên liệu đã tồn tại. Vui lòng kiểm tra danh sách, kể cả nguyên liệu đã ngừng sử dụng.");
        }
    }

    // GetManyAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<IReadOnlyList<Ingredient>> GetManyAsync(IReadOnlyCollection<Guid> ids, CancellationToken ct) =>
        await db.Ingredients.Where(x => ids.Contains(x.Id)).ToListAsync(ct);
}
