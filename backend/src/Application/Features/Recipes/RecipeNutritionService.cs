// Chức năng: công thức và định lượng nguyên liệu. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using System.ComponentModel.DataAnnotations;
using Application.Common.Validation;
using Application.Features.Ingredients;
using Domain.Entities;
using Domain.Rules;

namespace Application.Features.Recipes;

// RecipeNutritionService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed class RecipeNutritionService(IIngredientRepository ingredients)
{
    // CalculateAsync: Tính kết quả từ dữ liệu đã khai báo; kiểm tra điều kiện trước khi trả chỉ số.
    public async Task<RecipeNutritionResponse> CalculateAsync(RecipeNutritionRequest request, CancellationToken ct)
    {
        Validate(request);
        var selected = await ingredients.GetManyAsync(request.Ingredients.Select(x => x.IngredientId).ToArray(), ct);
        return Calculate(request, selected);
    }

    // Calculate: Tính kết quả từ dữ liệu đã khai báo; kiểm tra điều kiện trước khi trả chỉ số.
    public static RecipeNutritionResponse Calculate(RecipeNutritionRequest request, IReadOnlyList<Ingredient> selected)
    {
        Validate(request);
        var lookup = selected.ToDictionary(x => x.Id);
        var issues = new List<RecipeNutritionIssue>();
        var totals = new decimal[4];
        // Mỗi dòng góp năng lượng, đạm, tinh bột và chất béo theo cùng tỷ lệ lượng dùng/mốc dinh dưỡng.
        foreach (var row in request.Ingredients)
        {
            if (!lookup.TryGetValue(row.IngredientId, out var ingredient))
            {
                issues.Add(new(row.IngredientId, "Không tìm thấy nguyên liệu trong dữ liệu hệ thống."));
                continue;
            }
            var unit = RecipeNutritionRules.QuantityUnit(ingredient);
            if (row.Unit != unit)
            {
                issues.Add(new(row.IngredientId, $"{ingredient.Name}: đơn vị phải là {unit} theo dữ liệu nguyên liệu."));
                continue;
            }
            var ratio = RecipeNutritionRules.BasisRatio(ingredient, row.Quantity, unit);
            if (ratio is null)
            {
                issues.Add(new(row.IngredientId, $"{ingredient.Name}: công thức dùng {unit}, nhưng dinh dưỡng đang lưu trên {ingredient.NutritionBasisQuantity:0.###} {ingredient.NutritionBasisUnit}. Hãy cập nhật dinh dưỡng nguyên liệu theo {unit} để tính trực tiếp; hệ thống không coi ml bằng g."));
                continue;
            }
            decimal?[] values = [ingredient.Calories, ingredient.ProteinGram, ingredient.CarbohydrateGram, ingredient.FatGram];
            if (values.Any(x => x is null or < 0))
            {
                issues.Add(new(row.IngredientId, $"{ingredient.Name}: chưa có đầy đủ 4 chỉ số dinh dưỡng."));
                continue;
            }
            try
            {
                for (var index = 0; index < totals.Length; index++)
                    totals[index] = checked(totals[index] + values[index]!.Value * ratio.Value);
            }
            catch (OverflowException)
            {
                issues.Add(new(row.IngredientId, $"{ingredient.Name}: định lượng quá lớn để tính dinh dưỡng."));
            }
        }
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (issues.Count == 0)
        {
            // Cộng đủ cả món rồi mới chia khẩu phần và làm tròn, tránh sai số khi làm tròn từng nguyên liệu.
            totals = totals.Select(x => Math.Round(x / request.Servings, 3, MidpointRounding.AwayFromZero)).ToArray();
            if (totals.Any(x => x > 999999999m)) issues.Add(new(null, "Dinh dưỡng mỗi khẩu phần vượt giới hạn cho phép."));
        }
        // Thiếu bất kỳ dữ liệu nào thì không trả tổng một phần như một kết quả đầy đủ.
        return issues.Count > 0 ? new(false, null, null, null, null, issues)
            : new(true, totals[0], totals[1], totals[2], totals[3], []);
    }

    // Validate: Kiểm tra dữ liệu và điều kiện nghiệp vụ; dừng xử lý khi không hợp lệ.
    private static void Validate(RecipeNutritionRequest request)
    {
        RequestValidation.Validate(request);
        foreach (var row in request.Ingredients)
        {
            if (row is null) throw new ValidationException("Vui lòng chọn đầy đủ nguyên liệu.");
            RequestValidation.Validate(row);
            if (row.IngredientId == Guid.Empty) throw new ValidationException("Vui lòng chọn đầy đủ nguyên liệu.");
        }
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (request.Ingredients.Select(x => x.IngredientId).Distinct().Count() != request.Ingredients.Length)
            throw new ValidationException("Mỗi nguyên liệu chỉ được xuất hiện một lần.");
    }
}
