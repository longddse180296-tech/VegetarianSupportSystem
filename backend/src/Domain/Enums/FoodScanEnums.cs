// Chức năng: phân tích ảnh món ăn và nhãn thành phần. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
namespace Domain.Enums;

// IngredientKind: định nghĩa các giá trị trạng thái được phép.
public enum IngredientKind
{
    Plant,
    Egg,
    Dairy,
    Honey,
    Animal,
    Unknown
}

// VegetarianDiet: định nghĩa các giá trị trạng thái được phép.
public enum VegetarianDiet
{
    Vegan,
    Lacto,
    Ovo,
    LactoOvo
}

// FoodScanAssessmentStatus: định nghĩa các giá trị trạng thái được phép.
public enum FoodScanAssessmentStatus
{
    SuitableBasedOnProvidedInformation,
    Incompatible,
    InsufficientInformation
}
