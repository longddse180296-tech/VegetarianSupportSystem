// Chức năng: danh mục nguyên liệu và dữ liệu dinh dưỡng. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using System.ComponentModel.DataAnnotations;
using Application.Common.Exceptions;
using Application.Common.Validation;
using Domain.Entities;

namespace Application.Features.Ingredients;

// IngredientService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed class IngredientService(IIngredientRepository repository)
{
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<IngredientPage> ListAsync(IngredientListQuery query, bool includeInactive, CancellationToken ct)
    {
        RequestValidation.Validate(query);
        var (items, count) = await repository.ListAsync(query, includeInactive, ct);
        return new(items.Select(IngredientMapping.ToResponse).ToArray(), query.PageNumber, query.PageSize, count);
    }

    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<IngredientResponse> GetAsync(Guid id, bool includeInactive, CancellationToken ct)
    {
        var entity = await FindAsync(id, ct);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (!includeInactive && !entity.IsActive)
        {
            throw new KeyNotFoundException("Không tìm thấy nguyên liệu hoặc nguyên liệu không còn khả dụng.");
        }
        return IngredientMapping.ToResponse(entity);
    }

    // CreateAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<IngredientResponse> CreateAsync(IngredientRequest request, CancellationToken ct)
    {
        var entity = new Ingredient();
        await ApplyAsync(entity, request, ct);
        repository.Add(entity);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
        return IngredientMapping.ToResponse(entity);
    }

    // UpdateAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<IngredientResponse> UpdateAsync(Guid id, IngredientRequest request, CancellationToken ct)
    {
        var entity = await FindAsync(id, ct);
        await ApplyAsync(entity, request, ct);
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
        return IngredientMapping.ToResponse(entity);
    }

    // DeactivateAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public async Task DeactivateAsync(Guid id, CancellationToken ct)
    {
        var entity = await FindAsync(id, ct);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (!entity.IsActive)
        {
            return;
        }
        entity.IsActive = false;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
    }

    // Kích hoạt lại giữ nguyên dinh dưỡng và liên kết công thức, lưu trạng thái thật xuống database.
    public async Task ActivateAsync(Guid id, CancellationToken ct)
    {
        var entity = await FindAsync(id, ct);
        if (entity.IsActive) return;
        entity.IsActive = true;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await repository.SaveAsync(ct);
    }

    // FindAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    private async Task<Ingredient> FindAsync(Guid id, CancellationToken ct) =>
        await repository.GetAsync(id, ct) ?? throw new KeyNotFoundException("Không tìm thấy nguyên liệu hoặc nguyên liệu không còn khả dụng.");

    // ApplyAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private async Task ApplyAsync(Ingredient entity, IngredientRequest request, CancellationToken ct)
    {
        IngredientValidation.Validate(request);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (await repository.NameExistsAsync(request.Name.Trim(), entity.Id, ct))
        {
            throw new ConflictException("Tên nguyên liệu đã tồn tại. Vui lòng kiểm tra danh sách, kể cả nguyên liệu đã ngừng sử dụng.");
        }

        entity.Name = request.Name.Trim();
        entity.Aliases = request.Aliases?.Trim();
        entity.Origin = request.Origin;
        entity.ContainsEgg = request.ContainsEgg;
        entity.ContainsMilk = request.ContainsMilk;
        entity.ContainsHoney = request.ContainsHoney;
        entity.ContainsOtherAnimalProducts = request.ContainsOtherAnimalProducts;
        entity.Allergens = request.Allergens?.Trim();
        entity.DefaultUnit = request.DefaultUnit?.Trim();
        entity.Calories = request.Calories;
        entity.ProteinGram = request.ProteinGram;
        entity.CarbohydrateGram = request.CarbohydrateGram;
        entity.FatGram = request.FatGram;
        entity.NutritionBasisUnit = request.DefaultUnit!;
        entity.NutritionBasisQuantity = request.DefaultUnit is "g" or "ml" ? 100 : 1;
        entity.Source = request.Source?.Trim();
    }
}
