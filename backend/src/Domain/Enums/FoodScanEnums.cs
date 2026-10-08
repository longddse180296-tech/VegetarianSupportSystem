namespace Domain.Enums;

public enum IngredientKind
{
    Plant,
    Egg,
    Dairy,
    Honey,
    Animal,
    Unknown
}

public enum VegetarianDiet
{
    Vegan,
    Lacto,
    Ovo,
    LactoOvo
}

public enum FoodScanAssessmentStatus
{
    SuitableBasedOnProvidedInformation,
    Incompatible,
    InsufficientInformation
}
