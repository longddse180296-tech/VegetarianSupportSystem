// Chức năng: hạ tầng và quy tắc dùng chung. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
using Domain.Enums;

namespace Domain.ValueObjects;

// DietaryAssessment: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record DietaryAssessment(DietaryType DietaryType, DietaryCompatibility Status);
