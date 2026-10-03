using Domain.Entities;
using Domain.Enums;

namespace Domain.Tests;

public sealed class UserProfileTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 3, 0, 0, 0, TimeSpan.Zero);

    [Fact]
    public void RegistrationCreatesUserRoleAndEmptyProfile()
    {
        var user = User.Register("  Nguyen Van A  ", "  A@example.com  ", "hashed-password", Now);

        Assert.Equal(UserRole.User, user.Role);
        Assert.Equal("Nguyen Van A", user.FullName);
        Assert.Equal("A@EXAMPLE.COM", user.NormalizedEmail);
        Assert.NotNull(user.Profile);
        Assert.Equal(user.Id, user.Profile.UserId);
        Assert.Null(user.Profile.Diet);
    }

    [Fact]
    public void AllergiesAndAvoidedFoodsAreSeparateAndRejectDuplicates()
    {
        var profile = UserProfile.Create("user-1", Now);

        profile.AddAllergy("  Peanut  ", Now);
        profile.AddAvoidedFood("Peanut", Now);

        Assert.Single(profile.Allergies);
        Assert.Single(profile.AvoidedFoods);
        Assert.Throws<InvalidOperationException>(() => profile.AddAllergy("peanut", Now));
        Assert.Throws<InvalidOperationException>(() => profile.AddAvoidedFood("PEANUT", Now));
    }

    [Fact]
    public void AllergyAndAvoidedFoodCanBeRenamedAndRemovedIndividually()
    {
        var profile = UserProfile.Create("user-1", Now);
        var allergy = profile.AddAllergy("Peanut", Now);
        var avoided = profile.AddAvoidedFood("Mushroom", Now);

        profile.RenameAllergy(allergy.Id, "Soy", Now);
        profile.RenameAvoidedFood(avoided.Id, "Egg", Now);
        Assert.Equal("Soy", allergy.Name);
        Assert.Equal("Egg", avoided.Name);

        profile.RemoveAllergy(allergy.Id, Now);
        profile.RemoveAvoidedFood(avoided.Id, Now);
        Assert.Empty(profile.Allergies);
        Assert.Empty(profile.AvoidedFoods);
    }

    [Fact]
    public void BodyDataRejectsInvalidMeasurementsAndAcceptsOptionalFields()
    {
        var profile = UserProfile.Create("user-1", Now);

        Assert.Throws<ArgumentOutOfRangeException>(() => profile.SetBodyData(
            null, null, -1, null, null, null, Now));
        Assert.Throws<ArgumentOutOfRangeException>(() => profile.SetBodyData(
            null, null, 0, null, null, null, Now));
        Assert.Throws<ArgumentOutOfRangeException>(() => profile.SetBodyData(
            null, null, null, -1, null, null, Now));

        profile.SetBodyData(new DateOnly(2000, 1, 1), SexForEnergyEstimate.Female,
            165, 60, ActivityLevel.ModeratelyActive, WeightGoal.Maintain, Now);

        Assert.Equal(165, profile.HeightCm);
        Assert.Equal(60, profile.WeightKg);
    }

    [Fact]
    public void LockRequiresReasonAndUnlockClearsState()
    {
        var user = User.Register("Nguyen Van A", "a@example.com", "hashed-password", Now);

        Assert.Throws<ArgumentException>(() => user.Lock(" ", Now));
        user.Lock("Violation of community rules", Now);
        Assert.True(user.IsLocked);
        Assert.Equal("Violation of community rules", user.LockReason);

        user.Unlock(Now.AddMinutes(1));
        Assert.False(user.IsLocked);
        Assert.Null(user.LockReason);
        Assert.Null(user.LockedAtUtc);
    }
}
