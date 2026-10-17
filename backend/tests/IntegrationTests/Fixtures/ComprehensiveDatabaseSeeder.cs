using System.Security.Cryptography;
using Application.Features.Auth;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Identity;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Seeding;

public static class ComprehensiveDatabaseSeeder
{
    private static Guid Id(string prefix, int num) =>
        Guid.Parse($"{prefix}-0000-0000-0000-{num:D12}");

    private static readonly DateTimeOffset BaseTime = new(2026, 10, 15, 8, 0, 0, TimeSpan.Zero);

    public static async Task RunAsync(string connectionString)
    {
        Console.WriteLine("==================================================================");
        Console.WriteLine(" BẮT ĐẦU QUÁ TRÌNH LÀM SẠCH VÀ SEED DATABASE VEGETARIAN SUPPORT   ");
        Console.WriteLine("==================================================================");

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseSqlServer(connectionString);

        await using var db = new AppDbContext(optionsBuilder.Options);

        Console.WriteLine("1. Đang kiểm tra và áp dụng Migrations EF Core...");
        await db.Database.MigrateAsync();

        Console.WriteLine("2. Đang xóa sạch toàn bộ dữ liệu cũ...");
        await using var tx = await db.Database.BeginTransactionAsync();

        // Xóa theo thứ tự phụ thuộc khóa ngoại
        await db.Database.ExecuteSqlRawAsync(@"
            DELETE FROM [MealPlanShoppingItems];
            DELETE FROM [MealPlanMealIngredients];
            DELETE FROM [MealPlanMeals];
            DELETE FROM [MealPlans];
            DELETE FROM [FeaturedContent];
            DELETE FROM [Favorites];
            DELETE FROM [PantryItems];
            DELETE FROM [ContentReactions];
            DELETE FROM [Comments];
            DELETE FROM [ArticleVersionDietaryTypes];
            DELETE FROM [ArticleDietaryTypes];
            DELETE FROM [ArticleVersions];
            DELETE FROM [Articles];
            DELETE FROM [Videos];
            DELETE FROM [ModerationDecisions];
            DELETE FROM [ModerationSubmissions];
            DELETE FROM [FoodScanRecords];
            DELETE FROM [AiChatMessages];
            DELETE FROM [AiChatConversations];
            DELETE FROM [RestaurantRecipes];
            DELETE FROM [RestaurantAmenities];
            DELETE FROM [RestaurantDietaryTypes];
            DELETE FROM [Restaurants];
            DELETE FROM [RecipeIngredients];
            DELETE FROM [Recipes];
            DELETE FROM [Ingredients];
            DELETE FROM [Categories];
            DELETE FROM [UserAvoidedFoods];
            DELETE FROM [UserAllergies];
            DELETE FROM [MemberStatusChanges];
            DELETE FROM [PasswordResetTokens];
            DELETE FROM [RevokedAccessTokens];
            DELETE FROM [UserProfiles];
            DELETE FROM [Users];
        ");

        await tx.CommitAsync();
        Console.WriteLine("-> Đã xóa sạch dữ liệu cũ thành công!");

        // Khởi tạo tài khoản
        Console.WriteLine("3. Đang tạo tài khoản Quản trị viên và Người dùng...");
        var hasher = new Pbkdf2PasswordHasher();
        var adminPasswordHash = hasher.Hash("Admin@123456");
        var userPasswordHash = hasher.Hash("User@123456");

        var adminUser = User.CreateInitialAdmin("Quản Trị Viên Hệ Thống", "admin@vegetariansupport.vn", adminPasswordHash, BaseTime);
        var adminUser2 = User.CreateInitialAdmin("Quản Trị Viên", "admin@gmail.com", adminPasswordHash, BaseTime);
        var adminUser3 = User.CreateInitialAdmin("Quản Trị Viên Local", "admin@vegetariansupport.local", adminPasswordHash, BaseTime);
        var normalUser = User.Register("Nguyễn Văn An", "user@vegetariansupport.vn", userPasswordHash, BaseTime);
        var normalUser2 = User.Register("Nguyễn Văn An", "user@gmail.com", userPasswordHash, BaseTime);
        var normalUser3 = User.Register("Nguyễn Văn An", "user@vegetariansupport.local", userPasswordHash, BaseTime);

        db.Users.AddRange(adminUser, adminUser2, adminUser3, normalUser, normalUser2, normalUser3);
        await db.SaveChangesAsync();

        // Seed Danh mục
        Console.WriteLine("4. Đang tạo các danh mục món ăn chuẩn...");
        var categories = CreateCategories();
        db.Categories.AddRange(categories);
        await db.SaveChangesAsync();
        var catMap = categories.ToDictionary(c => c.Name, c => c.Id);

        // Seed Nguyên liệu
        Console.WriteLine("5. Đang tạo danh mục nguyên liệu chuẩn theo 4 chế độ ăn chay...");
        var ingredients = CreateIngredients();
        db.Ingredients.AddRange(ingredients);
        await db.SaveChangesAsync();
        var ingMap = ingredients.ToDictionary(i => i.Name, i => i);

        // Seed 50 Công thức
        Console.WriteLine("6. Đang tạo 50 công thức món chay thật phân theo 4 chế độ ăn...");
        var recipes = CreateRecipes(catMap, ingMap);
        db.Recipes.AddRange(recipes);
        await db.SaveChangesAsync();

        // Seed 10 Nhà hàng
        Console.WriteLine("7. Đang tạo 10 nhà hàng chay theo 4 loại ăn chay...");
        var restaurants = CreateRestaurants();
        db.Restaurants.AddRange(restaurants);
        await db.SaveChangesAsync();

        // Seed 10 Bài viết
        Console.WriteLine("8. Đang tạo 10 bài viết kiến thức chay đã xuất bản...");
        await SeedArticlesAsync(db, adminUser.Id);

        // Seed 10 Video
        Console.WriteLine("9. Đang tạo 10 video hướng dẫn nấu chay đã xuất bản...");
        await SeedVideosAsync(db, adminUser.Id, categories[1].Id);

        Console.WriteLine("==================================================================");
        Console.WriteLine(" HOÀN TẤT SEEDING THÀNH CÔNG!                                    ");
        Console.WriteLine($" - 9 Danh mục món ăn                                             ");
        Console.WriteLine($" - {ingredients.Count} Nguyên liệu chuẩn với calo, vi chất       ");
        Console.WriteLine($" - {recipes.Count} Công thức (13 Vegan, 12 Lacto, 12 Ovo, 13 Lacto-Ovo) ");
        Console.WriteLine($" - 10 Nhà hàng chay (kèm tọa độ, tiện ích, chế độ ăn)            ");
        Console.WriteLine($" - 10 Bài viết đã duyệt xuất bản kèm ảnh bìa                     ");
        Console.WriteLine($" - 10 Video nấu ăn đã duyệt xuất bản                             ");
        Console.WriteLine($" - Tài khoản Admin: admin@vegetariansupport.local / Admin@123456 ");
        Console.WriteLine($" - Tài khoản User:  user@vegetariansupport.local  / User@123456  ");
        Console.WriteLine("==================================================================");
    }

    private static List<Category> CreateCategories()
    {
        return
        [
            new Category { Id = Id("11111111", 1), Name = "Cơm & Xôi", Description = "Các món cơm chay thơm dẻo, xôi nếp và món chính no bụng giàu năng lượng." },
            new Category { Id = Id("11111111", 2), Name = "Bún, Phở & Mì", Description = "Các món nước thanh ngọt và món xào hấp dẫn từ bún gạo, bánh phở, mì sợi." },
            new Category { Id = Id("11111111", 3), Name = "Canh & Súp", Description = "Canh rau củ thanh mát, súp kem béo ngậy và món hầm thảo mộc bổ dưỡng." },
            new Category { Id = Id("11111111", 4), Name = "Món Xào & Rau Củ", Description = "Rau củ tươi giòn xào cùng các loại nấm và gia vị thực vật thanh đạm." },
            new Category { Id = Id("11111111", 5), Name = "Món Kho & Rim", Description = "Các món kho tiêu, kho tộ, ram mặn ngọt đậm đà đưa cơm." },
            new Category { Id = Id("11111111", 6), Name = "Gỏi & Salad", Description = "Món gỏi chua ngọt, salad thanh mát giàu chất xơ, vitamin và khoáng chất." },
            new Category { Id = Id("11111111", 7), Name = "Món Cuốn & Chiên Giòn", Description = "Chả giò, nem rán, gỏi cuốn ngũ sắc và các món chiên vàng thơm giòn rụm." },
            new Category { Id = Id("11111111", 8), Name = "Bánh & Tráng Miệng", Description = "Bánh ngọt chay, bánh kếp, bánh flan, chè dưỡng nhan và món tráng miệng." },
            new Category { Id = Id("11111111", 9), Name = "Đồ Uống Dinh Dưỡng", Description = "Sữa hạt, sinh tố hoa quả và thức uống thảo mộc tốt cho sức khỏe." }
        ];
    }

    private static List<Ingredient> CreateIngredients()
    {
        Ingredient Plant(int id, string name, string aliases, decimal cal, decimal pro, decimal carb, decimal fat, string? allergens = null) => new()
        {
            Id = Id("22222222", id),
            Name = name,
            Aliases = aliases,
            Origin = IngredientOrigin.Plant,
            ContainsEgg = false,
            ContainsMilk = false,
            ContainsHoney = false,
            ContainsOtherAnimalProducts = false,
            CaloriesPer100Gram = cal,
            ProteinGramPer100Gram = pro,
            CarbohydrateGramPer100Gram = carb,
            FatGramPer100Gram = fat,
            Allergens = allergens,
            DefaultUnit = "g",
            Source = "Bảng thành phần thực phẩm Việt Nam (Viện Dinh Dưỡng)"
        };

        Ingredient Milk(int id, string name, string aliases, decimal cal, decimal pro, decimal carb, decimal fat) => new()
        {
            Id = Id("22222222", id),
            Name = name,
            Aliases = aliases,
            Origin = IngredientOrigin.Animal,
            ContainsEgg = false,
            ContainsMilk = true,
            ContainsHoney = false,
            ContainsOtherAnimalProducts = false,
            CaloriesPer100Gram = cal,
            ProteinGramPer100Gram = pro,
            CarbohydrateGramPer100Gram = carb,
            FatGramPer100Gram = fat,
            Allergens = "Sữa;Milk",
            DefaultUnit = "g",
            Source = "Bảng thành phần thực phẩm sữa"
        };

        Ingredient Egg(int id, string name, string aliases, decimal cal, decimal pro, decimal carb, decimal fat) => new()
        {
            Id = Id("22222222", id),
            Name = name,
            Aliases = aliases,
            Origin = IngredientOrigin.Animal,
            ContainsEgg = true,
            ContainsMilk = false,
            ContainsHoney = false,
            ContainsOtherAnimalProducts = false,
            CaloriesPer100Gram = cal,
            ProteinGramPer100Gram = pro,
            CarbohydrateGramPer100Gram = carb,
            FatGramPer100Gram = fat,
            Allergens = "Trứng;Egg",
            DefaultUnit = "g",
            Source = "Bảng thành phần thực phẩm trứng"
        };

        return
        [
            // Thực vật (Plant)
            Plant(1, "Đậu hũ trắng", "đậu phụ;tofu", 80, 8.5m, 2.0m, 4.2m, "Đậu nành;Soy"),
            Plant(2, "Đậu hũ chiên", "đậu phụ rán;fried tofu", 125, 11.0m, 3.5m, 7.5m, "Đậu nành;Soy"),
            Plant(3, "Đậu hũ non", "silken tofu;đậu hũ lụa", 55, 5.0m, 1.8m, 3.0m, "Đậu nành;Soy"),
            Plant(4, "Nấm rơm", "straw mushroom", 32, 3.4m, 3.0m, 0.4m),
            Plant(5, "Nấm đùi gà", "king oyster mushroom;nấm bào ngư Nhật", 35, 3.1m, 5.5m, 0.6m),
            Plant(6, "Nấm đông cô tươi", "nấm hương;shiitake", 34, 2.2m, 6.8m, 0.5m),
            Plant(7, "Nấm kim châm", "enoki mushroom", 37, 2.7m, 7.8m, 0.3m),
            Plant(8, "Nấm bào ngư", "oyster mushroom", 33, 3.3m, 6.0m, 0.4m),
            Plant(9, "Gạo thơm", "gạo lài;gạo tẻ;rice", 360, 7.0m, 78.0m, 0.8m),
            Plant(10, "Gạo lứt", "brown rice;gạo huyết rồng", 350, 7.5m, 76.0m, 2.8m),
            Plant(11, "Bún tươi", "bún gạo;rice noodles", 110, 2.0m, 25.0m, 0.2m),
            Plant(12, "Bánh phở tươi", "phở;pho noodles", 140, 2.5m, 31.0m, 0.3m),
            Plant(13, "Bánh mì nguyên cám", "whole wheat bread;bánh mì", 250, 9.5m, 46.0m, 3.5m, "Gluten"),
            Plant(14, "Cà chua", "tomato", 20, 1.0m, 4.0m, 0.2m),
            Plant(15, "Cà tím", "eggplant;cà nâu", 25, 1.0m, 6.0m, 0.2m),
            Plant(16, "Khổ qua", "mướp đắng;bitter melon", 17, 1.0m, 3.7m, 0.2m),
            Plant(17, "Mướp hương", "mướp;sponge gourd", 16, 0.9m, 3.5m, 0.2m),
            Plant(18, "Cải thìa", "cải bẹ trắng;bok choy", 14, 1.5m, 2.2m, 0.2m),
            Plant(19, "Cải bó xôi", "rau bina;spinach", 23, 2.9m, 3.6m, 0.4m),
            Plant(20, "Bông cải xanh", "súp lơ xanh;broccoli", 34, 2.8m, 6.6m, 0.4m),
            Plant(21, "Bắp ngọt", "ngô ngọt;sweet corn", 86, 3.2m, 19.0m, 1.2m),
            Plant(22, "Bí đỏ", "bí ngô;pumpkin", 26, 1.0m, 6.5m, 0.1m),
            Plant(23, "Cà rốt", "carrot", 41, 0.9m, 9.6m, 0.2m),
            Plant(24, "Su su", "chayote", 19, 0.8m, 4.5m, 0.1m),
            Plant(25, "Khoai tây", "potato", 77, 2.0m, 17.5m, 0.1m),
            Plant(26, "Khoai lang", "sweet potato", 86, 1.6m, 20.0m, 0.1m),
            Plant(27, "Bơ sáp", "trái bơ;avocado", 160, 2.0m, 8.5m, 14.7m),
            Plant(28, "Chuối sứ", "banana;chuối", 89, 1.1m, 22.8m, 0.3m),
            Plant(29, "Hạt sen tươi", "lotus seed", 89, 4.1m, 17.3m, 0.5m),
            Plant(30, "Đậu gà", "chickpea;chickpeas", 164, 8.9m, 27.4m, 2.6m),
            Plant(31, "Đậu lăng đỏ", "red lentil;lentils", 116, 9.0m, 20.1m, 0.4m),
            Plant(32, "Đậu xanh hạt", "mung bean;đỗ xanh", 347, 23.8m, 62.6m, 1.2m),
            Plant(33, "Đậu phộng rang", "lạc rang;roasted peanut", 587, 25.8m, 16.1m, 49.2m, "Đậu phộng;Peanut"),
            Plant(34, "Hạt chia", "chia seeds", 486, 16.5m, 42.1m, 30.7m),
            Plant(35, "Mè rang", "vừng;sesame seeds", 573, 17.7m, 23.4m, 49.7m, "Mè;Sesame"),
            Plant(36, "Nước cốt dừa", "coconut milk", 197, 2.0m, 3.5m, 21.0m),
            Plant(37, "Sữa đậu nành", "soy milk;soymilk", 45, 3.3m, 4.0m, 1.8m, "Đậu nành;Soy"),
            Plant(38, "Dầu ô liu", "olive oil", 884, 0.0m, 0.0m, 100.0m),
            Plant(39, "Dầu mè", "sesame oil", 884, 0.0m, 0.0m, 100.0m, "Mè;Sesame"),
            Plant(40, "Dầu ăn thực vật", "cooking oil;dầu đậu nành", 884, 0.0m, 0.0m, 100.0m),
            Plant(41, "Nước tương đậu nành", "xì dầu;soy sauce", 53, 5.5m, 7.0m, 0.1m, "Đậu nành;Soy"),
            Plant(42, "Hạt nêm nấm chay", "mushroom seasoning;hạt nêm chay", 180, 4.0m, 38.0m, 0.5m),
            Plant(43, "Muối biển", "salt;muối tinh", 0, 0.0m, 0.0m, 0.0m),
            Plant(44, "Đường mía", "cane sugar;đường", 387, 0.0m, 99.9m, 0.0m),
            Plant(45, "Tiêu đen xay", "black pepper;tiêu", 251, 10.4m, 64.0m, 3.3m),
            Plant(46, "Rong biển khô", "nori;seaweed", 35, 5.8m, 5.1m, 0.3m),
            Plant(47, "Ngó sen tươi", "lotus rootlet", 74, 2.6m, 17.2m, 0.1m),
            Plant(48, "Bánh tráng cuốn", "rice paper", 340, 1.0m, 83.0m, 0.2m),
            Plant(49, "Dưa leo", "dưa chuột;cucumber", 15, 0.7m, 3.6m, 0.1m),
            Plant(50, "Xà lách", "rau diếp;lettuce", 15, 1.4m, 2.9m, 0.2m),
            Plant(51, "Rau ngò rí", "rau mùi;coriander", 23, 2.1m, 3.7m, 0.5m),
            Plant(52, "Hành boa-rô", "tỏi tây;leek", 61, 1.5m, 14.2m, 0.3m),

            // Sữa và chế phẩm (Lacto)
            Milk(101, "Sữa tươi không đường", "fresh milk;cow milk", 62, 3.2m, 4.8m, 3.5m),
            Milk(102, "Bơ lạt", "butter;bơ động vật", 717, 0.9m, 0.1m, 81.1m),
            Milk(103, "Phô mai Mozzarella", "mozzarella cheese", 280, 22.0m, 2.2m, 20.0m),
            Milk(104, "Phô mai Parmesan", "parmesan cheese", 431, 38.5m, 4.1m, 28.6m),
            Milk(105, "Sữa chua không đường", "plain yogurt;yogurt", 59, 3.5m, 4.7m, 3.3m),
            Milk(106, "Kem tươi Whipping Cream", "whipping cream", 340, 2.1m, 2.7m, 36.0m),

            // Trứng (Ovo)
            Egg(201, "Trứng gà tươi", "gà trứng;chicken egg;egg", 143, 12.6m, 0.7m, 9.5m),
            Egg(202, "Trứng vịt", "duck egg", 185, 12.8m, 1.4m, 13.8m),
            Egg(203, "Lòng đỏ trứng gà", "egg yolk", 322, 15.9m, 3.6m, 26.5m)
        ];
    }

    private static List<Recipe> CreateRecipes(Dictionary<string, Guid> cats, Dictionary<string, Ingredient> ings)
    {
        var list = new List<Recipe>();

        Recipe Build(int id, string catName, string name, string desc, int prep, int cook, int servings,
            string img, string instructions, params (string IngName, decimal Qty, string Unit, string? Note)[] ingredients)
        {
            var recipe = new Recipe
            {
                Id = Id("33333333", id),
                CategoryId = cats[catName],
                Name = name,
                Description = desc,
                PrepTimeMinutes = prep,
                CookTimeMinutes = cook,
                Servings = servings,
                ImageUrl = img,
                Instructions = instructions,
                IsActive = true,
                CreatedAt = BaseTime
            };

            decimal totalCal = 0, totalPro = 0, totalCarb = 0, totalFat = 0;
            foreach (var item in ingredients)
            {
                if (!ings.TryGetValue(item.IngName, out var ingredient))
                    throw new InvalidOperationException($"Không tìm thấy nguyên liệu: {item.IngName}");

                recipe.RecipeIngredients.Add(new RecipeIngredient
                {
                    RecipeId = recipe.Id,
                    IngredientId = ingredient.Id,
                    Quantity = item.Qty,
                    Unit = item.Unit,
                    Note = item.Note
                });

                // Tính toán dinh dưỡng dựa trên g (quy đổi đơn vị cơ bản)
                var grams = item.Unit switch
                {
                    "kg" => item.Qty * 1000m,
                    "g" => item.Qty,
                    "ml" => item.Qty,
                    "quả" or "trái" => item.Qty * 50m,
                    "củ" => item.Qty * 100m,
                    "muỗng" or "thìa" => item.Qty * 15m,
                    _ => item.Qty
                };

                totalCal += (ingredient.CaloriesPer100Gram ?? 0) * (grams / 100m);
                totalPro += (ingredient.ProteinGramPer100Gram ?? 0) * (grams / 100m);
                totalCarb += (ingredient.CarbohydrateGramPer100Gram ?? 0) * (grams / 100m);
                totalFat += (ingredient.FatGramPer100Gram ?? 0) * (grams / 100m);
            }

            recipe.CaloriesPerServing = Math.Round(totalCal / servings, 1);
            recipe.ProteinGramPerServing = Math.Round(totalPro / servings, 1);
            recipe.CarbohydrateGramPerServing = Math.Round(totalCarb / servings, 1);
            recipe.FatGramPerServing = Math.Round(totalFat / servings, 1);

            return recipe;
        }

        // ==========================================
        // NHÓM 1: THUẦN CHAY (VEGAN) - 13 MÓN
        // (Hoàn toàn thực vật, không trứng, không sữa)
        // ==========================================
        list.Add(Build(1, "Món Kho & Rim", "Đậu hũ sốt cà chua truyền thống",
            "Món ăn quen thuộc nhưng cực kỳ đậm đà, đậu hũ mềm thơm thấm đẫm sốt cà chua đỏ mọng.",
            10, 15, 2, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Đậu hũ cắt miếng vuông vừa ăn, chiên vàng nhẹ các mặt.\nBước 2: Cà chua rửa sạch, băm nhỏ. Phi thơm hành boa-rô với dầu ăn rồi cho cà chua vào đảo đều đến khi nhừ mềm.\nBước 3: Nêm nước tương, hạt nêm nấm, đường và chút nước sôi để tạo sốt sền sệt.\nBước 4: Cho đậu hũ vào rim lửa nhỏ 5-7 phút cho ngấm đều vị, rắc tiêu và ngò rí lên trên rồi tắt bếp.",
            ("Đậu hũ chiên", 300, "g", "Cắt miếng vuông"), ("Cà chua", 200, "g", "Băm nhuyễn"),
            ("Dầu ăn thực vật", 15, "g", "Dầu xào"), ("Nước tương đậu nành", 20, "g", "Nêm vị"),
            ("Hạt nêm nấm chay", 8, "g", "Gia vị"), ("Đường mía", 10, "g", "Cân bằng vị chua"), ("Tiêu đen xay", 2, "g", "Rắc thơm")));

        list.Add(Build(2, "Canh & Súp", "Canh chua chay Nam Bộ",
            "Canh chua thanh mát với dứa, cà chua, đậu bắp, bạc hà và đậu hũ non mềm ngọt tự nhiên.",
            15, 20, 4, "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Sơ chế cà chua cắt múi cau, đậu hũ non cắt quân cờ, nấm rơm chẻ đôi.\nBước 2: Đun sôi 1 lít nước, cho me hoặc nước cốt dứa vào nấu lấy vị chua thanh.\nBước 3: Cho cà chua, nấm rơm vào nấu chín tới, sau đó thả đậu hũ non vào nhẹ tay.\nBước 4: Nêm muối, hạt nêm nấm và đường cho vừa khẩu vị chua ngọt hài hòa. Rắc rau ngò ôm và ớt lát lên trên.",
            ("Đậu hũ non", 250, "g", "Cắt khối nhẹ tay"), ("Cà chua", 150, "g", "Múi cau"),
            ("Nấm rơm", 150, "g", "Rửa sạch chẻ đôi"), ("Muối biển", 5, "g", "Nêm canh"),
            ("Hạt nêm nấm chay", 10, "g", "Gia vị"), ("Đường mía", 15, "g", "Tạo vị ngọt thanh")));

        list.Add(Build(3, "Món Kho & Rim", "Nấm đùi gà kho tiêu xanh",
            "Nấm đùi gà dai giòn sần sật quyện sốt tương cay nồng của hạt tiêu xanh, cực kỳ bắt cơm.",
            15, 25, 3, "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Nấm đùi gà ngâm nước muối loãng, rửa sạch rồi khứa vảy rồng hoặc cắt khoanh tròn 2cm.\nBước 2: Chiên sơ hai mặt nấm với dầu ăn để giữ độ dai ngọt tự nhiên.\nBước 3: Phi thơm boa-rô, cho nước tương, đường mía, tiêu xay và tiêu hạt vào đun sôi sủi bọt.\nBước 4: Cho nấm vào rim với lửa liu riu cho đến khi nước sốt keo lại bám đều quanh từng miếng nấm.",
            ("Nấm đùi gà", 400, "g", "Cắt khoanh khứa vảy"), ("Dầu ăn thực vật", 15, "g", "Chiên áp chảo"),
            ("Nước tương đậu nành", 30, "g", "Nước kho"), ("Đường mía", 15, "g", "Tạo màu caramel"),
            ("Tiêu đen xay", 5, "g", "Tiêu thơm cay nồng"), ("Hạt nêm nấm chay", 6, "g", "Gia vị")));

        list.Add(Build(4, "Món Xào & Rau Củ", "Cải thìa xào nấm đông cô",
            "Cải thìa xanh mướt giòn ngọt kết hợp cùng nấm đông cô thơm lừng đậm đà dinh dưỡng thực vật.",
            10, 10, 2, "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Cải thìa tách bẹ rửa sạch, chần sơ qua nước sôi có chút muối rồi ngâm nước đá cho giòn.\nBước 2: Nấm đông cô tươi khứa chữ thập trên mặt mũ nấm.\nBước 3: Đun nóng chảo dầu mè, cho nấm đông cô vào xào chín tới cùng nước tương và hạt nêm nấm.\nBước 4: Cho cải thìa vào xào lửa lớn trong 2 phút, đảo đều tay để rau bóng đẹp rồi dọn ra đĩa.",
            ("Cải thìa", 300, "g", "Rửa sạch chần sơ"), ("Nấm đông cô tươi", 150, "g", "Khứa hoa"),
            ("Dầu mè", 10, "g", "Dầu xào thơm"), ("Nước tương đậu nành", 15, "g", "Gia vị sốt"),
            ("Hạt nêm nấm chay", 5, "g", "Nêm vừa ăn")));

        list.Add(Build(5, "Bún, Phở & Mì", "Bún riêu chay thuần thực vật",
            "Bún riêu chay với riêu đậu hũ nấm thơm béo, nước dùng cà chua thanh mát ăn kèm rau sống tươi ngon.",
            20, 30, 4, "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Bóp nhuyễn đậu hũ trắng, trộn với nấm rơm băm nhỏ, bột nghệ và hạt nêm để làm riêu đậu.\nBước 2: Nấu nước dùng từ củ cải trắng, bắp ngọt và su su lấy vị ngọt thanh tự nhiên.\nBước 3: Xào cà chua với dầu màu điều, đổ vào nồi nước dùng đun sôi.\nBước 4: Múc từng muôi riêu đậu thả vào nồi nước sôi cho nổi lên. Xếp bún tươi vào tô, chan nước dùng riêu và ăn cùng rau sống.",
            ("Bún tươi", 500, "g", "Chần nóng"), ("Đậu hũ trắng", 300, "g", "Nghiền làm riêu"),
            ("Nấm rơm", 150, "g", "Băm nhỏ"), ("Cà chua", 200, "g", "Tạo màu nước dùng"),
            ("Bắp ngọt", 150, "g", "Nấu nước dùng ngọt"), ("Hạt nêm nấm chay", 15, "g", "Nêm gia vị"),
            ("Dầu ăn thực vật", 15, "g", "Xào sốt")));

        list.Add(Build(6, "Bún, Phở & Mì", "Phở nấm chay gia truyền",
            "Hương vị phở Hà Nội tinh tế với nước dùng ninh từ rau củ quả, hoa hồi, thảo quả và nấm tươi giòn ngọt.",
            25, 45, 4, "https://images.unsplash.com/photo-1503764654157-724e030674c2?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Nướng thơm hành boa-rô, gừng, hoa hồi và thảo quả rồi bọc vào túi lọc.\nBước 2: Hầm củ cải, cà rốt, bắp ngọt với 2 lít nước và túi gia vị thảo mộc trong 40 phút.\nBước 3: Áp chảo nấm đùi gà và nấm bào ngư với chút dầu mè và hạt nêm.\nBước 4: Trụng bánh phở vào tô, xếp nấm lên trên, rắc hành ngò rồi chan nước dùng sôi sùng sục thơm lừng.",
            ("Bánh phở tươi", 500, "g", "Bánh phở mềm dai"), ("Nấm đùi gà", 200, "g", "Cắt lát áp chảo"),
            ("Nấm bào ngư", 150, "g", "Xé sợi"), ("Cà rốt", 100, "g", "Nấu nước lèo"),
            ("Bắp ngọt", 150, "g", "Nấu nước lèo"), ("Hạt nêm nấm chay", 20, "g", "Nêm phở"),
            ("Dầu mè", 10, "g", "Áp chảo nấm")));

        list.Add(Build(7, "Bún, Phở & Mì", "Bún bò Huế chay đậm vị sả ớt",
            "Tô bún bò Huế chay nóng hổi, thơm nức mùi sả phi cay nồng, chả lụa chay và nấm đông cô đậm đà.",
            20, 35, 4, "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Băm nhỏ sả và ớt, phi thơm với dầu ăn và chút bột nghệ để làm sa tế Huế chay.\nBước 2: Nấu nước lèo từ bắp ngọt, cà rốt và nấm đông cô cho ngọt đậm.\nBước 3: Cho hỗn hợp sả sa tế vào nồi nước lèo, nêm nước tương, muối và hạt nêm nấm vừa miệng.\nBước 4: Cho bún sợi to vào bát, xếp đậu hũ chiên, nấm đông cô lên trên, chan nước dùng cay nồng ăn kèm bắp chuối bào.",
            ("Bún tươi", 500, "g", "Bún sợi to"), ("Đậu hũ chiên", 200, "g", "Cắt lát"),
            ("Nấm đông cô tươi", 150, "g", "Ngâm nở"), ("Bắp ngọt", 150, "g", "Nấu nước dùng"),
            ("Dầu ăn thực vật", 20, "g", "Phi sả sa tế"), ("Hạt nêm nấm chay", 15, "g", "Nêm vị"),
            ("Nước tương đậu nành", 20, "g", "Gia vị Huế")));

        list.Add(Build(8, "Cơm & Xôi", "Cơm chiên ngọc bích hạt sen",
            "Đĩa cơm chiên xanh mướt màu rau cải bó xôi, điểm xuyết hạt sen bùi bùi và ngô ngọt giòn tan.",
            15, 15, 3, "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Cải bó xôi xay nhuyễn vắt lấy nước cốt xanh ngọc, trộn đều với cơm nguội.\nBước 2: Hạt sen tươi hấp chín mềm tới, ngô ngọt luộc sơ.\nBước 3: Phi thơm dầu ăn, cho cơm đã ngấm màu xanh vào rang lửa lớn cho hạt cơm săn tơi giòn.\nBước 4: Thêm hạt sen, bắp ngọt, nêm hạt nêm nấm và tiêu xay, đảo nhanh tay rồi trút ra đĩa thưởng thức.",
            ("Gạo thơm", 300, "g", "Nấu cơm để ráo"), ("Hạt sen tươi", 100, "g", "Hấp chín bùi"),
            ("Cải bó xôi", 100, "g", "Lấy nước cốt màu xanh"), ("Bắp ngọt", 80, "g", "Hạt bắp ngọt"),
            ("Dầu ăn thực vật", 15, "g", "Rang cơm"), ("Hạt nêm nấm chay", 10, "g", "Nêm cơm"),
            ("Tiêu đen xay", 2, "g", "Tiêu thơm")));

        list.Add(Build(9, "Gỏi & Salad", "Gỏi ngó sen đậu hũ giòn ngọt",
            "Món gỏi khai vị thanh đạm, giòn sần sật với ngó sen, cà rốt, đậu hũ chiên vàng và đậu phộng rang bùi.",
            20, 10, 4, "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Ngó sen cắt khúc ngâm giấm đường cho giòn trắng, cà rốt bào sợi mỏng.\nBước 2: Đậu hũ chiên cắt sợi dài chiên giòn.\nBước 3: Pha nước mắm chay từ nước tương, đường mía, nước cốt chanh và ớt băm nhuyễn.\nBước 4: Trộn đều ngó sen, cà rốt, đậu hũ chiên với nước sốt chua ngọt, rắc đậu phộng rang và rau răm lên trên.",
            ("Ngó sen tươi", 300, "g", "Cắt khúc ngâm giòn"), ("Đậu hũ chiên", 150, "g", "Cắt sợi chiên giòn"),
            ("Cà rốt", 80, "g", "Bào sợi"), ("Đậu phộng rang", 40, "g", "Giã dập"),
            ("Đường mía", 25, "g", "Pha nước sốt"), ("Nước tương đậu nành", 20, "g", "Pha sốt gỏi")));

        list.Add(Build(10, "Món Cuốn & Chiên Giòn", "Chả giò chay giòn rụm nhân nấm củ quả",
            "Từng cuốn chả giò vàng ươm giòn tan rụm, nhân nấm rơm, củ sắn, khoai môn thơm nức mũi.",
            30, 20, 4, "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Nấm rơm, cà rốt, khoai lang bào sợi mỏng, vắt nhẹ ráo nước.\nBước 2: Trộn đều nhân với đậu xanh hấp chín, nêm hạt nêm nấm và tiêu đen xay.\nBước 3: Trải bánh tráng cuốn nhân thật chặt tay thành từng cuốn vừa ăn.\nBước 4: Đun sôi dầu ăn ngập chảo, chiên chả giò với lửa vừa đến khi lớp vỏ vàng ươm giòn rụm thì vớt ra ráo dầu.",
            ("Bánh tráng cuốn", 200, "g", "Bánh tráng nem"), ("Nấm rơm", 150, "g", "Băm nhỏ"),
            ("Khoai lang", 150, "g", "Bào sợi"), ("Cà rốt", 100, "g", "Bào sợi"),
            ("Đậu xanh hạt", 80, "g", "Hấp chín tán nhuyễn"), ("Dầu ăn thực vật", 100, "g", "Chiên ngập dầu"),
            ("Hạt nêm nấm chay", 10, "g", "Gia vị nhân"), ("Tiêu đen xay", 3, "g", "Tiêu xay")));

        list.Add(Build(11, "Món Xào & Rau Củ", "Cà tím nướng mỡ hành đậu phộng",
            "Cà tím nướng xém cạnh ngọt mềm tự nhiên, chan mỡ hành boa-rô thơm lừng và đậu phộng giòn tan.",
            10, 15, 2, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Cà tím rửa sạch, dùng tăm xăm đều quanh thân rồi nướng trên bếp than hoặc nồi chiên không dầu đến khi mềm thơm xém vỏ.\nBước 2: Lột bỏ lớp vỏ cháy xém, xẻ dọc thân cà tím xếp ra đĩa.\nBước 3: Đun sôi dầu ăn, đổ vào bát hành boa-rô thái nhỏ nêm chút muối và đường để làm mỡ hành thuần chay.\nBước 4: Rưới đều mỡ hành lên mặt cà tím, rắc đậu phộng rang giã nhỏ và chan chút nước tương ớt tỏi chay.",
            ("Cà tím", 400, "g", "Nướng mềm lột vỏ"), ("Dầu ăn thực vật", 20, "g", "Làm mỡ hành"),
            ("Đậu phộng rang", 30, "g", "Giã dập"), ("Nước tương đậu nành", 15, "g", "Chan nước chấm"),
            ("Đường mía", 5, "g", "Cân bằng vị"), ("Muối biển", 2, "g", "Nêm mỡ hành")));

        list.Add(Build(12, "Canh & Súp", "Canh rong biển hạt sen đậu hũ non",
            "Món canh thanh nhiệt giải độc, bổ dưỡng cho trí não với hạt sen bùi béo kết hợp rong biển và đậu non.",
            15, 20, 3, "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Hạt sen tươi rửa sạch, bỏ tâm sen để không đắng, luộc chín mềm.\nBước 2: Rong biển khô ngâm nước 5 phút cho nở mềm, vớt ra cắt khúc ngắn.\nBước 3: Đun sôi nước dùng hạt sen, thả đậu hũ non cắt miếng vuông vào.\nBước 4: Nêm hạt nêm nấm, muối vừa miệng, cuối cùng cho rong biển vào đun sôi bùng lên thì tắt bếp, rắc dầu mè và gừng sợi.",
            ("Hạt sen tươi", 150, "g", "Bỏ tâm sen luộc mềm"), ("Đậu hũ non", 200, "g", "Cắt khối nhẹ tay"),
            ("Rong biển khô", 20, "g", "Ngâm nở"), ("Dầu mè", 5, "g", "Khử tanh thơm lừng"),
            ("Hạt nêm nấm chay", 10, "g", "Nêm canh"), ("Muối biển", 3, "g", "Vị đậm đà")));

        list.Add(Build(13, "Món Cuốn & Chiên Giòn", "Đậu hũ non chiên giòn sốt me chua ngọt",
            "Đậu hũ non áo lớp bột chiên giòn rụm bên ngoài, mềm mướt bên trong, phủ đẫm sốt me sánh mịn.",
            10, 15, 2, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Đậu hũ non cắt miếng dày 2cm, thấm khô nước nhẹ nhàng.\nBước 2: Lăn đậu hũ qua lớp bột chiên giòn mỏng rồi chiên trong chảo dầu nóng đến khi lớp vỏ vàng rộm.\nBước 3: Đun nước cốt me cùng đường mía, nước tương và ớt băm đến khi sốt keo sánh lại.\nBước 4: Xếp đậu hũ ra đĩa, rưới sốt me chua ngọt óng ả lên trên và rắc mè rang thơm lừng.",
            ("Đậu hũ non", 300, "g", "Cắt miếng chiên giòn"), ("Dầu ăn thực vật", 50, "g", "Chiên giòn vỏ"),
            ("Đường mía", 25, "g", "Nấu sốt me"), ("Nước tương đậu nành", 15, "g", "Nêm mặn ngọt"),
            ("Mè rang", 5, "g", "Rắc mặt")));

        // ==========================================
        // NHÓM 2: CHAY CÓ SỮA (LACTO-VEGETARIAN) - 12 MÓN
        // (Có sữa/bơ/phô mai/sữa chua, KHÔNG có trứng)
        // ==========================================
        list.Add(Build(14, "Canh & Súp", "Súp bí đỏ kem tươi hạnh nhân",
            "Món súp bí đỏ sánh mịn thơm phức, béo ngậy từ bơ lạt và kem sữa tươi whipping cream cao cấp.",
            15, 25, 3, "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Bí đỏ gọt vỏ, thái lát mỏng. Xào thơm bí đỏ với bơ lạt trong 5 phút.\nBước 2: Thêm nước sôi xâm xấp bí, đậy nắp nấu đến khi bí chín mềm nhừ.\nBước 3: Dùng máy xay cầm tay xay nhuyễn mịn bí đỏ ngay trong nồi.\nBước 4: Đổ sữa tươi không đường và kem tươi whipping cream vào khuấy đều, nêm chút muối và tiêu, đun sôi nhẹ rồi tắt bếp.",
            ("Bí đỏ", 400, "g", "Gọt vỏ thái mỏng"), ("Bơ lạt", 25, "g", "Xào thơm bí"),
            ("Sữa tươi không đường", 200, "ml", "Tạo độ lỏng sánh"), ("Kem tươi Whipping Cream", 60, "ml", "Tạo vị béo ngậy"),
            ("Muối biển", 3, "g", "Nêm súp"), ("Tiêu đen xay", 2, "g", "Tiêu thơm")));

        list.Add(Build(15, "Món Kho & Rim", "Cà ri rau củ Ấn Độ với bơ và sữa chua",
            "Món cà ri kiểu Ấn nồng nàn thảo mộc, đậm đà béo thơm nhờ bơ lạt và sữa chua không đường tự nhiên.",
            20, 30, 4, "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Khoai tây, cà rốt cắt khối vuông, đậu gà luộc mềm.\nBước 2: Đun chảy bơ lạt trên chảo, phi thơm sả băm, bột nghệ và bột cà ri Ấn Độ.\nBước 3: Cho rau củ và đậu gà vào xào săn, đổ nước dùng và sữa tươi vào ninh nhỏ lửa 20 phút.\nBước 4: Khi nước cà ri sệt lại, tắt bếp rồi cho sữa chua không đường vào khuấy đều tạo độ chua béo đặc trưng.",
            ("Khoai tây", 250, "g", "Cắt khối"), ("Cà rốt", 150, "g", "Cắt khối"),
            ("Đậu gà", 150, "g", "Luộc chín mềm"), ("Bơ lạt", 30, "g", "Xào gia vị cà ri"),
            ("Sữa tươi không đường", 150, "ml", "Nấu cốt cà ri"), ("Sữa chua không đường", 100, "g", "Tạo vị chua béo thanh"),
            ("Muối biển", 6, "g", "Gia vị"), ("Hạt nêm nấm chay", 10, "g", "Nêm đậm đà")));

        list.Add(Build(16, "Món Cuốn & Chiên Giòn", "Bánh mì bơ tỏi phô mai Mozzarella",
            "Bánh mì giòn rụm bên ngoài, đẫm sốt bơ tỏi thơm lừng và lớp phô mai Mozzarella kéo sợi béo ngậy.",
            15, 12, 3, "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Trộn bơ lạt đun chảy với ngò rí băm nhuyễn và chút muối tạo sốt bơ thơm.\nBước 2: Khía bánh mì thành các múi chéo nhưng không đứt đáy.\nBước 3: Quét đều sốt bơ lạt vào từng kẽ bánh mì, sau đó nhồi đầy ắp phô mai Mozzarella vào giữa.\nBước 4: Nướng bánh ở 180 độ C trong 10-12 phút cho đến khi vỏ bánh giòn tan và phô mai chảy sợi vàng ươm.",
            ("Bánh mì nguyên cám", 250, "g", "Cắt khía múi"), ("Bơ lạt", 40, "g", "Đun chảy làm sốt"),
            ("Phô mai Mozzarella", 120, "g", "Cắt sợi nhồi bánh"), ("Muối biển", 2, "g", "Gia vị sốt")));

        list.Add(Build(17, "Bún, Phở & Mì", "Mì Ý sốt kem nấm và phô mai Parmesan",
            "Sợi mì Ý dai ngon áo đều lớp sốt kem nấm trắng sánh mịn, thơm lừng bơ và phô mai Parmesan đậm chất Âu.",
            10, 15, 2, "https://images.unsplash.com/photo-1621996346565-e3d5d6281788?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Luộc mì Ý trong nước sôi có muối 8-10 phút đến khi vừa chín tới (al dente).\nBước 2: Đun chảy bơ lạt, cho nấm đùi gà và nấm bào ngư thái mỏng vào xào thơm xém cạnh.\nBước 3: Đổ kem tươi whipping cream và sữa tươi vào chảo nấm, đun sôi liu riu cho sốt sánh lại.\nBước 4: Cho mì Ý vào đảo đều trong sốt kem 2 phút, rắc phô mai Parmesan bào mịn và tiêu đen lên trên rồi thưởng thức nóng.",
            ("Bún tươi", 250, "g", "Thay thế sợi mì Ý dai ngon"), ("Nấm đùi gà", 150, "g", "Thái lát mỏng"),
            ("Bơ lạt", 25, "g", "Xào nấm thơm"), ("Kem tươi Whipping Cream", 80, "ml", "Nấu sốt kem béo"),
            ("Sữa tươi không đường", 80, "ml", "Hòa cùng kem"), ("Phô mai Parmesan", 30, "g", "Bào rắc mặt mì"),
            ("Muối biển", 3, "g", "Nêm sốt"), ("Tiêu đen xay", 3, "g", "Tiêu thơm cay")));

        list.Add(Build(18, "Món Xào & Rau Củ", "Khoai tây nghiền bơ sữa đút lò phô mai",
            "Khoai tây nghiền mịn màng tan ngay trong miệng với bơ sữa, phủ lớp phô mai Mozzarella nướng vàng xém.",
            15, 20, 3, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Khoai tây gọt vỏ, hấp chín mềm rồi dùng nĩa hoặc muỗng nghiền thật nhuyễn mịn.\nBước 2: Trộn đều khoai tây nghiền với bơ lạt ấm, sữa tươi không đường, muối và tiêu đen.\nBước 3: Cho hỗn hợp khoai vào khay nướng, dàn phẳng mặt rồi rải đều phô mai Mozzarella lên trên.\nBước 4: Nướng nhiệt độ 200 độ C trong 10-15 phút đến khi phô mai sôi bọt và xém vàng hấp dẫn.",
            ("Khoai tây", 500, "g", "Hấp chín nghiền nhuyễn"), ("Bơ lạt", 30, "g", "Trộn béo thơm"),
            ("Sữa tươi không đường", 80, "ml", "Tạo độ mướt mịn"), ("Phô mai Mozzarella", 100, "g", "Rải mặt đút lò"),
            ("Muối biển", 4, "g", "Gia vị"), ("Tiêu đen xay", 2, "g", "Tiêu xay")));

        list.Add(Build(19, "Đồ Uống Dinh Dưỡng", "Sinh tố bơ chuối sữa tươi nguyên chất",
            "Ly sinh tố xanh mát giàu năng lượng và kali, thơm ngọt tự nhiên từ chuối sứ và sữa tươi thanh trùng.",
            5, 5, 2, "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Bơ sáp nạo lấy thịt quả, chuối sứ bóc vỏ cắt khúc ngắn.\nBước 2: Cho bơ, chuối, sữa tươi không đường và đá viên vào cối máy xay sinh tố.\nBước 3: Xay ở tốc độ cao trong 45-60 giây đến khi hỗn hợp nhuyễn mịn hoàn toàn.\nBước 4: Rót sinh tố ra ly, rắc thêm chút hạt chia lên mặt để tăng chất xơ và thưởng thức ngay.",
            ("Bơ sáp", 200, "g", "Lấy thịt bơ dẻo"), ("Chuối sứ", 150, "g", "Chuối chín ngọt"),
            ("Sữa tươi không đường", 250, "ml", "Xay sinh tố"), ("Hạt chia", 10, "g", "Rắc mặt ly")));

        list.Add(Build(20, "Canh & Súp", "Súp ngô ngọt kem sữa tươi",
            "Vị ngọt thanh tự nhiên từ bắp ngô hòa quyện hoàn hảo trong làn súp kem sữa tươi thơm lừng ấm bụng.",
            10, 20, 3, "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Bắp ngọt tách hạt, giữ lại lõi ngô luộc lấy nước dùng ngọt thanh.\nBước 2: Xào hạt bắp với bơ lạt cho chín thơm, sau đó múc 1/2 lượng bắp đem xay nhuyễn với sữa tươi.\nBước 3: Đổ ngô xay trở lại nồi nước dùng cùng phần ngô nguyên hạt, đun sôi nhẹ.\nBước 4: Rót kem tươi whipping cream vào khuấy đều tay, nêm chút muối và tiêu cho vừa ăn.",
            ("Bắp ngọt", 300, "g", "Hạt bắp tươi ngọt"), ("Bơ lạt", 20, "g", "Xào bắp thơm"),
            ("Sữa tươi không đường", 150, "ml", "Xay cùng ngô"), ("Kem tươi Whipping Cream", 50, "ml", "Tạo vị béo mịn"),
            ("Muối biển", 3, "g", "Nêm súp")));

        list.Add(Build(21, "Gỏi & Salad", "Salad rau củ sốt sữa chua mè rang",
            "Đĩa salad tươi giòn mát rượi với xà lách, dưa leo, cà chua bi quyện cùng sốt sữa chua mè rang thơm bùi thanh nhẹ.",
            10, 0, 2, "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Xà lách, dưa leo rửa sạch ngâm nước muối loãng, cắt khúc vừa ăn.\nBước 2: Pha nước sốt: trộn đều sữa chua không đường với mè rang giã nhỏ, dầu ô liu, muối và chút đường mía.\nBước 3: Xếp các loại rau củ tươi mát vào âu lớn.\nBước 4: Rưới nước sốt sữa chua mè rang lên trên, trộn đều nhẹ tay và dùng ngay để rau giữ độ giòn.",
            ("Cà chua", 150, "g", "Thái múi cau"), ("Dưa leo", 150, "g", "Thái lát giòn"),
            ("Sữa chua không đường", 100, "g", "Làm nền sốt salad"), ("Mè rang", 15, "g", "Giã dập thơm bùi"),
            ("Dầu ô liu", 10, "g", "Tốt cho tim mạch"), ("Đường mía", 5, "g", "Cân bằng vị"), ("Muối biển", 2, "g", "Gia vị sốt")));

        list.Add(Build(22, "Bánh & Tráng Miệng", "Chè bí đỏ nấu sữa tươi thanh ngọt",
            "Món chè bổ dưỡng với bí đỏ dẻo mềm, ngập tràn trong sữa tươi thơm ngọt dịu dàng và hạt sen bùi béo.",
            15, 25, 4, "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Bí đỏ gọt vỏ, cắt quân cờ vuông vắn. Hạt sen luộc chín mềm.\nBước 2: Cho bí đỏ và hạt sen vào nồi cùng chút nước sôi, nấu lửa vừa đến khi bí chín mềm nhưng không nát.\nBước 3: Cho đường mía vào khuấy tan cho ngấm vị ngọt vào từng miếng bí.\nBước 4: Rót sữa tươi không đường vào nồi, hạ nhỏ lửa đun ấm nóng (không để sôi bùng) rồi múc ra chén thưởng thức.",
            ("Bí đỏ", 400, "g", "Cắt quân cờ"), ("Hạt sen tươi", 100, "g", "Luộc chín bùi"),
            ("Sữa tươi không đường", 300, "ml", "Tạo vị sữa thanh ngọt"), ("Đường mía", 50, "g", "Nấu chè ngọt dịu")));

        list.Add(Build(23, "Món Xào & Rau Củ", "Bông cải xanh đút lò sốt phô mai béo ngậy",
            "Bông cải xanh giòn ngọt đẫm mình trong sốt kem phô mai béo ngậy, nướng vàng xém mặt thơm nức.",
            15, 18, 3, "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Bông cải xanh cắt miếng vừa ăn, chần qua nước sôi 2 phút rồi vớt ra xả nước lạnh.\nBước 2: Nấu sốt kem phô mai: đun chảy bơ lạt, thêm sữa tươi và kem whipping cream, nêm chút muối tiêu.\nBước 3: Xếp bông cải vào khay sứ, chan đều nước sốt kem bơ sữa lên trên.\nBước 4: Phủ kín phô mai Mozzarella và Parmesan lên mặt, nướng ở 200 độ C trong 12-15 phút đến khi vàng thơm.",
            ("Bông cải xanh", 400, "g", "Cắt nhánh chần sơ"), ("Bơ lạt", 20, "g", "Làm sốt kem"),
            ("Sữa tươi không đường", 80, "ml", "Hòa cùng kem"), ("Kem tươi Whipping Cream", 50, "ml", "Tạo độ sánh"),
            ("Phô mai Mozzarella", 80, "g", "Kéo sợi béo"), ("Phô mai Parmesan", 20, "g", "Thơm đậm đà"),
            ("Muối biển", 3, "g", "Gia vị")));

        list.Add(Build(24, "Món Xào & Rau Củ", "Nấm đùi gà xào bơ tỏi thơm lừng",
            "Nấm đùi gà dai giòn sần sật xào xém cạnh cùng bơ lạt béo ngậy, dậy mùi thơm nức mũi của tỏi phi.",
            10, 10, 2, "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Nấm đùi gà cắt lát dày 1cm, dùng dao khía ca-rô nhẹ lên hai mặt để ngấm vị.\nBước 2: Đun chảy bơ lạt trên chảo, cho tỏi băm vào phi vàng thơm lừng.\nBước 3: Cho nấm vào áp chảo lửa lớn cho xém cạnh vàng óng hai mặt.\nBước 4: Nêm hạt nêm nấm, muối và tiêu đen xay, đảo nhanh tay 1 phút rồi rắc ngò rí lên trên.",
            ("Nấm đùi gà", 350, "g", "Khía ca-rô cắt lát"), ("Bơ lạt", 30, "g", "Xào thơm xém cạnh"),
            ("Hạt nêm nấm chay", 8, "g", "Gia vị nấm"), ("Muối biển", 2, "g", "Nêm vị"), ("Tiêu đen xay", 3, "g", "Tiêu cay nồng")));

        list.Add(Build(25, "Đồ Uống Dinh Dưỡng", "Trà sữa yến mạch sữa tươi thanh mát",
            "Ly trà sữa thơm dịu từ sữa tươi thanh trùng kết hợp bột yến mạch và đường mía sánh mịn thơm lành.",
            10, 10, 2, "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Nấu đường mía với chút nước thành si-rô caramen thơm lừng.\nBước 2: Đun nóng nhẹ sữa tươi không đường (không để sôi) rồi hòa cùng nước trà đen thơm đậm.\nBước 3: Thêm si-rô đường mía vào khuấy đều điều chỉnh độ ngọt vừa ý.\nBước 4: Thêm đá lạnh vào ly, rót trà sữa tươi thơm mát vào và thưởng thức sảng khoái.",
            ("Sữa tươi không đường", 350, "ml", "Cốt trà sữa thơm béo"), ("Đường mía", 40, "g", "Nấu caramen"),
            ("Hạt chia", 10, "g", "Topping giòn vui miệng")));

        // ==========================================
        // NHÓM 3: CHAY CÓ TRỨNG (OVO-VEGETARIAN) - 12 MÓN
        // (Có trứng gà/vịt, KHÔNG có sữa hay chế phẩm sữa)
        // ==========================================
        list.Add(Build(26, "Món Xào & Rau Củ", "Khổ qua xào trứng gà không đắng",
            "Món xào thanh nhiệt quen thuộc, khổ qua giòn ngọt xào quyện cùng trứng gà vàng ươm béo thơm đậm vị.",
            10, 10, 2, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Khổ qua bổ đôi bỏ ruột, bào lát mỏng rồi ngâm nước đá lạnh 10 phút để giảm vị đắng và tăng độ giòn.\nBước 2: Đánh tan 2 quả trứng gà với chút hạt nêm nấm, tiêu xay và nước tương.\nBước 3: Phi thơm dầu ăn, cho khổ qua vào xào lửa lớn 2-3 phút cho vừa chín tới.\nBước 4: Rưới đều bát trứng gà vào chảo, đảo nhẹ tay cho trứng chín bông xốp bám đều từng lát khổ qua.",
            ("Khổ qua", 300, "g", "Bào lát ngâm đá"), ("Trứng gà tươi", 2, "quả", "Đánh tan bông"),
            ("Dầu ăn thực vật", 15, "g", "Dầu xào"), ("Nước tương đậu nành", 10, "g", "Nêm trứng"),
            ("Hạt nêm nấm chay", 6, "g", "Gia vị"), ("Tiêu đen xay", 2, "g", "Tiêu thơm")));

        list.Add(Build(27, "Canh & Súp", "Canh cà chua đậu hũ trứng bồng bềnh",
            "Tô canh chua dịu ngọt thanh mát với những vân trứng gà bồng bềnh uốn lượn đẹp mắt cùng đậu non mềm mại.",
            10, 10, 3, "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Cà chua cắt múi cau xào chín nhuyễn với dầu ăn để tạo màu nước canh đỏ cam đẹp tự nhiên.\nBước 2: Đổ nước sôi vào nồi cà chua đun sôi, thả đậu hũ non cắt quân cờ vào.\nBước 3: Đánh tan 2 quả trứng gà. Vừa đổ trứng từ từ vào nồi canh vừa dùng đũa khuấy một chiều tạo vân trứng bồng bềnh.\nBước 4: Nêm muối biển và hạt nêm nấm cho vừa miệng, rắc hành ngò thái nhỏ lên trên rồi tắt bếp ngay.",
            ("Cà chua", 200, "g", "Xào nhuyễn lấy màu"), ("Đậu hũ non", 200, "g", "Cắt quân cờ"),
            ("Trứng gà tươi", 2, "quả", "Tạo vân hoa trứng"), ("Dầu ăn thực vật", 10, "g", "Xào cà chua"),
            ("Muối biển", 4, "g", "Nêm canh"), ("Hạt nêm nấm chay", 8, "g", "Vị ngọt thanh"),
            ("Tiêu đen xay", 2, "g", "Tiêu thơm")));

        list.Add(Build(28, "Canh & Súp", "Trứng hấp nấm rơm và bắp ngọt",
            "Món trứng hấp mịn màng như thạch, ngọt bùi từ bắp hạt và nấm rơm tươi giàu đạm cho cả gia đình.",
            15, 15, 3, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Đánh tan 3 quả trứng gà với 150ml nước ấm, nêm hạt nêm nấm và lọc qua rây để trứng mịn không bọt khí.\nBước 2: Nấm rơm thái hạt lựu, bắp ngọt luộc sơ rồi rải đều dưới đáy thố sứ.\nBước 3: Đổ hỗn hợp trứng đã lọc vào thố ngập lớp nấm và bắp.\nBước 4: Bọc màng bọc thực phẩm, hấp cách thủy với lửa nhỏ trong 12-15 phút đến khi trứng đông mịn màng.",
            ("Trứng gà tươi", 3, "quả", "Đánh tan lọc rây"), ("Nấm rơm", 100, "g", "Thái hạt lựu"),
            ("Bắp ngọt", 80, "g", "Luộc sơ tách hạt"), ("Hạt nêm nấm chay", 6, "g", "Nêm trứng"),
            ("Nước tương đậu nành", 10, "g", "Chan mặt khi chín"), ("Tiêu đen xay", 1, "g", "Rắc thơm")));

        list.Add(Build(29, "Cơm & Xôi", "Cơm chiên hoàng bào vàng ươm",
            "Từng hạt cơm săn tơi vàng ruộm màu lòng đỏ trứng gà, thơm lừng tiêu đen và giòn ngọt hạt bắp tươi.",
            15, 15, 2, "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Tách 2 lòng đỏ trứng gà trộn đều với cơm nguội cho từng hạt cơm thấm đẫm màu vàng óng ả.\nBước 2: Phi thơm dầu ăn trên chảo nóng, trút cơm vào đảo đều tay với lửa lớn cho hạt cơm săn giòn.\nBước 3: Thêm bắp ngọt và nấm đông cô thái hạt lựu vào xào cùng.\nBước 4: Nêm nước tương và hạt nêm nấm vừa vị, rắc tiêu xay thơm lừng và trút ra đĩa thưởng thức.",
            ("Gạo thơm", 250, "g", "Nấu cơm để ráo"), ("Lòng đỏ trứng gà", 2, "quả", "Trộn nhuộm màu cơm"),
            ("Trứng gà tươi", 1, "quả", "Chiên sợi xắt nhỏ"), ("Bắp ngọt", 80, "g", "Hạt bắp ngọt"),
            ("Dầu ăn thực vật", 15, "g", "Rang cơm"), ("Hạt nêm nấm chay", 8, "g", "Nêm vừa ăn"),
            ("Nước tương đậu nành", 10, "g", "Gia vị"), ("Tiêu đen xay", 2, "g", "Tiêu thơm")));

        list.Add(Build(30, "Món Cuốn & Chiên Giòn", "Trứng cuộn rong biển mè rang kiểu Nhật",
            "Món trứng cuộn Tamagoyaki vàng ruộm cuộn cùng lá rong biển giòn dai, rắc mè rang thơm lừng đẹp mắt.",
            10, 10, 2, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Đánh tan 3 quả trứng gà với chút nước tương, đường mía và muối biển.\nBước 2: Quét một lớp dầu mỏng lên chảo chống dính hình chữ nhật, đổ một lớp trứng mỏng.\nBước 3: Đặt lá rong biển lên trên mặt trứng, khi trứng se lại thì cuộn tròn về một phía.\nBước 4: Tiếp tục đổ thêm lớp trứng khác rồi cuộn chồng lên lớp cũ. Lấy trứng ra cắt khoanh tròn, rắc mè rang lên mặt.",
            ("Trứng gà tươi", 3, "quả", "Đánh đều làm cuộn"), ("Rong biển khô", 15, "g", "Cuộn giữa lớp trứng"),
            ("Dầu ăn thực vật", 10, "g", "Thoa chảo nướng"), ("Nước tương đậu nành", 8, "g", "Gia vị kiểu Nhật"),
            ("Đường mía", 5, "g", "Vị ngọt dịu"), ("Mè rang", 5, "g", "Rắc trang trí")));

        list.Add(Build(31, "Bún, Phở & Mì", "Bún xào trứng kiểu Singapore",
            "Sợi bún gạo mềm dai vàng óng ả màu bột nghệ, xào tơi cùng trứng gà, giá đỗ, cà rốt và nấm giòn ngọt.",
            15, 15, 3, "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Bún tươi chần qua nước sôi để ráo. Trứng gà đánh tan tráng mỏng trên chảo rồi thái sợi dài.\nBước 2: Cà rốt bào sợi, nấm đùi gà thái chỉ xào chín tới cùng bột nghệ và dầu ăn.\nBước 3: Cho bún vào chảo đảo đều tay với gia vị nước tương, hạt nêm nấm với lửa lớn.\nBước 4: Cho sợi trứng chiên vào trộn đều nhẹ tay, rắc tiêu xay và hành ngò lên đĩa bún thơm phức.",
            ("Bún tươi", 400, "g", "Chần ráo"), ("Trứng gà tươi", 2, "quả", "Tráng mỏng thái sợi"),
            ("Nấm đùi gà", 150, "g", "Thái chỉ"), ("Cà rốt", 80, "g", "Bào sợi"),
            ("Dầu ăn thực vật", 15, "g", "Xào bún"), ("Nước tương đậu nành", 15, "g", "Nêm vị"),
            ("Hạt nêm nấm chay", 8, "g", "Gia vị"), ("Tiêu đen xay", 2, "g", "Tiêu cay")));

        list.Add(Build(32, "Bún, Phở & Mì", "Mì xào giòn sốt nấm và trứng ốp la",
            "Vắt mì xào vàng rụm giòn tan, phủ đẫm sốt nấm xào sền sệt đậm đà và quả trứng ốp la lòng đào béo ngậy.",
            15, 15, 2, "https://images.unsplash.com/photo-1621996346565-e3d5d6281788?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Chiên giòn vắt mì trong chảo dầu nóng cho phồng xốp vàng rụm rồi vớt ra đĩa.\nBước 2: Ốp la 2 quả trứng gà giữ lòng đào sóng sánh.\nBước 3: Xào nấm đông cô, cà rốt, cải ngọt với nước tương, dầu mè và hạt nêm, hòa chút bột năng tạo sốt sệt.\nBước 4: Rưới sốt nấm rau củ nóng hổi lên đĩa mì giòn, đặt trứng ốp la lòng đào lên trên cùng và thưởng thức.",
            ("Bún tươi", 250, "g", "Chiên giòn giòn tan"), ("Trứng gà tươi", 2, "quả", "Ốp la lòng đào"),
            ("Nấm đông cô tươi", 120, "g", "Xào sốt"), ("Cà rốt", 80, "g", "Thái hoa"),
            ("Dầu mè", 10, "g", "Dầu xào thơm"), ("Dầu ăn thực vật", 40, "g", "Chiên mì"),
            ("Nước tương đậu nành", 20, "g", "Gia vị sốt"), ("Hạt nêm nấm chay", 8, "g", "Nêm vừa miệng")));

        list.Add(Build(33, "Món Xào & Rau Củ", "Trứng chiên nấm kim châm giòn thơm",
            "Món trứng chiên bồng bềnh giòn rụm bên rìa, ôm trọn những sợi nấm kim châm dai ngọt giòn sần sật.",
            10, 10, 2, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Nấm kim châm cắt gốc, rửa sạch tách thành từng chùm nhỏ.\nBước 2: Đánh tan 3 quả trứng gà với hạt nêm nấm, tiêu xay và nước tương.\nBước 3: Đun nóng dầu ăn trong chảo, xếp các chùm nấm kim châm xòe nan quạt trên mặt chảo.\nBước 4: Đổ đều trứng gà phủ kín mặt nấm, đậy nắp chiên lửa nhỏ đến khi mặt dưới vàng giòn thì lật mặt chiên chín đều.",
            ("Trứng gà tươi", 3, "quả", "Đánh tan bông"), ("Nấm kim châm", 150, "g", "Cắt gốc tách chùm"),
            ("Dầu ăn thực vật", 20, "g", "Chiên trứng giòn"), ("Hạt nêm nấm chay", 6, "g", "Nêm trứng"),
            ("Nước tương đậu nành", 8, "g", "Gia vị"), ("Tiêu đen xay", 2, "g", "Tiêu thơm")));

        list.Add(Build(34, "Canh & Súp", "Canh mướp hương nấu trứng bông",
            "Bát canh thơm nức mùi mướp hương mùa hè, vị ngọt thanh mát hòa cùng sợi trứng gà vàng ươm dịu nhẹ.",
            10, 10, 3, "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Mướp hương gọt vỏ, thái vát chéo vừa ăn.\nBước 2: Đun sôi 800ml nước, cho hạt nêm nấm và muối vào nêm nước canh ngọt dịu.\nBước 3: Thả mướp hương vào đun sôi 2 phút cho mướp vừa chín tới và giữ màu xanh.\nBước 4: Rót từ từ trứng gà đánh tan vào nồi, đảo nhẹ tay tạo vân trứng mềm mại rồi tắt bếp ngay.",
            ("Mướp hương", 350, "g", "Gọt vỏ thái vát"), ("Trứng gà tươi", 2, "quả", "Đánh tan tạo vân"),
            ("Muối biển", 4, "g", "Nêm canh"), ("Hạt nêm nấm chay", 8, "g", "Vị ngọt thanh"),
            ("Tiêu đen xay", 2, "g", "Rắc thơm")));

        list.Add(Build(35, "Món Kho & Rim", "Trứng chưng nấm đông cô sốt tương",
            "Món trứng chưng mềm mượt như lụa, ngấm đẫm sốt tương ngọt thơm từ nấm đông cô xào đậm đà.",
            15, 15, 3, "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Đánh tan trứng gà với nước dùng nấm theo tỉ lệ 1:1.5, lọc qua rây rồi đem hấp cách thủy 10 phút.\nBước 2: Nấm đông cô thái hạt lựu xào thơm với dầu mè, nước tương, đường mía và tiêu đen tạo sốt sánh nâu bóng.\nBước 3: Lấy thố trứng hấp chín mềm ra khỏi xửng hấp.\nBước 4: Múc sốt nấm đông cô đậm đà rưới ngập mặt trứng hấp, rắc hành ngò lên trên và dùng nóng với cơm.",
            ("Trứng gà tươi", 3, "quả", "Hấp chín mịn"), ("Nấm đông cô tươi", 150, "g", "Thái hạt lựu làm sốt"),
            ("Dầu mè", 10, "g", "Xào sốt thơm"), ("Nước tương đậu nành", 20, "g", "Vị tương đậm đà"),
            ("Đường mía", 10, "g", "Cân bằng mặn ngọt"), ("Tiêu đen xay", 2, "g", "Tiêu xay")));

        list.Add(Build(36, "Gỏi & Salad", "Salad rau trộn trứng luộc lòng đào",
            "Đĩa salad rực rỡ sắc màu với xà lách, cà chua, dưa leo tươi mát và trứng gà luộc lòng đào béo ngậy sốt giấm mè.",
            10, 8, 2, "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Luộc trứng gà trong nước sôi đúng 6 phút rồi vớt ra ngâm nước đá lạnh, bóc vỏ bổ đôi lòng đào dẻo quánh.\nBước 2: Xà lách, dưa leo, cà chua rửa sạch để ráo, cắt miếng vừa ăn xếp ra đĩa.\nBước 3: Pha sốt giấm đường: dầu ô liu, nước tương, đường mía, chút giấm và mè rang giã dập.\nBước 4: Xếp trứng luộc lòng đào lên trên đĩa rau, rưới nước sốt giấm mè thơm lừng và thưởng thức.",
            ("Trứng gà tươi", 2, "quả", "Luộc lòng đào 6 phút"), ("Cà chua", 150, "g", "Thái múi cau"),
            ("Dưa leo", 150, "g", "Thái lát"), ("Dầu ô liu", 15, "g", "Pha sốt salad"),
            ("Nước tương đậu nành", 15, "g", "Gia vị sốt"), ("Đường mía", 10, "g", "Pha chua ngọt"),
            ("Mè rang", 8, "g", "Rắc thơm giòn")));

        list.Add(Build(37, "Món Cuốn & Chiên Giòn", "Bánh mì kẹp trứng chiên hành thơm nức",
            "Bữa sáng giản dị mà ấm bụng với ổ bánh mì giòn rụm kẹp trứng gà chiên phồng xốp, dưa leo và nước tương cay ngọt.",
            5, 10, 2, "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Đánh tan 2 quả trứng gà cùng hành boa-rô băm nhỏ, tiêu xay và chút muối biển.\nBước 2: Đun nóng chảo dầu ăn, đổ trứng vào chiên phồng xốp vàng rụm hai mặt.\nBước 3: Nướng nóng giòn ổ bánh mì nguyên cám, xẻ dọc thân bánh.\nBước 4: Xếp trứng chiên vào ruột bánh, thêm dưa leo thái lát, rau mùi rồi rưới nước tương ớt cay nhẹ vào.",
            ("Bánh mì nguyên cám", 200, "g", "Bánh mì giòn nóng"), ("Trứng gà tươi", 2, "quả", "Chiên phồng xốp"),
            ("Dưa leo", 80, "g", "Kẹp kèm giòn mát"), ("Dầu ăn thực vật", 10, "g", "Chiên trứng"),
            ("Nước tương đậu nành", 10, "g", "Chan bánh mì"), ("Tiêu đen xay", 2, "g", "Tiêu thơm")));

        // ==========================================
        // NHÓM 4: CHAY CÓ CẢ TRỨNG VÀ SỮA (LACTO-OVO VEGETARIAN) - 13 MÓN
        // (Có cả trứng VÀ sữa/bơ/phô mai, không có thịt cá)
        // ==========================================
        list.Add(Build(38, "Bánh & Tráng Miệng", "Bánh kếp chuối trứng sữa thơm lừng (Pancake)",
            "Từng chiếc bánh kếp vàng óng xốp mềm, dậy mùi thơm của bơ lạt, trứng gà tươi và sữa ngọt ngào.",
            10, 15, 3, "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Dầm nhuyễn chuối chín. Đánh tan trứng gà với sữa tươi không đường và bơ lạt đun chảy.\nBước 2: Trộn bột mì, đường mía và chút muối vào hỗn hợp trứng sữa khuấy mịn không vón cục.\nBước 3: Làm nóng chảo chống dính, quét lớp bơ mỏng rồi múc từng muôi bột đổ vào giữa chảo.\nBước 4: Rán lửa nhỏ đến khi mặt bánh nổi bọt khí thì lật mặt rán vàng đều hai bên, ăn kèm lát chuối tươi.",
            ("Chuối sứ", 150, "g", "Dầm nhuyễn"), ("Trứng gà tươi", 2, "quả", "Tạo độ nở xốp"),
            ("Sữa tươi không đường", 150, "ml", "Hòa cùng bột bánh"), ("Bơ lạt", 20, "g", "Bơ rán bánh thơm"),
            ("Đường mía", 25, "g", "Tạo vị ngọt nhẹ"), ("Muối biển", 1, "g", "Cân bằng vị")));

        list.Add(Build(39, "Bánh & Tráng Miệng", "Bánh flan caramel trứng sữa truyền thống",
            "Hũ bánh flan núng nính mềm mịn tan trên đầu lưỡi, ngập tràn vị béo thơm của trứng gà và sữa tươi nguyên kem.",
            20, 30, 4, "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Thắng đường mía với chút nước đến khi chuyển màu cánh gián thơm thì trút vào đáy khuôn làm caramel.\nBước 2: Đun ấm sữa tươi không đường (khoảng 50 độ C).\nBước 3: Đánh tan nhẹ 3 quả trứng gà (không tạo bọt khí), rót từ từ sữa ấm vào khuấy đều rồi lọc qua rây 2 lần.\nBước 4: Rót hỗn hợp trứng sữa vào khuôn caramel, hấp cách thủy với lửa nhỏ liu riu trong 25 phút đến khi bánh đông mịn.",
            ("Trứng gà tươi", 3, "quả", "Đánh tan nhẹ lọc rây"), ("Sữa tươi không đường", 300, "ml", "Đun ấm hòa trứng"),
            ("Đường mía", 60, "g", "Thắng caramen"), ("Muối biển", 1, "g", "Chút muối dằn vị")));

        list.Add(Build(40, "Món Cuốn & Chiên Giòn", "Trứng ốp la phô mai bơ tỏi kẹp bánh mì",
            "Sự kết hợp hoàn hảo cho bữa sáng: trứng ốp la lòng đào, phô mai Mozzarella kéo sợi và bơ tỏi vàng ruộm.",
            10, 10, 2, "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Đun chảy bơ lạt trên chảo, ốp la 2 quả trứng gà rắc chút muối tiêu lên mặt.\nBước 2: Rải phô mai Mozzarella phủ kín lên mặt trứng khi lòng trắng vừa đông, đậy nắp 1 phút cho phô mai tan chảy kéo sợi.\nBước 3: Bánh mì nguyên cám áp chảo bơ lạt cho giòn rụm hai mặt.\nBước 4: Kẹp phần trứng phô mai tan chảy béo ngậy vào ruột bánh mì giòn tan và thưởng thức nóng hổi.",
            ("Bánh mì nguyên cám", 200, "g", "Áp chảo bơ giòn"), ("Trứng gà tươi", 2, "quả", "Ốp la lòng đào"),
            ("Phô mai Mozzarella", 80, "g", "Tan chảy kéo sợi"), ("Bơ lạt", 20, "g", "Áp chảo thơm"),
            ("Muối biển", 2, "g", "Nêm trứng"), ("Tiêu đen xay", 2, "g", "Tiêu thơm")));

        list.Add(Build(41, "Bún, Phở & Mì", "Mì Ý Carbonara sốt trứng phô mai béo ngậy",
            "Mì Carbonara chuẩn phong cách ẩm thực Ý với lòng đỏ trứng gà tươi béo mượt, kem sữa và phô mai Parmesan đậm đà.",
            15, 15, 2, "https://images.unsplash.com/photo-1621996346565-e3d5d6281788?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Luộc mì Ý vừa chín tới (al dente) giữ lại nửa bát nước luộc mì.\nBước 2: Đánh tan 2 lòng đỏ trứng gà cùng phô mai Parmesan bào mịn và kem tươi whipping cream tạo sốt kem đặc sệt.\nBước 3: Xào nấm đùi gà với bơ lạt cho xém vàng cạnh thơm phức.\nBước 4: Tắt bếp, trút mì nóng vào chảo nấm rồi đổ ngay hỗn hợp trứng phô mai kem vào đảo thật nhanh tay để hơi nóng làm chín sốt mượt mà.",
            ("Bún tươi", 250, "g", "Sợi mì dai ngon"), ("Lòng đỏ trứng gà", 2, "quả", "Cốt sốt Carbonara mượt mà"),
            ("Phô mai Parmesan", 40, "g", "Bào mịn trộn trứng"), ("Kem tươi Whipping Cream", 60, "ml", "Tạo sốt kem béo"),
            ("Nấm đùi gà", 120, "g", "Cắt sợi xào bơ"), ("Bơ lạt", 20, "g", "Xào nấm thơm"),
            ("Tiêu đen xay", 3, "g", "Tiêu thơm cay nồng"), ("Muối biển", 2, "g", "Nêm mì")));

        list.Add(Build(42, "Bánh & Tráng Miệng", "Quiche rau củ đút lò nướng trứng sữa phô mai",
            "Bánh Quiche mặn kiểu Pháp với vỏ bánh giòn xốp, nhân ngập tràn bông cải xanh, nấm, trứng sữa và phô mai tan chảy.",
            20, 30, 4, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Bông cải xanh và nấm rơm xào sơ với bơ lạt cho ráo nước.\nBước 2: Đánh tan 3 quả trứng gà cùng sữa tươi không đường, kem whipping cream, muối và tiêu đen.\nBước 3: Xếp rau củ vào khuôn sứ, đổ ngập hỗn hợp trứng sữa vào rồi rải đều phô mai Mozzarella lên trên.\nBước 4: Nướng ở nhiệt độ 180 độ C trong 25-30 phút đến khi bánh chín nở phồng, mặt phô mai vàng ươm hấp dẫn.",
            ("Trứng gà tươi", 3, "quả", "Cốt bánh quiche"), ("Sữa tươi không đường", 100, "ml", "Tạo độ mềm béo"),
            ("Kem tươi Whipping Cream", 50, "ml", "Tạo độ sánh đặc"), ("Bông cải xanh", 150, "g", "Cắt nhỏ xào sơ"),
            ("Nấm rơm", 100, "g", "Thái lát"), ("Bơ lạt", 15, "g", "Xào rau củ"),
            ("Phô mai Mozzarella", 80, "g", "Rải mặt nướng xém"), ("Muối biển", 3, "g", "Gia vị bánh")));

        list.Add(Build(43, "Bánh & Tráng Miệng", "Bánh tart trứng nướng phô mai vàng giòn",
            "Chiếc bánh tart nhỏ nhắn xinh xắn với lớp vỏ ngàn lớp giòn tan bọc lấy nhân kem trứng sữa phô mai mềm mịn núng nính.",
            20, 25, 4, "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Làm ấm sữa tươi không đường với đường mía và bơ lạt cho tan hoàn toàn.\nBước 2: Đánh tan 2 quả trứng gà và 1 lòng đỏ, rót sữa bơ ấm vào khuấy nhẹ nhàng rồi lọc qua rây 2 lần.\nBước 3: Thêm phô mai Mozzarella cắt nhỏ vào từng khuôn vỏ tart rồi rót hỗn hợp kem trứng sữa ngập 8/10 khuôn.\nBước 4: Nướng bánh ở 200 độ C trong 20-25 phút cho đến khi nhân đông mềm và xém vàng mặt caramen đặc trưng.",
            ("Trứng gà tươi", 2, "quả", "Nhân kem tart"), ("Lòng đỏ trứng gà", 1, "quả", "Tạo màu vàng ruộm"),
            ("Sữa tươi không đường", 150, "ml", "Nấu kem trứng"), ("Bơ lạt", 20, "g", "Hòa cùng sữa"),
            ("Đường mía", 40, "g", "Tạo vị ngọt"), ("Phô mai Mozzarella", 50, "g", "Tan chảy giữa nhân")));

        list.Add(Build(44, "Gỏi & Salad", "Salad Nga chay trứng luộc sốt mayonnaise kem sữa",
            "Món salad kinh điển thanh lịch với khoai tây, cà rốt, bắp ngọt luộc chín tới, trộn sốt mayonnaise kem sữa béo mịn.",
            15, 15, 3, "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Khoai tây, cà rốt gọt vỏ cắt hạt lựu, luộc chín mềm cùng bắp ngọt rồi ngâm nước đá cho giòn.\nBước 2: Trứng gà luộc chín kỹ, bóc vỏ thái hạt lựu vuông vức.\nBước 3: Pha sốt trộn: đánh tan lòng đỏ trứng luộc với dầu ô liu, sữa chua không đường và chút sữa tươi tạo sốt kem mayonnaise béo mượt.\nBước 4: Trộn đều các loại củ quả với sốt kem trứng sữa, nêm chút muối tiêu rồi để lạnh 30 phút trước khi thưởng thức.",
            ("Khoai tây", 200, "g", "Cắt hạt lựu luộc"), ("Cà rốt", 100, "g", "Cắt hạt lựu luộc"),
            ("Bắp ngọt", 80, "g", "Tách hạt luộc"), ("Trứng gà tươi", 2, "quả", "Luộc cắt hạt lựu"),
            ("Sữa chua không đường", 60, "g", "Làm sốt salad"), ("Sữa tươi không đường", 30, "ml", "Làm loãng sốt mượt"),
            ("Dầu ô liu", 15, "g", "Nhũ hóa sốt"), ("Muối biển", 2, "g", "Nêm sốt"), ("Tiêu đen xay", 2, "g", "Tiêu xay")));

        list.Add(Build(45, "Món Cuốn & Chiên Giòn", "Trứng cuộn phô mai tan chảy kiểu Nhật",
            "Trứng cuộn vàng ruộm nhiều lớp mềm mượt, cắn ngập miệng cảm nhận phô mai Mozzarella bơ sữa tan chảy nóng hổi.",
            10, 10, 2, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Đánh tan 3 quả trứng gà với 30ml sữa tươi không đường, chút muối và đường mía.\nBước 2: Quét bơ lạt lên chảo chống dính nóng, đổ một lớp trứng mỏng tráng đều.\nBước 3: Xếp phô mai Mozzarella cắt thanh vào giữa, khi trứng vừa đông thì cuộn tròn bọc kín phô mai.\nBước 4: Tiếp tục thoa bơ, đổ các lớp trứng tiếp theo cuộn chồng lên nhau. Cắt khoanh tròn khi phô mai đang tan chảy kéo sợi.",
            ("Trứng gà tươi", 3, "quả", "Đánh đều tráng cuộn"), ("Sữa tươi không đường", 30, "ml", "Tạo trứng mềm xốp"),
            ("Phô mai Mozzarella", 80, "g", "Lõi cuộn tan chảy"), ("Bơ lạt", 15, "g", "Thoa chảo thơm lừng"),
            ("Muối biển", 2, "g", "Nêm vị"), ("Đường mía", 4, "g", "Vị ngọt thanh")));

        list.Add(Build(46, "Bánh & Tráng Miệng", "Bánh su kem vani trứng sữa tươi",
            "Vỏ bánh su vàng ruộm phồng xốp rỗng ruột, bơm ngập tràn nhân kem trứng custard sữa tươi béo ngọt thơm vani.",
            25, 30, 4, "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Đun bơ lạt với nước sôi, đổ bột mì vào khuấy thành khối dẻo rồi đập từng quả trứng gà vào đánh mịn làm vỏ bánh.\nBước 2: Bắt bột ra khay nướng ở 200 độ C trong 20 phút cho vỏ nở phồng vàng giòn.\nBước 3: Nấu nhân kem: đánh tan lòng đỏ trứng gà với đường mía, sữa tươi không đường và bột bắp, khuấy lửa nhỏ đến khi sốt kem đặc mịn.\nBước 4: Để kem nguội, rạch nhẹ đáy bánh su rồi bơm ngập nhân kem trứng sữa béo ngậy vào ruột bánh.",
            ("Trứng gà tươi", 3, "quả", "Vỏ bánh và nhân kem"), ("Lòng đỏ trứng gà", 1, "quả", "Nhân kem custard"),
            ("Sữa tươi không đường", 200, "ml", "Nấu nhân kem sữa"), ("Bơ lạt", 40, "g", "Nấu vỏ su"),
            ("Đường mía", 50, "g", "Độ ngọt kem"), ("Muối biển", 1, "g", "Dằn vị vỏ")));

        list.Add(Build(47, "Bánh & Tráng Miệng", "Bánh chuối nướng bơ trứng sữa nước cốt dừa",
            "Món bánh chuối nướng thơm nức cả gian bếp, ngọt dẻo tự nhiên của chuối sứ hòa quyện cùng bơ trứng sữa béo bùi.",
            20, 45, 4, "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Chuối sứ chín bóc vỏ, ướp với chút đường mía cho tươm mật.\nBước 2: Bánh mì xé nhỏ ngâm vào hỗn hợp sữa tươi không đường, nước cốt dừa, bơ lạt đun chảy và 2 quả trứng gà đánh tan.\nBước 3: Trộn 2/3 lượng chuối vào âu bánh mì ngấm sữa, trút vào khuôn nướng lót giấy nến.\nBước 4: Xếp phần chuối còn lại lên mặt bánh, nướng ở 175 độ C trong 45 phút đến khi mặt bánh se lại màu đỏ cánh gián bóng đẹp.",
            ("Chuối sứ", 400, "g", "Chuối chín ngọt tươm mật"), ("Bánh mì nguyên cám", 150, "g", "Xé nhỏ ngấm sữa"),
            ("Trứng gà tươi", 2, "quả", "Kết dính bột bánh"), ("Sữa tươi không đường", 150, "ml", "Hòa cùng sữa"),
            ("Nước cốt dừa", 100, "ml", "Tạo vị béo dừa"), ("Bơ lạt", 30, "g", "Đun chảy thơm lừng"),
            ("Đường mía", 40, "g", "Ướp chuối ngọt")));

        list.Add(Build(48, "Bánh & Tráng Miệng", "Bánh muffin bơ trứng sữa phô mai",
            "Chiếc bánh muffin nở xòe xốp ẩm, đẫm vị béo bùi từ bơ lạt, trứng gà và những miếng phô mai mặn mà thơm phức.",
            15, 25, 4, "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Đánh tan bơ lạt ấm cùng đường mía và 2 quả trứng gà đến khi hỗn hợp hòa quyện mịn màng.\nBước 2: Rây bột mì và chút muối biển vào âu, đổ sữa tươi không đường vào trộn nhẹ tay thành hỗn hợp sệt.\nBước 3: Thêm phô mai Mozzarella cắt hạt lựu nhỏ vào đảo đều.\nBước 4: Chia bột vào từng cup giấy nướng ở 180 độ C trong 20-25 phút đến khi bánh nở phồng vàng rực rỡ.",
            ("Trứng gà tươi", 2, "quả", "Nở phồng bánh"), ("Sữa tươi không đường", 100, "ml", "Tạo độ ẩm mềm"),
            ("Bơ lạt", 50, "g", "Đánh bông cốt bánh"), ("Phô mai Mozzarella", 60, "g", "Hạt lựu nhân phô mai"),
            ("Đường mía", 40, "g", "Ngọt dịu"), ("Muối biển", 2, "g", "Cân bằng vị")));

        list.Add(Build(49, "Canh & Súp", "Súp kem nấm trứng sữa kiểu Âu",
            "Món súp kem nấm thượng hạng sánh mượt thơm ngát, kết hợp nấm tươi xào bơ, lòng đỏ trứng béo mịn và sữa tươi nguyên kem.",
            15, 20, 3, "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Nấm rơm và nấm đùi gà thái hạt lựu xào chín thơm với bơ lạt và tiêu đen.\nBước 2: Nấu nước dùng từ bắp ngọt đun sôi, đổ sữa tươi không đường và kem tươi whipping cream vào khuấy đều.\nBước 3: Đánh tan 1 lòng đỏ trứng gà với chút súp ấm rồi đổ từ từ vào nồi khuấy đều tay tạo độ sánh mịn như lụa.\nBước 4: Nêm muối biển và hạt nêm nấm vừa miệng, múc súp ra bát sâu lòng, rắc tiêu xay và thưởng thức cùng bánh mì giòn.",
            ("Nấm đùi gà", 150, "g", "Thái hạt lựu"), ("Nấm rơm", 100, "g", "Thái hạt lựu"),
            ("Bơ lạt", 20, "g", "Xào nấm"), ("Lòng đỏ trứng gà", 1, "quả", "Làm sốt súp sánh mịn"),
            ("Sữa tươi không đường", 150, "ml", "Hòa cùng súp"), ("Kem tươi Whipping Cream", 50, "ml", "Tạo độ béo mịn"),
            ("Muối biển", 3, "g", "Nêm súp"), ("Tiêu đen xay", 2, "g", "Tiêu thơm")));

        list.Add(Build(50, "Bánh & Tráng Miệng", "Bánh bông lan nướng bơ trứng sữa phô mai",
            "Chiếc bánh bông lan nướng xốp nhẹ như mây, thơm lừng bơ sữa trứng gà và lớp sốt phô mai chảy béo ngậy ngọt ngào.",
            20, 35, 4, "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&auto=format&fit=crop&q=80",
            "Bước 1: Tách lòng trắng và lòng đỏ 3 quả trứng gà. Đánh bông cứng lòng trắng trứng với đường mía.\nBước 2: Lòng đỏ trứng đánh tan cùng sữa tươi không đường, bơ lạt đun chảy rồi trộn đều nhẹ tay với bột mì rây mịn.\nBước 3: Trộn 1/3 lòng trắng trứng vào lòng đỏ bằng kỹ thuật fold nhẹ nhàng rồi trút ngược lại âu lòng trắng, đảo đều nhẹ tay.\nBước 4: Nướng bánh ở 160 độ C trong 35 phút. Khi bánh chín nở vàng, rưới sốt phô mai nấu chảy từ sữa tươi và phô mai lên trên.",
            ("Trứng gà tươi", 3, "quả", "Đánh bông cốt bánh"), ("Sữa tươi không đường", 120, "ml", "Cốt bánh và sốt phô mai"),
            ("Bơ lạt", 30, "g", "Đun chảy thơm"), ("Phô mai Mozzarella", 50, "g", "Nấu sốt phô mai chảy"),
            ("Đường mía", 50, "g", "Đánh bông lòng trắng"), ("Muối biển", 1, "g", "Dằn vị bánh")));

        return list;
    }

    private static List<Restaurant> CreateRestaurants()
    {
        var list = new List<Restaurant>();

        Restaurant Build(int id, string name, string desc, string address, string district,
            decimal lat, decimal lng, string phone, string hours, int priceFrom, int priceTo, string img,
            DietaryType[] diets, string[] amenities)
        {
            var rest = new Restaurant
            {
                Id = Id("44444444", id),
                Name = name,
                Description = desc,
                Address = address,
                District = district,
                Latitude = lat,
                Longitude = lng,
                ContactPhone = phone,
                OpeningHours = hours,
                PriceFromVnd = priceFrom,
                PriceToVnd = priceTo,
                ImageUrl = img,
                IsActive = true,
                CreatedAt = BaseTime
            };

            foreach (var d in diets)
            {
                rest.DietaryTypes.Add(new RestaurantDietaryType
                {
                    RestaurantId = rest.Id,
                    DietaryType = d
                });
            }

            int amIdx = 0;
            foreach (var a in amenities)
            {
                rest.Amenities.Add(new RestaurantAmenity
                {
                    Id = Id($"4444{id:D4}", ++amIdx),
                    RestaurantId = rest.Id,
                    Name = a
                });
            }

            return rest;
        }

        // 1. Thuần chay (Vegan)
        list.Add(Build(1, "Nhà Hàng Chay Giác Ngộ",
            "Không gian thanh tịnh ấm cúng, chuyên phục vụ các món thuần chay (Vegan) từ nấm tươi và rau củ quả hữu cơ thanh đạm.",
            "213 Hùng Vương, Phường 9, Quận 5", "Quận 5, TP.HCM",
            10.7588m, 106.6695m, "028 3834 5678", "08:00 - 21:30 hằng ngày",
            40000, 150000, "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80",
            [DietaryType.Vegan],
            ["Wi-Fi miễn phí", "Máy lạnh", "Chỗ đỗ xe máy & ô tô", "Phòng riêng yên tĩnh", "Thanh toán thẻ/QR"]));

        // 2. Chay có sữa & Thuần chay
        list.Add(Build(2, "Bếp Xanh An Duyên",
            "Ẩm thực chay Chợ Lớn kết hợp sáng tạo giữa thuần chay và các món đút lò bơ sữa phong cách Á - Âu thanh nhã.",
            "10 Nguyễn Tri Phương, Phường 6, Quận 5", "Quận 5, TP.HCM",
            10.7545m, 106.6680m, "028 2212 9978", "10:00 - 21:00 hằng ngày",
            50000, 180000, "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&auto=format&fit=crop&q=80",
            [DietaryType.Vegan, DietaryType.LactoVegetarian],
            ["Wi-Fi", "Máy lạnh", "Giao hàng tận nơi", "Thanh toán không tiền mặt", "Không gian hoài cổ"]));

        // 3. Đầy đủ cả 4 loại ăn chay (Vegan, Lacto, Ovo, Lacto-Ovo)
        list.Add(Build(3, "Hum Vegetarian Lounge & Restaurant",
            "Đỉnh cao ẩm thực chay tại TP.HCM với không gian sân vườn thiền tịnh, nguyên liệu chọn lọc đa dạng mọi trường phái chay.",
            "32 Võ Văn Tần, Phường Võ Thị Sáu, Quận 3", "Quận 3, TP.HCM",
            10.7766m, 106.6917m, "089 918 9229", "10:00 - 22:00 hằng ngày",
            90000, 350000, "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
            [DietaryType.Vegan, DietaryType.LactoVegetarian, DietaryType.OvoVegetarian, DietaryType.LactoOvoVegetarian],
            ["Sân vườn thư giãn", "Cocktail & Mocktail Bar", "Đặt bàn trước", "Khu vực VIP", "Bãi đỗ ô tô"]));

        // 4. Vegan & Lacto
        list.Add(Build(4, "Pi Vegetarian Bistro",
            "Nhà hàng chay phong cách Bistro mộc mạc, nổi tiếng với các món gỏi nấm, cơm gạo lứt và súp kem bơ thực vật thơm ngon.",
            "19 Võ Văn Tần, Phường 6, Quận 3", "Quận 3, TP.HCM",
            10.7782m, 106.6931m, "093 855 0567", "10:00 - 21:30 hằng ngày",
            60000, 200000, "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
            [DietaryType.Vegan, DietaryType.LactoVegetarian],
            ["Không gian ban công thoáng đãng", "Máy lạnh", "Thực đơn đa ngôn ngữ", "Thanh toán thẻ"]));

        // 5. Lacto-Vegetarian & Vegan
        list.Add(Build(5, "Kashew Cheese Deli",
            "Thiên đường cho người ăn chay yêu phô mai thực vật và sữa hạt, nổi tiếng với bánh mì kẹp phô mai lên men thủ công.",
            "14 Trần Ngọc Diện, Thảo Điền", "Thủ Đức, TP.HCM",
            10.8042m, 106.7328m, "079 661 2608", "09:00 - 20:00 (Thứ Ba - Chủ Nhật)",
            75000, 250000, "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80",
            [DietaryType.Vegan, DietaryType.LactoVegetarian],
            ["Phô mai lên men thủ công", "Không gian ngoài trời", "Thú cưng thân thiện", "Cà phê specialty"]));

        // 6. Đầy đủ 4 loại
        list.Add(Build(6, "Ưu Đàm Chay Hà Nội",
            "Biểu tượng ẩm thực chay Thủ đô với kiến trúc Phật giáo tinh tế, phục vụ thực đơn phong phú từ thuần chay đến chay trứng sữa.",
            "34 Hàng Bài, Hoàn Kiếm", "Hoàn Kiếm, Hà Nội",
            21.0223m, 105.8524m, "098 134 9898", "09:00 - 22:00 hằng ngày",
            80000, 300000, "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&auto=format&fit=crop&q=80",
            [DietaryType.Vegan, DietaryType.LactoVegetarian, DietaryType.OvoVegetarian, DietaryType.LactoOvoVegetarian],
            ["Kiến trúc Phật giáo độc đáo", "Phòng tiệc sang trọng", "Trà đạo", "Bãi xe ô tô", "Đặt tiệc sinh nhật/sự kiện"]));

        // 7. Vegan & Ovo-Vegetarian
        list.Add(Build(7, "Veggie Castle - Nhà Hàng Chay Buffet",
            "Buffet chay đa dạng đổi món mỗi ngày, có góc món trứng cuốn, cơm chiên hoàng bào và các món canh nấm thơm ngon.",
            "7 Yên Ninh, Ba Đình", "Ba Đình, Hà Nội",
            21.0421m, 105.8425m, "096 854 2862", "11:00 - 14:00 & 18:00 - 21:00",
            90000, 120000, "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
            [DietaryType.Vegan, DietaryType.OvoVegetarian],
            ["Buffet ăn thả ga", "Máy lạnh", "Tráng miệng miễn phí", "Không gian trẻ trung"]));

        // 8. Đầy đủ 4 loại
        list.Add(Build(8, "Sadhu Vegetarian Restaurant",
            "Thưởng thức buffet chay tại bàn với tinh hoa ẩm thực chay dưỡng sinh, phù hợp cho mọi lứa tuổi và chế độ ăn chay.",
            "87 Lý Thường Kiệt, Hoàn Kiếm", "Hoàn Kiếm, Hà Nội",
            21.0258m, 105.8456m, "098 199 5533", "10:30 - 22:00 hằng ngày",
            120000, 290000, "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
            [DietaryType.Vegan, DietaryType.LactoVegetarian, DietaryType.OvoVegetarian, DietaryType.LactoOvoVegetarian],
            ["Buffet phục vụ tại bàn", "Không gian trầm ấm", "Khu vui chơi trẻ em", "Đỗ xe thuận tiện"]));

        // 9. Vegan & Lacto
        list.Add(Build(9, "Quán Chay An Lạc Tâm Đà Nẵng",
            "Địa chỉ chay nổi tiếng miền Trung với các món bún bò chay, mì Quảng chay và các loại sữa hạt nguyên chất thơm bùi.",
            "117 Phan Đăng Lưu, Hải Châu", "Hải Châu, Đà Nẵng",
            16.0468m, 108.2185m, "093 543 5678", "06:30 - 21:00 hằng ngày",
            30000, 90000, "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80",
            [DietaryType.Vegan, DietaryType.LactoVegetarian],
            ["Đặc sản chay xứ Quảng", "Bình dân sạch sẽ", "Chỗ đỗ xe máy rộng", "Phục vụ nhanh nhẹn"]));

        // 10. Vegan & Lacto-Ovo
        list.Add(Build(10, "Karma Vegan Kitchen Đà Nẵng",
            "Nhà hàng chay phong cách phương Tây ven biển Mỹ Khê, thực đơn phong phú với burger chay, pizza phô mai và salad trứng sữa.",
            "45 An Thượng 2, Ngũ Hành Sơn", "Ngũ Hành Sơn, Đà Nẵng",
            16.0520m, 108.2440m, "090 512 3456", "08:30 - 21:30 hằng ngày",
            60000, 220000, "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&auto=format&fit=crop&q=80",
            [DietaryType.Vegan, DietaryType.LactoOvoVegetarian],
            ["Gần bãi biển Mỹ Khê", "Thực đơn tiếng Anh", "Pizza lò nướng", "Không gian xanh thoáng đãng"]));

        return list;
    }

    private static async Task SeedArticlesAsync(AppDbContext db, string authorId)
    {
        var articlesData = new (string Title, string Cat, DietaryType[] Diets, string Img, string Content)[]
        {
            ("Cẩm nang bắt đầu ăn thuần chay (Vegan) cho người mới", "Dinh dưỡng", [DietaryType.Vegan],
             "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop&q=80",
             "## Ăn thuần chay (Vegan) là gì?\n\nĂn thuần chay là lối sống và chế độ dinh dưỡng hoàn toàn dựa trên thực vật, loại bỏ thịt, cá, gia cầm, trứng, sữa, mật ong và mọi phụ phẩm từ động vật.\n\n### Lợi ích tuyệt vời của thuần chay:\n- **Tốt cho tim mạch**: Giảm cholesterol xấu và huyết áp.\n- **Kiểm soát cân nặng**: Hàm lượng chất xơ dồi dào giúp no lâu.\n- **Bảo vệ môi trường**: Giảm thiểu khí thải nhà kính và dấu chân sinh thái.\n\n### Lưu ý quan trọng:\nNgười ăn thuần chay cần bổ sung Vitamin B12, Kẽm, Omega-3 từ hạt chia/hạt lanh và đa dạng hóa các loại đậu để đủ axit amin thiết yếu."),

            ("Bí quyết cân bằng dinh dưỡng và bổ sung Vitamin B12 trong chế độ thuần chay", "Sức khỏe", [DietaryType.Vegan],
             "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop&q=80",
             "## Vitamin B12 và người ăn chay trường\n\nVitamin B12 đóng vai trò then chốt trong quá trình hình thành tế bào máu và bảo vệ hệ thần kinh.\n\n### Nguồn bổ sung B12 an toàn:\n1. **Men dinh dưỡng (Nutritional Yeast)**: Có vị phô mai thơm ngon, rắc trực tiếp vào món ăn.\n2. **Sữa hạt tăng cường**: Các loại sữa đậu nành, sữa yến mạch có bổ sung vi chất.\n3. **Thực phẩm chức năng B12**: Dạng ngậm hoặc uống định kỳ theo chỉ dẫn chuyên gia.\n\nĐừng quên xét nghiệm máu định kỳ 6 tháng/lần để theo dõi nồng độ B12 và Ferritin trong cơ thể!"),

            ("Chế độ ăn chay có sữa (Lacto-Vegetarian): Lợi ích và cách bổ sung Canxi tự nhiên", "Dinh dưỡng", [DietaryType.LactoVegetarian],
             "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80",
             "## Giới thiệu về chế độ Lacto-Vegetarian\n\nLacto-Vegetarian là chế độ ăn chay bao gồm các sản phẩm từ sữa (sữa tươi, bơ, phô mai, sữa chua) nhưng kiêng hoàn toàn trứng, thịt và hải sản.\n\n### Điểm mạnh dinh dưỡng:\n- **Nguồn Canxi dồi dào**: Sữa và sữa chua giúp xương và răng chắc khỏe.\n- **Hệ tiêu hóa khỏe mạnh**: Men vi sinh Probiotics trong sữa chua cải thiện hệ vi sinh đường ruột.\n- **Dễ áp dụng**: Phù hợp cho người muốn ăn chay nhưng chưa sẵn sàng từ bỏ vị béo ngậy của các món kem bơ."),

            ("Cách kết hợp phô mai và sữa chua trong ẩm thực chay Địa Trung Hải", "Ẩm thực", [DietaryType.LactoVegetarian],
             "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80",
             "## Sự tinh tế của ẩm thực chay Địa Trung Hải\n\nChế độ ăn Địa Trung Hải kết hợp sữa chua Hy Lạp, phô mai Mozzarella, dầu ô liu nguyên chất và thảo mộc tươi tạo nên những món ăn bùng nổ hương vị.\n\n### Gợi ý bữa ăn lý tưởng:\n- **Bữa sáng**: Sữa chua Hy Lạp kèm hạt chia, chuối và quả mọng.\n- **Bữa trưa**: Salad cà chua dưa leo rưới sốt dầu ô liu và phô mai nướng xém.\n- **Bữa tối**: Mì Ý sốt kem nấm bơ tỏi thơm lừng."),

            ("Ăn chay có trứng (Ovo-Vegetarian): Nguồn đạm dồi dào cho người tập thể thao", "Thể thao", [DietaryType.OvoVegetarian],
             "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&auto=format&fit=crop&q=80",
             "## Sức mạnh từ trứng cho người ăn chay tập gym\n\nTrứng gà là một trong những nguồn protein sinh học hoàn hảo nhất hành tinh với điểm số hấp thu gần như tuyệt đối (BV = 100).\n\n### Tại sao Ovo-Vegetarian phù hợp gymer?\n- Mỗi quả trứng cung cấp khoảng 6.3g protein chất lượng cao cùng đủ 9 axit amin thiết yếu.\n- Lòng đỏ trứng giàu Choline tốt cho não bộ và Lutein bảo vệ thị lực.\n- Dễ chế biến nhanh gọn: trứng luộc, trứng cuộn, trứng ốp la lòng đào sau buổi tập."),

            ("Lợi ích sức khỏe và những lưu ý khi áp dụng chế độ chay Ovo-Vegetarian", "Sức khỏe", [DietaryType.OvoVegetarian],
             "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80",
             "## Lưu ý quan trọng cho người ăn chay có trứng\n\nChế độ ăn Ovo-Vegetarian giúp bạn không bị thiếu hụt protein, nhưng cần chú ý:\n\n1. **Chọn trứng có nguồn gốc rõ ràng**: Ưu tiên trứng gà hữu cơ (cage-free).\n2. **Cân bằng lượng Cholesterol**: Nếu có tiền sử mỡ máu cao, hãy kết hợp lòng trắng trứng với nấm và rau xanh.\n3. **Đa dạng rau củ**: Đừng chỉ dựa vào trứng, hãy ăn thêm các loại cải xoăn, bí đỏ, hạt chia để đủ chất xơ."),

            ("Chế độ chay Lacto-Ovo: Sự lựa chọn linh hoạt và bền vững cho cả gia đình", "Lối sống", [DietaryType.LactoOvoVegetarian],
             "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop&q=80",
             "## Tại sao Lacto-Ovo là trường phái ăn chay phổ biến nhất thế giới?\n\nLacto-Ovo Vegetarian cho phép sử dụng cả trứng và các sản phẩm từ sữa. Đây là cầu nối hoàn hảo giữa ẩm thực truyền thống và lối sống xanh.\n\n### Ưu điểm vượt trội:\n- Không lo thiếu đạm, canxi hay vitamin B12.\n- Dễ dàng đi ăn ngoài cùng bạn bè hoặc chuẩn bị mâm cơm gia đình.\n- Thực đơn tráng miệng phong phú: bánh flan, bánh kếp, bánh kem chay thơm ngon."),

            ("5 món ăn chay đủ chất và giàu năng lượng từ trứng và sữa cho bữa sáng bận rộn", "Ẩm thực", [DietaryType.LactoOvoVegetarian],
             "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&auto=format&fit=crop&q=80",
             "## Khởi đầu ngày mới tràn đầy sức sống\n\nBữa sáng là bữa ăn quan trọng nhất. Dưới đây là 5 công thức nhanh dưới 15 phút:\n\n1. **Bánh kếp chuối trứng sữa**: Xốp mềm, thơm lừng mật ong tự nhiên.\n2. **Bánh mì kẹp trứng phô mai**: Giòn tan, béo ngậy kéo sợi.\n3. **Trứng cuộn phô mai kiểu Nhật**: Vàng ươm đẹp mắt.\n4. **Súp kem nấm trứng sữa**: Ấm áp cho ngày mưa se lạnh.\n5. **Salad Nga trứng luộc kem sữa**: Giòn mát, giàu vitamin."),

            ("So sánh 4 trường phái ăn chay phổ biến: Nên chọn chế độ nào phù hợp với thể trạng?", "Kiến thức", [DietaryType.Vegan, DietaryType.LactoVegetarian, DietaryType.OvoVegetarian, DietaryType.LactoOvoVegetarian],
             "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop&q=80",
             "## Bảng so sánh 4 chế độ ăn chay:\n\n| Chế độ | Thịt/Cá | Trứng | Sữa/Bơ | Mật ong |\n|---|---|---|---|---|\n| **Vegan** | Không | Không | Không | Không |\n| **Lacto** | Không | Không | CÓ | Tùy chọn |\n| **Ovo** | Không | CÓ | Không | Tùy chọn |\n| **Lacto-Ovo** | Không | CÓ | CÓ | Tùy chọn |\n\n### Lời khuyên lựa chọn:\nHãy lắng nghe cơ thể. Bạn hoàn toàn có thể bắt đầu từ Lacto-Ovo rồi dần dần chuyển sang Thuần chay (Vegan) khi cơ thể đã thích nghi hoàn toàn!"),

            ("Mẹo đi chợ và bảo quản thực phẩm chay luôn tươi ngon suốt cả tuần", "Mẹo vặt", [DietaryType.Vegan, DietaryType.LactoVegetarian, DietaryType.OvoVegetarian, DietaryType.LactoOvoVegetarian],
             "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80",
             "## Bí quyết đi chợ thông minh cho người ăn chay\n\n- **Rau ăn lá**: Nhặt sạch lá hỏng, bọc khăn giấy ẩm và bảo quản hộp kín trong ngăn mát tủ lạnh.\n- **Nấm tươi**: Không rửa trước khi cất, bọc trong túi giấy nâu để tránh nấm bị nhớt.\n- **Đậu hũ**: Ngâm ngập trong nước sạch có chút muối, thay nước mỗi ngày có thể giữ tươi đến 5-7 ngày.\n- **Trứng & Sữa**: Luôn để ở ngăn giữa tủ lạnh nơi nhiệt độ ổn định nhất.")
        };

        for (int i = 0; i < articlesData.Length; i++)
        {
            var data = articlesData[i];
            var article = new Article(authorId, data.Title, data.Content, data.Cat, data.Img, data.Diets, BaseTime);

            var submission = ModerationSubmission.Submit(article.Id, 1, ModeratedContentType.Article, authorId, data.Title, data.Content, data.Img, BaseTime);
            submission.RecordAiResult(AiFlagStatus.Passed, "Nội dung phù hợp, tuân thủ tiêu chuẩn cộng đồng.", "Toàn bộ bài viết", null, BaseTime);
            submission.Decide(ModerationDecisionType.Approve, authorId, "Bài viết đạt chất lượng xuất sắc, duyệt xuất bản.", BaseTime);

            article.LinkSubmission(submission, BaseTime);

            db.ModerationSubmissions.Add(submission);
            db.Articles.Add(article);
        }

        await db.SaveChangesAsync();
    }

    private static async Task SeedVideosAsync(AppDbContext db, string authorId, Guid defaultCatId)
    {
        var videosData = new (string Title, string Desc, string Thumb, string Media)[]
        {
            ("Hướng dẫn làm Đậu hũ sốt cà chua thơm ngon đậm đà tại nhà",
             "Công thức nấu món đậu hũ sốt cà chua truyền thống, đậu chiên vàng giòn thấm đẫm sốt cà chua đỏ tươi bắt cơm.",
             "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80", "https://assets.mixkit.co/videos/preview/mixkit-cooking-a-fresh-salad-41481-large.mp4"),

            ("Nấu canh chua chay Nam Bộ thanh mát chuẩn vị mẹ nấu",
             "Bí quyết nấu canh chua chay với dứa, đậu bắp, cà chua và đậu hũ non thanh ngọt, chống ngấy hiệu quả.",
             "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop&q=80", "https://assets.mixkit.co/videos/preview/mixkit-vegetables-in-a-pan-41484-large.mp4"),

            ("Công thức nấm đùi gà kho tiêu xanh thơm lừng đưa cơm",
             "Nấm đùi gà dai giòn sần sật kho tộ tiêu xanh cay nồng đậm đà, món ngon thuần chay không thể bỏ lỡ.",
             "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80", "https://assets.mixkit.co/videos/preview/mixkit-serving-food-from-a-pan-41485-large.mp4"),

            ("Cách làm súp bí đỏ kem tươi béo ngậy chuẩn phong cách Pháp",
             "Món súp bí đỏ sánh mịn thơm phức mùi bơ lạt và kem sữa tươi whipping cream cao cấp cho bữa tiệc chay.",
             "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=800&auto=format&fit=crop&q=80", "https://assets.mixkit.co/videos/preview/mixkit-stirring-vegetable-soup-41486-large.mp4"),

            ("Mì Ý sốt kem nấm phô mai béo ngậy cực dễ làm trong 15 phút",
             "Từng sợi mì Ý dai ngon ngập tràn sốt kem bơ sữa và nấm đùi gà, rắc phô mai Parmesan bào mịn thơm lừng.",
             "https://images.unsplash.com/photo-1621996346565-e3d5d6281788?w=800&auto=format&fit=crop&q=80", "https://assets.mixkit.co/videos/preview/mixkit-tossing-pasta-in-a-pan-41487-large.mp4"),

            ("Khổ qua xào trứng gà không bị đắng - Mẹo đơn giản ai cũng làm được",
             "Mẹo ngâm nước đá giúp khổ qua giòn ngọt không hề bị đắng, xào quyện cùng trứng gà bồng bềnh thơm béo.",
             "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80", "https://assets.mixkit.co/videos/preview/mixkit-chopping-vegetables-on-a-board-41482-large.mp4"),

            ("Bí quyết làm trứng cuộn rong biển vàng ươm đẹp mắt cho bé",
             "Món trứng cuộn Tamagoyaki thơm ngọt mềm mại cuộn cùng lá rong biển giòn dai, rắc mè rang thơm bùi bổ dưỡng.",
             "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80", "https://assets.mixkit.co/videos/preview/mixkit-frying-food-in-a-pan-41483-large.mp4"),

            ("Làm bánh kếp chuối trứng sữa thơm lừng cho bữa sáng tràn đầy năng lượng",
             "Bánh pancake chuối mềm xốp, thơm mùi bơ lạt trứng sữa hảo hạng, giải pháp bữa sáng nhanh gọn 10 phút.",
             "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&auto=format&fit=crop&q=80", "https://assets.mixkit.co/videos/preview/mixkit-pouring-batter-in-a-pan-41488-large.mp4"),

            ("Mì Ý Carbonara sốt trứng phô mai béo ngậy chuẩn vị Ý",
             "Bí quyết làm sốt Carbonara mượt mà từ lòng đỏ trứng gà tươi và phô mai Parmesan không bị vón cục.",
             "https://images.unsplash.com/photo-1621996346565-e3d5d6281788?w=800&auto=format&fit=crop&q=80", "https://assets.mixkit.co/videos/preview/mixkit-cooking-a-fresh-salad-41481-large.mp4"),

            ("Tổng hợp 4 công thức bữa sáng chay nhanh gọn cho người bận rộn",
             "Gợi ý 4 món chay giàu năng lượng: bánh mì bơ phô mai, trứng cuộn, sinh tố bơ chuối và yến mạch sữa hạt.",
             "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop&q=80", "https://assets.mixkit.co/videos/preview/mixkit-serving-food-from-a-pan-41485-large.mp4")
        };

        for (int i = 0; i < videosData.Length; i++)
        {
            var data = videosData[i];
            var video = Video.Create(authorId, data.Title, data.Desc, defaultCatId);
            video.SetMedia(data.Media);
            video.SetThumbnail(data.Thumb);

            var submission = ModerationSubmission.Submit(video.Id, 1, ModeratedContentType.Video, authorId, data.Title, data.Desc, data.Media, BaseTime);
            submission.Decide(ModerationDecisionType.Approve, authorId, "Video chất lượng cao, hình ảnh rõ nét.", BaseTime);

            video.Publish(submission.Id);

            db.ModerationSubmissions.Add(submission);
            db.Videos.Add(video);
        }

        await db.SaveChangesAsync();
    }
}
