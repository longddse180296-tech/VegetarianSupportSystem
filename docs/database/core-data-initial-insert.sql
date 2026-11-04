-- =========================================================================================
-- Chức năng: Kịch bản SQL khởi tạo dữ liệu gốc (Core Data) cho hệ thống Vegetarian Support
-- Phạm vi bảng: Categories, Ingredients, Recipes, RecipeIngredients,
--               Restaurants, RestaurantDietaryTypes, RestaurantAmenities, RestaurantFeaturedDishes
-- Mục đích: Nhập bộ dữ liệu ẩm thực chay Việt Nam tự nhiên, dinh dưỡng đối chiếu theo
--           Bảng thành phần thực phẩm Việt Nam (Viện Dinh dưỡng Quốc gia) và USDA FoodData Central.
-- Lưu ý:
--   1. Dành cho cơ sở dữ liệu mới khởi tạo (trống) sau khi chạy `dotnet ef database update`.
--   2. Chỉ số dinh dưỡng mỗi khẩu phần trong bảng Recipes khớp tuyệt đối với công thức quy đổi
--      của RecipeNutritionService và RecipeNutritionRules (làm tròn 3 chữ số thập phân).
--   3. Tọa độ nhà hàng đã đối chiếu thực tế, tương thích bộ lọc Haversine và tìm kiếm địa phương.
-- =========================================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;

DECLARE @Now DATETIMEOFFSET = SYSDATETIMEOFFSET();

-- =========================================================================================
-- 1. DANH MỤC MÓN ĂN (Categories)
-- =========================================================================================
INSERT INTO [dbo].[Categories] ([Id], [Name], [Description], [IsActive], [CreatedAt], [UpdatedAt])
VALUES
    ('10000000-0000-0000-0000-000000000001', N'Món chính & Cơm thực dưỡng', N'Các món cơm gạo lứt, hạt sen và món mặn chủ đạo giàu đạm thực vật cho bữa trưa và bữa tối.', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000002', N'Bún, Phở & Mì nước', N'Các món nước truyền thống nấu từ nước dùng rau củ ngọt thanh tự nhiên, kèm đậu hũ và nấm tươi.', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000003', N'Canh & Súp dưỡng sinh', N'Canh hầm rau củ, hạt sen và các loại súp kem hạt béo mịn giúp cân bằng dinh dưỡng và dễ tiêu hóa.', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000004', N'Gỏi & Salad thanh mát', N'Rau xanh tươi trộn cùng các loại đậu, quả bơ, hạt dinh dưỡng và nước sốt dầu ép lạnh.', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000005', N'Món kho & Xào truyền thống', N'Các món nấm, đậu hũ, tàu hũ ky kho tộ đậm đà hoặc xào nhanh giữ trọn độ giòn ngọt của rau củ.', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000006', N'Điểm tâm & Bữa sáng nhanh', N'Yến mạch, bánh mì nguyên cám và các món ăn sáng gọn nhẹ cung cấp năng lượng bền bỉ cho ngày mới.', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000007', N'Tráng miệng & Món ăn nhẹ', N'Chè dưỡng nhan ít ngọt, khoai nướng và các món ăn phụ lành mạnh giữa giờ.', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000008', N'Thức uống & Sinh tố hạt', N'Sữa hạt tự nhiên và sinh tố trái cây tươi kết hợp hạt dinh dưỡng không dùng đường tinh luyện.', 1, @Now, NULL);

-- =========================================================================================
-- 2. NGUYÊN LIỆU & THÔNG TIN DINH DƯỠNG (Ingredients)
-- Quy ước Origin: 1 = Thực vật (Plant), 2 = Động vật/Phái sinh (Animal), 0 = Chưa xác định
-- Quy ước NutritionBasisUnit: N'g', N'kg', N'ml', N'đơn vị'
-- =========================================================================================
INSERT INTO [dbo].[Ingredients] (
    [Id], [Name], [Aliases], [Origin],
    [ContainsEgg], [ContainsMilk], [ContainsHoney], [ContainsOtherAnimalProducts],
    [Allergens], [DefaultUnit],
    [CaloriesPer100Gram], [ProteinGramPer100Gram], [CarbohydrateGramPer100Gram], [FatGramPer100Gram],
    [NutritionBasisQuantity], [NutritionBasisUnit],
    [Source], [IsActive], [CreatedAt], [UpdatedAt]
)
VALUES
    -- Nhóm chế phẩm đậu nành & ngũ cốc
    ('10000000-0000-0000-0000-000000000101', N'Đậu hũ trắng', N'đậu phụ;đậu hũ non;tofu', 1, 0, 0, 0, 0, N'Đậu nành;Soy', N'g', 82.000, 8.800, 1.900, 4.600, 100.000, N'g', N'Bảng thành phần thực phẩm Việt Nam - Viện Dinh dưỡng Quốc gia', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000102', N'Tàu hũ ky tươi', N'phù trúc;váng đậu tươi;tofu skin', 1, 0, 0, 0, 0, N'Đậu nành;Soy', N'g', 215.000, 21.500, 6.200, 11.800, 100.000, N'g', N'Bảng thành phần thực phẩm Việt Nam - Viện Dinh dưỡng Quốc gia', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000103', N'Gạo lứt đỏ', N'gạo lứt huyết rồng;gạo nguyên cám;brown rice', 1, 0, 0, 0, 0, NULL, N'g', 362.000, 7.500, 76.200, 2.700, 100.000, N'g', N'Bảng thành phần thực phẩm Việt Nam - Viện Dinh dưỡng Quốc gia', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000104', N'Bún gạo tươi', N'bún tươi;sợi bún gạo;fresh rice vermicelli', 1, 0, 0, 0, 0, NULL, N'g', 110.000, 1.800, 25.400, 0.200, 100.000, N'g', N'Bảng thành phần thực phẩm Việt Nam - Viện Dinh dưỡng Quốc gia', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000105', N'Yến mạch cán dẹt', N'yến mạch;rolled oats;oatmeal', 1, 0, 0, 0, 0, N'Yến mạch;Gluten', N'g', 379.000, 13.200, 67.700, 6.500, 100.000, N'g', N'USDA FoodData Central', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000106', N'Bánh mì nguyên cám', N'bánh mì đen;bánh mì lúa mì nguyên cám;whole wheat bread', 1, 0, 0, 0, 0, N'Lúa mì;Wheat;Gluten', N'g', 252.000, 12.500, 42.800, 3.500, 100.000, N'g', N'USDA FoodData Central', 1, @Now, NULL),

    -- Nhóm nấm & các loại hạt đậu
    ('10000000-0000-0000-0000-000000000107', N'Nấm đùi gà', N'nấm bào ngư nhật;king oyster mushroom', 1, 0, 0, 0, 0, NULL, N'g', 35.000, 3.300, 6.100, 0.400, 100.000, N'g', N'USDA FoodData Central', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000108', N'Nấm đông cô tươi', N'nấm hương tươi;shiitake mushroom', 1, 0, 0, 0, 0, NULL, N'g', 34.000, 2.200, 6.800, 0.500, 100.000, N'g', N'Bảng thành phần thực phẩm Việt Nam - Viện Dinh dưỡng Quốc gia', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000109', N'Nấm rơm', N'nấm rơm tươi;straw mushroom', 1, 0, 0, 0, 0, NULL, N'g', 32.000, 3.800, 4.900, 0.300, 100.000, N'g', N'Bảng thành phần thực phẩm Việt Nam - Viện Dinh dưỡng Quốc gia', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000110', N'Hạt sen tươi', N'hạt sen Huế;lotus seeds', 1, 0, 0, 0, 0, NULL, N'g', 89.000, 4.100, 17.300, 0.500, 100.000, N'g', N'Bảng thành phần thực phẩm Việt Nam - Viện Dinh dưỡng Quốc gia', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000111', N'Đậu gà luộc chín', N'đậu gà;chickpeas;garbanzo beans', 1, 0, 0, 0, 0, NULL, N'g', 164.000, 8.900, 27.400, 2.600, 100.000, N'g', N'USDA FoodData Central', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000112', N'Đậu xanh cà vỏ', N'đỗ xanh;đậu xanh không vỏ;split mung beans', 1, 0, 0, 0, 0, NULL, N'g', 347.000, 23.900, 62.600, 1.200, 100.000, N'g', N'Bảng thành phần thực phẩm Việt Nam - Viện Dinh dưỡng Quốc gia', 1, @Now, NULL),

    -- Nhóm rau củ quả tươi
    ('10000000-0000-0000-0000-000000000113', N'Cà rốt', N'củ cà rốt;carrot', 1, 0, 0, 0, 0, NULL, N'g', 41.000, 0.900, 9.600, 0.200, 100.000, N'g', N'Bảng thành phần thực phẩm Việt Nam - Viện Dinh dưỡng Quốc gia', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000114', N'Củ cải trắng', N'củ cải đường;daikon;white radish', 1, 0, 0, 0, 0, NULL, N'g', 18.000, 0.600, 4.100, 0.100, 100.000, N'g', N'Bảng thành phần thực phẩm Việt Nam - Viện Dinh dưỡng Quốc gia', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000115', N'Bông cải xanh', N'súp lơ xanh;broccoli', 1, 0, 0, 0, 0, NULL, N'g', 34.000, 2.800, 6.600, 0.400, 100.000, N'g', N'Bảng thành phần thực phẩm Việt Nam - Viện Dinh dưỡng Quốc gia', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000116', N'Cải bó xôi', N'rau bina;rau chân vịt;spinach', 1, 0, 0, 0, 0, NULL, N'g', 23.000, 2.900, 3.600, 0.400, 100.000, N'g', N'USDA FoodData Central', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000117', N'Cà chua', N'cà chua chín;tomato', 1, 0, 0, 0, 0, NULL, N'g', 18.000, 0.900, 3.900, 0.200, 100.000, N'g', N'Bảng thành phần thực phẩm Việt Nam - Viện Dinh dưỡng Quốc gia', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000118', N'Dưa leo', N'dưa chuột;cucumber', 1, 0, 0, 0, 0, NULL, N'g', 15.000, 0.700, 3.600, 0.100, 100.000, N'g', N'Bảng thành phần thực phẩm Việt Nam - Viện Dinh dưỡng Quốc gia', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000119', N'Xà lách Romaine', N'rau xà lách;rau diếp;romaine lettuce', 1, 0, 0, 0, 0, NULL, N'g', 17.000, 1.200, 3.300, 0.300, 100.000, N'g', N'USDA FoodData Central', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000120', N'Bí đỏ hồ lô', N'bí ngô;bí đỏ;butternut squash;pumpkin', 1, 0, 0, 0, 0, NULL, N'g', 26.000, 1.000, 6.500, 0.100, 100.000, N'g', N'Bảng thành phần thực phẩm Việt Nam - Viện Dinh dưỡng Quốc gia', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000121', N'Khoai lang mật', N'khoai lang Đà Lạt;sweet potato', 1, 0, 0, 0, 0, NULL, N'g', 86.000, 1.600, 20.100, 0.100, 100.000, N'g', N'Bảng thành phần thực phẩm Việt Nam - Viện Dinh dưỡng Quốc gia', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000122', N'Bơ sáp', N'quả bơ;trái bơ;avocado', 1, 0, 0, 0, 0, NULL, N'g', 160.000, 2.000, 8.500, 14.700, 100.000, N'g', N'USDA FoodData Central', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000123', N'Chuối sứ chín', N'chuối xiêm;chuối chín;banana', 1, 0, 0, 0, 0, NULL, N'g', 89.000, 1.100, 22.800, 0.300, 100.000, N'g', N'Bảng thành phần thực phẩm Việt Nam - Viện Dinh dưỡng Quốc gia', 1, @Now, NULL),

    -- Nhóm chất lỏng, dầu thực vật, gia vị & hạt béo
    ('10000000-0000-0000-0000-000000000124', N'Nước cốt dừa tươi', N'cốt dừa;coconut milk', 1, 0, 0, 0, 0, NULL, N'ml', 197.000, 2.000, 2.800, 21.300, 100.000, N'ml', N'Bảng thành phần thực phẩm Việt Nam - Viện Dinh dưỡng Quốc gia', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000125', N'Sữa đậu nành không đường', N'sữa đậu nành;unsweetened soy milk', 1, 0, 0, 0, 0, N'Đậu nành;Soy', N'ml', 38.000, 3.300, 1.800, 1.900, 100.000, N'ml', N'Bảng thành phần thực phẩm Việt Nam - Viện Dinh dưỡng Quốc gia', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000126', N'Dầu mè nguyên chất', N'dầu vừng;sesame oil', 1, 0, 0, 0, 0, N'Mè;Vừng;Sesame', N'ml', 884.000, 0.000, 0.000, 100.000, 100.000, N'ml', N'USDA FoodData Central', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000127', N'Dầu ô liu ép lạnh', N'dầu olive;extra virgin olive oil', 1, 0, 0, 0, 0, NULL, N'ml', 884.000, 0.000, 0.000, 100.000, 100.000, N'ml', N'USDA FoodData Central', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000128', N'Nước tương lên men tự nhiên', N'xì dầu;soy sauce;tamari', 1, 0, 0, 0, 0, N'Đậu nành;Soy;Lúa mì;Wheat', N'ml', 53.000, 8.100, 4.900, 0.100, 100.000, N'ml', N'USDA FoodData Central', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000129', N'Hạt điều rang mộc', N'hạt điều Bình Phước;cashew nuts', 1, 0, 0, 0, 0, N'Hạt cây;Hạt điều;Tree nuts', N'g', 553.000, 18.200, 30.200, 43.800, 100.000, N'g', N'Bảng thành phần thực phẩm Việt Nam - Viện Dinh dưỡng Quốc gia', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000130', N'Mè trắng rang', N'vừng rang;toasted sesame seeds', 1, 0, 0, 0, 0, N'Mè;Vừng;Sesame', N'g', 573.000, 17.700, 23.400, 49.700, 100.000, N'g', N'Bảng thành phần thực phẩm Việt Nam - Viện Dinh dưỡng Quốc gia', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000131', N'Hạt chia đen', N'hạt chia;chia seeds', 1, 0, 0, 0, 0, NULL, N'g', 486.000, 16.500, 42.100, 30.700, 100.000, N'g', N'USDA FoodData Central', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000132', N'Đường thốt nốt', N'đường thốt nốt An Giang;palm sugar', 1, 0, 0, 0, 0, NULL, N'g', 380.000, 0.400, 95.000, 0.000, 100.000, N'g', N'Bảng thành phần thực phẩm Việt Nam - Viện Dinh dưỡng Quốc gia', 1, @Now, NULL),

    -- Nhóm nguyên liệu dành cho chế độ Ovo / Lacto / Lacto-Ovo Vegetarian
    ('10000000-0000-0000-0000-000000000133', N'Trứng gà ta', N'trứng gà;quả trứng gà;chicken egg', 2, 1, 0, 0, 0, N'Trứng;Egg', N'đơn vị', 72.000, 6.300, 0.400, 4.800, 1.000, N'đơn vị', N'USDA FoodData Central (1 quả cỡ vừa 50g)', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000134', N'Sữa tươi thanh trùng không đường', N'sữa bò tươi;fresh milk', 2, 0, 1, 0, 0, N'Sữa;Milk', N'ml', 61.000, 3.200, 4.800, 3.300, 100.000, N'ml', N'Bảng thành phần thực phẩm Việt Nam - Viện Dinh dưỡng Quốc gia', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000135', N'Phô mai Mozzarella vi sinh', N'phô mai chay không men động vật;vegetarian mozzarella cheese', 2, 0, 1, 0, 0, N'Sữa;Milk', N'g', 280.000, 22.000, 2.200, 20.000, 100.000, N'g', N'USDA FoodData Central', 1, @Now, NULL),
    ('10000000-0000-0000-0000-000000000136', N'Mật ong hoa nhãn', N'mật ong nguyên chất;raw honey', 2, 0, 0, 1, 0, NULL, N'ml', 304.000, 0.300, 82.400, 0.000, 100.000, N'ml', N'Bảng thành phần thực phẩm Việt Nam - Viện Dinh dưỡng Quốc gia', 1, @Now, NULL);

-- =========================================================================================
-- 3. CÔNG THỨC NẤU ĂN (Recipes)
-- Quy ước DeclaredDietaryType:
--   1 = Vegan (Thuần chay)
--   2 = LactoVegetarian (Chay có sữa)
--   3 = OvoVegetarian (Chay có trứng)
--   4 = LactoOvoVegetarian (Chay có trứng và sữa)
-- =========================================================================================
INSERT INTO [dbo].[Recipes] (
    [Id], [CategoryId], [Name], [Description], [Servings], [Instructions],
    [PrepTimeMinutes], [CookTimeMinutes], [ImageUrl],
    [CaloriesPerServing], [ProteinGramPerServing], [CarbohydrateGramPerServing], [FatGramPerServing],
    [DeclaredDietaryType], [IsActive], [CreatedAt], [UpdatedAt]
)
VALUES
    -- R201
    ('20000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000001',
     N'Cơm gạo lứt hạt sen nấm đông cô',
     N'Món cơm thực dưỡng dẻo bùi từ gạo lứt đỏ nấu cùng hạt sen Huế và nấm đông cô tươi, dậy mùi thơm dịu của dầu mè nguyên chất.',
     2,
     N'Bước 1: Vo sạch gạo lứt đỏ, ngâm nước ấm khoảng 45 phút cho hạt gạo mềm rồi để ráo. Hạt sen tươi rửa sạch, thông tâm.
Bước 2: Nấm đông cô tươi cắt bỏ chân, thái lát vừa ăn; cà rốt gọt vỏ, cắt hạt lựu.
Bước 3: Cho gạo lứt và hạt sen vào nồi cùng lượng nước vừa đủ, nấu chín mềm.
Bước 4: Phi thơm chảo với dầu mè, cho nấm đông cô và cà rốt vào xào săn cùng nước tương lên men tự nhiên trong 5 phút.
Bước 5: Khi cơm chín tới, cho phần nhân nấm cà rốt vào đảo đều, ủ thêm 10 phút trên bếp ấm rồi xới ra bát thưởng thức.',
     20, 40, N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
     417.000, 10.320, 77.340, 7.750, 1, 1, @Now, NULL),

    -- R202
    ('20000000-0000-0000-0000-000000000202', '10000000-0000-0000-0000-000000000005',
     N'Đậu hũ non sốt nấm đùi gà cải bó xôi',
     N'Đậu hũ trắng mềm mịn kết hợp cùng nấm đùi gà dai giòn và cải bó xôi xanh mướt trong lớp nước sốt nước tương đậm đà.',
     2,
     N'Bước 1: Đậu hũ trắng cắt khối vuông khoảng 2.5cm, chần sơ qua nước sôi có pha chút muối để miếng đậu săn chắc.
Bước 2: Nấm đùi gà rửa sạch, thái lát dọc mỏng hoặc cắt quân cờ. Cải bó xôi nhặt rửa sạch, chần nhanh 30 giây rồi xếp ra đĩa.
Bước 3: Làm nóng chảo với dầu mè, cho nấm đùi gà vào áp chảo lửa vừa đến khi xém vàng hai mặt.
Bước 4: Thêm nước tương lên men tự nhiên và 40ml nước lọc, hạ lửa nhỏ rồi nhẹ tay cho đậu hũ vào rim 5 phút để thấm vị.
Bước 5: Trút đậu hũ và nấm cùng nước sốt sánh nhẹ lên đĩa cải bó xôi, dùng nóng với cơm.',
     15, 15, N'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80',
     226.075, 19.688, 12.263, 12.613, 1, 1, @Now, NULL),

    -- R203
    ('20000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000002',
     N'Bún riêu chay thanh đạm từ sữa đậu nành và nấm rơm',
     N'Nước dùng ngọt thanh từ củ cải trắng và cà chua chín mọng, kết hợp phần riêu kết tủa tự nhiên từ sữa đậu nành không đường, đậu hũ và nấm rơm.',
     2,
     N'Bước 1: Củ cải trắng gọt vỏ, cắt khoanh tròn hầm với 1 lít nước trong 25 phút để lấy nước dùng ngọt tự nhiên.
Bước 2: Đun ấm sữa đậu nành không đường ở lửa nhỏ để tạo lớp váng riêu mềm, vớt nhẹ ra bát riêng.
Bước 3: Đậu hũ trắng cắt miếng vừa ăn, áp chảo vàng nhẹ. Cà chua bổ múi cau, nấm rơm cắt đôi.
Bước 4: Xào cà chua và nấm rơm với dầu ô liu cho lên màu đẹp, sau đó cho vào nồi nước dùng củ cải cùng đậu hũ, đun sôi nhẹ 10 phút.
Bước 5: Trụng bún gạo tươi vào tô, xếp đậu hũ, nấm rơm, váng riêu đậu nành lên trên rồi chan nước dùng nóng hổi.',
     20, 30, N'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=80',
     416.700, 19.675, 59.775, 12.400, 1, 1, @Now, NULL),

    -- R204
    ('20000000-0000-0000-0000-000000000204', '10000000-0000-0000-0000-000000000005',
     N'Tàu hũ ky cuộn nấm đông cô kho tộ đường thốt nốt',
     N'Món kho truyền thống có màu nâu cánh gián tự nhiên từ đường thốt nốt An Giang, tàu hũ ky dai mềm thấm đẫm hương nấm đông cô.',
     2,
     N'Bước 1: Tàu hũ ky tươi rửa sạch, cắt khúc vừa ăn hoặc cuộn chặt cùng nấm đông cô tươi đã thái lát.
Bước 2: Áp chảo sơ các cuộn tàu hũ ky với dầu mè cho bề mặt săn vàng đều.
Bước 3: Thắng nhẹ đường thốt nốt trong nồi đất với 2 thìa nước đến khi chuyển màu vàng óng, thêm nước tương lên men tự nhiên.
Bước 4: Xếp tàu hũ ky và phần nấm đông cô còn lại vào nồi, thêm 80ml nước ấm, đun lửa nhỏ liu riu trong 18 phút cho nước kho sánh quyện.',
     15, 25, N'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80',
     312.650, 23.845, 17.460, 17.065, 1, 1, @Now, NULL),

    -- R205
    ('20000000-0000-0000-0000-000000000205', '10000000-0000-0000-0000-000000000003',
     N'Canh hạt sen hầm củ quả dưỡng sinh',
     N'Bát canh trong vắt, ngọt dịu từ bí đỏ hồ lô, cà rốt, củ cải trắng và hạt sen tươi, giúp thanh nhiệt và bồi bổ cơ thể.',
     2,
     N'Bước 1: Hạt sen tươi rửa sạch. Cà rốt, củ cải trắng và bí đỏ hồ lô gọt vỏ, cắt miếng vừa ăn. Nấm rơm ngâm nước muối loãng 5 phút rồi rửa sạch.
Bước 2: Cho hạt sen, củ cải trắng và cà rốt vào nồi cùng 800ml nước, hầm lửa nhỏ trong 15 phút.
Bước 3: Tiếp tục cho bí đỏ hồ lô và nấm rơm vào nấu thêm 10 phút đến khi hạt sen và bí đỏ chín bùi nhưng không bị nát.
Bước 4: Nêm nếm thanh nhẹ, múc canh ra tô dùng nóng trong bữa chính.',
     15, 25, N'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80',
     140.350, 6.715, 29.135, 0.795, 1, 1, @Now, NULL),

    -- R206
    ('20000000-0000-0000-0000-000000000206', '10000000-0000-0000-0000-000000000003',
     N'Súp bí đỏ hạt điều cốt dừa mịn mượt',
     N'Súp kem thuần thực vật kết hợp vị ngọt tự nhiên của bí đỏ hồ lô cùng độ béo ngậy từ hạt điều Bình Phước và nước cốt dừa tươi.',
     2,
     N'Bước 1: Bí đỏ hồ lô gọt vỏ, bỏ ruột, cắt khối vuông 3cm rồi hấp chín mềm trong 15 phút.
Bước 2: Cho bí đỏ đã hấp nóng vào máy xay cùng hạt điều rang mộc và 200ml nước ấm, xay nhuyễn mịn hoàn toàn.
Bước 3: Chuyển hỗn hợp sang nồi nhỏ, thêm nước cốt dừa tươi và khuấy đều trên lửa nhỏ 5 phút cho súp sánh mịn.
Bước 4: Múc súp ra bát, rưới nhẹ dầu ô liu ép lạnh lên bề mặt và dùng ấm.',
     10, 20, N'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=900&q=80',
     263.500, 6.440, 20.160, 19.980, 1, 1, @Now, NULL),

    -- R207
    ('20000000-0000-0000-0000-000000000207', '10000000-0000-0000-0000-000000000004',
     N'Salad đậu gà bơ sáp sốt dầu ô liu mè rang',
     N'Đĩa salad giàu đạm và chất béo tốt từ đậu gà luộc chín, bơ sáp dẻo mịn, xà lách Romaine giòn tươi và mè trắng rang thơm lừng.',
     2,
     N'Bước 1: Xà lách Romaine rửa sạch, để ráo hoàn toàn rồi cắt khúc vừa ăn. Dưa leo và cà chua rửa sạch, thái miếng vừa miệng.
Bước 2: Bơ sáp bổ đôi, bỏ hạt, lột vỏ và cắt quân cờ. Đậu gà luộc chín để ráo nước.
Bước 3: Cho xà lách, dưa leo, cà chua và đậu gà vào tô lớn, rưới dầu ô liu ép lạnh và đảo nhẹ tay.
Bước 4: Xếp bơ sáp lên trên để tránh bị nát, rắc đều mè trắng rang và thưởng thức ngay.',
     15, 0, N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
     397.875, 13.248, 41.260, 22.683, 1, 1, @Now, NULL),

    -- R208
    ('20000000-0000-0000-0000-000000000208', '10000000-0000-0000-0000-000000000005',
     N'Bông cải xanh xào nấm đông cô và hạt điều',
     N'Món xào thanh vị giữ trọn màu xanh ngọc của bông cải, quyện cùng vị ngọt đậm của nấm đông cô tươi và hạt điều rang giòn bùi.',
     2,
     N'Bước 1: Bông cải xanh tách nhánh vừa ăn, cà rốt tỉa hoa thái lát mỏng. Chần nhanh bông cải và cà rốt trong nước sôi 1 phút rồi vớt ra ngâm nước mát để giữ độ giòn.
Bước 2: Nấm đông cô tươi rửa sạch, khứa chữ thập trên mũ nấm hoặc cắt đôi.
Bước 3: Đun nóng chảo với dầu mè nguyên chất, cho nấm đông cô vào xào 3 phút cho dậy mùi thơm.
Bước 4: Cho bông cải xanh, cà rốt và nước tương lên men tự nhiên vào đảo nhanh trên lửa lớn 2 phút.
Bước 5: Tắt bếp, rắc hạt điều rang mộc vào trộn đều rồi bày ra đĩa.',
     10, 10, N'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80',
     251.675, 10.458, 25.248, 14.823, 1, 1, @Now, NULL),

    -- R209
    ('20000000-0000-0000-0000-000000000209', '10000000-0000-0000-0000-000000000006',
     N'Yến mạch ngâm sữa đậu nành chuối chín và hạt chia',
     N'Bữa sáng giàu chất xơ hòa tan và Omega-3 thực vật, không cần nấu nướng, mát lạnh và tiện lợi cho người bận rộn.',
     2,
     N'Bước 1: Trộn đều yến mạch cán dẹt và hạt chia đen cùng sữa đậu nành không đường trong hai hũ thủy tinh có nắp đậy.
Bước 2: Khuấy kỹ sau 5 phút đầu để hạt chia không bị vón cục, sau đó đậy kín và để ngăn mát tủ lạnh từ 4 giờ hoặc qua đêm.
Bước 3: Khi dùng, lấy hũ yến mạch ra, cắt lát chuối sứ chín xếp lên bề mặt và thưởng thức trực tiếp.',
     10, 0, N'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=900&q=80',
     375.200, 14.190, 61.280, 9.440, 1, 1, @Now, NULL),

    -- R210
    ('20000000-0000-0000-0000-000000000210', '10000000-0000-0000-0000-000000000006',
     N'Bánh mì nguyên cám áp chảo bơ nghiền và đậu gà',
     N'Bánh mì nguyên cám nướng giòn rụm phết lớp bơ sáp nghiền mịn, phủ đậu gà bùi béo, cà chua tươi và mè trắng rang.',
     2,
     N'Bước 1: Áp chảo khô các lát bánh mì nguyên cám trên lửa nhỏ mỗi mặt 2 phút đến khi vàng giòn.
Bước 2: Bơ sáp lấy phần thịt, dùng nĩa dầm nhuyễn mịn cùng một nửa lượng đậu gà luộc chín.
Bước 3: Phết đều hỗn hợp bơ đậu gà lên từng lát bánh mì nướng, xếp cà chua cắt lát và phần đậu gà nguyên hạt còn lại lên trên.
Bước 4: Rắc mè trắng rang lên bề mặt và dùng ngay khi bánh còn giòn.',
     10, 5, N'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80',
     390.250, 15.645, 51.490, 15.135, 1, 1, @Now, NULL),

    -- R211
    ('20000000-0000-0000-0000-000000000211', '10000000-0000-0000-0000-000000000007',
     N'Chè đậu xanh hạt sen đường thốt nốt cốt dừa',
     N'Món chè truyền thống vị ngọt thanh dịu của đường thốt nốt, hạt sen chín bở hòa quyện cùng đậu xanh cà vỏ và nước cốt dừa béo thơm.',
     4,
     N'Bước 1: Đậu xanh cà vỏ ngâm nước ấm 1 giờ cho nở mềm rồi đãi sạch. Hạt sen tươi rửa sạch, bỏ tâm đắng.
Bước 2: Cho hạt sen vào nồi nấu với 1 lít nước trong 15 phút trước, sau đó cho đậu xanh vào nấu cùng thêm 15 phút đến khi cả hai chín mềm.
Bước 3: Cho đường thốt nốt thái nhỏ vào khuấy nhẹ tay đến khi tan hoàn toàn, đun sôi lại 3 phút rồi tắt bếp.
Bước 4: Múc chè ra chén, chan nước cốt dừa tươi lên trên và dùng ấm hoặc mát tùy thích.',
     15, 35, N'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=80',
     269.750, 11.060, 44.913, 5.963, 1, 1, @Now, NULL),

    -- R212
    ('20000000-0000-0000-0000-000000000212', '10000000-0000-0000-0000-000000000008',
     N'Sinh tố bơ sáp hạt điều sữa đậu nành',
     N'Thức uống dinh dưỡng sánh mịn kết hợp vị béo ngậy của bơ sáp, hạt điều rang và vị ngọt tự nhiên từ chuối sứ chín.',
     2,
     N'Bước 1: Bơ sáp bổ đôi, bỏ hạt, lấy phần thịt quả. Chuối sứ chín bóc vỏ, cắt khoanh tròn.
Bước 2: Cho bơ sáp, chuối chín, hạt điều rang mộc và sữa đậu nành không đường vào cối máy xay sinh tố.
Bước 3: Xay ở tốc độ cao trong 60 giây đến khi hỗn hợp nhuyễn mịn hoàn toàn, rót ra 2 ly và thưởng thức ngay.',
     10, 0, N'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=900&q=80',
     321.350, 9.940, 27.710, 21.360, 1, 1, @Now, NULL),

    -- R213 (Lacto-Vegetarian = 2)
    ('20000000-0000-0000-0000-000000000213', '10000000-0000-0000-0000-000000000007',
     N'Khoai lang mật đút lò phủ phô mai Mozzarella',
     N'Khoai lang mật Đà Lạt nướng chín dẻo ngọt, quyện cùng sữa tươi thanh trùng và lớp phô mai Mozzarella vi sinh kéo sợi thơm béo.',
     2,
     N'Bước 1: Khoai lang mật rửa sạch, hấp chín mềm trong 20 phút rồi bổ dọc hoặc lấy ruột nghiền mịn cùng sữa tươi thanh trùng không đường.
Bước 2: Cho phần khoai đã trộn sữa vào khay sứ nướng hoặc vỏ khoai, dàn phẳng bề mặt.
Bước 3: Phủ đều phô mai Mozzarella vi sinh bào sợi lên trên, rắc thêm mè trắng rang.
Bước 4: Đút lò nướng hoặc nồi chiên không dầu ở 190 độ C trong 10 phút đến khi lớp phô mai tan chảy và xém vàng.',
     10, 30, N'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?auto=format&fit=crop&w=900&q=80',
     309.450, 13.445, 38.665, 11.650, 2, 1, @Now, NULL),

    -- R214 (Ovo-Vegetarian = 3)
    ('20000000-0000-0000-0000-000000000214', '10000000-0000-0000-0000-000000000001',
     N'Cơm chiên gạo lứt trứng gà ta và rau củ ngũ sắc',
     N'Hạt cơm gạo lứt săn tơi áo đều lớp trứng gà ta vàng ươm, xào cùng nấm đùi gà, cà rốt và cải bó xôi giàu dưỡng chất.',
     2,
     N'Bước 1: Nấu chín gạo lứt đỏ thành cơm rồi để nguội cho hạt cơm săn ráo. Cà rốt và nấm đùi gà cắt hạt lựu nhỏ; cải bó xôi thái sợi.
Bước 2: Đánh tan 2 quả trứng gà ta, trộn một nửa lượng trứng vào cơm gạo lứt nguội để hạt cơm có màu vàng đẹp khi rang.
Bước 3: Làm nóng chảo với dầu mè nguyên chất, cho phần trứng còn lại vào đảo tơi rồi cho cà rốt và nấm đùi gà vào xào chín.
Bước 4: Trút cơm gạo lứt vào rang trên lửa vừa 7 phút, nêm nước tương lên men tự nhiên, cuối cùng cho cải bó xôi vào đảo đều 1 phút rồi tắt bếp.',
     15, 25, N'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=80',
     455.175, 16.368, 70.418, 12.448, 3, 1, @Now, NULL),

    -- R215 (Ovo-Vegetarian = 3)
    ('20000000-0000-0000-0000-000000000215', '10000000-0000-0000-0000-000000000001',
     N'Trứng gà hấp nấm đông cô và đậu hũ non',
     N'Món trứng hấp mềm mịn như lụa kết hợp cùng đậu hũ trắng, nấm đông cô tươi và cà rốt thái hạt lựu, giàu đạm và dễ tiêu hóa.',
     2,
     N'Bước 1: Đậu hũ trắng cắt khối nhỏ xếp dưới đáy thố sứ. Nấm đông cô tươi và cà rốt thái hạt lựu nhỏ, chần sơ qua nước sôi 1 phút.
Bước 2: Đánh tan 3 quả trứng gà ta với 150ml nước ấm, lọc qua rây để hỗn hợp trứng mịn mượt không bọt khí.
Bước 3: Rót nhẹ hỗn hợp trứng vào thố đậu hũ, rắc nấm đông cô và cà rốt lên bề mặt, bọc màng thực phẩm chịu nhiệt.
Bước 4: Hấp cách thủy lửa nhỏ trong 15 phút đến khi trứng chín đông mềm, rưới dầu mè nguyên chất và nước tương lên trên trước khi dùng.',
     10, 15, N'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80',
     221.500, 17.780, 8.070, 13.455, 3, 1, @Now, NULL),

    -- R216 (Lacto-Ovo Vegetarian = 4)
    ('20000000-0000-0000-0000-000000000216', '10000000-0000-0000-0000-000000000006',
     N'Bánh mì nguyên cám nướng trứng sữa mật ong hoa nhãn',
     N'Bánh mì nguyên cám nhúng hỗn hợp trứng gà ta và sữa tươi thanh trùng áp chảo thơm lừng, dùng kèm chuối chín, hạt chia và mật ong hoa nhãn.',
     2,
     N'Bước 1: Đánh đều 2 quả trứng gà ta cùng sữa tươi thanh trùng không đường trong khay sâu lòng.
Bước 2: Nhúng đều hai mặt các lát bánh mì nguyên cám vào hỗn hợp trứng sữa trong 20 giây cho thấm mềm mà không bị rách.
Bước 3: Áp chảo bánh mì trên chảo chống dính lửa nhỏ mỗi mặt 3 phút đến khi chín vàng thơm.
Bước 4: Xếp bánh ra đĩa, bày chuối sứ chín cắt lát lên trên, rắc hạt chia đen và rưới mật ong hoa nhãn.',
     10, 10, N'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=900&q=80',
     384.200, 18.375, 54.985, 10.915, 4, 1, @Now, NULL);

-- =========================================================================================
-- 4. ĐỊNH LƯỢNG NGUYÊN LIỆU THEO CÔNG THỨC (RecipeIngredients)
-- =========================================================================================
INSERT INTO [dbo].[RecipeIngredients] ([RecipeId], [IngredientId], [Quantity], [Unit], [Note])
VALUES
    -- R201: Cơm gạo lứt hạt sen nấm đông cô (2 khẩu phần)
    ('20000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000103', 160.000, N'g', N'Vo sạch, ngâm nước ấm 45 phút trước khi nấu'),
    ('20000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000110', 100.000, N'g', N'Hạt sen tươi đã lấy tâm'),
    ('20000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000108', 100.000, N'g', N'Thái lát vừa ăn'),
    ('20000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000113', 80.000, N'g', N'Gọt vỏ, cắt hạt lựu 1cm'),
    ('20000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000126', 10.000, N'ml', N'Dùng để xào nhân nấm và trộn cơm'),
    ('20000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000128', 20.000, N'ml', N'Nêm vào nhân nấm khi xào'),

    -- R202: Đậu hũ non sốt nấm đùi gà cải bó xôi (2 khẩu phần)
    ('20000000-0000-0000-0000-000000000202', '10000000-0000-0000-0000-000000000101', 300.000, N'g', N'Cắt khối vuông 2.5cm, chần sơ nước ấm'),
    ('20000000-0000-0000-0000-000000000202', '10000000-0000-0000-0000-000000000107', 200.000, N'g', N'Cắt quân cờ hoặc thái lát dày'),
    ('20000000-0000-0000-0000-000000000202', '10000000-0000-0000-0000-000000000116', 150.000, N'g', N'Nhặt rửa sạch, chần nhanh 30 giây'),
    ('20000000-0000-0000-0000-000000000202', '10000000-0000-0000-0000-000000000126', 10.000, N'ml', N'Áp chảo nấm và tạo độ bóng cho sốt'),
    ('20000000-0000-0000-0000-000000000202', '10000000-0000-0000-0000-000000000128', 25.000, N'ml', N'Làm nền sốt rim đậu hũ'),

    -- R203: Bún riêu chay thanh đạm từ sữa đậu nành và nấm rơm (2 khẩu phần)
    ('20000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000104', 350.000, N'g', N'Trụng nước sôi trước khi chia vào 2 tô'),
    ('20000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000101', 200.000, N'g', N'Cắt miếng tam giác, áp chảo vàng'),
    ('20000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000109', 150.000, N'g', N'Cắt gốc, chẻ đôi những tai nấm lớn'),
    ('20000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000117', 250.000, N'g', N'Bổ múi cau, xào tạo màu nước dùng'),
    ('20000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000114', 150.000, N'g', N'Cắt khoanh hầm lấy nước ngọt'),
    ('20000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000125', 200.000, N'ml', N'Đun ấm lấy váng riêu và pha nước dùng'),
    ('20000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000127', 10.000, N'ml', N'Dùng xào cà chua và nấm rơm'),

    -- R204: Tàu hũ ky cuộn nấm đông cô kho tộ đường thốt nốt (2 khẩu phần)
    ('20000000-0000-0000-0000-000000000204', '10000000-0000-0000-0000-000000000102', 200.000, N'g', N'Cắt khúc 4cm hoặc cuộn nấm'),
    ('20000000-0000-0000-0000-000000000204', '10000000-0000-0000-0000-000000000108', 100.000, N'g', N'Cắt bỏ chân, để nguyên mũ nhỏ hoặc bổ đôi'),
    ('20000000-0000-0000-0000-000000000204', '10000000-0000-0000-0000-000000000128', 30.000, N'ml', N'Ướp và kho trong nồi đất'),
    ('20000000-0000-0000-0000-000000000204', '10000000-0000-0000-0000-000000000132', 15.000, N'g', N'Thắng tạo màu caramel tự nhiên và vị dịu'),
    ('20000000-0000-0000-0000-000000000204', '10000000-0000-0000-0000-000000000126', 10.000, N'ml', N'Áp chảo tàu hũ ky trước khi kho'),

    -- R205: Canh hạt sen hầm củ quả dưỡng sinh (2 khẩu phần)
    ('20000000-0000-0000-0000-000000000205', '10000000-0000-0000-0000-000000000110', 150.000, N'g', N'Rửa sạch, giữ nguyên hạt'),
    ('20000000-0000-0000-0000-000000000205', '10000000-0000-0000-0000-000000000113', 120.000, N'g', N'Cắt khoanh dày 1cm'),
    ('20000000-0000-0000-0000-000000000205', '10000000-0000-0000-0000-000000000114', 150.000, N'g', N'Gọt vỏ, cắt miếng vừa ăn'),
    ('20000000-0000-0000-0000-000000000205', '10000000-0000-0000-0000-000000000109', 100.000, N'g', N'Rửa sạch, cho vào nửa sau thời gian hầm'),
    ('20000000-0000-0000-0000-000000000205', '10000000-0000-0000-0000-000000000120', 150.000, N'g', N'Cắt khối vuông 3cm để không bị nát'),

    -- R206: Súp bí đỏ hạt điều cốt dừa mịn mượt (2 khẩu phần)
    ('20000000-0000-0000-0000-000000000206', '10000000-0000-0000-0000-000000000120', 400.000, N'g', N'Gọt vỏ, hấp chín mềm rồi xay nhuyễn'),
    ('20000000-0000-0000-0000-000000000206', '10000000-0000-0000-0000-000000000129', 40.000, N'g', N'Xay cùng bí đỏ tạo độ kem béo tự nhiên'),
    ('20000000-0000-0000-0000-000000000206', '10000000-0000-0000-0000-000000000124', 80.000, N'ml', N'Khuấy đều ở bước đun ấm cuối cùng'),
    ('20000000-0000-0000-0000-000000000206', '10000000-0000-0000-0000-000000000127', 5.000, N'ml', N'Rưới lên mặt súp khi trình bày'),

    -- R207: Salad đậu gà bơ sáp sốt dầu ô liu mè rang (2 khẩu phần)
    ('20000000-0000-0000-0000-000000000207', '10000000-0000-0000-0000-000000000111', 200.000, N'g', N'Để ráo nước hoàn toàn trước khi trộn'),
    ('20000000-0000-0000-0000-000000000207', '10000000-0000-0000-0000-000000000122', 150.000, N'g', N'Cắt khối vuông vừa ăn'),
    ('20000000-0000-0000-0000-000000000207', '10000000-0000-0000-0000-000000000119', 120.000, N'g', N'Rửa sạch, quay khô nước, cắt khúc 3cm'),
    ('20000000-0000-0000-0000-000000000207', '10000000-0000-0000-0000-000000000118', 100.000, N'g', N'Thái lát bán nguyệt'),
    ('20000000-0000-0000-0000-000000000207', '10000000-0000-0000-0000-000000000117', 100.000, N'g', N'Cắt múi cau nhỏ'),
    ('20000000-0000-0000-0000-000000000207', '10000000-0000-0000-0000-000000000130', 15.000, N'g', N'Rắc đều lên mặt salad'),
    ('20000000-0000-0000-0000-000000000207', '10000000-0000-0000-0000-000000000127', 10.000, N'ml', N'Làm sốt trộn trực tiếp'),

    -- R208: Bông cải xanh xào nấm đông cô và hạt điều (2 khẩu phần)
    ('20000000-0000-0000-0000-000000000208', '10000000-0000-0000-0000-000000000115', 300.000, N'g', N'Tách nhánh nhỏ, chần sơ 1 phút'),
    ('20000000-0000-0000-0000-000000000208', '10000000-0000-0000-0000-000000000108', 150.000, N'g', N'Cắt đôi mũ nấm lớn'),
    ('20000000-0000-0000-0000-000000000208', '10000000-0000-0000-0000-000000000113', 80.000, N'g', N'Thái lát mỏng'),
    ('20000000-0000-0000-0000-000000000208', '10000000-0000-0000-0000-000000000129', 40.000, N'g', N'Cho vào sau cùng để giữ độ giòn'),
    ('20000000-0000-0000-0000-000000000208', '10000000-0000-0000-0000-000000000126', 10.000, N'ml', N'Xào thơm nấm đông cô'),
    ('20000000-0000-0000-0000-000000000208', '10000000-0000-0000-0000-000000000128', 15.000, N'ml', N'Nêm khi đảo lửa lớn'),

    -- R209: Yến mạch ngâm sữa đậu nành chuối chín và hạt chia (2 khẩu phần)
    ('20000000-0000-0000-0000-000000000209', '10000000-0000-0000-0000-000000000105', 100.000, N'g', N'Chia đều vào 2 hũ thủy tinh'),
    ('20000000-0000-0000-0000-000000000209', '10000000-0000-0000-0000-000000000125', 300.000, N'ml', N'Ngâm ngập yến mạch và hạt chia'),
    ('20000000-0000-0000-0000-000000000209', '10000000-0000-0000-0000-000000000123', 180.000, N'g', N'Cắt lát xếp lên trên khi dùng'),
    ('20000000-0000-0000-0000-000000000209', '10000000-0000-0000-0000-000000000131', 20.000, N'g', N'Khuấy đều cùng sữa đậu nành'),

    -- R210: Bánh mì nguyên cám áp chảo bơ nghiền và đậu gà (2 khẩu phần)
    ('20000000-0000-0000-0000-000000000210', '10000000-0000-0000-0000-000000000106', 140.000, N'g', N'4 lát bánh mì nguyên cám áp chảo giòn'),
    ('20000000-0000-0000-0000-000000000210', '10000000-0000-0000-0000-000000000122', 120.000, N'g', N'Dầm nhuyễn phết lên mặt bánh'),
    ('20000000-0000-0000-0000-000000000210', '10000000-0000-0000-0000-000000000111', 100.000, N'g', N'Dầm một nửa cùng bơ, một nửa để nguyên hạt'),
    ('20000000-0000-0000-0000-000000000210', '10000000-0000-0000-0000-000000000117', 80.000, N'g', N'Thái lát mỏng xếp lên bơ nghiền'),
    ('20000000-0000-0000-0000-000000000210', '10000000-0000-0000-0000-000000000130', 10.000, N'g', N'Rắc đều trên cùng'),

    -- R211: Chè đậu xanh hạt sen đường thốt nốt cốt dừa (4 khẩu phần)
    ('20000000-0000-0000-0000-000000000211', '10000000-0000-0000-0000-000000000112', 150.000, N'g', N'Ngâm nước ấm 1 giờ trước khi nấu'),
    ('20000000-0000-0000-0000-000000000211', '10000000-0000-0000-0000-000000000110', 150.000, N'g', N'Hầm mềm nhưng giữ nguyên hạt'),
    ('20000000-0000-0000-0000-000000000211', '10000000-0000-0000-0000-000000000132', 60.000, N'g', N'Thái nhỏ cho dễ tan'),
    ('20000000-0000-0000-0000-000000000211', '10000000-0000-0000-0000-000000000124', 100.000, N'ml', N'Chan lên từng chén khi thưởng thức'),

    -- R212: Sinh tố bơ sáp hạt điều sữa đậu nành (2 khẩu phần)
    ('20000000-0000-0000-0000-000000000212', '10000000-0000-0000-0000-000000000122', 160.000, N'g', N'Thịt quả bơ sáp chín dẻo'),
    ('20000000-0000-0000-0000-000000000212', '10000000-0000-0000-0000-000000000123', 120.000, N'g', N'Tạo độ ngọt tự nhiên thay đường'),
    ('20000000-0000-0000-0000-000000000212', '10000000-0000-0000-0000-000000000125', 300.000, N'ml', N'Dùng sữa đậu nành mát'),
    ('20000000-0000-0000-0000-000000000212', '10000000-0000-0000-0000-000000000129', 30.000, N'g', N'Xay mịn cùng sinh tố'),

    -- R213: Khoai lang mật đút lò phủ phô mai Mozzarella (2 khẩu phần - Lacto)
    ('20000000-0000-0000-0000-000000000213', '10000000-0000-0000-0000-000000000121', 350.000, N'g', N'Hấp chín rồi nghiền mịn'),
    ('20000000-0000-0000-0000-000000000213', '10000000-0000-0000-0000-000000000135', 80.000, N'g', N'Bào sợi phủ đều mặt khoai'),
    ('20000000-0000-0000-0000-000000000213', '10000000-0000-0000-0000-000000000134', 60.000, N'ml', N'Trộn vào khoai nghiền cho mềm ẩm'),
    ('20000000-0000-0000-0000-000000000213', '10000000-0000-0000-0000-000000000130', 10.000, N'g', N'Rắc lên lớp phô mai trước khi nướng'),

    -- R214: Cơm chiên gạo lứt trứng gà ta và rau củ ngũ sắc (2 khẩu phần - Ovo)
    ('20000000-0000-0000-0000-000000000214', '10000000-0000-0000-0000-000000000103', 160.000, N'g', N'Nấu cơm chín và để nguội cho săn hạt'),
    ('20000000-0000-0000-0000-000000000214', '10000000-0000-0000-0000-000000000133', 2.000, N'đơn vị', N'Đánh tan, trộn một nửa với cơm trước khi rang'),
    ('20000000-0000-0000-0000-000000000214', '10000000-0000-0000-0000-000000000113', 80.000, N'g', N'Cắt hạt lựu nhỏ'),
    ('20000000-0000-0000-0000-000000000214', '10000000-0000-0000-0000-000000000107', 100.000, N'g', N'Cắt hạt lựu bằng kích thước cà rốt'),
    ('20000000-0000-0000-0000-000000000214', '10000000-0000-0000-0000-000000000116', 100.000, N'g', N'Thái sợi nhỏ, cho vào cuối cùng'),
    ('20000000-0000-0000-0000-000000000214', '10000000-0000-0000-0000-000000000126', 10.000, N'ml', N'Dùng rang cơm dậy mùi thơm'),
    ('20000000-0000-0000-0000-000000000214', '10000000-0000-0000-0000-000000000128', 15.000, N'ml', N'Nêm đều khi hạt cơm đã săn'),

    -- R215: Trứng gà hấp nấm đông cô và đậu hũ non (2 khẩu phần - Ovo)
    ('20000000-0000-0000-0000-000000000215', '10000000-0000-0000-0000-000000000133', 3.000, N'đơn vị', N'Đánh tan cùng nước ấm và lọc qua rây'),
    ('20000000-0000-0000-0000-000000000215', '10000000-0000-0000-0000-000000000101', 150.000, N'g', N'Cắt khối nhỏ xếp dưới đáy thố'),
    ('20000000-0000-0000-0000-000000000215', '10000000-0000-0000-0000-000000000108', 100.000, N'g', N'Thái hạt lựu nhỏ'),
    ('20000000-0000-0000-0000-000000000215', '10000000-0000-0000-0000-000000000113', 50.000, N'g', N'Thái hạt lựu nhỏ'),
    ('20000000-0000-0000-0000-000000000215', '10000000-0000-0000-0000-000000000126', 5.000, N'ml', N'Rưới lên mặt trứng sau khi hấp chín'),
    ('20000000-0000-0000-0000-000000000215', '10000000-0000-0000-0000-000000000128', 10.000, N'ml', N'Rưới kèm dầu mè khi ăn nóng'),

    -- R216: Bánh mì nguyên cám nướng trứng sữa mật ong hoa nhãn (2 khẩu phần - LactoOvo)
    ('20000000-0000-0000-0000-000000000216', '10000000-0000-0000-0000-000000000106', 140.000, N'g', N'4 lát bánh mì nguyên cám dày vừa'),
    ('20000000-0000-0000-0000-000000000216', '10000000-0000-0000-0000-000000000133', 2.000, N'đơn vị', N'Khuấy tan với sữa tươi để nhúng bánh'),
    ('20000000-0000-0000-0000-000000000216', '10000000-0000-0000-0000-000000000134', 120.000, N'ml', N'Pha cùng trứng gà ta'),
    ('20000000-0000-0000-0000-000000000216', '10000000-0000-0000-0000-000000000136', 20.000, N'ml', N'Rưới lên bánh sau khi áp chảo'),
    ('20000000-0000-0000-0000-000000000216', '10000000-0000-0000-0000-000000000123', 100.000, N'g', N'Cắt lát ăn kèm bánh nướng'),
    ('20000000-0000-0000-0000-000000000216', '10000000-0000-0000-0000-000000000131', 10.000, N'g', N'Rắc lên mặt chuối và mật ong');

-- =========================================================================================
-- 5. NHÀ HÀNG CHAY THỰC TẾ (Restaurants)
-- =========================================================================================
INSERT INTO [dbo].[Restaurants] (
    [Id], [Name], [Description], [Address], [District],
    [Latitude], [Longitude], [ContactPhone], [WebsiteUrl], [OpeningHours],
    [PriceFromVnd], [PriceToVnd], [ImageUrl], [Source],
    [DataUpdatedAt], [IsActive], [CreatedAt], [UpdatedAt]
)
VALUES
    -- 301: Ẩm Thực Chay Tuệ (Quận 1, TP.HCM)
    ('30000000-0000-0000-0000-000000000301',
     N'Ẩm Thực Chay Tuệ - Trần Hưng Đạo',
     N'Không gian tĩnh lặng mang phong cách Á Đông đương đại, phục vụ các món chay thực dưỡng chế biến từ nấm tươi, hạt sen và rau củ hữu cơ theo mùa.',
     N'162 Trần Hưng Đạo, Phường Nguyễn Cư Trinh, Quận 1, TP. Hồ Chí Minh',
     N'Quận 1, TP. Hồ Chí Minh',
     10.763796, 106.691367, N'0907 259 988', N'https://amthucchaytue.com',
     N'Hằng ngày: 07:30 - 22:00',
     65000, 250000, N'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
     N'Đối chiếu thông tin chi nhánh Trần Hưng Đạo và tọa độ bản đồ OpenStreetMap',
     @Now, 1, @Now, NULL),

    -- 302: Nhà Hàng Chay Phương Mai (Quận 3, TP.HCM)
    ('30000000-0000-0000-0000-000000000302',
     N'Nhà Hàng Chay Phương Mai',
     N'Nhà hàng chay lâu năm tại trung tâm Quận 3 với khuôn viên ấm cúng, thực đơn phong phú từ món cuốn, gỏi nấm đến các món lẩu nấm thảo mộc.',
     N'86F Võ Thị Sáu, Phường Tân Định, Quận 3, TP. Hồ Chí Minh',
     N'Quận 3, TP. Hồ Chí Minh',
     10.789209, 106.692023, N'028 3822 3166', NULL,
     N'Hằng ngày: 09:00 - 21:30',
     55000, 200000, N'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80',
     N'Đối chiếu thông tin địa điểm Võ Thị Sáu và tọa độ OpenStreetMap',
     @Now, 1, @Now, NULL),

    -- 303: Hum Garden & Restaurant (Thảo Điền, TP. Thủ Đức, TP.HCM)
    ('30000000-0000-0000-0000-000000000303',
     N'Hum Garden - Ẩm Thực Thực Vật Thảo Điền',
     N'Biệt thự sân vườn xanh mát chuyên phục vụ ẩm thực thuần thực vật sáng tạo từ nông sản bản địa Việt Nam, các loại hạt và thảo mộc tươi.',
     N'32 Đường số 10, Phường Thảo Điền, TP. Thủ Đức, TP. Hồ Chí Minh',
     N'Thủ Đức, TP. Hồ Chí Minh',
     10.803125, 106.734812, N'0899 189 229', N'https://humvietnam.vn',
     N'Hằng ngày: 10:00 - 22:00',
     120000, 380000, N'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=900&q=80',
     N'Thông tin công khai từ nhà hàng Hum Vietnam và tọa độ Thảo Điền',
     @Now, 1, @Now, NULL),

    -- 304: Nhà Hàng Chay Pi Vegetarian Bistro (Quận 1, TP.HCM)
    ('30000000-0000-0000-0000-000000000304',
     N'Pi Vegetarian Bistro',
     N'Không gian bistro xanh thoáng trên tầng thượng đường Võ Văn Kiệt, nổi bật với các món cơm gạo lứt, cà ri rau củ và gỏi cuốn tươi.',
     N'Lầu 3, 187/15 Điện Biên Phủ, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh',
     N'Quận 1, TP. Hồ Chí Minh',
     10.787640, 106.695420, N'0916 414 133', NULL,
     N'Hằng ngày: 10:00 - 15:00 & 17:00 - 21:30',
     50000, 165000, N'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80',
     N'Thông tin địa điểm ẩm thực chay Quận 1 TP.HCM',
     @Now, 1, @Now, NULL),

    -- 305: Cơm Chay Nàng Tấm (Hoàn Kiếm, Hà Nội)
    ('30000000-0000-0000-0000-000000000305',
     N'Cơm Chay Nàng Tấm Trần Hưng Đạo',
     N'Một trong những quán cơm chay truyền thống đầu tiên tại Hà Nội từ năm 1995, giữ trọn hương vị cỗ chay Bắc Bộ thanh tao và mộc mạc.',
     N'79A Trần Hưng Đạo, Phường Trần Hưng Đạo, Quận Hoàn Kiếm, Hà Nội',
     N'Quận Hoàn Kiếm, Hà Nội',
     21.022180, 105.846390, N'024 3942 4140', N'https://comchaynangtam.com',
     N'Hằng ngày: 09:30 - 21:00',
     50000, 180000, N'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
     N'Thông tin nhà hàng Cơm Chay Nàng Tấm Hoàn Kiếm Hà Nội',
     @Now, 1, @Now, NULL),

    -- 306: Ưu Đàm Chay (Hoàn Kiếm, Hà Nội)
    ('30000000-0000-0000-0000-000000000306',
     N'Nhà Hàng Ưu Đàm Chay Hàng Bài',
     N'Kiến trúc Phật giáo đương đại tinh tế giữa lòng Hà Nội, thực đơn đa dạng từ súp hạt thông, cơm sen hấp lá đến các loại nước ép nguyên chất.',
     N'55 Nguyễn Du, Phường Nguyễn Du, Quận Hai Bà Trưng, Hà Nội',
     N'Quận Hai Bà Trưng, Hà Nội',
     21.019360, 105.847920, N'0981 349 898', N'https://uudamchay.com',
     N'Hằng ngày: 10:30 - 21:30',
     95000, 320000, N'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=900&q=80',
     N'Thông tin công khai từ nhà hàng Ưu Đàm Chay Hà Nội',
     @Now, 1, @Now, NULL),

    -- 307: Vị Lai Vegetarian Restaurant (Hai Bà Trưng, Hà Nội)
    ('30000000-0000-0000-0000-000000000307',
     N'Nhà Hàng Chay Vị Lai',
     N'Không gian hồ cá Koi và cây xanh yên bình, phục vụ thực đơn gọi món và thực đơn theo set chế biến từ nấm rừng, đậu phụ thủ công và rau củ tươi.',
     N'67 Lý Thường Kiệt, Phường Trần Hưng Đạo, Quận Hoàn Kiếm, Hà Nội',
     N'Quận Hoàn Kiếm, Hà Nội',
     21.024850, 105.844120, N'0853 535 656', N'https://vilai.vn',
     N'Hằng ngày: 10:30 - 14:00 & 17:30 - 21:00',
     85000, 280000, N'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=900&q=80',
     N'Thông tin công khai từ nhà hàng Vị Lai Hà Nội',
     @Now, 1, @Now, NULL),

    -- 308: Nhà Hàng Chay Ans Vegetarian Cuisine (Hải Châu, Đà Nẵng)
    ('30000000-0000-0000-0000-000000000308',
     N'Ans Vegetarian Cuisine Đà Nẵng',
     N'Quán chay phong cách mộc mạc gần cầu Rồng, chuyên các món bún miền Trung thanh đạm, cơm gạo lứt muối mè và salad rau hữu cơ Trà Quế.',
     N'169F Trưng Nữ Vương, Phường Bình Thuận, Quận Hải Châu, Đà Nẵng',
     N'Quận Hải Châu, Đà Nẵng',
     16.054820, 108.219410, N'0905 749 079', NULL,
     N'Hằng ngày: 08:00 - 21:00',
     35000, 120000, N'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80',
     N'Thông tin địa điểm ẩm thực chay Quận Hải Châu Đà Nẵng',
     @Now, 1, @Now, NULL),

    -- 309: Bếp Chay Không Tên - Ngũ Hành Sơn (Đà Nẵng)
    ('30000000-0000-0000-0000-000000000309',
     N'Nhà Hàng Chay Phúc An Đà Nẵng',
     N'Không gian sân vườn thoáng mát gần biển Mỹ Khê, phục vụ điểm tâm sáng, mì Quảng chay, cao lầu chay và các món canh dưỡng sinh.',
     N'547 Nguyễn Tất Thành, Phường Xuân Hà, Quận Thanh Khê, Đà Nẵng',
     N'Quận Thanh Khê, Đà Nẵng',
     16.071950, 108.198340, N'0905 942 547', NULL,
     N'Hằng ngày: 07:00 - 21:30',
     40000, 150000, N'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=900&q=80',
     N'Thông tin địa điểm ẩm thực chay Đà Nẵng',
     @Now, 1, @Now, NULL),

    -- 310: Liên Hoa Vegetarian Restaurant (TP. Huế)
    ('30000000-0000-0000-0000-000000000310',
     N'Ẩm Thực Chay Liên Hoa Huế',
     N'Ngôi nhà cổ kính rợp bóng cây trên đường Lê Quý Đôn, nổi tiếng với hơn 80 món chay xứ Huế như bún Huế chay, bánh bèo nậm lọc chay và chè hạt sen.',
     N'03 Lê Quý Đôn, Phường Phú Hội, TP. Huế, Thừa Thiên Huế',
     N'TP. Huế, Thừa Thiên Huế',
     16.464890, 107.595140, N'0234 382 1451', NULL,
     N'Hằng ngày: 07:00 - 21:30',
     30000, 120000, N'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
     N'Thông tin địa điểm ẩm thực chay truyền thống TP. Huế',
     @Now, 1, @Now, NULL);

-- =========================================================================================
-- 6. CHẾ ĐỘ ĂN PHỤC VỤ TẠI NHÀ HÀNG (RestaurantDietaryTypes)
-- Quy ước: 1 = Vegan, 2 = LactoVegetarian, 3 = OvoVegetarian, 4 = LactoOvoVegetarian
-- =========================================================================================
INSERT INTO [dbo].[RestaurantDietaryTypes] ([RestaurantId], [DietaryType])
VALUES
    ('30000000-0000-0000-0000-000000000301', 1),
    ('30000000-0000-0000-0000-000000000301', 2),
    ('30000000-0000-0000-0000-000000000302', 1),
    ('30000000-0000-0000-0000-000000000302', 2),
    ('30000000-0000-0000-0000-000000000303', 1),
    ('30000000-0000-0000-0000-000000000304', 1),
    ('30000000-0000-0000-0000-000000000304', 2),
    ('30000000-0000-0000-0000-000000000304', 4),
    ('30000000-0000-0000-0000-000000000305', 1),
    ('30000000-0000-0000-0000-000000000306', 1),
    ('30000000-0000-0000-0000-000000000306', 2),
    ('30000000-0000-0000-0000-000000000306', 4),
    ('30000000-0000-0000-0000-000000000307', 1),
    ('30000000-0000-0000-0000-000000000307', 2),
    ('30000000-0000-0000-0000-000000000308', 1),
    ('30000000-0000-0000-0000-000000000308', 3),
    ('30000000-0000-0000-0000-000000000308', 4),
    ('30000000-0000-0000-0000-000000000309', 1),
    ('30000000-0000-0000-0000-000000000309', 2),
    ('30000000-0000-0000-0000-000000000310', 1);

-- =========================================================================================
-- 7. TIỆN ÍCH NHÀ HÀNG (RestaurantAmenities)
-- =========================================================================================
INSERT INTO [dbo].[RestaurantAmenities] ([Id], [RestaurantId], [Name])
VALUES
    ('31000000-0000-0000-0000-000000003011', '30000000-0000-0000-0000-000000000301', N'Không gian máy lạnh'),
    ('31000000-0000-0000-0000-000000003012', '30000000-0000-0000-0000-000000000301', N'Phòng riêng yên tĩnh'),
    ('31000000-0000-0000-0000-000000003013', '30000000-0000-0000-0000-000000000301', N'Wi-Fi miễn phí'),

    ('31000000-0000-0000-0000-000000003021', '30000000-0000-0000-0000-000000000302', N'Chỗ đỗ xe máy & ô tô'),
    ('31000000-0000-0000-0000-000000003022', '30000000-0000-0000-0000-000000000302', N'Không gian máy lạnh'),
    ('31000000-0000-0000-0000-000000003023', '30000000-0000-0000-0000-000000000302', N'Đóng gói mang đi'),

    ('31000000-0000-0000-0000-000000003031', '30000000-0000-0000-0000-000000000303', N'Sân vườn thoáng mát'),
    ('31000000-0000-0000-0000-000000003032', '30000000-0000-0000-0000-000000000303', N'Thanh toán thẻ & QR'),
    ('31000000-0000-0000-0000-000000003033', '30000000-0000-0000-0000-000000000303', N'Chỗ đỗ xe ô tô'),

    ('31000000-0000-0000-0000-000000003041', '30000000-0000-0000-0000-000000000304', N'Wi-Fi miễn phí'),
    ('31000000-0000-0000-0000-000000003042', '30000000-0000-0000-0000-000000000304', N'Không gian ban công cây xanh'),

    ('31000000-0000-0000-0000-000000003051', '30000000-0000-0000-0000-000000000305', N'Nhận đặt mâm cỗ chay'),
    ('31000000-0000-0000-0000-000000003052', '30000000-0000-0000-0000-000000000305', N'Đóng gói mang đi'),

    ('31000000-0000-0000-0000-000000003061', '30000000-0000-0000-0000-000000000306', N'Không gian máy lạnh'),
    ('31000000-0000-0000-0000-000000003062', '30000000-0000-0000-0000-000000000306', N'Thanh toán thẻ & QR'),
    ('31000000-0000-0000-0000-000000003063', '30000000-0000-0000-0000-000000000306', N'Bàn gia đình lớn'),

    ('31000000-0000-0000-0000-000000003071', '30000000-0000-0000-0000-000000000307', N'Khuôn viên hồ cá Koi'),
    ('31000000-0000-0000-0000-000000003072', '30000000-0000-0000-0000-000000000307', N'Phòng riêng yên tĩnh'),

    ('31000000-0000-0000-0000-000000003081', '30000000-0000-0000-0000-000000000308', N'Rau hữu cơ Trà Quế'),
    ('31000000-0000-0000-0000-000000003082', '30000000-0000-0000-0000-000000000308', N'Wi-Fi miễn phí'),

    ('31000000-0000-0000-0000-000000003091', '30000000-0000-0000-0000-000000000309', N'Sân vườn thoáng mát'),
    ('31000000-0000-0000-0000-000000003092', '30000000-0000-0000-0000-000000000309', N'Chỗ đỗ xe máy & ô tô'),

    ('31000000-0000-0000-0000-000000003101', '30000000-0000-0000-0000-000000000310', N'Sân vườn nhà cổ Huế'),
    ('31000000-0000-0000-0000-000000003102', '30000000-0000-0000-0000-000000000310', N'Đóng gói mang đi');

-- =========================================================================================
-- 8. MÓN NỔI BẬT TẠI NHÀ HÀNG (RestaurantFeaturedDishes - DisplayOrder từ 0 đến 2)
-- =========================================================================================
INSERT INTO [dbo].[RestaurantFeaturedDishes] ([Id], [RestaurantId], [Name], [ImageUrl], [DisplayOrder])
VALUES
    -- 301: Ẩm Thực Chay Tuệ
    ('32000000-0000-0000-0000-000000003010', '30000000-0000-0000-0000-000000000301', N'Cơm sen hấp lá sen non', N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', 0),
    ('32000000-0000-0000-0000-000000003011', '30000000-0000-0000-0000-000000000301', N'Lẩu nấm thảo mộc dưỡng sinh', N'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80', 1),
    ('32000000-0000-0000-0000-000000003012', '30000000-0000-0000-0000-000000000301', N'Gỏi bưởi nấm tuyết hạt điều', N'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', 2),

    -- 302: Nhà Hàng Chay Phương Mai
    ('32000000-0000-0000-0000-000000003020', '30000000-0000-0000-0000-000000000302', N'Đậu hũ non sốt nấm đông cô', N'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', 0),
    ('32000000-0000-0000-0000-000000003021', '30000000-0000-0000-0000-000000000302', N'Bún riêu chay thanh đạm', N'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80', 1),
    ('32000000-0000-0000-0000-000000003022', '30000000-0000-0000-0000-000000000302', N'Tàu hũ ky cuộn nấm kho tộ', N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', 2),

    -- 303: Hum Garden Thảo Điền
    ('32000000-0000-0000-0000-000000003030', '30000000-0000-0000-0000-000000000303', N'Củ sen lắc mè rang mật mía', N'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', 0),
    ('32000000-0000-0000-0000-000000003031', '30000000-0000-0000-0000-000000000303', N'Súp bí đỏ hạt điều cốt dừa', N'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=600&q=80', 1),
    ('32000000-0000-0000-0000-000000003032', '30000000-0000-0000-0000-000000000303', N'Cơm gạo lứt đỏ hấp ống tre', N'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80', 2),

    -- 304: Pi Vegetarian Bistro
    ('32000000-0000-0000-0000-000000003040', '30000000-0000-0000-0000-000000000304', N'Cà ri rau củ nước cốt dừa', N'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=600&q=80', 0),
    ('32000000-0000-0000-0000-000000003041', '30000000-0000-0000-0000-000000000304', N'Salad bơ sáp đậu gà sốt mè', N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', 1),
    ('32000000-0000-0000-0000-000000003042', '30000000-0000-0000-0000-000000000304', N'Khoai lang mật đút lò phô mai', N'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?auto=format&fit=crop&w=600&q=80', 2),

    -- 305: Cơm Chay Nàng Tấm
    ('32000000-0000-0000-0000-000000003050', '30000000-0000-0000-0000-000000000305', N'Nem rán rau củ nấm hương', N'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', 0),
    ('32000000-0000-0000-0000-000000003051', '30000000-0000-0000-0000-000000000305', N'Canh hạt sen hầm củ quả', N'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80', 1),
    ('32000000-0000-0000-0000-000000003052', '30000000-0000-0000-0000-000000000305', N'Bông cải xanh xào nấm đông cô', N'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', 2),

    -- 306: Ưu Đàm Chay
    ('32000000-0000-0000-0000-000000003060', '30000000-0000-0000-0000-000000000306', N'Súp kem bí đỏ hạt thông', N'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=600&q=80', 0),
    ('32000000-0000-0000-0000-000000003061', '30000000-0000-0000-0000-000000000306', N'Cơm chiên trái thơm hạt điều', N'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80', 1),
    ('32000000-0000-0000-0000-000000003062', '30000000-0000-0000-0000-000000000306', N'Chè hạt sen long nhãn đường phèn', N'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80', 2),

    -- 307: Vị Lai Vegetarian
    ('32000000-0000-0000-0000-000000003070', '30000000-0000-0000-0000-000000000307', N'Nấm đùi gà áp chảo sốt tiêu xanh', N'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', 0),
    ('32000000-0000-0000-0000-000000003071', '30000000-0000-0000-0000-000000000307', N'Đậu phụ non thủ công sốt nấm', N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', 1),
    ('32000000-0000-0000-0000-000000003072', '30000000-0000-0000-0000-000000000307', N'Salad rong biển bơ tươi', N'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', 2),

    -- 308: Ans Vegetarian Cuisine Đà Nẵng
    ('32000000-0000-0000-0000-000000003080', '30000000-0000-0000-0000-000000000308', N'Mì Quảng chay rau sống Trà Quế', N'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80', 0),
    ('32000000-0000-0000-0000-000000003081', '30000000-0000-0000-0000-000000000308', N'Cơm gạo lứt muối mè đậu hũ', N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', 1),
    ('32000000-0000-0000-0000-000000003082', '30000000-0000-0000-0000-000000000308', N'Trứng gà ta hấp nấm đông cô', N'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', 2),

    -- 309: Nhà Hàng Chay Phúc An Đà Nẵng
    ('32000000-0000-0000-0000-000000003090', '30000000-0000-0000-0000-000000000309', N'Cao lầu chay Hội An truyền thống', N'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80', 0),
    ('32000000-0000-0000-0000-000000003091', '30000000-0000-0000-0000-000000000309', N'Bánh mì nguyên cám bơ nghiền', N'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80', 1),
    ('32000000-0000-0000-0000-000000003092', '30000000-0000-0000-0000-000000000309', N'Sinh tố bơ sáp hạt điều sữa hạt', N'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=600&q=80', 2),

    -- 310: Ẩm Thực Chay Liên Hoa Huế
    ('32000000-0000-0000-0000-000000003100', '30000000-0000-0000-0000-000000000310', N'Bún Huế chay nấm rơm đậu phụ', N'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80', 0),
    ('32000000-0000-0000-0000-000000003101', '30000000-0000-0000-0000-000000000310', N'Cơm hạt sen Huế gói lá sen', N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', 1),
    ('32000000-0000-0000-0000-000000003102', '30000000-0000-0000-0000-000000000310', N'Chè đậu xanh hạt sen đường thốt nốt', N'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80', 2);

COMMIT TRANSACTION;
GO
