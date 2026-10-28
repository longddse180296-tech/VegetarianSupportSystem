using Domain.Entities;
using Domain.Enums;

namespace Infrastructure.Persistence.Seeding;

// Separate from the small CoreDataSeeder fixture used by the existing SQL filter checks.
internal static class DemoDataCatalog
{
    internal static Guid Id(int value) => Guid.Parse($"20000000-0000-0000-0000-{value:000000000000}");
    private const string SampleSource = "Dữ liệu demo giả lập; số dinh dưỡng minh họa, chưa được xác minh để tư vấn sức khỏe.";

    internal static Category[] Categories() =>
    [
        Category(1, "Bữa sáng", "Cháo, yến mạch và món ăn nhanh buổi sáng."),
        Category(2, "Cơm và bún", "Món chính dùng gạo, bún hoặc bánh mì."),
        Category(3, "Canh và súp", "Canh rau củ, súp đậu và món hầm."),
        Category(4, "Salad và rau củ", "Salad, rau trộn và món rau hấp."),
        Category(5, "Món nhẹ", "Khoai, trái cây và món ăn nhẹ."),
        Category(6, "Đồ uống", "Sinh tố và đồ uống từ thực vật."),
        Category(7, "Món có trứng hoặc sữa", "Dùng để demo phân loại Lacto, Ovo và Lacto-ovo."),
        Category(8, "Danh mục đã ngừng", "Chỉ hiển thị ở trang quản trị; giữ tham chiếu công thức cũ.", false)
    ];

    internal static Ingredient[] Ingredients() =>
    [
        Plant(101, "Đậu hũ", "đậu phụ;tofu", 80, 8, 2, 4, "Đậu nành;Soy"),
        Plant(102, "Gạo lứt", "brown rice;gạo nguyên cám", 360, 7, 76, 3),
        Plant(103, "Yến mạch", "oats;rolled oats", 380, 13, 67, 7, "Gluten"),
        Plant(104, "Bún gạo", "rice noodles;bún khô", 350, 6, 80, 1),
        Plant(105, "Bánh mì nguyên cám", "whole wheat bread;bánh mì lúa mì", 250, 10, 45, 4, "Lúa mì;Wheat;Gluten"),
        Plant(106, "Đậu gà", "chickpea;đậu garbanzo", 160, 9, 27, 3),
        Plant(107, "Đậu lăng", "lentil;đậu lăng đỏ", 115, 9, 20, 1),
        Plant(108, "Đậu xanh", "mung bean;đỗ xanh", 340, 23, 63, 1),
        Plant(109, "Nấm bào ngư", "oyster mushroom;nấm dai", 35, 3, 6, 1),
        Plant(110, "Cà rốt", "carrot;củ cà rốt", 40, 1, 10, 0),
        Plant(111, "Bí đỏ", "pumpkin;bí ngô", 26, 1, 7, 0),
        Plant(112, "Bông cải xanh", "broccoli;súp lơ xanh", 35, 3, 7, 0),
        Plant(113, "Cải bó xôi", "spinach;rau bina", 25, 3, 4, 0),
        Plant(114, "Cà chua", "tomato", 20, 1, 4, 0),
        Plant(115, "Dưa leo", "cucumber;dưa chuột", 15, 1, 4, 0),
        Plant(116, "Xà lách", "lettuce;rau diếp", 15, 1, 3, 0),
        Plant(117, "Bắp ngọt", "sweet corn;ngô ngọt", 90, 3, 19, 1),
        Plant(118, "Khoai tây", "potato", 77, 2, 17, 0),
        Plant(119, "Khoai lang", "sweet potato", 86, 2, 20, 0),
        Plant(120, "Chuối", "banana", 90, 1, 23, 0),
        Plant(121, "Bơ quả", "avocado;trái bơ", 160, 2, 9, 15),
        Plant(122, "Hạt chia", "chia seeds", 480, 16, 42, 31),
        Plant(123, "Mè rang", "vừng;sesame", 570, 18, 23, 50, "Mè;Vừng;Sesame"),
        Plant(124, "Đậu phộng", "lạc;peanut", 560, 25, 16, 49, "Đậu phộng;Lạc;Peanut"),
        Plant(125, "Nước cốt dừa", "coconut milk;cốt dừa", 190, 2, 3, 19),
        Plant(126, "Sữa đậu nành", "soy milk;soymilk", 40, 3, 4, 2, "Đậu nành;Soy"),
        Plant(127, "Dầu ô liu", "olive oil;dầu olive", 900, 0, 0, 100),
        Plant(128, "Muối", "salt;muối ăn", 0, 0, 0, 0),
        Plant(129, "Đường mía", "sugar;đường", 400, 0, 100, 0),
        Animal(130, "Trứng gà", "egg;trứng", 145, 13, 1, 10, egg: true, allergens: "Trứng;Egg"),
        Animal(131, "Sữa bò", "milk;sữa tươi", 60, 3, 5, 3, milk: true, allergens: "Sữa;Milk"),
        Animal(132, "Phô mai không men dịch vị động vật", "cheese;phô mai chay", 280, 18, 3, 22, milk: true, allergens: "Sữa;Milk"),
        Animal(133, "Mật ong", "honey", 300, 0, 82, 0, honey: true),
        new Ingredient
        {
            Id = Id(134), Name = "[Demo] Gia vị chưa rõ nguồn gốc", Aliases = "seasoning;hương liệu chưa xác minh",
            Origin = IngredientOrigin.Unknown, ContainsOtherAnimalProducts = null,
            DefaultUnit = "g", Source = SampleSource
        },
        Animal(135, "Nước mắm cá", "fish sauce;nước mắm từ cá", 35, 5, 4, 0, otherAnimal: true, allergens: "Cá;Fish"),
        InactiveFlour()
    ];

    internal static Recipe[] Recipes(IReadOnlyDictionary<Guid, Ingredient> ingredients)
    {
        Recipe Make(int id, int category, string name, int prep, int cook, string instructions,
            params (int Id, decimal Grams)[] rows) => CreateRecipe(ingredients, id, category, name, prep, cook, instructions, rows);

        return
        [
            Make(201, 1, "Yến mạch chuối hạt chia", 5, 5, "Nấu yến mạch với sữa đậu nành và ít nước đến mềm. Thêm chuối cắt lát, rắc hạt chia rồi chia hai phần.", (103, 100), (120, 200), (122, 10), (126, 300)),
            Make(202, 1, "Cháo đậu xanh bí đỏ", 10, 30, "Rửa gạo và đậu xanh, nấu với nước đến mềm. Cho bí đỏ thái hạt lựu vào nấu chín, nêm muối và chia hai bát.", (102, 100), (108, 60), (111, 200), (128, 2)),
            Make(203, 1, "Bánh mì bơ cà chua", 10, 5, "Nướng bánh mì. Nghiền bơ, phết lên bánh rồi thêm cà chua và mè rang; chia hai phần.", (105, 160), (121, 150), (114, 100), (123, 10)),
            Make(204, 1, "Khoai lang và sữa đậu nành", 5, 20, "Rửa và hấp khoai lang đến mềm. Hâm sữa đậu nành, dùng cùng khoai và chia hai phần.", (119, 400), (126, 400)),
            Make(205, 1, "Cháo nấm đậu hũ", 10, 25, "Nấu gạo với nước thành cháo. Thêm nấm xé và đậu hũ cắt nhỏ, nấu chín rồi nêm muối, chia hai bát.", (102, 100), (109, 150), (101, 200), (128, 2)),
            Make(206, 2, "Cơm gạo lứt đậu hũ nấm", 10, 30, "Nấu gạo lứt với nước. Áp chảo đậu hũ và nấm với dầu, nêm muối; dùng cùng cơm, chia hai phần.", (102, 160), (101, 300), (109, 200), (127, 10), (128, 2)),
            Make(207, 2, "Bún rau củ đậu hũ", 15, 15, "Luộc bún rồi để ráo. Xào cà rốt, bông cải và đậu hũ với dầu, nêm muối, trộn cùng bún và chia hai phần.", (104, 160), (101, 250), (110, 100), (112, 150), (127, 10), (128, 2)),
            Make(208, 2, "Cơm đậu lăng cà chua", 10, 25, "Nấu gạo thành cơm. Hầm đậu lăng và cà chua với nước, nêm muối; rưới lên cơm và chia hai phần.", (102, 160), (107, 250), (114, 200), (127, 10), (128, 2)),
            Make(209, 2, "Cơm bắp cải bó xôi", 10, 20, "Nấu gạo thành cơm. Xào bắp và cải bó xôi với dầu, nêm muối, trộn cơm rồi rắc mè; chia hai phần.", (102, 160), (117, 200), (113, 150), (123, 10), (127, 10), (128, 2)),
            Make(210, 2, "Bánh mì đậu gà nghiền", 15, 5, "Nghiền đậu gà đã nấu chín với dầu và muối. Kẹp bánh mì cùng xà lách, dưa leo và chia hai phần.", (105, 160), (106, 250), (116, 80), (115, 100), (127, 10), (128, 2)),
            Make(211, 3, "Súp bí đỏ đậu lăng", 10, 25, "Hầm bí đỏ và đậu lăng với nước đến mềm. Xay thô, thêm cốt dừa và muối, đun nóng rồi chia hai bát.", (111, 400), (107, 250), (125, 80), (128, 2)),
            Make(212, 3, "Canh nấm đậu hũ", 10, 15, "Đun nước, cho nấm và cà rốt vào nấu chín. Thêm đậu hũ, nêm muối và chia hai bát.", (109, 200), (101, 300), (110, 100), (128, 2)),
            Make(213, 3, "Súp khoai tây bông cải", 10, 20, "Luộc khoai tây và bông cải đến mềm. Xay cùng sữa đậu nành, nêm muối và đun nóng; chia hai bát.", (118, 300), (112, 250), (126, 200), (128, 2)),
            Make(214, 3, "Canh rau củ đậu xanh", 10, 25, "Nấu đậu xanh với nước đến mềm. Thêm bí đỏ và cà rốt, nấu chín rồi nêm muối, chia hai bát.", (108, 100), (111, 200), (110, 150), (128, 2)),
            Make(215, 4, "Salad đậu gà bơ", 15, 0, "Trộn đậu gà đã nấu chín với bơ, cà chua, dưa leo và xà lách. Thêm dầu, muối rồi chia hai phần.", (106, 250), (121, 150), (114, 150), (115, 100), (116, 80), (127, 10), (128, 2)),
            Make(216, 4, "Bông cải hấp mè", 5, 10, "Hấp bông cải và cà rốt đến chín. Trộn dầu và muối, rắc mè rang, chia hai phần.", (112, 300), (110, 150), (123, 15), (127, 5), (128, 2)),
            Make(217, 4, "Salad bắp đậu phộng", 15, 10, "Luộc bắp, để nguội rồi trộn cùng dưa leo và cà chua. Thêm đậu phộng rang, dầu và muối, chia hai phần.", (117, 250), (124, 40), (115, 150), (114, 150), (127, 5), (128, 2)),
            Make(218, 5, "Khoai lang nướng mè", 5, 35, "Cắt khoai thành miếng, trộn dầu rồi nướng đến mềm. Rắc mè rang và chia hai phần.", (119, 400), (123, 15), (127, 5)),
            Make(219, 5, "Chuối cốt dừa hạt chia", 5, 10, "Đun chuối với cốt dừa và ít nước. Thêm đường, tắt bếp rồi rắc hạt chia, chia hai phần.", (120, 300), (125, 100), (122, 10), (129, 10)),
            Make(220, 6, "Sinh tố bơ chuối đậu nành", 10, 0, "Xay bơ, chuối và sữa đậu nành đến mịn. Chia hai ly, dùng ngay.", (121, 150), (120, 200), (126, 300)),
            Make(221, 6, "Sữa yến mạch mè", 5, 10, "Nấu yến mạch với nước đến mềm. Xay cùng mè rang và đường, thêm nước theo độ đặc mong muốn rồi chia hai ly.", (103, 80), (123, 15), (129, 10)),
            Make(222, 7, "Trứng hấp nấm", 10, 15, "Đánh trứng với ít nước và muối. Thêm nấm thái nhỏ, hấp đến chín hoàn toàn và chia hai phần.", (130, 200), (109, 150), (128, 2)),
            Make(223, 7, "Cơm trứng rau củ", 10, 15, "Nấu gạo thành cơm. Xào trứng đến chín hoàn toàn, thêm cà rốt và bắp, trộn cơm cùng muối rồi chia hai phần.", (102, 160), (130, 150), (110, 100), (117, 100), (127, 10), (128, 2)),
            Make(224, 7, "Yến mạch sữa bò chuối", 5, 10, "Nấu yến mạch với sữa và ít nước đến mềm. Thêm chuối cắt lát và chia hai phần.", (103, 100), (131, 300), (120, 200)),
            Make(225, 7, "Súp bí đỏ sữa", 10, 20, "Hầm bí đỏ với nước đến mềm. Xay cùng sữa bò, nêm muối rồi đun nóng; chia hai bát.", (111, 400), (131, 250), (128, 2)),
            Make(226, 7, "Bánh mì trứng sữa", 5, 10, "Đánh trứng với sữa rồi nhúng bánh mì. Áp chảo với dầu đến khi trứng chín hoàn toàn; chia hai phần.", (105, 160), (130, 100), (131, 100), (127, 5)),
            Make(227, 6, "Sinh tố chuối mật ong", 5, 0, "Xay chuối với sữa đậu nành và mật ong. Chia hai ly.", (120, 300), (126, 300), (133, 20)),
            Make(228, 7, "Salad phô mai cà chua", 10, 0, "Cắt phô mai không men dịch vị động vật thành miếng. Trộn với cà chua, xà lách và dầu, chia hai phần.", (132, 100), (114, 250), (116, 100), (127, 10)),
            Make(229, 2, "Đậu hũ với gia vị cần xác minh", 10, 10, "Áp chảo đậu hũ và nấm. Đây là tình huống demo: cần xác minh nguồn gốc gia vị trước khi đánh giá chế độ ăn.", (101, 300), (109, 150), (134, 5)),
            Make(230, 2, "Rau củ có nước mắm cá", 10, 10, "Xào bông cải và cà rốt với dầu, thêm nước mắm cá. Tình huống demo không phù hợp cả bốn chế độ ăn chay.", (112, 250), (110, 150), (135, 15), (127, 10)),
            InactiveRecipe(Make(231, 8, "Bánh bột mì đã ngừng", 10, 15, "Trộn bột với nước rồi áp chảo. Công thức ngừng sử dụng chỉ phục vụ demo quản trị và giữ tham chiếu cũ.", (136, 160), (127, 10), (128, 2))),
            Make(232, 6, "Sữa bò mật ong", 5, 5, "Hâm sữa, để bớt nóng rồi khuấy mật ong. Chia hai ly.", (131, 400), (133, 20))
        ];
    }

    private static Category Category(int id, string name, string description, bool active = true) => new()
    {
        Id = Id(id), Name = $"[Demo] {name}", Description = $"Dữ liệu demo. {description}", IsActive = active
    };

    private static Ingredient Plant(int id, string name, string aliases, decimal calories, decimal protein,
        decimal carbs, decimal fat, string? allergens = null) => Ingredient(id, name, aliases, calories, protein, carbs, fat, IngredientOrigin.Plant, allergens);

    private static Ingredient Animal(int id, string name, string aliases, decimal calories, decimal protein,
        decimal carbs, decimal fat, bool egg = false, bool milk = false, bool honey = false,
        bool otherAnimal = false, string? allergens = null)
    {
        var ingredient = Ingredient(id, name, aliases, calories, protein, carbs, fat, IngredientOrigin.Animal, allergens);
        ingredient.ContainsEgg = egg;
        ingredient.ContainsMilk = milk;
        ingredient.ContainsHoney = honey;
        ingredient.ContainsOtherAnimalProducts = otherAnimal;
        return ingredient;
    }

    private static Ingredient Ingredient(int id, string name, string aliases, decimal calories, decimal protein,
        decimal carbs, decimal fat, IngredientOrigin origin, string? allergens) => new()
    {
        Id = Id(id), Name = $"[Demo] {name}", Aliases = $"{name};{aliases}", Origin = origin,
        ContainsOtherAnimalProducts = false, Allergens = allergens, DefaultUnit = "g",
        Calories = calories, ProteinGram = protein,
        CarbohydrateGram = carbs, FatGram = fat, Source = SampleSource
    };

    private static Ingredient InactiveFlour()
    {
        var ingredient = Plant(136, "Bột mì đã ngừng", "wheat flour;bột mì", 360, 10, 76, 1, "Lúa mì;Wheat;Gluten");
        ingredient.IsActive = false;
        return ingredient;
    }

    private static Recipe InactiveRecipe(Recipe recipe)
    {
        recipe.IsActive = false;
        return recipe;
    }

    private static Recipe CreateRecipe(IReadOnlyDictionary<Guid, Ingredient> ingredients, int id, int category,
        string name, int prep, int cook, string instructions, (int Id, decimal Grams)[] rows)
    {
        // All sample quantities are grams, including liquids. Values describe two portions;
        // the stored nutrition describes one portion, matching the API and meal plan snapshots.
        decimal? PerServing(Func<Ingredient, decimal?> value)
        {
            if (rows.Any(row => value(ingredients[Id(row.Id)]) is null)) return null;
            return decimal.Round(rows.Sum(row => value(ingredients[Id(row.Id)])!.Value * row.Grams / 100m) / 2m, 3);
        }

        return new Recipe
        {
            Id = Id(id), CategoryId = Id(category), Name = $"[Demo] {name}",
            Description = "Công thức demo cho 2 người. Định lượng tính bằng g; dinh dưỡng minh họa theo mỗi khẩu phần, chưa xác minh.",
            Servings = 2, PrepTimeMinutes = prep, CookTimeMinutes = cook, Instructions = instructions,
            CaloriesPerServing = PerServing(x => x.Calories),
            ProteinGramPerServing = PerServing(x => x.ProteinGram),
            CarbohydrateGramPerServing = PerServing(x => x.CarbohydrateGram),
            FatGramPerServing = PerServing(x => x.FatGram),
            RecipeIngredients = rows.Select(row => new RecipeIngredient
            {
                RecipeId = Id(id), IngredientId = Id(row.Id), Quantity = row.Grams, Unit = "g",
                Note = "Định lượng demo cho toàn bộ 2 khẩu phần."
            }).ToList()
        };
    }
}
