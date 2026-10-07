import type {
  AlternativeItem,
  DietaryAssessment,
  FoodScanResult,
  MealplanOption,
  NutritionFact,
  ScannedIngredient,
} from './food-scan.types'

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const MOCK_SCANNED_INGREDIENTS: ScannedIngredient[] = [
  {
    id: 'si-1',
    name: 'Thịt bò băm',
    quantity: '200 g',
    confidence: 0.96,
    isVegan: false,
    isAllergen: false,
    category: 'protein',
    notes: 'Nguồn gốc động vật – không phù hợp Vegan',
  },
  {
    id: 'si-2',
    name: 'Mỡ động vật (bò gà)',
    quantity: '30 ml',
    confidence: 0.88,
    isVegan: false,
    isAllergen: false,
    category: 'seasoning',
    notes: 'Dạng chiên/nướng – chứa cholesterol động vật',
  },
  {
    id: 'si-3',
    name: 'Nước mắm truyền thống',
    quantity: '2 muỗng canh',
    confidence: 0.91,
    isVegan: false,
    isAllergen: false,
    category: 'seasoning',
    notes: 'Làm từ cá – không phù hợp Vegan, thay bằng nước mắm chay',
  },
  {
    id: 'si-4',
    name: 'Cải bó xôi (rau chân vịt)',
    quantity: '150 g',
    confidence: 0.99,
    isVegan: true,
    isAllergen: false,
    category: 'vegetable',
  },
  {
    id: 'si-5',
    name: 'Cà chua đỏ',
    quantity: '2 quả ~ 240 g',
    confidence: 0.98,
    isVegan: true,
    isAllergen: false,
    category: 'vegetable',
  },
  {
    id: 'si-6',
    name: 'Cơm trắng (gạo tẻ)',
    quantity: '1 chén ~ 180 g',
    confidence: 0.95,
    isVegan: true,
    isAllergen: false,
    category: 'grain',
  },
  {
    id: 'si-7',
    name: 'Hành tây, tỏi băm',
    quantity: '40 g',
    confidence: 0.93,
    isVegan: true,
    isAllergen: false,
    category: 'seasoning',
  },
]

const MOCK_DIETARY_ASSESSMENT: DietaryAssessment = {
  overallMatch: 'not_suitable',
  targetDiet: 'Vegan',
  verdictTitle: 'Món ăn này KHÔNG PHÙ HỢP với chế độ Thuần Chay (Vegan)!',
  verdictSubtitle:
    'Món ăn có chứa nguyên liệu nguồn gốc động vật như thịt bò, mỡ động vật và nước mắm cá. Bạn nên chuyển sang các phiên bản chay hoặc tìm các công thức thay thế 100% thực vật trong danh sách gợi ý bên dưới (Z-Algo) để đảm bảo tuân thủ chế độ thuần chay nghiêm ngặt.',
  flags: [
    {
      id: 'nf-1',
      name: 'Nhóm thịt & protein Phân Khác Kiểu (Red Meat & Dairy)',
      detectedIn: 'Thịt bò, mỡ động vật, nước mắm cá (OCR phát hiện nhãn "20% thịt heo tươi")',
      riskLevel: 'high',
      evidence:
        'Thành phần đã xác nhận qua ảnh & mô tả người dùng: 3 trong 7 danh mục phát hiện có nguồn gốc động vật.',
    },
  ],
  confidence: 0.92,
  processedAt: new Date().toISOString(),
  dishName: 'Cơm bò kho cải bó xôi (User xác nhận: món bữa trưa văn phòng)',
}

const MOCK_NUTRITION_FACTS: NutritionFact[] = [
  {
    key: 'calories',
    label: 'Năng lượng (kcal)',
    value: '680 kcal',
    dailyPercent: '34% NRV',
    trend: 'high',
    badge: 'Cao hơn mục tiêu 2000 kcal/ngày',
  },
  {
    key: 'protein',
    label: 'Chất đạm (g)',
    value: '42 g',
    dailyPercent: '84% NRV',
    trend: 'high',
    badge: 'Thừa protein động vật',
  },
  {
    key: 'carbs',
    label: 'Tinh bột tổng (g)',
    value: '52 g',
    dailyPercent: '21% NRV',
    trend: 'medium',
  },
  {
    key: 'fat',
    label: 'Chất béo tổng (g)',
    value: '38 g',
    dailyPercent: '59% NRV',
    trend: 'high',
    badge: 'Dễ tích mỡ thừa',
  },
  {
    key: 'fiber',
    label: 'Chất xơ (g)',
    value: '7.4 g',
    dailyPercent: '30% NRV',
    trend: 'low',
  },
  {
    key: 'sugar',
    label: 'Đường (g)',
    value: '6.5 g',
    dailyPercent: '~ 7% NRV',
    trend: 'low',
  },
  {
    key: 'sodium',
    label: 'Muối (mg)',
    value: '1480 mg',
    dailyPercent: '74% NRV',
    trend: 'high',
    badge: 'Gần mức giới hạn WHO ngày',
  },
  {
    key: 'cholesterol',
    label: 'Cholesterol (mg)',
    value: '130 mg',
    dailyPercent: '43% NRV',
    trend: 'medium',
  },
  {
    key: 'iron',
    label: 'Sắt (mg)',
    value: '5.4 mg',
    dailyPercent: '30% NRV',
    trend: 'medium',
    badge: 'Sắt heme – hấp thu cao nhưng khối thận',
  },
  {
    key: 'vitaminC',
    label: 'Vitamin C (mg)',
    value: '18 mg',
    dailyPercent: '20% NRV',
    trend: 'low',
  },
]

const MOCK_ALTERNATIVES: AlternativeItem[] = [
  {
    id: 'alt-1',
    original: 'Thịt bò băm',
    substituteName: 'Nấm hương thái hạt lựu + Đậu nành protein (Textured Soy)',
    substituteType: 'Thay thế 2 trong 1 (vị Umami + cảm giác dai)',
    swapRatio: '1:1 trọng lượng – Ưu tiên sần sơ qua dầu ô liu trước khi kho',
    whyItWorks:
      'Tạo độ giòn, thấm vị tương tự thịt băm; giảm cholesterol động vật, tăng chất xơ và các hoạt chất chống oxy hóa từ nấm.',
    flavorMatch: 0.9,
    nutritionMatch: 0.88,
    priceHint: 'Tiết kiệm ~ 30% so với thịt bò',
    availabilityTag: 'Dễ mua tại siêu thị, cửa hàng bán đồ chay',
  },
  {
    id: 'alt-2',
    original: 'Mỡ động vật, Nước mắm cá, Pha chế',
    substituteName: 'Dầu gạo (Rice Bran Oil) + Nước tương chay (Low Sodium) + Nước mắm chay (Vegan Fish Sauce từ tảo bẹ & đạm đậu nành)',
    substituteType: 'Z-Algo: bộ thay thế 3 thành phần – giảm mỡ bão hòa, loại bỏ nguồn gốc động vật',
    swapRatio:
      'Dầu gạo thay thế 1:1 thể tích / Nước tương + Nước mắm chay: 1.5 muỗng canh thay 2 muỗng canh nước mắm truyền thống',
    whyItWorks:
      'Bảo toàn vị mặn umami, loại bỏ hoàn toàn cholesterol và protein cá; bổ sung gamma oryzanol và phytosterol có lợi cho tim mạch.',
    flavorMatch: 0.85,
    nutritionMatch: 0.92,
    priceHint: 'Chênh lệch ~ 8% – cao hơn một chút nhưng an toàn cho chế độ Vegan',
    availabilityTag: 'Dễ tìm tại Co.opmart, Lotte, các tiệm chay chuyên biệt',
  },
  {
    id: 'alt-3',
    original: 'Đế cơm trắng + Rau củ nấu kèm',
    substituteName: 'Đế rau củ nướng (bí ngòi, cà tím, súp lơ) với Cơm gạo lứt 1/2 chén',
    substituteType: 'Swap Đế – Thay thế 1/2 lượng tinh bột trắng bằng rau củ màu',
    swapRatio:
      '70 g gạo lứt khô (1/2 chén nấu chín) + 200 g hỗn hợp rau củ nướng / áp chảo',
    whyItWorks:
      'Đẩy mạnh nhóm rau màu, tăng gấp đôi chất xơ và 2.6 lần vitamin A so với cơm trắng thuần; giữ đường huyết ổn định sau bữa ăn.',
    flavorMatch: 0.82,
    nutritionMatch: 0.95,
    priceHint: 'Tiết kiệm chi phí sạch sẽ & dễ chuẩn bị',
    availabilityTag: 'Nguyên liệu luôn có sẵn tại chợ rau củ',
  },
]

const MOCK_MEALPLAN_OPTIONS: MealplanOption[] = [
  {
    id: 'mp-1',
    day: 'Thứ Hai (06/10)',
    dayIndex: 1,
    slots: [
      { key: 'breakfast', label: 'Sáng', recipeCount: 2 },
      { key: 'lunch', label: 'Trưa', recipeCount: 3 },
      { key: 'dinner', label: 'Tối', recipeCount: 2 },
      { key: 'snack', label: 'Xế', recipeCount: 1 },
    ],
    totalItems: 8,
    calTargetMatch: 'Trùng khớp mục tiêu 1800 kcal – 15% protein chay',
    filledPercentage: 82,
  },
  {
    id: 'mp-2',
    day: 'Thứ Ba (07/10) – Thứ Sáu (10/10)',
    dayIndex: 2,
    slots: [
      { key: 'breakfast', label: 'Sáng', recipeCount: 4 },
      { key: 'lunch', label: 'Trưa', recipeCount: 3 },
      { key: 'dinner', label: 'Tối', recipeCount: 3 },
      { key: 'snack', label: 'Xế', recipeCount: 2 },
    ],
    totalItems: 12,
    calTargetMatch: 'Đã có thểm Combo Đồ Ăn Vặt Chay – 2 món / ngày',
    filledPercentage: 64,
  },
]

export async function analyzeFoodImage(
  _imageFile: File | null,
  abortSignal?: AbortSignal
): Promise<FoodScanResult> {
  for (const step of [220, 300, 260]) {
    await delay(step)
    if (abortSignal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }
  }

  return {
    id: 'fs-' + Math.random().toString(36).slice(2, 10),
    scannedAt: new Date().toISOString(),
    dietaryAssessment: MOCK_DIETARY_ASSESSMENT,
    nutritionBreakdown: {
      totalCalories: 680,
      proteinG: 42,
      carbsG: 52,
      fatG: 38,
      fiberG: 7.4,
      sugarG: 6.5,
      sodiumMg: 1480,
      cholesterolMg: 130,
      vitaminA_IU: 2400,
      vitaminC_MG: 18,
      calcium_MG: 140,
      iron_MG: 5.4,
    },
    nutritionFacts: MOCK_NUTRITION_FACTS,
    alternatives: MOCK_ALTERNATIVES,
    mealplanOptions: MOCK_MEALPLAN_OPTIONS,
    scannedIngredients: MOCK_SCANNED_INGREDIENTS,
  }
}

export async function addScanToMealplan(
  _scanId: string,
  _slot: { dayIndex: number; key: 'breakfast' | 'lunch' | 'dinner' | 'snack' }
): Promise<{ ok: true; updatedAt: string }> {
  await delay(600)
  return { ok: true, updatedAt: new Date().toISOString() }
}
