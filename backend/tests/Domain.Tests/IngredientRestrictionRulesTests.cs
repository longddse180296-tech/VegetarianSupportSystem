using Domain.Entities;
using Domain.Rules;

namespace Domain.Tests;

public sealed class IngredientRestrictionRulesTests
{
    [Theory]
    [InlineData("bí đỏ")]
    [InlineData(" BÍ   ĐỎ ")]
    [InlineData("Bi\u0301 đo\u0309")]
    public void AllergyMatchesIngredientNameEvenWithoutAllergenTags(string allergy)
    {
        Assert.True(IngredientRestrictionRules.MatchesAllergy(new Ingredient { Name = "Bí đỏ", Allergens = null }, allergy));
    }

    [Fact]
    public void AllergyChecksAliasesAndAllergenGroups()
    {
        var ingredient = new Ingredient { Name = "Đậu hũ", Aliases = "Tofu; Đậu phụ", Allergens = "Đậu nành | Sữa" };
        Assert.True(IngredientRestrictionRules.MatchesAllergy(ingredient, "Đậu phụ"));
        Assert.True(IngredientRestrictionRules.MatchesAllergy(ingredient, "đậu nành"));
        Assert.True(IngredientRestrictionRules.MatchesAllergy(ingredient, "sữa"));
        Assert.False(IngredientRestrictionRules.MatchesAllergy(ingredient, "Đậu phộng"));
    }

    [Fact]
    public void AvoidedFoodsMatchWholeNamesAndAliasesWithoutLooseSubstrings()
    {
        var pumpkin = new Ingredient { Name = "Bí đỏ", Aliases = "Bí ngô; Pumpkin" };
        Assert.True(IngredientRestrictionRules.MatchesNameOrAlias(pumpkin, "bí ngô"));
        Assert.False(IngredientRestrictionRules.MatchesNameOrAlias(new Ingredient { Name = "Hạt bí xanh" }, "Bí đỏ"));
        Assert.False(IngredientRestrictionRules.MatchesAllergy(pumpkin, " "));
    }
}
