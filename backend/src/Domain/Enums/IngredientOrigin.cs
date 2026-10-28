// Chức năng: danh mục nguyên liệu và dữ liệu dinh dưỡng. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
namespace Domain.Enums;

// IngredientOrigin: định nghĩa các giá trị trạng thái được phép.
public enum IngredientOrigin
{
    Unknown = 0,
    Plant = 1,
    Animal = 2
}
