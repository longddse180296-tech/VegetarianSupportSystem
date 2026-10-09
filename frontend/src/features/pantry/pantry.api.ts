import type {
  AddIngredientRequest,
  CheckedIngredient,
  ExpertInsight,
  PantryAiSuggestionResult,
  PantryIngredient,
  PantryRecipeSuggestion,
  SwapSuggestion,
} from './pantry.types'

const DEFAULT_INGREDIENTS: PantryIngredient[] = [
  { id: 'ig-1', name: 'Đậu hũ trắng (300g)', quantityGram: 300, category: 'protein', unit: 'g' },
  { id: 'ig-2', name: 'Nấm hương tươi (150g)', quantityGram: 150, category: 'vegetable', unit: 'g' },
  { id: 'ig-3', name: 'Cà chua chín mọng (2 quả)', quantityGram: 240, category: 'vegetable', unit: 'quả' },
  { id: 'ig-4', name: 'Đậu hào (Hàu oyster)', quantityGram: 120, category: 'other', unit: 'g' },
  { id: 'ig-5', name: 'Trứng gà tươi', quantityGram: 100, category: 'protein', unit: 'quả' },
]

const DEFAULT_CHECKED: CheckedIngredient[] = [
  {
    id: 'ig-1',
    name: 'Đậu hũ trắng (300g)',
    quantityGram: 300,
    category: 'protein',
    assessment: 'vegan_safe',
    evidence:
      'Thành phần đậu nành + nước + chất đông đặc thực vật (Nigari / MgCl₂) – không sữa, không gelatin, mũi đông vật khi đảm bảo món chay an tuyệt đối.',
    canKeepFor: 'vegan',
  },
  {
    id: 'ig-2',
    name: 'Nấm hương tươi (150g)',
    quantityGram: 150,
    category: 'vegetable',
    assessment: 'vegan_safe',
    evidence: 'Rau củ sạch, tự nhiên, không chế biến gia vị động vật.',
    canKeepFor: 'vegan',
  },
  {
    id: 'ig-3',
    name: 'Cà chua chín mọng (2 quả)',
    quantityGram: 240,
    category: 'vegetable',
    assessment: 'vegan_safe',
    evidence: 'Trái cây - rau màu sạch, chế biến tự nhiên không có phụ gia động vật.',
    canKeepFor: 'vegan',
  },
  {
    id: 'ig-4',
    name: 'Đậu hào (Hàu oyster)',
    quantityGram: 120,
    category: 'other',
    assessment: 'not_vegan',
    evidence:
      'Chứa chất hàu khai thác biển động vật. Không phù hợp với người thuần chay ở bất kỳ hình thức chuẩn nào.',
    canKeepFor: 'none',
  },
  {
    id: 'ig-5',
    name: 'Trứng gà tươi',
    quantityGram: 100,
    category: 'protein',
    assessment: 'ovo_lacto_only',
    evidence:
      'Không phù hợp với chế độ Thuần chay (Vegan). Chỉ phù hợp với chế độ ăn Ovo-Lacto-ovo vegetarian.',
    canKeepFor: 'ovo_lacto',
  },
]

const DEFAULT_SWAPS: SwapSuggestion[] = [
  {
    id: 'sw-1',
    targetIngredientId: 'ig-4',
    originalName: 'Đậu hào (hàu khai thác biển động vật)',
    substituteName: 'Sợi đậu hũ chay & nước hầm rau củ khử vị ngọt umami (hủ tiếu khô)',
    substituteType: 'Nguyên liệu thay thế – Đạm từ đậu nành + Rau củ ngâm',
    swapRatio: 'Đậu hào 100g → Sợi đậu hũ chay 140g + nước hầm rau củ 120ml',
    whyItWorks:
      'Sợi đậu hũ khô mềm xốp + gia vị hầm nấm + củ cải khô + hành tây nướng cho vị umami gần giống hàu, giữ được độ dai đặc trưng. Dùng cho món canh, xào, kho đều hợp lý.',
    flavorMatch: 0.85,
    nutritionMatch: 0.78,
    priceHint: 'Rẻ hơn ~35% so với đậu hào tươi',
    availabilityTag: 'Có sẵn tại chợ / siêu thị',
  },
  {
    id: 'sw-2',
    targetIngredientId: 'ig-5',
    originalName: 'Đậu hũ non tán nhuyễn xào bột nghệ (hình thức Scramble)',
    substituteName: 'Tofu Scramble (Đậu hũ non tán nhuyễn + Nghệ + Bột dinh dưỡng yeast)',
    substituteType: 'Công thức chế biến – Thay thế hương vị trứng ốp la',
    swapRatio: 'Trứng 2 quả → Đậu hũ non 200g + Nghệ 5g + Yeast 8g',
    whyItWorks:
      'Đậu hũ non tán nhuyễn + gia vị ớt bột / tỏi / nghệ + yeast flakes cho vị béo và cảm giác ăn giống trứng scramble mà hoàn toàn thuần thực vật, bổ sung B12 từ yeast.',
    flavorMatch: 0.79,
    nutritionMatch: 0.9,
    priceHint: 'Tiết kiệm ~28% so với dùng trứng gà sạch organic',
    availabilityTag: 'Có sẵn tại chợ / siêu thị',
  },
]

const DEFAULT_RECIPES: PantryRecipeSuggestion[] = [
  {
    id: 'rec-1',
    title: 'Đậu hũ sốt cà chua nấm hương thanh vị',
    subtitle:
      'Đậu hũ áp chảo vàng giòn với sốt cà chua tự nấu đậm đà, phối hợp nấm hương (Cỏ hoàng thảo khô đậm nét Umami).',
    coverImageUrl:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=A%20top%20down%20view%20of%20a%20vegan%20tofu%20in%20tomato%20sauce%20with%20shiitake%20mushrooms%20and%20fresh%20herbs%2C%20in%20a%20ceramic%20bowl%20on%20wooden%20table%2C%20Vietnamese%20home%20cooking%20style&image_size=landscape_16_9',
    cookTimeMin: 20,
    badges: [
      { label: '100% Thuần Chay (Vegan)', variant: 'success' },
      { label: 'Khớp 3/3 nguyên liệu tủ bếp của bạn', variant: 'info' },
    ],
    matchedIngredientIds: ['ig-1', 'ig-2', 'ig-3'],
    ingredientSummary:
      'Tủ bếp: Đậu hũ (IG-1) ✅ + Nấm hương (IG-2) ✅ + Cà chua (IG-3) ✅ → Các bước: Hương vị / Xào mềm / Kho thấm',
    nutrition: { calories: 320, proteinG: 18.5, carbsG: 16.2, goodFatG: 12.0 },
    isVeganVerified: true,
    veganConfidence: 1.0,
  },
  {
    id: 'rec-2',
    title: 'Canh nấm đậu hũ cà chua chưa ngọt',
    subtitle:
      'Canh thanh nhiệt giải độc, nước dùng trầm thanh từ củ cải khô, nấm hương tươi, đậu hũ non mềm tan trong miệng, ít muối Natri hơn so với món thường.',
    coverImageUrl:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=A%20warm%20vegan%20soup%20with%20soft%20tofu%2C%20shiitake%20mushrooms%2C%20tomato%20chunks%20and%20scallions%20in%20a%20white%20ceramic%20pot%2C%20Vietnamese%20light%20vegetable%20broth%2C%20top%20view&image_size=landscape_16_9',
    cookTimeMin: 15,
    badges: [
      { label: '100% Thuần Chay (Vegan)', variant: 'success' },
      { label: 'Khớp 3/3 nguyên liệu tủ bếp của bạn', variant: 'info' },
    ],
    matchedIngredientIds: ['ig-1', 'ig-2', 'ig-3'],
    ingredientSummary:
      'Tủ bếp: Đậu hũ (IG-1) ✅ + Nấm hương (IG-2) ✅ + Cà chua (IG-3) ✅ + Gia vị pha chế: Bột ngọt, hạt nêm chay, muối',
    nutrition: { calories: 180, proteinG: 12.0, carbsG: 14.0, goodFatG: 4.5 },
    isVeganVerified: true,
    veganConfidence: 1.0,
  },
  {
    id: 'rec-3',
    title: 'Đậu hũ nấm kho tiêu sốt mềm dậm đà',
    subtitle:
      'Món kho mặn mà hao cơm kết hợp nấm hương gần như sợi đậu hũ thấm vị, thay bằng Hạnh nhân (Chó thỏ) tạo độ giòn mềm hoà quyện thay mỡ hành chảo lửa.',
    coverImageUrl:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Close%20up%20photo%20of%20a%20Vietnamese%20style%20vegan%20braised%20tofu%20with%20shiitake%20mushrooms%20in%20a%20dark%20soy%20and%20pepper%20sauce%2C%20steam%20rising%2C%20served%20with%20rice%2C%20top%20down&image_size=landscape_16_9',
    cookTimeMin: 25,
    badges: [
      { label: '100% Thuần Chay (Vegan)', variant: 'success' },
      { label: 'Khớp 2/3 nguyên liệu (Thiếu: Tỏi củ, Tiêu xay)', variant: 'warning' },
    ],
    matchedIngredientIds: ['ig-1', 'ig-2'],
    ingredientSummary:
      'Tủ bếp: Đậu hũ (IG-1) ✅ + Nấm hương (IG-2) ✅ + Hành tây (bỏ qua) → Thay bằng Hạnh bột + Hạt tiêu thay thế',
    nutrition: { calories: 260, proteinG: 16.2, carbsG: 18.0, goodFatG: 9.0 },
    isVeganVerified: true,
    veganConfidence: 1.0,
  },
  {
    id: 'rec-4',
    title: 'Đậu hũ áp chảo sốt nấm hương ngũ vị',
    subtitle:
      'Đậu hũ vàng ướm rim nước sốt nấm hương, rim nước sót nhẹ nhàng hấp thụ đầy đủ hương vị 5 vị (ngọt - chua - mặn - cay - thơm).',
    coverImageUrl:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Pan%20fried%20crispy%20golden%20vegan%20tofu%20topped%20with%20a%20rich%20five%20spice%20shiitake%20mushroom%20sauce%2C%20sesame%20seeds%20and%20green%20onions%2C%20on%20a%20white%20ceramic%20plate%2C%20top%20view%2C%20Vietnamese%20restaurant&image_size=landscape_16_9',
    cookTimeMin: 19,
    badges: [
      { label: '100% Thuần Chay (Vegan)', variant: 'success' },
      { label: 'Khớp 3/3 nguyên liệu tủ bếp của bạn', variant: 'info' },
    ],
    matchedIngredientIds: ['ig-1', 'ig-2', 'ig-3'],
    ingredientSummary:
      'Tủ bếp: Đậu hũ (IG-1) ✅ + Nấm hương (IG-2) ✅ + Cà chua (IG-3) ✅ + Bột ngũ vị + Tỏi băm + Xả băm',
    nutrition: { calories: 295, proteinG: 17.0, carbsG: 16.5, goodFatG: 11.2 },
    isVeganVerified: true,
    veganConfidence: 1.0,
  },
]

const DEFAULT_EXPERT: ExpertInsight = {
  title:
    'Trợ lý AI đánh giá: Bộ 3 nguyên liệu Đậu hũ + Nấm hương + Cà chua là sự kết hợp hoàn hảo giữa Đạm thực vật hoàn chỉnh (Đậu hũ cung cấp 9 axit amin thiết yếu)',
  badge: 'Chỉ số hệ thống tối ưu',
  body:
    'Beta-glucan tăng cường kháng thể từ Nấm hương và Lycopene chống oxy hóa được hòa tốt nhất khi nấu cùng dầu thực vật lành mạnh và Cà chua chín mềm. Bạn hoàn toàn có thể nấu một bữa ăn thuần chay cân bằng, ngon miệng mà không lo thiếu hụt vị chế.',
  pros: ['Phù hợp cho chế độ ăn giảm cân & kiểm soát BMI', 'Chỉ số đường huyết (GI) thấp'],
}

const delay = <T>(data: T, ms = 500): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms))

export function fetchPantryAiSuggestions(
  _ingredients?: PantryIngredient[],
  signal?: AbortSignal,
): Promise<PantryAiSuggestionResult> {
  if (signal?.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'))
  return delay({
    resultId: 'pantry-result-' + Math.random().toString(36).slice(2, 9),
    generatedAtISO: new Date().toISOString(),
    aiVersion: 'Smart Pantry v2.4',
    dietModeLabel: 'Thuần chay (Vegan)',
    dietModeDescription:
      'Hệ thống tự động quét mạnh miễn đến 100% nguồn liệu gốc động vật (thịt, cá, sữa bò hữu cơ, gelatin, mũ đông vật) để đảm bảo món chay an tuyệt đối.',
    availableIngredients: DEFAULT_INGREDIENTS,
    maxIngredientsInPantry: 15,
    checkedIngredients: DEFAULT_CHECKED,
    veganAssessmentSummary: {
      safeCount: 3,
      warnCount: 1,
      flaggedCount: 1,
      safePercent: 100 * (3 / 5),
    },
    swaps: DEFAULT_SWAPS,
    autoReplaceAll: true,
    recipeSuggestions: DEFAULT_RECIPES,
    recipeSortDefault: 'match',
    expertInsight: DEFAULT_EXPERT,
  })
}

export function addIngredientToPantry(
  payload: AddIngredientRequest,
): Promise<{ ok: true; item: PantryIngredient }> {
  const next: PantryIngredient = {
    id: 'ig-' + Math.random().toString(36).slice(2, 8),
    name: payload.name,
    quantityGram: payload.quantityGram ?? 100,
    category: payload.category ?? 'other',
  }
  return delay({ ok: true as const, item: next }, 240)
}

export function applySwap(
  swapId: string,
): Promise<{ ok: true; swapId: string; appliedAtISO: string }> {
  return delay(
    { ok: true as const, swapId, appliedAtISO: new Date().toISOString() },
    180,
  )
}

export function autoReplaceAllSwaps(): Promise<{
  ok: true
  appliedIds: string[]
  replacedAtISO: string
}> {
  return delay(
    {
      ok: true as const,
      appliedIds: DEFAULT_SWAPS.map((s) => s.id),
      replacedAtISO: new Date().toISOString(),
    },
    360,
  )
}
