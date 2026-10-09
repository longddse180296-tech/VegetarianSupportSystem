import type {
  Recipe,
  RecipeListFilter,
  RecipeListResponse,
  RecipeSortOption,
} from '../types/recipe.types'
import { DEFAULT_RECIPE_FILTER } from '../types/recipe.types'

const delay = (ms = 500) => new Promise<void>((r) => setTimeout(r, ms))

// ---------- In-memory seed data (NO hardcode in Components) ----------
const IN_MEMORY_RECIPES: Recipe[] = [
  {
    id: 'r_001_tofu_tomato',
    title: 'Đậu phụ xốt cà chua thơm ngọt tự nhiên',
    description:
      'Công thức đơn giản, thơm mùi hành phi, cà chua chín nhừ kết hợp với đậu phụ vàng đều, ăn với cơm nóng là đỉnh của chóp. Đặc biệt phù hợp khi bạn mới bắt đầu ăn thuần thực vật.',
    coverImage:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=vietnamese%20pan-fried%20tofu%20with%20tomato%20sauce%20rice%20bowl%20green%20garnish%20top%20view&image_size=landscape_4_3',
    cookTimeMinutes: 25,
    prepTimeMinutes: 10,
    servingSize: 3,
    dietCategory: 'vegan',
    difficulty: 'easy',
    isFavorite: true,
    favoriteCount: 1842,
    viewCount: 32110,
    authorName: 'Bếp Nhà Mẹ',
    authorAvatar:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=friendly%20asian%20female%20chef%20avatar%20wearing%20green%20apron%20flat%20style&image_size=square',
    tags: ['đậu phụ', 'cà chua', 'nhanh', 'dễ làm', 'cơm nhà'],
    ingredients: [
      { id: 'ig_01', name: 'Đậu phụ tươi', amount: 400, unit: 'g' },
      { id: 'ig_02', name: 'Cà chua chín', amount: 3, unit: 'quả', note: 'chọn quả mềm, đỏ đều' },
      { id: 'ig_03', name: 'Hành tây', amount: 50, unit: 'g' },
      { id: 'ig_04', name: 'Tỏi băm', amount: 1, unit: 'muỗng canh' },
      { id: 'ig_05', name: 'Nước tương', amount: 2, unit: 'muỗng canh' },
      { id: 'ig_06', name: 'Ớt trái cây (tuỳ chọn)', amount: 1, unit: 'quả' },
    ],
    steps: [
      {
        stepNo: 1,
        title: 'Sơ chế đậu phụ',
        description:
          'Đậu phụ cắt miếng 2-3 cm, để ráo nước hoặc ướp nhẹ 1 muỗng cà phê nước tương 5 phút cho thấm đậm đà hơn.',
        tip: 'Để ráo nước bông ăn tẩm đậu phụ, bánh sẽ ít bị dính và vàng đều hơn khi chiên.',
        durationMinutes: 7,
      },
      {
        stepNo: 2,
        title: 'Chiên vàng đậu phụ',
        description:
          'Chảo nóng dầu ăn, đặt từng miếng đậu phụ vào chiên vàng đều 2 mặt, vớt ra đĩa có lót giấy thấm dầu.',
        durationMinutes: 8,
      },
      {
        stepNo: 3,
        title: 'Làm xốt cà chua',
        description:
          'Sử dụng lại dầu còn lại trong chảo, phi thơm tỏi + hành tây băm, thêm cà chua đã cắt múi khoanh vào xào nhừ. Nêm nước tương, chút đường, nhỏ chút nước để cà chua nhừ đều.',
        tip: 'Thêm 1 muỗng cà phê sốt ớt chua ngọt nếu muốn vị đậm đà hơn.',
        durationMinutes: 7,
      },
      {
        stepNo: 4,
        title: 'Toss đậu phụ & hoàn thiện',
        description:
          'Thả đậu phụ chiên vàng vào chảo xốt, lắc nhẹ cho đậu phụ bao đều xốt. Nấu thêm 2-3 phút, rắc rau mùi hoặc hành lá cắt nhỏ rồi tắt bếp.',
        durationMinutes: 3,
      },
    ],
    nutrition: { kcal: 380, proteinG: 22, carbsG: 18, fatG: 24, fiberG: 6 },
    publishedAt: '2026-09-12',
  },
  {
    id: 'r_002_chia_orange',
    title: 'Chia pudding cam ớt hồng sáp',
    description:
      'Bữa sáng siêu nhanh, vị ngọt từ cam đào, hương vani, độ béo từ sữa hạt điều và độ đàn hồi từ hạt chia. Làm tối hôm trước sáng hôm sau ăn liền 1 phút.',
    coverImage:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=vegan%20chia%20pudding%20layered%20glass%20orange%20slices%20mint%20leaf%20wooden%20table&image_size=landscape_4_3',
    cookTimeMinutes: 5,
    prepTimeMinutes: 2,
    servingSize: 2,
    dietCategory: 'vegan',
    difficulty: 'easy',
    isFavorite: false,
    favoriteCount: 1231,
    viewCount: 20891,
    authorName: 'Eat Clean Hà Nội',
    authorAvatar:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=young%20asian%20male%20fitness%20trainer%20avatar%20wearing%20green%20tee%20flat&image_size=square',
    tags: ['chia', 'sáng', 'no cook', 'làm sẵn', 'cao đạm'],
    ingredients: [
      { id: 'ig_01', name: 'Hạt chia', amount: 4, unit: 'muỗng canh' },
      { id: 'ig_02', name: 'Sữa hạt điều không đường', amount: 240, unit: 'ml' },
      { id: 'ig_03', name: 'Cam sành', amount: 1, unit: 'quả' },
      { id: 'ig_04', name: 'Đường phèn', amount: 1, unit: 'muỗng canh', note: 'hoặc thay bằng siro agave' },
      { id: 'ig_05', name: 'Bột vani', amount: 0.25, unit: 'muỗng cà phê' },
    ],
    steps: [
      {
        stepNo: 1,
        description:
          'Lấy lọ thủy tinh có nắp, đổ hạt chia + sữa hạt điều + đường phèn + bột vani vào. Đậy nắp lắc mạnh 30 giây để chia không bị vón cục.',
        durationMinutes: 2,
      },
      {
        stepNo: 2,
        description:
          'Để trong tủ lạnh ít nhất 4 tiếng (hoặc tốt nhất là qua đêm) cho hạt chia nở mềm, thuỷ phân sữa hạt thành dạng pudding đàn hồi.',
        tip: 'Lắc thêm 1 lần sau 30 phút đầu để chia đều hơn.',
        durationMinutes: 3,
      },
      {
        stepNo: 3,
        title: 'Dùng',
        description:
          'Lấy ra, vắt 1/2 quả cam, vớt lớp mùi cam thơm lên trên, thêm lát cam + ớt hồng cắt múi trang trí. Món ăn ngay hoặc có thể để nguội 30 phút nữa cho sánh hơn.',
        durationMinutes: 0,
      },
    ],
    nutrition: { kcal: 240, proteinG: 8, carbsG: 30, fatG: 12, fiberG: 11 },
    publishedAt: '2026-10-01',
  },
  {
    id: 'r_003_brownrice_mushroom',
    title: 'Cơm lứt rang nấm cải thìa thơm tỏi',
    description:
      'Một chén cơm lứt nóng hổi, rang với cải thìa xanh mướt, nấm shimeji dai ngọt, nhánh tỏi phi vàng ăn cực kỳ "đã đàm". Chỉ 1 nồi duy nhất, rửa ít bát.',
    coverImage:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=vegan%20brown%20rice%20fried%20rice%20mushroom%20bok%20choy%20chinese%20bowl%20chopsticks%20top%20view&image_size=landscape_4_3',
    cookTimeMinutes: 30,
    prepTimeMinutes: 10,
    servingSize: 4,
    dietCategory: 'high-protein',
    difficulty: 'medium',
    isFavorite: true,
    favoriteCount: 2310,
    viewCount: 41023,
    authorName: 'Nhật Minh Bếp Chay',
    authorAvatar:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=asian%20male%20chef%20with%20long%20hair%20avatar%20wearing%20bandana%20flat%20style&image_size=square',
    tags: ['cơm lứt', 'nấm', 'cải thìa', '1 nồi', 'bữa chính'],
    ingredients: [
      { id: 'ig_01', name: 'Cơm lứt nấu chín (để nguội)', amount: 700, unit: 'g' },
      { id: 'ig_02', name: 'Nấm shimeji', amount: 200, unit: 'g' },
      { id: 'ig_03', name: 'Cải thìa', amount: 1, unit: 'bó', note: 'chọn bó nhỏ, lá xanh đều' },
      { id: 'ig_04', name: 'Tỏi ta', amount: 6, unit: 'tép' },
      { id: 'ig_05', name: 'Nước tương chay', amount: 3, unit: 'muỗng canh' },
      { id: 'ig_06', name: 'Dầu hào chay (tuỳ chọn)', amount: 1, unit: 'muỗng canh' },
    ],
    steps: [
      {
        stepNo: 1,
        title: 'Sơ chế',
        description:
          'Cải thìa tách lá, cắt rễ, rửa sạch. Nấm shimeji tách cây. Tỏi băm nhỏ, đập dập nửa còn lại để phi thơm.',
        durationMinutes: 8,
      },
      {
        stepNo: 2,
        title: 'Chần cải thìa',
        description:
          'Nước sôi có chút muối, cho cải thìa vào chần 40 giây, vớt ra ngâm ngay trong tô nước lạnh đá để giữ màu xanh giòn ngọt.',
        durationMinutes: 4,
      },
      {
        stepNo: 3,
        title: 'Rang cơm',
        description:
          'Chảo lớn, dầu nóng, phi tỏi vàng, cho nấm vào xào săn. Thêm cơm lứt vào, dùng đũa tơi đều, tưới nước tương, lửa lớn rang đến hạt cơm khô se lại, không vón cục.',
        durationMinutes: 10,
      },
      {
        stepNo: 4,
        title: 'Hoàn thiện',
        description:
          'Cuối cùng, cho cải thìa vào xào cùng 3 nhịp, nêm thêm 1 nhúm tiêu, dầu hào (nếu dùng), tắt bếp, đổ ra chén, rắc hành phi thơm lên trên ăn nóng.',
        durationMinutes: 5,
      },
    ],
    nutrition: { kcal: 470, proteinG: 14, carbsG: 82, fatG: 10, fiberG: 7 },
    publishedAt: '2026-09-25',
  },
  {
    id: 'r_004_yogurt_berry',
    title: 'Sữa chua thực vật phủ trái cây thu đông',
    description:
      'Bữa ăn nhẹ giàu probiotic, lớp sữa chua dừa mềm xốp phủ lên trên lớp quả mọng rực rỡ, nếp cẩm nếp tím nướng giòn.',
    coverImage:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=vegan%20coconut%20yogurt%20bowl%20strawberry%20blueberry%20pomegrante%20granola%20purple%20rice&image_size=landscape_4_3',
    cookTimeMinutes: 15,
    prepTimeMinutes: 5,
    servingSize: 2,
    dietCategory: 'ovo-lacto',
    difficulty: 'easy',
    isFavorite: false,
    favoriteCount: 912,
    viewCount: 17210,
    authorName: 'Yoga Kitchen',
    authorAvatar:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=serene%20asian%20female%20yoga%20instructor%20avatar%20wearing%20green%20top%20flat%20style&image_size=square',
    tags: ['sữa chua', 'trái cây', 'bữa nhẹ', 'làm đẹp da'],
    ingredients: [
      { id: 'ig_01', name: 'Sữa chua dừa không đường', amount: 360, unit: 'g' },
      { id: 'ig_02', name: 'Dâu tây', amount: 150, unit: 'g' },
      { id: 'ig_03', name: 'Việt quất', amount: 80, unit: 'g' },
      { id: 'ig_04', name: 'Lựu tách hạt', amount: 80, unit: 'g' },
      { id: 'ig_05', name: 'Củ năng đường nếp cẩm rang giòn', amount: 30, unit: 'g' },
      { id: 'ig_06', name: 'Si rô agave (tuỳ chọn)', amount: 1, unit: 'muỗng canh' },
    ],
    steps: [
      {
        stepNo: 1,
        description:
          'Sữa chua dừa đã đông từ tủ lạnh, đổ ra tô lớn, dùng thìa đánh nhẹ nhàng đến mịn, thêm si rô agave (nếu muốn thêm ngọt), khuấy đều.',
        durationMinutes: 3,
      },
      {
        stepNo: 2,
        description:
          'Dâu tây cắt múi, việt quất rửa nhẹ nở trong nước lạnh, lựu tách hạt kỹ lưỡng bỏ tép màng trắng để tránh đắng.',
        durationMinutes: 5,
      },
      {
        stepNo: 3,
        description:
          'Đổ sữa chua đánh mịn ra 2 tô nhỏ. Phủ một nửa quả mọng ở lớp dưới, nếp cẩm giòn, rồi phủ tiếp sữa chua còn lại, trang trí mặt trên bằng lát dâu, lựu, việt quất cho đẹp mắt.',
        tip: 'Ăn sau khi làm ngay 15 phút để nếp cẩm vẫn giòn, không bị nổ mềm.',
        durationMinutes: 7,
      },
    ],
    nutrition: { kcal: 290, proteinG: 6, carbsG: 42, fatG: 13, fiberG: 5 },
    publishedAt: '2026-09-08',
  },
  {
    id: 'r_005_canhchua_mushroom',
    title: 'Canh chua nấm đậu thơm bạc hà',
    description:
      'Vị chua thanh từ me, thơm của tỏi phi, nấm kim châm dai giòn, đậu non giòn ngọt. Chén canh nóng hổi cho ngày mưa, ăn cùng bánh mì nướng giòn.',
    coverImage:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=vietnamese%20vegan%20sour%20soup%20canh%20chua%20mushroom%20tofu%20mint%20herbs%20white%20bowl&image_size=landscape_4_3',
    cookTimeMinutes: 20,
    prepTimeMinutes: 8,
    servingSize: 4,
    dietCategory: 'quick',
    difficulty: 'easy',
    isFavorite: false,
    favoriteCount: 560,
    viewCount: 11020,
    authorName: 'Chay Miền Tây',
    authorAvatar:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=elderly%20vietnamese%20female%20chef%20with%20conical%20hat%20avatar%20flat%20style&image_size=square',
    tags: ['canh', 'nấm', 'me', 'nhiệt đới', 'nhanh'],
    ingredients: [
      { id: 'ig_01', name: 'Nấm kim châm', amount: 200, unit: 'g' },
      { id: 'ig_02', name: 'Đậu hũ non kiên', amount: 1, unit: 'hũ' },
      { id: 'ig_03', name: 'Me chua chín', amount: 2, unit: 'muỗng canh', note: 'pha 150ml nước ấm lọc lấy nước' },
      { id: 'ig_04', name: 'Củ cải trắng', amount: 150, unit: 'g' },
      { id: 'ig_05', name: 'Cà chua', amount: 2, unit: 'quả' },
      { id: 'ig_06', name: 'Rau húng quế', amount: 3, unit: 'nhánh' },
    ],
    steps: [
      {
        stepNo: 1,
        description:
          'Cà chua cắt múi, củ cải trắng cắt mỏng 5mm. Nấm kim châm cắt gốc, tách cây. Đậu non kiên cắt lát 2 cm.',
        durationMinutes: 5,
      },
      {
        stepNo: 2,
        title: 'Nấu canh',
        description:
          'Nồi canh 1.5 lít, dầu nhỏ phi tỏi, cho cà chua + củ cải vào xào sơ, đổ nước dùng (nước nấu nấm) vào nấu sôi 5 phút cho củ cải mềm.',
        durationMinutes: 8,
      },
      {
        stepNo: 3,
        description:
          'Thêm nấm, đậu non kiên vào, nấu sôi lại 2 phút, tưới nước me đã lọc vào, nêm nếm lại vừa miệng. Tắt bếp, rắc húng quế + bạc hà lên trên, ăn nóng.',
        tip: 'Không đun sôi lại sau khi cho me, sẽ làm mất hương thơm và vị chua thanh tự nhiên.',
        durationMinutes: 5,
      },
    ],
    nutrition: { kcal: 180, proteinG: 12, carbsG: 18, fatG: 6, fiberG: 5 },
    publishedAt: '2026-10-03',
  },
  {
    id: 'r_006_salad_chia',
    title: 'Salad đậu phụ hạt chia sốt chanh mật ong',
    description:
      'Đĩa salad thanh mát, đậu phụ mềm chiên giòn bên ngoài, sốt chanh mật ong chua ngọt, độ giòn của cải bó xôi + hạt điều rang.',
    coverImage:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=vegan%20tofu%20salad%20spinach%20chia%20seeds%20cashews%20lemon%20dressing%20white%20plate&image_size=landscape_4_3',
    cookTimeMinutes: 15,
    prepTimeMinutes: 10,
    servingSize: 2,
    dietCategory: 'low-fat',
    difficulty: 'easy',
    isFavorite: true,
    favoriteCount: 802,
    viewCount: 15320,
    authorName: 'Eat Clean Hà Nội',
    authorAvatar:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=young%20asian%20male%20fitness%20trainer%20avatar%20wearing%20green%20tee%20flat&image_size=square',
    tags: ['salad', 'giảm cân', 'thanh mát', 'đậu phụ'],
    ingredients: [
      { id: 'ig_01', name: 'Đậu phụ tươi', amount: 300, unit: 'g' },
      { id: 'ig_02', name: 'Cải bó xôi baby', amount: 120, unit: 'g' },
      { id: 'ig_03', name: 'Hạt chia', amount: 1, unit: 'muỗng canh' },
      { id: 'ig_04', name: 'Hạt điều rang', amount: 20, unit: 'g' },
      { id: 'ig_05', name: 'Sốt chanh + mật ong', amount: 3, unit: 'muỗng canh' },
    ],
    steps: [
      {
        stepNo: 1,
        description:
          'Đậu phụ cắt miếng mỏng 5mm, chiên vàng 2 mặt với ít dầu, để nguội trên giấy thấm dầu.',
        durationMinutes: 7,
      },
      {
        stepNo: 2,
        description:
          'Cải bó xôi nhặt hỏng, rửa sạch, ngâm muỗi loãng 5 phút, vớt ra vẩy ráo.',
        durationMinutes: 5,
      },
      {
        stepNo: 3,
        title: 'Trộn salad',
        description:
          'Đĩa lớn, cho cải bó xôi + đậu nguội + hạt điều vào, tưới sốt chanh mật ong, rắc hạt chia lên trên, dùng 2 thìa nhẹ nhàng trộn đều, dùng ngay.',
        durationMinutes: 3,
      },
    ],
    nutrition: { kcal: 260, proteinG: 18, carbsG: 14, fatG: 16, fiberG: 6 },
    publishedAt: '2026-09-22',
  },
  {
    id: 'r_007_pho_tofu',
    title: 'Phở thuần chay đậu phụ nấm shiitake',
    description:
      'Nước dùng phở chay được hầm từ củ cải, củ kiệu, gạo rang, nấm shiitake cho vị ngọt đậm. Tô phở đậm đà nhưng vẫn thanh mát, ăn kèm giá đỗ, húng.',
    coverImage:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=vegan%20vietnamese%20pho%20noodles%20soup%20tofu%20shiitake%20mushroom%20herbs%20lime%20bean%20sprouts&image_size=landscape_4_3',
    cookTimeMinutes: 60,
    prepTimeMinutes: 15,
    servingSize: 4,
    dietCategory: 'high-protein',
    difficulty: 'hard',
    isFavorite: false,
    favoriteCount: 3321,
    viewCount: 58912,
    authorName: 'Hương Phố Cổ',
    authorAvatar:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=asian%20grandmother%20chef%20avatar%20old%20hanoi%20style%20flat&image_size=square',
    tags: ['phở', 'nước dùng', 'hầm lâu', 'tiểu thương'],
    ingredients: [
      { id: 'ig_01', name: 'Bánh phở tươi', amount: 500, unit: 'g' },
      { id: 'ig_02', name: 'Nấm shiitake khô', amount: 80, unit: 'g' },
      { id: 'ig_03', name: 'Đậu phụ hương', amount: 300, unit: 'g' },
      { id: 'ig_04', name: 'Củ cải trắng', amount: 300, unit: 'g' },
      { id: 'ig_05', name: 'Gạo rang', amount: 2, unit: 'muỗng canh' },
      { id: 'ig_06', name: 'Bột phở gia vị', amount: 1, unit: 'muỗng canh' },
      { id: 'ig_07', name: 'Giá đỗ, húng quế, tắc', amount: 300, unit: 'g', note: 'ăn kèm' },
    ],
    steps: [
      {
        stepNo: 1,
        title: 'Hầm nước dùng',
        description:
          'Nấm shiitake ngâm 30 phút nở mềm. Củ cải trắng bổ đôi, nướng trên lửa nhỏ cho thơm. Gạo rang vàng, bỏ tất cả vào nồi nước 2 lít, hầm lửa nhỏ 45 phút, thêm muối, bột phở gia vị.',
        durationMinutes: 45,
      },
      {
        stepNo: 2,
        title: 'Luộc bánh phở',
        description:
          'Bánh phở tươi luộc riêng 1 nồi, đổ ra rổ, rửa qua nước sôi để không bị dính, phân đều ra 4 tô lớn.',
        durationMinutes: 8,
      },
      {
        stepNo: 3,
        title: 'Hoàn thiện',
        description:
          'Đậu hũ cắt lát 1cm, chiên vàng vớt ra. Tô phở: xếp nấm shiitake + đậu chiên + cải thảo chần lên trên. Đổ nước dùng đang sôi hổi, rắc hành lá, tiêu xay, ăn kèm giá, húng, lát tắc.',
        durationMinutes: 7,
      },
    ],
    nutrition: { kcal: 420, proteinG: 22, carbsG: 62, fatG: 11, fiberG: 7 },
    publishedAt: '2026-09-15',
  },
  {
    id: 'r_008_banhmi_chay',
    title: 'Bánh mì chả lụa chay bơ tỏi giòn rụm',
    description:
      'Ống bánh mì giòn vàng bên ngoài, mềm xốp bên trong, phết bơ tỏi thơm lừng, nhồi chả lụa chay, dưa chuột muối, rau sống, ngót tay một ống là no cả buổi.',
    coverImage:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=vietnamese%20vegan%20banh%20mi%20sandwich%20crispy%20baguette%20cilantro%20cucumber%20jalapeno%20top%20view&image_size=landscape_4_3',
    cookTimeMinutes: 20,
    prepTimeMinutes: 10,
    servingSize: 2,
    dietCategory: 'ovo-lacto',
    difficulty: 'medium',
    isFavorite: false,
    favoriteCount: 1402,
    viewCount: 22310,
    authorName: 'Nhật Minh Bếp Chay',
    authorAvatar:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=asian%20male%20chef%20with%20long%20hair%20avatar%20wearing%20bandana%20flat%20style&image_size=square',
    tags: ['bánh mì', 'nhanh', 'mang đi', 'bữa trưa'],
    ingredients: [
      { id: 'ig_01', name: 'Ống bánh mì giòn', amount: 2, unit: 'ống' },
      { id: 'ig_02', name: 'Chả lụa chay (mỳ căn)', amount: 150, unit: 'g' },
      { id: 'ig_03', name: 'Bơ thực vật', amount: 30, unit: 'g' },
      { id: 'ig_04', name: 'Tỏi băm', amount: 1, unit: 'muỗng canh' },
      { id: 'ig_05', name: 'Dưa chuột', amount: 1, unit: 'quả' },
      { id: 'ig_06', name: 'Cà rốt củ cải muối', amount: 80, unit: 'g' },
    ],
    steps: [
      {
        stepNo: 1,
        title: 'Làm bơ tỏi + nướng bánh mì',
        description:
          'Bơ thực vật để mềm, hòa cùng tỏi băm + chút muối, phết đều 2 mặt trong ống bánh mì, đưa vào lò nướng 180°C 5 phút cho ống bánh giòn vàng thơm tỏi.',
        durationMinutes: 8,
      },
      {
        stepNo: 2,
        title: 'Sơ chế nhân',
        description:
          'Chả lụa chay cắt lát mỏng 3mm. Dưa chuột thái chỉ dài, muối nhẹ 10 phút, vẩy bớt nước cho giòn hơn.',
        durationMinutes: 5,
      },
      {
        stepNo: 3,
        title: 'Nhồi bánh mì',
        description:
          'Lấy ống bánh vừa ra lò, trải một lớp chả lụa, xếp dưa chuột, cà rốt củ cải muối, thêm túp tương ớt + sốt mayonnaise chay (nếu thích), kẹp chặt 2 đầu, ăn ngay.',
        tip: 'Nướng bánh mì lần cuối ở 220°C 2 phút sẽ giòn hơn nhiều.',
        durationMinutes: 5,
      },
    ],
    nutrition: { kcal: 560, proteinG: 20, carbsG: 68, fatG: 24, fiberG: 6 },
    publishedAt: '2026-10-02',
  },
  {
    id: 'r_009_banhxeo_chay',
    title: 'Bánh xèo nấm đậu xanh lá lốt',
    description:
      'Vỏ bánh xèo vàng xốp, nụ cười xèo xèo khi mới chiên, nhân nấm bào ngư, giá đỗ, tôm chay giòn dai, cuộn lá lốt ăn kèm nước mắm pha chua ngọt.',
    coverImage:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=vietnamese%20banh%20xeo%20crispy%20vegan%20crepe%20mung%20bean%20mushroom%20bean%20sprouts%20plate%20fish%20sauce%20dip&image_size=landscape_4_3',
    cookTimeMinutes: 35,
    prepTimeMinutes: 15,
    servingSize: 4,
    dietCategory: 'vegan',
    difficulty: 'medium',
    isFavorite: true,
    favoriteCount: 1980,
    viewCount: 34210,
    authorName: 'Chay Miền Tây',
    authorAvatar:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=elderly%20vietnamese%20female%20chef%20with%20conical%20hat%20avatar%20flat%20style&image_size=square',
    tags: ['bánh xèo', 'cuốn lá lốt', 'Nam Bộ', 'giỗ tổ'],
    ingredients: [
      { id: 'ig_01', name: 'Bột bánh xèo', amount: 300, unit: 'g' },
      { id: 'ig_02', name: 'Nước cốt dừa tươi', amount: 250, unit: 'ml' },
      { id: 'ig_03', name: 'Nấm bào ngư', amount: 150, unit: 'g' },
      { id: 'ig_04', name: 'Giá đỗ', amount: 250, unit: 'g' },
      { id: 'ig_05', name: 'Đậu xanh đã ngâm', amount: 100, unit: 'g' },
      { id: 'ig_06', name: 'Lá lốt tươi', amount: 20, unit: 'lá' },
    ],
    steps: [
      {
        stepNo: 1,
        title: 'Pha bột',
        description:
          'Bột bánh xèo + nước cốt dừa + 150ml nước lạnh + 1 nhúm nghệ + 1 nhúm muối, khuấy tan để nghỉ 20 phút cho bột nở mềm.',
        durationMinutes: 20,
      },
      {
        stepNo: 2,
        title: 'Xào nhân',
        description:
          'Chảo nhỏ, dầu nóng phi hành, cho nấm bào ngư cắt lát + đậu xanh vào xào thơm, thêm giá đỗ xào tới 3 nhịp, nêm chút muối + tiêu, tắt bếp, để riêng.',
        durationMinutes: 7,
      },
      {
        stepNo: 3,
        title: 'Đổ bánh xèo',
        description:
          'Chảo chiên bánh, dầu nóng, múc 1/2 chén bột vào, xoay chảo cho bột trải đều. Thêm 1 muỗng canh nhân vào nửa chảo, đậy nắp 2 phút cho vỏ vàng xốp, gấp đôi bánh lại, vớt ra đĩa.',
        tip: 'Lửa trung bình nhỏ không làm vỏ cháy, giữ được màu vàng đẹp & thơm dừa.',
        durationMinutes: 8,
      },
    ],
    nutrition: { kcal: 480, proteinG: 16, carbsG: 60, fatG: 20, fiberG: 7 },
    publishedAt: '2026-09-05',
  },
  {
    id: 'r_010_raw_energyballs',
    title: 'Energy ball sống dừa ca cao',
    description:
      'Không nấu, không đường tinh luyện, chỉ 5 nguyên liệu trộn cùng nhau vo viên lăn dừa nạo. Ăn vặt lành mạnh 2 viên mỗi ngày là đủ năng lượng 1 giờ chạy bộ.',
    coverImage:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=vegan%20raw%20energy%20balls%20cocoa%20coconut%20flakes%20on%20wooden%20board%20chocolate%20bits&image_size=landscape_4_3',
    cookTimeMinutes: 10,
    prepTimeMinutes: 5,
    servingSize: 12,
    dietCategory: 'raw',
    difficulty: 'easy',
    isFavorite: true,
    favoriteCount: 2102,
    viewCount: 37890,
    authorName: 'Yoga Kitchen',
    authorAvatar:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=serene%20asian%20female%20yoga%20instructor%20avatar%20wearing%20green%20top%20flat%20style&image_size=square',
    tags: ['no cook', 'vặt', 'làm sẵn', 'raw food'],
    ingredients: [
      { id: 'ig_01', name: 'Chà là (ngâm mềm 30 phút)', amount: 150, unit: 'g' },
      { id: 'ig_02', name: 'Bột ca cao không đường', amount: 3, unit: 'muỗng canh' },
      { id: 'ig_03', name: 'Hạt óc chó xay', amount: 80, unit: 'g' },
      { id: 'ig_04', name: 'Dừa nạo khô', amount: 40, unit: 'g', note: '2/3 lăn, 1/3 rắc trên' },
      { id: 'ig_05', name: 'Bột vani', amount: 0.25, unit: 'muỗng cà phê' },
    ],
    steps: [
      {
        stepNo: 1,
        description:
          'Chà là đã bỏ hạt + bột ca cao + hạt óc chó xay + bột vani cho vào máy xay, xay nhuyễn thành khối dính.',
        durationMinutes: 3,
      },
      {
        stepNo: 2,
        description:
          'Đổ hỗn hợp ra đĩa, vo đều 12 viên tròn bằng lòng bàn tay. Lăn qua dừa nạo khô cho đều 4 mặt, cho vào hộp có nắp.',
        durationMinutes: 5,
      },
      {
        stepNo: 3,
        description:
          'Để trong tủ lạnh 30 phút cho viên bánh cứng lại, dùng trong 7 ngày. Tặng bạn bè cũng đẹp & ý nghĩa.',
        tip: 'Để thêm 2 hạt muối biển lên mặt 1 viên sẽ làm vị ca cao đậm đà hơn gấp 2 lần.',
        durationMinutes: 2,
      },
    ],
    nutrition: { kcal: 90, proteinG: 3, carbsG: 12, fatG: 5, fiberG: 2 },
    publishedAt: '2026-10-04',
  },
  {
    id: 'r_011_bunrieu_chay',
    title: 'Bún riêu đậu hũ chả cua chay',
    description:
      'Nước dùng riêu chút sệt, vị chua thanh từ cà chua và đậm đà từ chả cua chay (tôm hùm chay + trứng gà). Bún tươi mềm, ăn kèm rau húng, tía tô thơm lừng.',
    coverImage:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=vietnamese%20bun%20rieu%20chay%20vegan%20rice%20noodles%20tomato%20soup%20tofu%20mushrooms%20herbs%20bowl&image_size=landscape_4_3',
    cookTimeMinutes: 45,
    prepTimeMinutes: 15,
    servingSize: 4,
    dietCategory: 'ovo-lacto',
    difficulty: 'hard',
    isFavorite: false,
    favoriteCount: 1091,
    viewCount: 20120,
    authorName: 'Hương Phố Cổ',
    authorAvatar:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=asian%20grandmother%20chef%20avatar%20old%20hanoi%20style%20flat&image_size=square',
    tags: ['bún', 'riêu', 'bữa trưa', 'lễ hội'],
    ingredients: [
      { id: 'ig_01', name: 'Bún tươi', amount: 500, unit: 'g' },
      { id: 'ig_02', name: 'Chả cua chay (tôm hùm chay)', amount: 200, unit: 'g' },
      { id: 'ig_03', name: 'Cà chua', amount: 500, unit: 'g' },
      { id: 'ig_04', name: 'Đậu phụ tươi', amount: 300, unit: 'g' },
      { id: 'ig_05', name: 'Trứng gà (ovo-lacto)', amount: 3, unit: 'quả' },
      { id: 'ig_06', name: 'Tôm chay', amount: 50, unit: 'g' },
    ],
    steps: [
      {
        stepNo: 1,
        title: 'Hầm nước cà chua',
        description:
          'Cà chua cắt múi, phi thơm hành tây băm, cho cà chua + 1.8 lít nước vào, hầm lửa vừa 30 phút cho nước cà sánh lại, nêm nước tương + chút đường, lọc lấy nước trong (hoặc giữ nguyên tùy thích).',
        durationMinutes: 30,
      },
      {
        stepNo: 2,
        title: 'Đổ riêu',
        description:
          'Nước sôi, tưới trứng gà đánh nhẹ từ từ tay, để trứng chín thành sợi, sau đó thả chả cua chay + đậu phụ cắt nhỏ + tôm chay đã ngâm mềm vào, nấu sôi lại 3 phút, tắt bếp.',
        durationMinutes: 10,
      },
      {
        stepNo: 3,
        title: 'Hoàn thiện',
        description:
          'Bún tươi luộc mềm, đổ vào tô, chan nước riêu, rắc hành lá + rau thơm húng quế tía tô, ăn kèm giá đỗ, rau sống, ớt tươi, chanh, tương ớt.',
        durationMinutes: 5,
      },
    ],
    nutrition: { kcal: 410, proteinG: 24, carbsG: 58, fatG: 10, fiberG: 7 },
    publishedAt: '2026-09-20',
  },
  {
    id: 'r_012_carrot_cake',
    title: 'Carrot cake thuần chay kem dừa',
    description:
      'Bánh ẩm mềm vị quế đậm đà, vị ngọt từ củ cà rốt nạo + táo xay nhuyễn, không trứng, không sữa bò, phủ kem dừa whipping lạnh tan trong miệng.',
    coverImage:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=vegan%20carrot%20cake%20slice%20coconut%20cream%20frosting%20walnuts%20cinnamon%20white%20plate&image_size=landscape_4_3',
    cookTimeMinutes: 65,
    prepTimeMinutes: 20,
    servingSize: 8,
    dietCategory: 'vegan',
    difficulty: 'hard',
    isFavorite: false,
    favoriteCount: 1501,
    viewCount: 24320,
    authorName: 'Bánh Bông Lan Sài Gòn',
    authorAvatar:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=young%20asian%20female%20pastry%20chef%20avatar%20wearing%20toque%20flat&image_size=square',
    tags: ['bánh', 'trái cây', 'sinh nhật', 'không trứng'],
    ingredients: [
      { id: 'ig_01', name: 'Bột mì đa dụng', amount: 240, unit: 'g' },
      { id: 'ig_02', name: 'Củ cà rốt nạo sợi nhỏ', amount: 250, unit: 'g' },
      { id: 'ig_03', name: 'Táo đỏ xay nhuyễn', amount: 120, unit: 'g' },
      { id: 'ig_04', name: 'Sữa hạnh nhân không đường', amount: 180, unit: 'ml' },
      { id: 'ig_05', name: 'Dầu thực vật', amount: 80, unit: 'ml' },
      { id: 'ig_06', name: 'Bột quế', amount: 1, unit: 'muỗng cà phê' },
      { id: 'ig_07', name: 'Kem dừa whipping lạnh', amount: 200, unit: 'ml', note: 'phủ kem' },
    ],
    steps: [
      {
        stepNo: 1,
        title: 'Pha bột khô & ướt',
        description:
          'Tô lớn 1: trộn bột mì + baking soda + bột quế + muối. Tô 2: táo xay + sữa hạnh nhân + dầu + đường nâu + vanilla. Đổ khô vào ướt, khuấy nhẹ tay, cuối cùng gấp cà rốt nạo + hạt óc chó vào.',
        durationMinutes: 10,
      },
      {
        stepNo: 2,
        title: 'Nướng bánh',
        description:
          'Khuôn 20cm tròn, lót giấy chống dính, đổ bột vào, đập nhẹ 2 lần cho bột đều, nướng lò 170°C 45-55 phút. Lấy ra treo trên giá cho nguội hoàn toàn mới phủ kem.',
        durationMinutes: 50,
      },
      {
        stepNo: 3,
        title: 'Phủ kem',
        description:
          'Kem dừa + 1 muỗng bột đường xay + vani đánh bông mềm. Phủ đều 2 mặt bánh, rắc thêm cà rốt nạo nhỏ + hạt óc chó nướng + cọng quế trang trí ăn lạnh ngon nhất.',
        tip: 'Bánh ẩm hơn khi để trong hộp kín tủ lạnh qua đêm, bơm ngọt đều từng lớp.',
        durationMinutes: 10,
      },
    ],
    nutrition: { kcal: 310, proteinG: 5, carbsG: 45, fatG: 15, fiberG: 4 },
    publishedAt: '2026-10-05',
  },
]

// ---------- Helpers ----------
function normalize(str: string) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function applyFilter(list: Recipe[], filter: RecipeListFilter): Recipe[] {
  const token = normalize(filter.search)
  let out = list
  if (filter.search.trim()) {
    out = out.filter(
      (r) =>
        normalize(r.title).includes(token) ||
        normalize(r.description).includes(token) ||
        r.tags.some((t) => normalize(t).includes(token)) ||
        r.ingredients.some((ig) => normalize(ig.name).includes(token)),
    )
  }
  if (filter.diet !== 'all') out = out.filter((r) => r.dietCategory === filter.diet)
  if (filter.difficulty !== 'all') out = out.filter((r) => r.difficulty === filter.difficulty)
  if (filter.favoritesOnly) out = out.filter((r) => r.isFavorite)
  return sortRecipes(out, filter.sort)
}

function sortRecipes(list: Recipe[], sort: RecipeSortOption): Recipe[] {
  const arr = [...list]
  switch (sort) {
    case 'newest':
      return arr.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    case 'cooktime_asc':
      return arr.sort((a, b) => a.cookTimeMinutes - b.cookTimeMinutes)
    case 'favorite_desc':
      return arr.sort((a, b) => b.favoriteCount - a.favoriteCount)
    case 'relevance':
    default:
      return arr.sort(
        (a, b) =>
          b.favoriteCount + b.viewCount / 10 - (a.favoriteCount + a.viewCount / 10),
      )
  }
}

// ---------- Public API ----------
export async function getRecipes(
  inputFilter: Partial<RecipeListFilter> = {},
): Promise<RecipeListResponse> {
  await delay()
  const applied: RecipeListFilter = { ...DEFAULT_RECIPE_FILTER, ...inputFilter }
  const items = applyFilter(IN_MEMORY_RECIPES, applied)
  return {
    items,
    totalCount: items.length,
    appliedFilter: applied,
  }
}

export async function getRecipeDetail(id: string): Promise<Recipe | null> {
  await delay()
  const found = IN_MEMORY_RECIPES.find((r) => r.id === id) ?? null
  if (found) return { ...found, ingredients: [...found.ingredients], steps: [...found.steps] }
  return null
}

export async function toggleFavorite(
  id: string,
  nextState?: boolean,
): Promise<{ id: string; isFavorite: boolean; favoriteCount: number }> {
  await delay()
  const idx = IN_MEMORY_RECIPES.findIndex((r) => r.id === id)
  if (idx < 0) {
    return { id, isFavorite: false, favoriteCount: 0 }
  }
  const r = IN_MEMORY_RECIPES[idx]
  const willFavorite = nextState ?? !r.isFavorite
  if (willFavorite && !r.isFavorite) {
    r.favoriteCount += 1
  } else if (!willFavorite && r.isFavorite) {
    r.favoriteCount = Math.max(0, r.favoriteCount - 1)
  }
  r.isFavorite = willFavorite
  return { id: r.id, isFavorite: r.isFavorite, favoriteCount: r.favoriteCount }
}

export { IN_MEMORY_RECIPES as __DEBUG_IN_MEMORY_RECIPES__ }
