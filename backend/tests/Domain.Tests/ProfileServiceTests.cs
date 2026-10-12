using Application.Features.Profiles;
using Domain.Entities;
using Domain.Enums;

namespace Domain.Tests;

public sealed class ProfileServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 3, 0, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task UpdateReturnsSavedProfileAndKeepsIndependentLists()
    {
        var user = User.Register("Old Name", "old@example.com", "hash", Now);
        user.Profile!.AddAllergy("Peanut", Now);
        user.Profile.AddAvoidedFood("Mushroom", Now);
        var repository = new FakeRepository(user);
        var service = new ProfileService(repository);

        var result = await service.UpdateAsync(user.Id, new UpdateProfile(
            " New Name ", " +84 912 345 678 ", VegetarianDiet.LactoOvo,
            new DateOnly(2000, 1, 1), SexForEnergyEstimate.Female,
            165.5m, 60.2m, ActivityLevel.ModeratelyActive, WeightGoal.Maintain,
            " Quận 1 "), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("New Name", result.FullName);
        Assert.Equal("old@example.com", result.Email);
        Assert.Equal("+84 912 345 678", result.PhoneNumber);
        Assert.Equal(Now, result.MemberSinceUtc);
        Assert.Equal(VegetarianDiet.LactoOvo, result.Diet);
        Assert.Equal(165.5m, result.HeightCm);
        Assert.Equal(60.2m, result.WeightKg);
        Assert.Equal(ActivityLevel.ModeratelyActive, result.ActivityLevel);
        Assert.Equal(WeightGoal.Maintain, result.WeightGoal);
        Assert.Equal("Quận 1", result.RestaurantArea);
        Assert.Single(result.Allergies);
        Assert.Single(result.AvoidedFoods);
        Assert.Equal(1, repository.SaveCount);
    }

    [Fact]
    public async Task CannotModifyAnotherUsersAllergy()
    {
        var owner = User.Register("Owner", "owner@example.com", "hash", Now);
        var other = User.Register("Other", "other@example.com", "hash", Now);
        var allergy = owner.Profile!.AddAllergy("Peanut", Now);
        var service = new ProfileService(new FakeRepository(owner, other));

        var renamed = await service.RenameAllergyAsync(other.Id, allergy.Id, "Soy", CancellationToken.None);
        var removed = await service.RemoveAllergyAsync(other.Id, allergy.Id, CancellationToken.None);

        Assert.False(renamed);
        Assert.False(removed);
        Assert.Equal("Peanut", allergy.Name);
    }

    [Fact]
    public async Task ContextReaderReturnsOnlyRequestedUsersProfileAndDetachedLists()
    {
        var owner = User.Register("Owner", "owner@example.com", "hash", Now);
        owner.Profile!.SetDiet(VegetarianDiet.Vegan, Now);
        owner.Profile.AddAllergy("Peanut", Now);
        var other = User.Register("Other", "other@example.com", "hash", Now);
        other.Profile!.AddAllergy("Soy", Now);
        var service = new ProfileService(new FakeRepository(owner, other));

        var context = await service.GetContextAsync(owner.Id, CancellationToken.None);
        owner.Profile.AddAllergy("Sesame", Now);

        Assert.NotNull(context);
        Assert.Equal(owner.Id, context.UserId);
        Assert.Equal(VegetarianDiet.Vegan, context.Diet);
        Assert.Equal(["Peanut"], context.Allergies);
        Assert.DoesNotContain("Soy", context.Allergies);
        Assert.Null(await service.GetContextAsync("unknown", CancellationToken.None));
    }

    [Fact]
    public async Task ChoosingDietKeepsBodyDataAndAllergies()
    {
        var user = User.Register("User", "user@example.com", "hash", Now);
        user.Profile!.SetBodyData(null, null, 170m, 65m, null, null, Now);
        user.Profile.AddAllergy("Peanut", Now);
        var repository = new FakeRepository(user);
        var service = new ProfileService(repository);

        var result = await service.SetDietAsync(user.Id, VegetarianDiet.Vegan, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(VegetarianDiet.Vegan, result.Diet);
        Assert.Equal(170m, result.HeightCm);
        Assert.Single(result.Allergies);
        Assert.Equal(1, repository.SaveCount);
    }

    [Fact]
    public async Task UpdatingPersonalDetailsKeepsEmailAndMeasurements()
    {
        var user = User.Register("Old Name", "user@example.com", "hash", Now);
        user.Profile!.SetBodyData(null, null, 170m, 65m, null, null, Now);
        var repository = new FakeRepository(user);
        var service = new ProfileService(repository);

        var result = await service.UpdatePersonalAsync(user.Id,
            new UpdatePersonalDetails("New Name", "0912 345 678", "Hà Nội"), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("New Name", result.FullName);
        Assert.Equal("user@example.com", result.Email);
        Assert.Equal("0912 345 678", result.PhoneNumber);
        Assert.Equal("Hà Nội", result.RestaurantArea);
        Assert.Equal(170m, result.HeightCm);
        Assert.Equal(1, repository.SaveCount);
    }

    [Fact]
    public async Task UpdatingBodyRecalculatesBmiAndKeepsDietAndContact()
    {
        var user = User.Register("User", "user@example.com", "hash", Now);
        user.SetPhoneNumber("0912 345 678", Now);
        user.Profile!.SetDiet(VegetarianDiet.Vegan, Now);
        var repository = new FakeRepository(user);
        var service = new ProfileService(repository);

        var result = await service.UpdateBodyAsync(user.Id,
            new UpdateBodyDetails(new DateOnly(2000, 1, 1), SexForEnergyEstimate.Female,
                170m, 65m, ActivityLevel.ModeratelyActive, WeightGoal.Maintain),
            CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(22.5m, result.Bmi);
        Assert.Equal(VegetarianDiet.Vegan, result.Diet);
        Assert.Equal("0912 345 678", result.PhoneNumber);
        Assert.Equal(1, repository.SaveCount);
    }

    [Fact]
    public async Task PreviewUsesSavedEstimateRulesWithoutChangingProfile()
    {
        var user = User.Register("User", "user@example.com", "hash", Now);
        user.Profile!.SetBodyData(new DateOnly(2000, 1, 1), SexForEnergyEstimate.Female,
            160m, 50m, ActivityLevel.Sedentary, WeightGoal.Maintain, Now);
        var repository = new FakeRepository(user);
        var service = new ProfileService(repository);
        var request = new UpdateBodyDetails(new DateOnly(2000, 1, 1),
            SexForEnergyEstimate.Female, 170m, 65m,
            ActivityLevel.ModeratelyActive, WeightGoal.Lose);

        var preview = await service.PreviewBodyAsync(user.Id, request, CancellationToken.None);

        Assert.NotNull(preview);
        Assert.Equal(22.5m, preview.Bmi);
        Assert.Equal(160m, user.Profile.HeightCm);
        Assert.Equal(0, repository.SaveCount);

        var saved = await service.UpdateBodyAsync(user.Id, request, CancellationToken.None);
        Assert.NotNull(saved);
        Assert.Equal(saved.Bmi, preview.Bmi);
        Assert.Equal(saved.AdultBmiCategory, preview.AdultBmiCategory);
        Assert.Equal(saved.EstimatedTdeeKcal, preview.EstimatedTdeeKcal);
    }

    [Fact]
    public async Task InvalidNameAndMeasurementsDoNotSave()
    {
        var user = User.Register("User", "user@example.com", "hash", Now);
        var repository = new FakeRepository(user);
        var service = new ProfileService(repository);

        await Assert.ThrowsAsync<ArgumentException>(() => service.UpdateAsync(user.Id,
            new UpdateProfile(" ", null, null, null, null,
                null, null, null, null, null), CancellationToken.None));
        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => service.UpdateAsync(user.Id,
            new UpdateProfile("User", null, null, null, null,
                0, null, null, null, null), CancellationToken.None));

        Assert.Equal(0, repository.SaveCount);
    }

    private sealed class FakeRepository(params User[] users) : IUserProfileRepository
    {
        public int SaveCount { get; private set; }

        public Task<User?> FindByIdAsync(string userId, CancellationToken cancellationToken) =>
            Task.FromResult(users.SingleOrDefault(x => x.Id == userId));

        public Task SaveChangesAsync(CancellationToken cancellationToken)
        {
            SaveCount++;
            return Task.CompletedTask;
        }
    }
}
