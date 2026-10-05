import type {
  CategoryOption,
  DietOption,
  DietType,
  TimeRangeOption,
  CalorieRangeOption,
  RecipeSummary,
  FetchRecipesParams,
  RecipeListResponse,
  RecipeDetail,
} from '../types/recipes.types';

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'main_dish', label: 'Món chính' },
  { key: 'salad', label: 'Salad' },
  { key: 'soup', label: 'Món nước' },
  { key: 'dessert', label: 'Tráng miệng' },
  { key: 'drink', label: 'Thức uống' },
  { key: 'side_dish', label: 'Món phụ' },
];

const DIET_VEGAN: DietType = 'Thuần chay(Vegan)';
const DIET_LACTO: DietType = 'Chay có sữa(Lacto)';
const DIET_OVO: DietType = 'Chay có trứng(Ovo)';
const DIET_LACTO_OVO: DietType = 'Trứng & sữa(LactoOvo)';

export const DIET_OPTIONS: DietOption[] = [
  { key: 'all', label: 'Tất cả' },
  { key: DIET_VEGAN, label: 'Thuần chay' },
  { key: DIET_LACTO, label: 'Lacto' },
  { key: DIET_OVO, label: 'Ovo' },
  { key: DIET_LACTO_OVO, label: 'Lacto-Ovo' },
];

export const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { key: 'all', label: 'Tất cả thời gian' },
  { key: 'under_15', label: 'Dưới 15 phút', maxMinutes: 15 },
  { key: '15_30', label: '15 - 30 phút', minMinutes: 15, maxMinutes: 30 },
  { key: '30_60', label: '30 - 60 phút', minMinutes: 30, maxMinutes: 60 },
  { key: 'over_60', label: 'Trên 60 phút', minMinutes: 60 },
];

export const CALORIE_RANGE_OPTIONS: CalorieRangeOption[] = [
  { key: 'all', label: 'Tất cả mức calo' },
  { key: 'under_200', label: 'Dưới 200 kcal', maxKcal: 200 },
  { key: '200_400', label: '200 - 400 kcal', minKcal: 200, maxKcal: 400 },
  { key: '400_600', label: '400 - 600 kcal', minKcal: 400, maxKcal: 600 },
  { key: 'over_600', label: 'Trên 600 kcal', minKcal: 600 },
];

const MOCK_RECIPES: RecipeSummary[] = [
  {
    id: 'r1',
    name: 'Đậu hũ sốt nấm',
    category: 'Món chính',
    imageUrl:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Tofu%20with%20mushroom%20sauce%20Vietnamese%20vegetarian%20dish%20on%20white%20plate%20cozy%20kitchen%20natural%20light&image_size=square_hd',
    cookTimeMinutes: 25,
    caloriesPerServing: 320,
    suitableDiets: [DIET_VEGAN, DIET_LACTO, DIET_OVO, DIET_LACTO_OVO],
    suitabilityScore: 98,
  },
  {
    id: 'r2',
    name: 'Cơm gạo lứt rau củ',
    category: 'Món chính',
    imageUrl:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Brown%20rice%20with%20roasted%20vegetables%20vegetarian%20meal%20bowl%20healthy%20fresh%20natural%20light&image_size=square_hd',
    cookTimeMinutes: 35,
    caloriesPerServing: 380,
    suitableDiets: [DIET_VEGAN, DIET_LACTO, DIET_OVO, DIET_LACTO_OVO],
    suitabilityScore: 95,
  },
  {
    id: 'r3',
    name: 'Salad bơ và đậu gà',
    category: 'Salad',
    imageUrl:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Avocado%20chickpea%20salad%20fresh%20green%20bowl%20healthy%20vegetarian%20lunch%20natural%20light&image_size=square_hd',
    cookTimeMinutes: 15,
    caloriesPerServing: 290,
    suitableDiets: [DIET_VEGAN, DIET_LACTO, DIET_OVO, DIET_LACTO_OVO],
    suitabilityScore: 92,
  },
  {
    id: 'r4',
    name: 'Bún chay thanh đạm',
    category: 'Món nước',
    imageUrl:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vegetarian%20rice%20noodle%20soup%20Vietnamese%20bun%20chay%20fresh%20herbs%20mushrooms%20warm%20bowl&image_size=square_hd',
    cookTimeMinutes: 35,
    caloriesPerServing: 340,
    suitableDiets: [DIET_VEGAN, DIET_LACTO, DIET_OVO, DIET_LACTO_OVO],
    suitabilityScore: 90,
  },
  {
    id: 'r5',
    name: 'Mì xào giòn rau củ thập cẩm',
    category: 'Món chính',
    imageUrl:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Crispy%20stir%20fried%20noodles%20with%20mixed%20vegetables%20Chinese%20style%20vegetarian%20plate&image_size=square_hd',
    cookTimeMinutes: 25,
    caloriesPerServing: 320,
    suitableDiets: [DIET_VEGAN, DIET_LACTO, DIET_LACTO_OVO],
    suitabilityScore: 88,
  },
  {
    id: 'r6',
    name: 'Canh nấm hạt sen tào đỏ',
    category: 'Món nước',
    imageUrl:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Lotus%20seed%20mushroom%20soup%20Asian%20vegetarian%20clear%20broth%20elegant%20bowl%20warm%20light&image_size=square_hd',
    cookTimeMinutes: 40,
    caloriesPerServing: 210,
    suitableDiets: [DIET_VEGAN, DIET_LACTO, DIET_OVO, DIET_LACTO_OVO],
    suitabilityScore: 94,
  },
  {
    id: 'r7',
    name: 'Cháo yến mạch rau củ',
    category: 'Món chính',
    imageUrl:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Hearty%20oat%20porridge%20with%20vegetables%20healthy%20savory%20breakfast%20bowl%20warm%20cozy&image_size=square_hd',
    cookTimeMinutes: 15,
    caloriesPerServing: 280,
    suitableDiets: [DIET_VEGAN, DIET_LACTO, DIET_LACTO_OVO],
    suitabilityScore: 89,
  },
  {
    id: 'r8',
    name: 'Cà ri rau củ nước cốt dừa',
    category: 'Món chính',
    imageUrl:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vegetable%20coconut%20curry%20Vietnamese%20Ca%20ri%20vegetarian%20rich%20creamy%20bowl%20fresh%20herbs&image_size=square_hd',
    cookTimeMinutes: 45,
    caloriesPerServing: 420,
    suitableDiets: [DIET_VEGAN, DIET_LACTO, DIET_OVO, DIET_LACTO_OVO],
    suitabilityScore: 96,
  },
];

function filterMockRecipes(params: FetchRecipesParams): RecipeSummary[] {
  let result = [...MOCK_RECIPES];

  if (params.search && params.search.trim().length > 0) {
    const q = params.search.trim().toLowerCase();
    result = result.filter((r) => r.name.toLowerCase().includes(q));
  }

  if (params.category && params.category !== 'all') {
    const categoryLabel =
      CATEGORY_OPTIONS.find((c) => c.key === params.category)?.label ?? '';
    if (categoryLabel) {
      result = result.filter((r) => r.category === categoryLabel);
    }
  }

  const dietFilter = params.diet;
  if (dietFilter) {
    result = result.filter((r) => r.suitableDiets.includes(dietFilter));
  }

  if (params.timeRangeKey && params.timeRangeKey !== 'all') {
    const opt = TIME_RANGE_OPTIONS.find((t) => t.key === params.timeRangeKey);
    if (opt) {
      result = result.filter((r) => {
        const okMin = opt.minMinutes == null || r.cookTimeMinutes >= opt.minMinutes;
        const okMax = opt.maxMinutes == null || r.cookTimeMinutes <= opt.maxMinutes;
        return okMin && okMax;
      });
    }
  }

  if (params.calorieRangeKey && params.calorieRangeKey !== 'all') {
    const opt = CALORIE_RANGE_OPTIONS.find((c) => c.key === params.calorieRangeKey);
    if (opt) {
      result = result.filter((r) => {
        const okMin = opt.minKcal == null || r.caloriesPerServing >= opt.minKcal;
        const okMax = opt.maxKcal == null || r.caloriesPerServing <= opt.maxKcal;
        return okMin && okMax;
      });
    }
  }

  return result;
}

export async function fetchRecipes(
  params: FetchRecipesParams = {},
): Promise<RecipeListResponse> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 8;

  try {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value != null && value !== '') {
        query.set(key, String(value));
      }
    });
    const res = await fetch(`/api/recipes?${query.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = (await res.json()) as RecipeListResponse;
      return data;
    }
  } catch {
    // fallthrough to mock
  }

  await new Promise((resolve) => setTimeout(resolve, 600));

  const all = filterMockRecipes(params);
  const totalItems = all.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const items = all.slice(start, start + pageSize);

  return {
    items,
    pagination: {
      page: safePage,
      pageSize,
      totalItems,
      totalPages,
    },
  };
}

const MOCK_RECIPE_DETAIL: RecipeDetail = {
  id: 'r1',
  name: 'Đậu hũ sốt nấm',
  category: 'Món chính',
  imageUrl:
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Tofu%20with%20mushroom%20sauce%20Vietnamese%20vegetarian%20dish%20on%20white%20plate%20cozy%20kitchen%20natural%20light&image_size=square_hd',
  description:
    'Món đậu hũ sốt nấm dày sánh, mềm mịn mà có thể chế biến tại nhà cực đơn giản và nhanh gọn.',
  servings: '2 khẩu phần (M)',
  caloriesPerServing: 320,
  suitableDietLabel: 'Mọi chế độ ăn',
  difficultyLabel: 'Dễ',
  timing: {
    prepMinutes: 10,
    cookMinutes: 20,
    totalMinutes: 30,
  },
  ingredients: [
    { name: 'Đậu hũ', amount: '220g' },
    { name: 'Nấm', amount: '90g' },
    { name: 'Cà rốt', amount: '40g' },
    { name: 'Hạt tiêu trắng', amount: '20g' },
    { name: 'Nước tương', amount: '2 muỗng canh' },
    { name: 'Đường cát', amount: '1 muỗng cà phê' },
    { name: 'Tỏi', amount: 'vừa đủ' },
  ],
  steps: [
    {
      order: 1,
      title: 'Bước 1',
      description: 'Thái cà rốt hạt lựu, nấu nhuyễn cà chua mịn như dạ.',
    },
    {
      order: 2,
      title: 'Bước 2',
      description: 'Phi thơm tỏi với dầu ăn nóng.',
    },
    {
      order: 3,
      title: 'Bước 3',
      description: 'Áp chảo đậu hũ hai mặt vàng đều.',
    },
    {
      order: 4,
      title: 'Bước 4',
      description: 'Cho nấm vào đảo đều đến chín tới.',
    },
    {
      order: 5,
      title: 'Bước 5',
      description: 'Thêm nước tương, tiêu bột và đường vào.',
    },
    {
      order: 6,
      title: 'Bước 6',
      description: 'Đun nhỏ lửa đến khi gia vị hòa quyện hoàn toàn.',
    },
  ],
  nutrition: {
    caloriesKcal: 320,
    proteinG: 10,
    carbsG: 25,
    fatG: 14,
  },
  relatedArticles: [
    {
      id: 'a1',
      title: 'Cách chế biến protein kỹ an chuyên',
      excerpt: 'Phân tích nguồn đạm thực vật tốt, chuẩn bị đúng phương pháp và tối ưu hấp thụ cho cơ thể.',
      imageUrl:
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Variety%20of%20vegan%20protein%20sources%20bowls%20chickpeas%20tofu%20lentils%20quinoa%20on%20wooden%20table%20natural%20light&image_size=square_hd',
      readMinutes: 8,
    },
    {
      id: 'a2',
      title: 'Những lợi ích của đậu hũ',
      excerpt: 'Từ bảo quản đến chế biến, làm sao để giữ dưỡng chất và phát huy tối đa giá trị đậu hũ Việt Nam.',
      imageUrl:
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Fresh%20tofu%20blocks%20and%20soybeans%20healthy%20vegan%20ingredients%20light%20minimal%20background%20soft%20lighting&image_size=square_hd',
      readMinutes: 7,
    },
    {
      id: 'a3',
      title: 'Mẹo cân bằng bữa ăn chay hiệu quả',
      excerpt: 'Hướng dẫn phối hợp tỷ lệ, cân bằng dưỡng chất trong từng bữa ăn của bạn mỗi ngày.',
      imageUrl:
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Balanced%20vegan%20meal%20platter%20colorful%20vegetables%20grains%20legumes%20healthy%20portions%20wooden%20table&image_size=square_hd',
      readMinutes: 6,
    },
  ],
  relatedVideos: [
    {
      id: 'v1',
      title: 'Cách làm đậu hũ sốt nấm trong 20 phút',
      duration: '20:14',
      thumbnailUrl:
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vietnamese%20tofu%20mushroom%20sauce%20cooking%20video%20thumbnail%20dark%20background%20dish%20closeup&image_size=landscape_16_9',
      channelName: 'Bếp Chay 1975',
    },
    {
      id: 'v2',
      title: 'Cách lựa bột ăn cùng đậu hũ',
      duration: '15:42',
      thumbnailUrl:
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vegan%20cooking%20show%20tofu%20stir%20fry%20video%20thumbnail%20kitchen%20scene%20warm%20light&image_size=landscape_16_9',
      channelName: 'Đậu Việt Channel',
    },
    {
      id: 'v3',
      title: 'Các mẹo làm đậu ngũ vị giòn',
      duration: '18:14',
      thumbnailUrl:
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Crispy%20five%20spice%20fried%20tofu%20video%20thumbnail%20dark%20food%20photography&image_size=landscape_16_9',
      channelName: 'Bếp Nhà Sài',
    },
  ],
  relatedRestaurants: [
    {
      id: 's1',
      name: 'Nhà hàng Chay Lê Lợi',
      address: 'Số 42 Nguyễn Bỉnh Khiêm, Quận 1, TP.HCM',
      distanceKm: 2.1,
      imageUrl:
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Cozy%20Vietnamese%20vegetarian%20restaurant%20interior%20green%20decor%20wooden%20tables&image_size=square_hd',
    },
    {
      id: 's2',
      name: 'Tiệm Chay Mộc Viên',
      address: '48 Đường Hồng Bàng, Phường 12, Q.10, TP. Hồ Chí Minh',
      distanceKm: 2.8,
      imageUrl:
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Elegant%20Vietnamese%20vegan%20restaurant%20exterior%20green%20signage%20traditional%20design&image_size=square_hd',
    },
  ],
};

const DEFAULT_INGREDIENTS: RecipeDetail['ingredients'] = [
  { name: 'Đậu hũ', amount: '220g' },
  { name: 'Nấm', amount: '90g' },
  { name: 'Cà rốt', amount: '40g' },
  { name: 'Hạt tiêu trắng', amount: '20g' },
  { name: 'Nước tương', amount: '2 muỗng canh' },
  { name: 'Đường cát', amount: '1 muỗng cà phê' },
  { name: 'Tỏi', amount: 'vừa đủ' },
];

const DEFAULT_STEPS: RecipeDetail['steps'] = [
  { order: 1, title: 'Bước 1', description: 'Thái cà rốt hạt lựu, nấu nhuyễn cà chua mịn như dạ.' },
  { order: 2, title: 'Bước 2', description: 'Phi thơm tỏi với dầu ăn nóng.' },
  { order: 3, title: 'Bước 3', description: 'Áp chảo đậu hũ hai mặt vàng đều.' },
  { order: 4, title: 'Bước 4', description: 'Cho nấm vào đảo đều đến chín tới.' },
  { order: 5, title: 'Bước 5', description: 'Thêm nước tương, tiêu bột và đường vào.' },
  { order: 6, title: 'Bước 6', description: 'Đun nhỏ lửa đến khi gia vị hòa quyện hoàn toàn.' },
];

function buildMockDetailFor(recipe: RecipeSummary): RecipeDetail {
  const cookMinutes = recipe.cookTimeMinutes;
  const prepMinutes = Math.max(5, Math.floor(cookMinutes / 3));
  const totalMinutes = prepMinutes + cookMinutes;
  const calories = recipe.caloriesPerServing;
  const protein = Math.max(5, Math.floor(calories * 0.12 / 4));
  const carbs = Math.max(15, Math.floor(calories * 0.5 / 4));
  const fat = Math.max(5, Math.floor(calories * 0.3 / 9));

  return {
    id: recipe.id,
    name: recipe.name,
    category: recipe.category,
    imageUrl: recipe.imageUrl,
    description: `Công thức ${recipe.name} ngon miệng, dinh dưỡng, dễ thực hiện tại nhà với các nguyên liệu thuần chay quen thuộc.`,
    servings: '2 khẩu phần (M)',
    caloriesPerServing: calories,
    suitableDietLabel:
      recipe.suitableDiets.length >= 4
        ? 'Mọi chế độ ăn'
        : recipe.suitableDiets.join(', '),
    difficultyLabel: cookMinutes <= 20 ? 'Dễ' : cookMinutes <= 40 ? 'Trung bình' : 'Khó',
    timing: {
      prepMinutes,
      cookMinutes,
      totalMinutes,
    },
    ingredients: DEFAULT_INGREDIENTS,
    steps: DEFAULT_STEPS,
    nutrition: {
      caloriesKcal: calories,
      proteinG: protein,
      carbsG: carbs,
      fatG: fat,
    },
    relatedArticles: MOCK_RECIPE_DETAIL.relatedArticles,
    relatedVideos: MOCK_RECIPE_DETAIL.relatedVideos,
    relatedRestaurants: MOCK_RECIPE_DETAIL.relatedRestaurants,
  };
}

export async function fetchRecipeDetail(id: string): Promise<RecipeDetail | null> {
  if (!id.trim()) return null;

  let usedMockFallback = false;
  try {
    const res = await fetch(`/api/recipes/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = (await res.json()) as RecipeDetail;
      return data;
    }
    usedMockFallback = true;
  } catch {
    usedMockFallback = true;
  }

  if (usedMockFallback) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (id === MOCK_RECIPE_DETAIL.id) return MOCK_RECIPE_DETAIL;
    const match = MOCK_RECIPES.find((r) => r.id === id);
    if (match) return buildMockDetailFor(match);
    return null;
  }

  return null;
}
