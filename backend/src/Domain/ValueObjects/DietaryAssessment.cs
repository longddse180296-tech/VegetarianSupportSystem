using Domain.Enums;

namespace Domain.ValueObjects;

public sealed record DietaryAssessment(DietaryType DietaryType, DietaryCompatibility Status);
