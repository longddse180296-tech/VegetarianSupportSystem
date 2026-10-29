using System.ComponentModel.DataAnnotations;
using Application.Features.Recipes;
using Domain.Entities;

namespace Domain.Tests;

public sealed class RecipeNutritionTests
{
    [Theory]
    [InlineData("ml",100,50,100)]
    [InlineData("ml",100,100,200)]
    [InlineData("ml",100,250,500)]
    [InlineData("đơn vị",1,1,200)]
    [InlineData("đơn vị",1,2,400)]
    [InlineData("đơn vị",1,0.5,100)]
    public void UsesDeclaredVolumeOrCountBasisWithoutMassConversion(string unit,int basis,double quantity,int expected)
    {
        var item = Ingredient(unit,basis);
        item.Calories=200;
        var result=RecipeNutritionService.Calculate(new(){Servings=1,Ingredients=[Row(item,(decimal)quantity,unit)]},[item]);
        Assert.True(result.IsComplete);
        Assert.Equal((decimal)expected,result.CaloriesPerServing);
        Assert.Equal(10m*(decimal)quantity/basis,result.ProteinGramPerServing);
    }
    [Fact]
    public void MilkWithVolumeNutritionUsesMillilitersDirectly()
    {
        // Số liệu tổng hợp chỉ dùng test; không phải nhãn của một sản phẩm sữa thật.
        var milk = Ingredient("ml");
        milk.Calories = 60; milk.ProteinGram = 3; milk.CarbohydrateGram = 5; milk.FatGram = 3;
        var result = RecipeNutritionService.Calculate(new() {Servings=2, Ingredients=[Row(milk,250,"ml")]},[milk]);
        Assert.True(result.IsComplete);
        Assert.Equal(75m,result.CaloriesPerServing);
        Assert.Equal(3.75m,result.ProteinGramPerServing);
        Assert.Equal(6.25m,result.CarbohydrateGramPerServing);
        Assert.Equal(3.75m,result.FatGramPerServing);
        Assert.Empty(result.Issues);
    }
    private static Ingredient Ingredient(string unit = "g", decimal basis = 100) => new()
    {
        DefaultUnit = unit, NutritionBasisUnit = unit, NutritionBasisQuantity = basis,
        Calories = 100, ProteinGram = 10, CarbohydrateGram = 20, FatGram = 0
    };
    private static RecipeIngredientRequest Row(Ingredient item, decimal quantity, string? unit = null) =>
        new() { IngredientId = item.Id, Quantity = quantity, Unit = unit ?? item.DefaultUnit! };

    [Fact]
    public void SumsMassVolumeAndCountThenDividesServings()
    {
        var flour = Ingredient();
        var milk = Ingredient("ml");
        var egg = Ingredient("đơn vị", 1);
        var result = RecipeNutritionService.Calculate(new()
        {
            Servings = 2, Ingredients = [Row(flour, 200), Row(milk, 50), Row(egg, 2)]
        }, [flour, milk, egg]);
        Assert.True(result.IsComplete);
        Assert.Equal(225m, result.CaloriesPerServing);
        Assert.Equal(22.5m, result.ProteinGramPerServing);
        Assert.Equal(45m, result.CarbohydrateGramPerServing);
        Assert.Equal(0m, result.FatGramPerServing);
    }

    [Theory]
    [InlineData("kg", "g", 100, 0.25, 250)]
    [InlineData("g", "kg", 1, 250, 25)]
    public void ConvertsOnlyBetweenGramsAndKilograms(string quantityUnit, string basisUnit, int basis, double quantity, int expected)
    {
        var item = Ingredient(basisUnit, basis);
        item.DefaultUnit = quantityUnit;
        var result = RecipeNutritionService.Calculate(new() { Servings = 1, Ingredients = [Row(item, (decimal)quantity)] }, [item]);
        Assert.Equal((decimal)expected, result.CaloriesPerServing);
    }

    [Theory]
    [InlineData("ml", "g")]
    [InlineData("đơn vị", "g")]
    [InlineData("g", "ml")]
    public void DoesNotGuessDensityOrWeightPerPiece(string quantityUnit, string basisUnit)
    {
        var item = Ingredient(basisUnit);
        item.DefaultUnit = quantityUnit;
        var result = RecipeNutritionService.Calculate(new() { Servings = 1, Ingredients = [Row(item, 100)] }, [item]);
        Assert.False(result.IsComplete);
        Assert.Null(result.CaloriesPerServing);
        Assert.NotEmpty(result.Issues);
    }

    [Fact]
    public void UnknownNutrientMakesEntireResultIncomplete()
    {
        var known = Ingredient();
        var unknown = Ingredient();
        unknown.Calories = null;
        var result = RecipeNutritionService.Calculate(new() { Servings = 1, Ingredients = [Row(known, 100), Row(unknown, 100)] }, [known, unknown]);
        Assert.False(result.IsComplete);
        Assert.Null(result.CaloriesPerServing);
        Assert.Null(result.ProteinGramPerServing);
        Assert.Equal(unknown.Id, Assert.Single(result.Issues).IngredientId);
    }

    [Fact]
    public void RejectsForgedUnitAndMissingIngredient()
    {
        var item = Ingredient();
        Assert.False(RecipeNutritionService.Calculate(new() { Servings = 1, Ingredients = [Row(item, 100, "ml")] }, [item]).IsComplete);
        Assert.False(RecipeNutritionService.Calculate(new() { Servings = 1, Ingredients = [Row(item, 100)] }, []).IsComplete);
    }

    [Fact]
    public void RoundsOnlyFinalPerServingTotalAndEnforcesLimits()
    {
        var item = Ingredient("đơn vị", 1);
        item.Calories = 1;
        var rounded = RecipeNutritionService.Calculate(new() { Servings = 3, Ingredients = [Row(item, 1)] }, [item]);
        Assert.Equal(0.333m, rounded.CaloriesPerServing);
        item.Calories = 999999999m;
        var oversized = RecipeNutritionService.Calculate(new() { Servings = 1, Ingredients = [Row(item, 999999999)] }, [item]);
        Assert.False(oversized.IsComplete);
        Assert.Null(oversized.CaloriesPerServing);
    }

    [Fact]
    public void ValidatesServingsQuantityAndDuplicateRows()
    {
        var item = Ingredient();
        Assert.Throws<ValidationException>(() => RecipeNutritionService.Calculate(new() { Servings = 0, Ingredients = [Row(item, 1)] }, [item]));
        Assert.Throws<ValidationException>(() => RecipeNutritionService.Calculate(new() { Servings = 1, Ingredients = [Row(item, 0)] }, [item]));
        Assert.Throws<ValidationException>(() => RecipeNutritionService.Calculate(new() { Servings = 1, Ingredients = [Row(item, 1), Row(item, 1)] }, [item]));
    }
}
