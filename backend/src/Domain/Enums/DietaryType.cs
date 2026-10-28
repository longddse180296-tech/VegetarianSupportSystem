// Chức năng: hạ tầng và quy tắc dùng chung. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
namespace Domain.Enums;

// DietaryType: định nghĩa các giá trị trạng thái được phép.
public enum DietaryType
{
    Vegan = 1,
    LactoVegetarian = 2,
    OvoVegetarian = 3,
    LactoOvoVegetarian = 4
}
