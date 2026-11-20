// Khai báo nhóm thành phần và trạng thái đánh giá trong tính năng quét.
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
