// BE2-01/04 | Triển khai truy vấn và lưu dữ liệu EF Core cho thông tin món, số khẩu phần và dinh dưỡng mỗi khẩu phần.
// Đọc và ghi công thức, số khẩu phần, nguyên liệu và hướng dẫn nấu bằng EF Core.
using Domain.Rules;
using Application.Common.Exceptions;
using Application.Features.Recipes;
using Domain.Entities;
using Domain.Enums;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

// RecipeRepository: thực hiện truy vấn và lưu dữ liệu của tính năng qua EF Core.
public sealed class RecipeRepository(AppDbContext db) : IRecipeRepository
{
    public Task<int> CountRequiringReviewAsync(CancellationToken ct) => db.Recipes.CountAsync(RecipeReviewRules.RequiresReview, ct);
    // BE2-01/04 | Dùng chung cho danh sách public và Admin; trả các món của trang hiện tại và tổng số món khớp bộ lọc.
    public async Task<(IReadOnlyList<Recipe> Items, int TotalCount)> ListAsync(RecipeListQuery request, bool includeInactive, CancellationToken ct)
    {
        // Bắt đầu xây dựng truy vấn bảng Recipes. AsNoTracking dùng cho dữ liệu chỉ đọc, không theo dõi để cập nhật.
        // Các Where phía dưới chỉ ghép điều kiện; CountAsync/ToListAsync mới thực thi truy vấn xuống database.
        var query = db.Recipes.AsNoTracking().AsQueryable();
        // Controller public truyền includeInactive=false: chỉ hiển thị công thức đang sử dụng.
        // Controller Admin truyền true: có thể xem cả công thức đã ngừng sử dụng.
        if (!includeInactive)
        {
            query = query.Where(x => x.IsActive);
        }
        // Có từ khóa mới tìm kiếm; bỏ qua nếu null, rỗng hoặc chỉ có khoảng trắng.
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            // Trim bỏ khoảng trắng đầu/cuối. Contains kiểm tra chứa từ khóa; || nghĩa là hoặc.
            // Any: chỉ cần một nguyên liệu có tên hoặc tên gọi khác (Aliases) khớp là lấy công thức đó.
            var search = request.Search.Trim();
            query = query.Where(x => x.Name.Contains(search) ||
                x.RecipeIngredients.Any(row => row.Ingredient!.Name.Contains(search) ||
                    (row.Ingredient.Aliases != null && row.Ingredient.Aliases.Contains(search))));
        }
        // HasValue: người dùng có gửi bộ lọc; Value là giá trị được gửi.
        // Các Where liên tiếp kết hợp với nhau: công thức phải thỏa tất cả bộ lọc đã chọn.
        if (request.CategoryId.HasValue)
        {
            query = query.Where(x => x.CategoryId == request.CategoryId.Value);
        }
        // Lọc đúng chế độ ăn Admin đã khai báo trên công thức, chưa đánh giá lại nguyên liệu.
        if (request.DeclaredDietaryType.HasValue)
        {
            query = query.Where(x => x.DeclaredDietaryType == request.DeclaredDietaryType.Value);
        }
        // Giới hạn thời gian nấu: chọn 30 phút thì lấy món có thời gian <= 30 phút.
        if (request.MaxCookTimeMinutes.HasValue)
        {
            query = query.Where(recipe => recipe.CookTimeMinutes <= request.MaxCookTimeMinutes.Value);
        }
        // Giới hạn calo mỗi khẩu phần: phải có dữ liệu calo và không vượt mức chọn.
        // && nghĩa là cả hai điều kiện cùng đúng; món chưa có calo không được lấy khi áp dụng bộ lọc này.
        if (request.MaxCaloriesPerServing.HasValue)
        {
            query = query.Where(recipe => recipe.CaloriesPerServing.HasValue &&
                recipe.CaloriesPerServing.Value <= request.MaxCaloriesPerServing.Value);
        }
        // Lọc khả năng tương thích theo loại đã khai báo: lấy món chưa khai báo, món Vegan hoặc đúng loại yêu cầu.
        // Nếu người dùng ăn cả trứng và sữa (LactoOvo), điều kiện này chấp nhận mọi loại đã khai báo.
        if (request.CompatibleDeclaredDietaryType.HasValue)
        {
            var requestedDiet = request.CompatibleDeclaredDietaryType.Value;
            query = query.Where(recipe => !recipe.DeclaredDietaryType.HasValue ||
                recipe.DeclaredDietaryType == Domain.Enums.DietaryType.Vegan || recipe.DeclaredDietaryType == requestedDiet ||
                requestedDiet == Domain.Enums.DietaryType.LactoOvoVegetarian);
        }
        // Khác với DeclaredDietaryType: bộ lọc này kiểm tra dữ liệu nguyên liệu hiện tại theo Domain rule.
        if (request.DietaryType.HasValue)
        {
            // Tạo truy vấn ID nguyên liệu không phù hợp với chế độ ăn được yêu cầu.
            var incompatibleIds = db.Ingredients
                .Where(DietaryRules.IncompatibleIngredient(request.DietaryType.Value)).Select(ingredient => ingredient.Id);

            // Công thức phải có nguyên liệu và không được chứa bất kỳ nguyên liệu không phù hợp nào.
            query = query.Where(recipe => recipe.RecipeIngredients.Any() &&
                !recipe.RecipeIngredients.Any(row => incompatibleIds.Contains(row.IngredientId)));
        }

        // Đếm tổng số món khớp bộ lọc TRƯỚC phân trang để FE biết tổng kết quả.
        var count = await query.CountAsync(ct);
        // Số món cần bỏ qua: (trang - 1) * kích thước trang. Ví dụ trang 2, mỗi trang 12 món => bỏ 12 món.
        // Tính bằng long để tránh tràn số khi PageNumber lớn.
        var offset = ((long)request.PageNumber - 1) * request.PageSize;
        // Trang vượt quá số kết quả thì trả danh sách rỗng, vẫn giữ tổng số món.
        if (offset >= count)
        {
            return (Array.Empty<Recipe>(), count);
        }
        // Ưu tiên cùng tập công thức được đếm ở menu, trước khi phân trang.
        var prioritized = includeInactive ? query.OrderByDescending(RecipeReviewRules.RequiresReview) : query.OrderBy(recipe => false);
        // Sắp xếp phụ sau mức ưu tiên: asc tăng dần calo, desc giảm dần, mặc định theo tên.
        // Món thiếu calo nằm cuối trong cùng mức ưu tiên; tên rồi ID giúp thứ tự ổn định khi phân trang.
        var ordered = request.RankByPopularity
            ? query.OrderByDescending(recipe => db.Favorites.Count(favorite => favorite.TargetType == FavoriteTargetType.Recipe && favorite.TargetId == recipe.Id))
                .ThenBy(recipe => recipe.Name).ThenBy(recipe => recipe.Id)
            : request.CalorieSort switch
        {
            "asc" => prioritized.ThenBy(x => !x.CaloriesPerServing.HasValue)
                .ThenBy(x => x.CaloriesPerServing).ThenBy(x => x.Name).ThenBy(x => x.Id),
            "desc" => prioritized.ThenBy(x => !x.CaloriesPerServing.HasValue)
                .ThenByDescending(x => x.CaloriesPerServing).ThenBy(x => x.Name).ThenBy(x => x.Id),
            _ => prioritized.ThenBy(x => x.Name).ThenBy(x => x.Id)
        };
        // Skip bỏ các món của trang trước; Take giới hạn số món trong trang hiện tại.
        // Include tải danh mục; ThenInclude tải thông tin nguyên liệu qua các dòng định lượng RecipeIngredients.
        // AsSplitQuery tách truy vấn tải dữ liệu liên quan; ToListAsync thực thi và đưa kết quả vào danh sách.
        // ct truyền tín hiệu hủy từ request xuống thao tác database.
        var items = await ordered
            .Skip((int)offset).Take(request.PageSize)
            .Include(x => x.Category)
            .Include(x => x.RecipeIngredients).ThenInclude(x => x.Ingredient)
            .AsSplitQuery()
            .ToListAsync(ct);
        // Service nhận danh sách của trang và tổng số món để tạo RecipePage trả về FE.
        return (items, count);
    }

    // BE2-01/04 | Lấy chi tiết theo ID, kèm danh mục và nguyên liệu; không tìm thấy thì trả null.
    // Repository chưa lọc IsActive ở đây; Service quyết định có cho public xem công thức ngừng sử dụng hay không.
    public Task<Recipe?> GetAsync(Guid id, CancellationToken ct) =>
        db.Recipes.Include(x => x.Category).Include(x => x.RecipeIngredients).ThenInclude(x => x.Ingredient).SingleOrDefaultAsync(x => x.Id == id, ct);

    // BE2-04 | Kiểm tra trùng tên trên cả công thức đang dùng và đã ngừng sử dụng.
    // exceptId bỏ qua chính công thức đang sửa, để giữ nguyên tên của nó mà không bị báo trùng.
    public Task<bool> NameExistsAsync(string name, Guid? exceptId, CancellationToken ct) =>
        db.Recipes.AnyAsync(x => x.Name == name && x.Id != exceptId, ct);

    // BE2-04 | Đánh dấu công thức mới để EF thêm vào database; chưa lưu cho đến khi gọi SaveAsync.
    public void Add(Recipe entity) => db.Recipes.Add(entity);

    // BE2-04 | Ghi các thay đổi đang được DbContext theo dõi xuống database.
    public async Task SaveAsync(CancellationToken ct)
    {
        try
        {
            await db.SaveChangesAsync(ct);
        }
        // SQL Server báo vi phạm khóa/chỉ mục duy nhất (2601/2627), ví dụ hai yêu cầu cùng tạo tên trùng.
        // Chuyển thành lỗi nghiệp vụ Conflict để Controller trả HTTP 409 và thông báo dễ hiểu.
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new ConflictException("Tên công thức đã tồn tại. Vui lòng kiểm tra cả công thức đã ngừng sử dụng.");
        }
    }
}
