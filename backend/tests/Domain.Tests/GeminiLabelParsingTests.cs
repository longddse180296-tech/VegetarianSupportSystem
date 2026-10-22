using System.Net;
using System.Net.Http.Json;
using Application.Abstractions.AI;
using Domain.Enums;
using Infrastructure.AI.Gemini;
using Microsoft.Extensions.Configuration;

namespace Domain.Tests;

public sealed class GeminiLabelParsingTests
{
    [Fact]
    public async Task SuggestionsMustBePresentInOcrAndInvalidKindsStayUnknown()
    {
        var result = await ReadLabelAsync("""
            {"extractedText":"Bí đỏ 500 g\nSữa bò tươi 350 g\nHương liệu",
             "isIncomplete":false,"suggestedIngredients":[
               {"name":"Bí đỏ","kind":"Plant"},
               {"name":"Sữa bò tươi","kind":"Dairy"},
               {"name":"Hương liệu","kind":"Invalid"},
               {"name":"Thịt bò","kind":"Animal"}]}
            """);

        Assert.True(result.IsAvailable);
        var suggestions = Assert.IsAssignableFrom<IReadOnlyList<GeminiLabelIngredient>>(result.SuggestedIngredients);
        Assert.Equal(["Bí đỏ", "Sữa bò tươi", "Hương liệu"],
            suggestions.Select(item => item.Name));
        Assert.Equal([IngredientKind.Plant, IngredientKind.Dairy, IngredientKind.Unknown],
            suggestions.Select(item => item.Kind));
    }

    [Theory]
    [InlineData("[]")]
    [InlineData("{\"extractedText\":\"sữa\",\"isIncomplete\":false,\"suggestedIngredients\":{}}")]
    public async Task MalformedLabelResultsAreAnalysisFailures(string text)
    {
        var result = await ReadLabelAsync(text);

        Assert.False(result.IsAvailable);
        Assert.Equal("InvalidOcrResponse", result.ErrorCode);
    }

    private static async Task<GeminiLabelResponse> ReadLabelAsync(string text)
    {
        using var client = new HttpClient(new ReplyHandler(text));
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> { ["Gemini:ApiKey"] = "test-key" }).Build();
        return await new GeminiService(client, configuration)
            .ReadIngredientLabelAsync(new GeminiDishImageRequest([1], "image/png"));
    }

    private sealed class ReplyHandler(string text) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
            CancellationToken cancellationToken) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = JsonContent.Create(new
            {
                candidates = new[] { new { content = new { parts = new[] { new { text } } } } }
            })
        });
    }
}
