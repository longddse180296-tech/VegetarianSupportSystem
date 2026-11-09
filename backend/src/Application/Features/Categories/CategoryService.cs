// BE2-02 | Điều phối nghiệp vụ và kiểm tra điều kiện trước khi lưu (danh mục: tên, mô tả và trạng thái sử dụng).
// Chức năng: danh mục nội dung. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using System.ComponentModel.DataAnnotations;
using Application.Common.Exceptions;
using Application.Common.Validation;
using Domain.Entities;
using Domain.Enums;

namespace Application.Features.Categories;

// CategoryService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed class CategoryService(ICategoryRepository repository)
{
    // ListAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<CategoryPage> ListAsync(CategoryListQuery query, bool includeInactive, CancellationToken ct, CategoryKind kind = CategoryKind.Recipe)
    {
        RequestValidation.Validate(query);
        var (items, count) = await repository.ListAsync(query, includeInactive, kind, ct);
        return new(items.Select(CategoryMapping.ToResponse).ToArray(), query.PageNumber, query.PageSize, count);
    }

    // GetAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<CategoryResponse> GetAsync(Guid id, bool includeInactive, CancellationToken ct, CategoryKind kind = CategoryKind.Recipe)
    {
        var entity = await FindAsync(id, kind, ct);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (!includeInactive && !entity.IsActive)
        {
            throw new KeyNotFoundException("Không tìm thấy danh mục hoặc danh mục không còn khả dụng.");
        }
        return CategoryMapping.ToResponse(entity);
    }

    // CreateAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<CategoryResponse> CreateAsync(CategoryRequest request, CancellationToken ct, CategoryKind kind = CategoryKind.Recipe)
    {
        var entity = new Category { Kind = kind };
        await ApplyAsync(entity, request, ct);
        repository.Add(entity);
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
        return CategoryMapping.ToResponse(entity);
    }

    // UpdateAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<CategoryResponse> UpdateAsync(Guid id, CategoryRequest request, CancellationToken ct, CategoryKind kind = CategoryKind.Recipe)
    {
        var entity = await FindAsync(id, kind, ct);
        await ApplyAsync(entity, request, ct);
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
        return CategoryMapping.ToResponse(entity);
    }

    // DeactivateAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public Task DeactivateAsync(Guid id, CancellationToken ct, CategoryKind kind = CategoryKind.Recipe) =>
        SetActiveAsync(id, false, ct, kind);

    public async Task SetActiveAsync(Guid id, bool active, CancellationToken ct, CategoryKind kind)
    {
        var entity = await FindAsync(id, kind, ct);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (entity.IsActive == active)
        {
            return;
        }
        entity.IsActive = active;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        // Lưu thay đổi sau khi các điều kiện nghiệp vụ đã được kiểm tra.
        await repository.SaveAsync(ct);
    }

    // FindAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    private async Task<Category> FindAsync(Guid id, CategoryKind kind, CancellationToken ct) =>
        await repository.GetAsync(id, ct) is { } entity && entity.Kind == kind ? entity : throw new KeyNotFoundException("Không tìm thấy danh mục hoặc danh mục không còn khả dụng.");

    // ApplyAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private async Task ApplyAsync(Category entity, CategoryRequest request, CancellationToken ct)
    {
        RequestValidation.Validate(request);

        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (await repository.NameExistsAsync(request.Name.Trim(), entity.Id, entity.Kind, ct))
        {
            throw new ConflictException("Tên danh mục đã tồn tại. Vui lòng kiểm tra cả danh mục đã ngừng sử dụng.");
        }

        entity.Name = request.Name.Trim();
        entity.Description = request.Description?.Trim();
    }
}
