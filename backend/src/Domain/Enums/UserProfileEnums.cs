// Chức năng: hồ sơ và nhu cầu dinh dưỡng cá nhân. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
namespace Domain.Enums;

// SexForEnergyEstimate: định nghĩa các giá trị trạng thái được phép.
public enum SexForEnergyEstimate
{
    Female,
    Male
}

// ActivityLevel: định nghĩa các giá trị trạng thái được phép.
public enum ActivityLevel
{
    Sedentary,
    LightlyActive,
    ModeratelyActive,
    VeryActive,
    ExtraActive
}

// WeightGoal: định nghĩa các giá trị trạng thái được phép.
public enum WeightGoal
{
    Lose,
    Maintain,
    Gain
}

// AdultBmiCategory: định nghĩa các giá trị trạng thái được phép.
public enum AdultBmiCategory
{
    Underweight,
    HealthyWeight,
    Overweight,
    Obesity
}
