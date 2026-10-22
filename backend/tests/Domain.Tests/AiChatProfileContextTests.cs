using System.Text.Json;
using Application.Features.AiChat;
using Application.Features.Profiles;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Domain.Tests;

public sealed class AiChatProfileContextTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 16, 0, 0, 0, TimeSpan.Zero);

    [Theory]
    [InlineData(VegetarianDiet.Vegan)]
    [InlineData(VegetarianDiet.Lacto)]
    [InlineData(VegetarianDiet.Ovo)]
    [InlineData(VegetarianDiet.LactoOvo)]
    public async Task ContextUsesSavedDietAndSameEstimatesAsProfile(VegetarianDiet diet)
    {
        var user = NewUser();
        var profile = user.Profile!;
        profile.SetDiet(diet, Now);
        profile.SetBodyData(new DateOnly(2000, 1, 1), SexForEnergyEstimate.Female,
            165.5m, 60.2m, ActivityLevel.ModeratelyActive, WeightGoal.Maintain, Now);
        profile.SetRestaurantArea("Quận 1", Now);
        profile.AddAllergy("Đậu phộng", Now);
        profile.AddAvoidedFood("Nấm", Now);
        var profiles = new ProfileService(new Profiles(user));
        using var db = EmptyDb();
        var context = await new AiChatContextRepository(db, profiles).GetProfileContextAsync(user.Id, default);
        var saved = await profiles.GetAsync(user.Id, default);
        using var json = Data(context!);
        var root = json.RootElement;

        Assert.Equal(diet.ToString(), root.GetProperty("diet").GetString());
        Assert.Equal(saved!.Bmi, root.GetProperty("bmi").GetDecimal());
        Assert.Equal(saved.EstimatedTdeeKcal, root.GetProperty("estimatedTdeeKcal").GetInt32());
        Assert.Equal("Maintain", root.GetProperty("weightGoal").GetString());
        Assert.False(root.TryGetProperty("restaurantArea", out _));
        Assert.Equal("Đậu phộng", root.GetProperty("allergies")[0].GetString());
        Assert.Equal("Nấm", root.GetProperty("avoidedFoods")[0].GetString());
        Assert.DoesNotContain(user.Id, context);
        Assert.DoesNotContain(user.Email, context);
        Assert.DoesNotContain("Quận 1", context);
        Assert.False(root.TryGetProperty("birthDate", out _));
    }

    [Fact]
    public async Task EmptyProfileDoesNotInventDietOrHealthData()
    {
        var user = NewUser();
        using var db = EmptyDb();
        var context = await new AiChatContextRepository(db, new ProfileService(new Profiles(user)))
            .GetProfileContextAsync(user.Id, default);
        using var json = Data(context!);
        foreach (var name in new[] { "diet", "weightGoal", "bmi", "adultBmiCategory", "estimatedTdeeKcal", "heightCm", "weightKg" })
            Assert.Equal(JsonValueKind.Null, json.RootElement.GetProperty(name).ValueKind);
        Assert.Equal(0, json.RootElement.GetProperty("allergies").GetArrayLength());
        Assert.Contains("không chứng minh không dị ứng", context);
    }

    [Fact]
    public async Task MissingProfileReturnsNoContext()
    {
        using var db = EmptyDb();
        var context = await new AiChatContextRepository(db, new ProfileService(new Profiles(NewUser())))
            .GetProfileContextAsync("another-user", default);
        Assert.Null(context);
    }

    [Fact]
    public async Task EachMessageReadsLatestSavedProfileWithoutGemini()
    {
        var user = NewUser();
        var profiles = new ProfileService(new Profiles(user));
        var conversations = new Conversations(user.Id);
        var provider = new CapturingProvider();
        using var db = EmptyDb();
        var service = new AiChatService(conversations, provider, new AiChatContextRepository(db, profiles));

        await profiles.SetDietAsync(user.Id, VegetarianDiet.Vegan, default);
        var first = await service.SubmitMessageAsync(conversations.Conversation.Id, user.Id, "Xin chào", default);
        await profiles.SetDietAsync(user.Id, VegetarianDiet.Ovo, default);
        await profiles.AddAvoidedFoodAsync(user.Id, "Nấm", default);
        var second = await service.SubmitMessageAsync(conversations.Conversation.Id, user.Id, "Xin chào", default);

        Assert.Equal(AiChatAnswerStatus.Unavailable, first!.AnswerStatus);
        Assert.Equal(AiChatAnswerStatus.Unavailable, second!.AnswerStatus);
        Assert.Null(second.AssistantMessage);
        Assert.Equal(2, provider.Contexts.Count);
        using var initial = Data(provider.Contexts[0]!);
        using var latest = Data(provider.Contexts[1]!);
        Assert.Equal("Vegan", initial.RootElement.GetProperty("diet").GetString());
        Assert.Equal(0, initial.RootElement.GetProperty("avoidedFoods").GetArrayLength());
        Assert.Equal("Ovo", latest.RootElement.GetProperty("diet").GetString());
        Assert.Equal("Nấm", latest.RootElement.GetProperty("avoidedFoods")[0].GetString());
    }

    [Fact]
    public async Task AnotherUsersConversationDoesNotReadProfileOrCallProvider()
    {
        var user = NewUser();
        var profiles = new Profiles(user);
        var conversations = new Conversations(user.Id);
        var provider = new CapturingProvider();
        using var db = EmptyDb();
        var service = new AiChatService(conversations, provider,
            new AiChatContextRepository(db, new ProfileService(profiles)));

        var result = await service.SubmitMessageAsync(conversations.Conversation.Id, "another-user", "Xin chào", default);

        Assert.Null(result);
        Assert.Empty(provider.Contexts);
        Assert.Equal(0, profiles.ReadCount);
    }

    private static User NewUser() => User.Register("Test profile", "phase2@example.invalid", "test-only", Now);
    private static AppDbContext EmptyDb() => new(new DbContextOptionsBuilder<AppDbContext>().Options);
    private static JsonDocument Data(string text) => JsonDocument.Parse(text[text.IndexOf('{')..(text.LastIndexOf('}') + 1)]);

    private sealed class Profiles(User user) : IUserProfileRepository
    {
        public int ReadCount { get; private set; }
        public Task<User?> FindByIdAsync(string id, CancellationToken ct)
        {
            ReadCount++;
            return Task.FromResult(id == user.Id ? user : null);
        }
        public Task SaveChangesAsync(CancellationToken ct) => Task.CompletedTask;
    }

    // Test-only provider captures input; it never creates a fabricated assistant answer.
    private sealed class CapturingProvider : IAiChatAnswerService
    {
        public List<string?> Contexts { get; } = [];
        public Task<AiChatAnswerResult> GenerateAsync(string prompt, IReadOnlyList<AiChatTurn> history,
            CancellationToken ct, string? profileContext = null)
        {
            Contexts.Add(profileContext);
            return Task.FromResult(AiChatAnswerResult.Unavailable());
        }
    }

    private sealed class Conversations(string userId) : IAiChatRepository
    {
        public AiChatConversation Conversation { get; } = AiChatConversation.Create(userId, Now);
        private readonly List<AiChatMessage> messages = [];
        public Task<AiChatConversation?> GetConversationForUserAsync(Guid id, string owner, CancellationToken ct) =>
            Task.FromResult(id == Conversation.Id && owner == Conversation.UserId ? Conversation : null);
        public Task<IReadOnlyList<AiChatMessage>> GetRecentMessagesAsync(Guid id, int limit, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<AiChatMessage>>(messages.TakeLast(limit).ToArray());
        public Task<AiChatMessage> AddMessageAsync(Guid id, AiChatMessageRole role, string content, CancellationToken ct)
        {
            var message = AiChatMessage.Create(id, role, content, Now);
            messages.Add(message);
            return Task.FromResult(message);
        }
        public Task<AiChatConversation> CreateConversationAsync(string owner, CancellationToken ct) => throw new NotSupportedException();
        public Task<AiChatPage<AiChatConversation>> ListConversationsForUserAsync(string owner, int page, int pageSize, CancellationToken ct) => throw new NotSupportedException();
        public Task<AiChatPage<AiChatMessage>> ListMessagesAsync(Guid id, int page, int pageSize, CancellationToken ct) => throw new NotSupportedException();
    }
}
