// Khai báo các lựa chọn hồ sơ như giới tính, hoạt động, mục tiêu và chế độ ăn.
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
