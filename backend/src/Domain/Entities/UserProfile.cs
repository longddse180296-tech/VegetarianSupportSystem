using Domain.Enums;

namespace Domain.Entities;

public sealed class UserProfile
{
    private UserProfile() { }

    private UserProfile(string userId, DateTimeOffset createdAtUtc)
    {
        UserId = userId;
        UpdatedAtUtc = createdAtUtc;
    }

    public string UserId { get; private set; } = string.Empty;
    public VegetarianDiet? Diet { get; private set; }
    public DateOnly? BirthDate { get; private set; }
    public SexForEnergyEstimate? SexForEnergyEstimate { get; private set; }
    public decimal? HeightCm { get; private set; }
    public decimal? WeightKg { get; private set; }
    public ActivityLevel? ActivityLevel { get; private set; }
    public WeightGoal? WeightGoal { get; private set; }
    public string? RestaurantArea { get; private set; }
    public DateTimeOffset UpdatedAtUtc { get; private set; }
    public ICollection<UserAllergy> Allergies { get; private set; } = new List<UserAllergy>();
    public ICollection<UserAvoidedFood> AvoidedFoods { get; private set; } = new List<UserAvoidedFood>();

    public static UserProfile Create(string userId, DateTimeOffset createdAtUtc)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("A user ID is required.", nameof(userId));

        return new UserProfile(userId.Trim(), createdAtUtc);
    }

    public void SetDiet(VegetarianDiet? diet, DateTimeOffset updatedAtUtc)
    {
        if (diet is not null && !Enum.IsDefined(diet.Value))
            throw new ArgumentOutOfRangeException(nameof(diet));

        Diet = diet;
        UpdatedAtUtc = updatedAtUtc;
    }

    public void SetBodyData(
        DateOnly? birthDate,
        SexForEnergyEstimate? sexForEnergyEstimate,
        decimal? heightCm,
        decimal? weightKg,
        ActivityLevel? activityLevel,
        WeightGoal? weightGoal,
        DateTimeOffset updatedAtUtc)
    {
        if (birthDate > DateOnly.FromDateTime(updatedAtUtc.UtcDateTime))
            throw new ArgumentOutOfRangeException(nameof(birthDate));
        if (sexForEnergyEstimate is not null && !Enum.IsDefined(sexForEnergyEstimate.Value))
            throw new ArgumentOutOfRangeException(nameof(sexForEnergyEstimate));
        if (heightCm is <= 0 or > 300)
            throw new ArgumentOutOfRangeException(nameof(heightCm));
        if (heightCm is not null && decimal.Round(heightCm.Value, 2) != heightCm.Value)
            throw new ArgumentOutOfRangeException(nameof(heightCm));
        if (weightKg is <= 0 or > 1_000)
            throw new ArgumentOutOfRangeException(nameof(weightKg));
        if (weightKg is not null && decimal.Round(weightKg.Value, 2) != weightKg.Value)
            throw new ArgumentOutOfRangeException(nameof(weightKg));
        if (activityLevel is not null && !Enum.IsDefined(activityLevel.Value))
            throw new ArgumentOutOfRangeException(nameof(activityLevel));
        if (weightGoal is not null && !Enum.IsDefined(weightGoal.Value))
            throw new ArgumentOutOfRangeException(nameof(weightGoal));

        BirthDate = birthDate;
        SexForEnergyEstimate = sexForEnergyEstimate;
        HeightCm = heightCm;
        WeightKg = weightKg;
        ActivityLevel = activityLevel;
        WeightGoal = weightGoal;
        UpdatedAtUtc = updatedAtUtc;
    }

    public void SetRestaurantArea(string? area, DateTimeOffset updatedAtUtc)
    {
        area = area?.Trim();
        if (area?.Length > 200)
            throw new ArgumentException("Restaurant area must be at most 200 characters.", nameof(area));

        RestaurantArea = string.IsNullOrEmpty(area) ? null : area;
        UpdatedAtUtc = updatedAtUtc;
    }

    public UserAllergy AddAllergy(string name, DateTimeOffset createdAtUtc)
    {
        var item = UserAllergy.Create(UserId, name, createdAtUtc);
        if (Allergies.Any(x => x.NormalizedName == item.NormalizedName))
            throw new InvalidOperationException("This allergy has already been added.");

        Allergies.Add(item);
        UpdatedAtUtc = createdAtUtc;
        return item;
    }

    public UserAvoidedFood AddAvoidedFood(string name, DateTimeOffset createdAtUtc)
    {
        var item = UserAvoidedFood.Create(UserId, name, createdAtUtc);
        if (AvoidedFoods.Any(x => x.NormalizedName == item.NormalizedName))
            throw new InvalidOperationException("This avoided food has already been added.");

        AvoidedFoods.Add(item);
        UpdatedAtUtc = createdAtUtc;
        return item;
    }

    public void RenameAllergy(Guid allergyId, string name, DateTimeOffset updatedAtUtc)
    {
        var item = Allergies.SingleOrDefault(x => x.Id == allergyId)
            ?? throw new KeyNotFoundException("Allergy not found in the loaded profile.");
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("An allergy name is required.", nameof(name));
        var normalizedName = name.Trim().ToUpperInvariant();
        if (Allergies.Any(x => x.Id != allergyId && x.NormalizedName == normalizedName))
            throw new InvalidOperationException("This allergy has already been added.");

        item.Rename(name);
        UpdatedAtUtc = updatedAtUtc;
    }

    public void RenameAvoidedFood(Guid avoidedFoodId, string name, DateTimeOffset updatedAtUtc)
    {
        var item = AvoidedFoods.SingleOrDefault(x => x.Id == avoidedFoodId)
            ?? throw new KeyNotFoundException("Avoided food not found in the loaded profile.");
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("An avoided food name is required.", nameof(name));
        var normalizedName = name.Trim().ToUpperInvariant();
        if (AvoidedFoods.Any(x => x.Id != avoidedFoodId && x.NormalizedName == normalizedName))
            throw new InvalidOperationException("This avoided food has already been added.");

        item.Rename(name);
        UpdatedAtUtc = updatedAtUtc;
    }

    public void RemoveAllergy(Guid allergyId, DateTimeOffset updatedAtUtc)
    {
        var item = Allergies.SingleOrDefault(x => x.Id == allergyId)
            ?? throw new KeyNotFoundException("Allergy not found in the loaded profile.");
        Allergies.Remove(item);
        UpdatedAtUtc = updatedAtUtc;
    }

    public void RemoveAvoidedFood(Guid avoidedFoodId, DateTimeOffset updatedAtUtc)
    {
        var item = AvoidedFoods.SingleOrDefault(x => x.Id == avoidedFoodId)
            ?? throw new KeyNotFoundException("Avoided food not found in the loaded profile.");
        AvoidedFoods.Remove(item);
        UpdatedAtUtc = updatedAtUtc;
    }
}
