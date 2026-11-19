// Biểu diễn kết quả tương thích giữa nguyên liệu hoặc món ăn và một chế độ ăn.
using Domain.Enums;

namespace Domain.ValueObjects;

// DietaryAssessment: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record DietaryAssessment(DietaryType DietaryType, DietaryCompatibility Status);
