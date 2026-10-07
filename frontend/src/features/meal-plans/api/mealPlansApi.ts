import type {
  DietTabOption,
  DietType,
  GeneralMealPlanData,
  MealItem,
  MealSlot,
  RecommendedMealPlanData,
  RecommendedMealItem,
  MealReplacementOption,
  DayOfWeek,
  PersonalizationFormValues,
  BmiAnalysisResult,
  GeneratedPersonalizedPlan,
} from '../types/mealPlans.types'

export const DIET_TABS: DietTabOption[] = [
  {
    id: 'vegan',
    name: 'Thuần chay (Vegan)',
    subName: 'Không thịt, trứng, sữa, mật ong',
    badge: '100% Thực vật',
    icon: 'leaf',
  },
  {
    id: 'lacto',
    name: 'Ăn chay có sữa',
    subName: 'Lacto-vegetarian',
    badge: 'Có sữa & bơ',
    icon: 'milk',
  },
  {
    id: 'ovo',
    name: 'Ăn chay có trứng',
    subName: 'Ovo-vegetarian',
    badge: 'Có trứng hữu cơ',
    icon: 'egg',
  },
  {
    id: 'lacto-ovo',
    name: 'Trứng & Sữa',
    subName: 'Lacto-ovo vegetarian',
    badge: 'Đa dạng nguồn đạm',
    icon: 'utensils',
  },
]

const MOCK_MEAL_PLANS: Record<DietType, GeneralMealPlanData> = {
  vegan: {
    dietType: 'vegan',
    characteristic: {
      title: 'Đặc tính dinh dưỡng chế độ Thuần Chay (Vegan)',
      certBadge: 'Chuẩn Viện Dinh Dưỡng',
      description:
        'Hoàn toàn không sử dụng thịt động vật, gia cầm, trứng, chế phẩm từ sữa và mật ong. Nguồn đạm chất lượng cao được cân đối tối ưu từ nhóm súp đậu tương non, hạt quinoa, nấm rừng, nấm hương tươi và các loại hạt dinh dưỡng lành mạnh.',
      targetKcal: 1850,
      targetProtein: 68,
      targetCarbs: 230,
      targetFat: 45,
      targetFiber: 38,
      targetMicronutrients: 'B12, Fe, K',
    },
    meals: [
      {
        id: 'meal-1',
        slot: 'breakfast',
        slotTime: '07:00',
        slotLabel: 'Bữa sáng',
        title: 'Phở nấm hương & tàu hũ ky nước dùng rau củ',
        description:
          'Nước dùng hầm từ củ cải đường, lê Nam Phi và mía thanh ngọt tự nhiên không bột ngọt, dùng kèm nấm hương tươi nướng, tàu hũ ky chiên vắt...',
        imageUrl:
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        calories: 420,
        protein: 16.5,
        fat: 8.2,
        carbs: 66.0,
        tags: ['100% Thuần chay', 'Dairy-free', 'Egg-free', 'Giàu chất xơ'],
        matchRate: 95,
        matchNote: 'Nhóm năng lượng từ rau củ',
        recipeId: 'rec-1',
      },
      {
        id: 'meal-2',
        slot: 'lunch',
        slotTime: '12:00',
        slotLabel: 'Bữa trưa',
        title: 'Đậu hũ kho nấm đông cô & Cơm gạo lứt ngũ sắc',
        description:
          'Đậu hũ non chiên vàng rim nước tương nấm đậm đà thơm ngậy, ăn kèm cơm gạo lứt dẻo ngọt, bắp cải xào củ cải đỏ...',
        imageUrl:
          'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
        calories: 650,
        protein: 25.4,
        fat: 14.5,
        carbs: 88.5,
        tags: ['Thuần chay (Vegan)', 'Dairy-free', 'Egg-free', 'Giàu đạm thực vật'],
        matchRate: 98,
        matchNote: 'Đề xuất cho người tập luyện (Gym)',
        recipeId: 'rec-2',
      },
      {
        id: 'meal-3',
        slot: 'snack',
        slotTime: '15:30',
        slotLabel: 'Bữa phụ chiều',
        title: 'Sinh tố chuối bơ hạnh nhân & hạt chia Úc',
        description:
          'Bổ sung năng lượng tức thì với sữa hạt hạnh nhân tươi nguyên chất, chất béo không bão hòa từ quả bơ chín cây, hoàn toàn không thêm...',
        imageUrl:
          'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&auto=format&fit=crop&q=80',
        calories: 220,
        protein: 6.2,
        fat: 9.0,
        carbs: 26.0,
        tags: ['Thuần chay', 'Dairy-free', 'Giàu Omega-3'],
        matchRate: 100,
        recipeId: 'rec-3',
      },
      {
        id: 'meal-4',
        slot: 'dinner',
        slotTime: '18:30',
        slotLabel: 'Bữa tối',
        title: 'Cà ri rau củ đậu gà & Bánh mì ngũ cốc nguyên cám',
        description:
          'Hạt đậu gà bùi ngậy nấu chậm cùng khoai lang mật, bí đỏ hữu cơ và nước cốt dừa xêm thơm béo thanh nhẹ, nêm muối hồng Himalaya...',
        imageUrl:
          'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=80',
        calories: 510,
        protein: 21.8,
        fat: 13.0,
        carbs: 64.5,
        tags: ['Thuần chay (Vegan)', 'Dairy-free', 'Egg-free', 'Dễ tiêu hóa'],
        matchRate: 94,
        matchNote: 'Chứa Tryptophan hỗ trợ giấc ngủ ngon',
        recipeId: 'rec-4',
      },
    ],
    macroSummary: {
      calories: 1800,
      targetCalories: 1850,
      percentAchieved: 97,
      statusNote: 'Năng lượng chuẩn BMI mức cho người vận động vừa phải.',
      carbsPercent: 55,
      carbsGrams: 245,
      proteinPercent: 22,
      proteinGrams: 70,
      fatPercent: 23,
      fatGrams: 44.2,
    },
    aiAdvice:
      'Thực đơn hôm nay đã đáp ứng 100% nhu cầu sắt tự nhiên và đạm thực vật từ đậu non & hạt đậu gà. Bạn hãy nhớ uống đủ 2.2 lít nước lọc trong ngày và duy trì bổ sung viên uống B12 định kỳ hàng tuần!',
    shoppingList: [
      { id: 'shop-1', name: 'Đậu hũ non sạch (tofu)', quantity: '300g', isChecked: true },
      { id: 'shop-2', name: 'Nấm đông cô tươi', quantity: '150g', isChecked: true },
      { id: 'shop-3', name: 'Cà chua chín cây hữu cơ', quantity: '2 quả', isChecked: false },
      { id: 'shop-4', name: 'Đậu gà ngâm mềm', quantity: '100g', isChecked: false },
      { id: 'shop-5', name: 'Gạo lứt đỏ Điện Biên', quantity: '150g', isChecked: false },
      { id: 'shop-6', name: 'Bông cải xanh & Củ cải', quantity: '250g', isChecked: false },
    ],
  },
  lacto: {
    dietType: 'lacto',
    characteristic: {
      title: 'Đặc tính dinh dưỡng chế độ Ăn Chay Có Sữa (Lacto)',
      certBadge: 'Giàu Canxi & Vitamin D',
      description:
        'Chế độ ăn chay cho phép sử dụng sữa, sữa chua, phô mai và bơ thực vật hoặc bơ động vật hữu cơ, kết hợp nguồn protein phong phú từ đậu hạt và các loại rau xanh.',
      targetKcal: 1900,
      targetProtein: 72,
      targetCarbs: 235,
      targetFat: 48,
      targetFiber: 36,
      targetMicronutrients: 'Ca, B12, D3',
    },
    meals: [
      {
        id: 'meal-lacto-1',
        slot: 'breakfast',
        slotTime: '07:00',
        slotLabel: 'Bữa sáng',
        title: 'Bánh mì nướng bơ tỏi & Sữa hạt yến mạch phô mai',
        description: 'Bánh mì nguyên cám giòn tan kèm sốt bơ tỏi tươi và ly sữa hạt yến mạch ấm nóng.',
        imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80',
        calories: 440,
        protein: 18.0,
        fat: 10.5,
        carbs: 68.0,
        tags: ['Lacto-vegetarian', 'Có sữa', 'Giàu canxi'],
        matchRate: 96,
        matchNote: 'Cung cấp năng lượng bền bỉ cho buổi sáng',
      },
      {
        id: 'meal-lacto-2',
        slot: 'lunch',
        slotTime: '12:00',
        slotLabel: 'Bữa trưa',
        title: 'Mì Ý sốt kem nấm & Phô mai Parmesan chay',
        description: 'Mì fettuccine sốt nấm đùi gà béo ngậy với kem tươi thực vật và phô mai bào mịn.',
        imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80',
        calories: 680,
        protein: 26.0,
        fat: 16.0,
        carbs: 85.0,
        tags: ['Lacto-vegetarian', 'Giàu đạm', 'Đậm đà'],
        matchRate: 97,
      },
      {
        id: 'meal-lacto-3',
        slot: 'snack',
        slotTime: '15:30',
        slotLabel: 'Bữa phụ chiều',
        title: 'Sữa chua Hy Lạp kèm hạt granola mật hoa dừa',
        description: 'Hũ sữa chua sánh mịn giàu lợi khuẩn probiotics kết hợp hạnh nhân, hạt óc chó giòn rụm.',
        imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80',
        calories: 230,
        protein: 10.0,
        fat: 7.0,
        carbs: 30.0,
        tags: ['Probiotics', 'Tốt cho tiêu hóa'],
        matchRate: 99,
      },
      {
        id: 'meal-lacto-4',
        slot: 'dinner',
        slotTime: '18:30',
        slotLabel: 'Bữa tối',
        title: 'Súp bí đỏ kem tươi & Salad phô mai Feta thảo mộc',
        description: 'Bát súp bí đỏ sánh mịn thơm mùi bơ nhạt, thưởng thức cùng đĩa rau mầm ô-liu tươi.',
        imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=80',
        calories: 490,
        protein: 19.5,
        fat: 13.5,
        carbs: 62.0,
        tags: ['Thanh nhẹ', 'Dễ hấp thu'],
        matchRate: 95,
      },
    ],
    macroSummary: {
      calories: 1840,
      targetCalories: 1900,
      percentAchieved: 97,
      statusNote: 'Lượng đạm và canxi được bảo đảm nhờ bổ sung chế phẩm từ sữa chất lượng cao.',
      carbsPercent: 52,
      carbsGrams: 245,
      proteinPercent: 24,
      proteinGrams: 73.5,
      fatPercent: 24,
      fatGrams: 47.0,
    },
    aiAdvice:
      'Chế độ ăn của bạn hôm nay rất giàu canxi và men vi sinh. Hãy ưu tiên các sản phẩm sữa ít đường và bổ sung thêm các loại hạt giàu kẽm.',
    shoppingList: [
      { id: 'shop-l1', name: 'Sữa chua Hy Lạp nguyên chất', quantity: '2 hộp', isChecked: true },
      { id: 'shop-l2', name: 'Nấm đùi gà tươi', quantity: '200g', isChecked: false },
      { id: 'shop-l3', name: 'Bí đỏ hồ lô', quantity: '400g', isChecked: false },
      { id: 'shop-l4', name: 'Hạt Granola nướng mật hoa dừa', quantity: '100g', isChecked: true },
    ],
  },
  ovo: {
    dietType: 'ovo',
    characteristic: {
      title: 'Đặc tính dinh dưỡng chế độ Ăn Chay Có Trứng (Ovo)',
      certBadge: 'Nguồn Choline & Protein Sinh Học Cao',
      description:
        'Chế độ ăn chay sử dụng trứng hữu cơ (organic eggs) kết hợp với các loại nông sản thực vật thuần khiết, không sử dụng sữa và chế phẩm từ sữa.',
      targetKcal: 1820,
      targetProtein: 70,
      targetCarbs: 220,
      targetFat: 46,
      targetFiber: 37,
      targetMicronutrients: 'Choline, B12, Fe',
    },
    meals: [
      {
        id: 'meal-ovo-1',
        slot: 'breakfast',
        slotTime: '07:00',
        slotLabel: 'Bữa sáng',
        title: 'Trứng ốp la rau chân vịt & Bánh mì men tự nhiên',
        description: '2 quả trứng gà ta ốp la lòng đào phục vụ cùng rau chân vịt áp chảo và lát bánh mì sourdough.',
        imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80',
        calories: 430,
        protein: 20.0,
        fat: 14.0,
        carbs: 52.0,
        tags: ['Ovo-vegetarian', 'Có trứng', 'Giàu Choline'],
        matchRate: 98,
      },
      {
        id: 'meal-ovo-2',
        slot: 'lunch',
        slotTime: '12:00',
        slotLabel: 'Bữa trưa',
        title: 'Cơm gạo lứt chiên nấm rong biển cuộn trứng',
        description: 'Đĩa cơm chiên thơm phức với nấm hương, cà rốt và lớp trứng cuộn mỏng tang vàng ươm.',
        imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=80',
        calories: 640,
        protein: 24.5,
        fat: 15.0,
        carbs: 86.0,
        tags: ['Năng lượng dồi dào', 'Trứng gà hữu cơ'],
        matchRate: 96,
      },
      {
        id: 'meal-ovo-3',
        slot: 'snack',
        slotTime: '15:30',
        slotLabel: 'Bữa phụ chiều',
        title: 'Pudding hạt chia sữa dừa & Xoài cát chín',
        description: 'Món tráng miệng thanh mát không trứng không sữa động vật, dồi dào chất xơ hòa tan.',
        imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80',
        calories: 210,
        protein: 5.5,
        fat: 8.0,
        carbs: 28.0,
        tags: ['Thanh mát', 'Thuần thực vật'],
        matchRate: 97,
      },
      {
        id: 'meal-ovo-4',
        slot: 'dinner',
        slotTime: '18:30',
        slotLabel: 'Bữa tối',
        title: 'Canh rong biển đậu hũ & Trứng hấp nấm tuyết',
        description: 'Bát canh ngọt thanh giải nhiệt và đĩa trứng hấp nấm mềm mịn tan ngay trong miệng.',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        calories: 480,
        protein: 22.0,
        fat: 11.0,
        carbs: 58.0,
        tags: ['Dễ tiêu hóa', 'Ấm bụng'],
        matchRate: 95,
      },
    ],
    macroSummary: {
      calories: 1760,
      targetCalories: 1820,
      percentAchieved: 96,
      statusNote: 'Trứng cung cấp lượng protein sinh học hoàn hảo với đầy đủ 9 axit amin thiết yếu.',
      carbsPercent: 51,
      carbsGrams: 224,
      proteinPercent: 26,
      proteinGrams: 72.0,
      fatPercent: 23,
      fatGrams: 48.0,
    },
    aiAdvice:
      'Trứng là nguồn choline tuyệt vời cho não bộ và mắt. Hãy ưu tiên phương pháp luộc lòng đào hoặc hấp thay vì chiên nhiều dầu mỡ.',
    shoppingList: [
      { id: 'shop-o1', name: 'Trứng gà ta thả vườn hữu cơ', quantity: '6 quả', isChecked: true },
      { id: 'shop-o2', name: 'Rau chân vịt baby', quantity: '200g', isChecked: false },
      { id: 'shop-o3', name: 'Rong biển nấu canh', quantity: '50g', isChecked: true },
    ],
  },
  'lacto-ovo': {
    dietType: 'lacto-ovo',
    characteristic: {
      title: 'Đặc tính dinh dưỡng chế độ Trứng & Sữa (Lacto-Ovo)',
      certBadge: 'Cân Bằng Toàn Diện & Dễ Tiếp Cận',
      description:
        'Trường phái ăn chay phổ biến nhất, cho phép kết hợp linh hoạt cả trứng và sữa để tối ưu nguồn protein, canxi và vitamin B12 mà không sợ thiếu chất.',
      targetKcal: 1950,
      targetProtein: 75,
      targetCarbs: 240,
      targetFat: 50,
      targetFiber: 35,
      targetMicronutrients: 'B12, Ca, Fe, Zn',
    },
    meals: [
      {
        id: 'meal-lo-1',
        slot: 'breakfast',
        slotTime: '07:00',
        slotLabel: 'Bữa sáng',
        title: 'Cháo yến mạch sữa tươi & Trứng chần thảo mộc',
        description: 'Bát cháo yến mạch béo thơm kèm một quả trứng chần và hạt chia rắc thơm lừng.',
        imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=600&auto=format&fit=crop&q=80',
        calories: 450,
        protein: 22.0,
        fat: 12.0,
        carbs: 64.0,
        tags: ['Lacto-Ovo', 'Đầy đủ dinh dưỡng'],
        matchRate: 98,
      },
      {
        id: 'meal-lo-2',
        slot: 'lunch',
        slotTime: '12:00',
        slotLabel: 'Bữa trưa',
        title: 'Cơm niêu nấm rơm sốt tiêu & Trứng đúc đậu hũ phô mai',
        description: 'Bữa cơm đậm đà phong vị truyền thống kết hợp tinh tế cùng lớp phô mai nướng xém.',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
        calories: 700,
        protein: 28.0,
        fat: 18.0,
        carbs: 88.0,
        tags: ['Giàu đạm', 'Cực kỳ ngon miệng'],
        matchRate: 97,
      },
      {
        id: 'meal-lo-3',
        slot: 'snack',
        slotTime: '15:30',
        slotLabel: 'Bữa phụ chiều',
        title: 'Bánh tart táo quế & Sữa đậu nành hữu cơ ấm',
        description: 'Bánh nướng ít đường với hương quế ấm áp giải tỏa căng thẳng giữa giờ làm việc.',
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
        calories: 240,
        protein: 8.0,
        fat: 7.5,
        carbs: 34.0,
        tags: ['Nạp năng lượng tức thì'],
        matchRate: 99,
      },
      {
        id: 'meal-lo-4',
        slot: 'dinner',
        slotTime: '18:30',
        slotLabel: 'Bữa tối',
        title: 'Salad Caesar chay sốt mayonnaise trứng & Canh súp rau củ',
        description: 'Rau xà lách Romaine giòn ngọt kết hợp croutons nướng giòn và chén canh củ sen thanh nhẹ.',
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
        calories: 520,
        protein: 20.0,
        fat: 14.5,
        carbs: 65.0,
        tags: ['Ít calo', 'Thanh đạm buổi tối'],
        matchRate: 96,
      },
    ],
    macroSummary: {
      calories: 1910,
      targetCalories: 1950,
      percentAchieved: 98,
      statusNote: 'Chế độ hoàn hảo nhất về sự đa dạng nguyên liệu và không lo thiếu hụt vitamin B12.',
      carbsPercent: 53,
      carbsGrams: 251,
      proteinPercent: 24,
      proteinGrams: 78.0,
      fatPercent: 23,
      fatGrams: 52.0,
    },
    aiAdvice:
      'Chế độ Lacto-Ovo rất tiện lợi và cân đối. Hãy chú ý lượng natri và chất béo bão hòa từ phô mai, ưu tiên rau củ tươi trong mỗi bữa ăn.',
    shoppingList: [
      { id: 'shop-lo1', name: 'Trứng gà hữu cơ', quantity: '4 quả', isChecked: true },
      { id: 'shop-lo2', name: 'Sữa tươi nguyên kem ít đường', quantity: '500ml', isChecked: true },
      { id: 'shop-lo3', name: 'Xà lách Romaine sạch', quantity: '300g', isChecked: false },
      { id: 'shop-lo4', name: 'Nấm rơm tươi búp tròn', quantity: '200g', isChecked: false },
    ],
  },
}

// 1. Fetch general meal plan by diet type with 1-2 second setTimeout
export async function getGeneralMealPlan(dietType: DietType = 'vegan'): Promise<GeneralMealPlanData> {
  await new Promise((resolve) => setTimeout(resolve, 600))
  return JSON.parse(JSON.stringify(MOCK_MEAL_PLANS[dietType] || MOCK_MEAL_PLANS.vegan))
}

// 2. Swap a meal in the current slot
export async function swapMeal(_dietType: DietType, slot: MealSlot): Promise<MealItem> {
  await new Promise((resolve) => setTimeout(resolve, 800))
  // Provide alternative delicious meal for swap
  const alternatives: Record<MealSlot, MealItem> = {
    breakfast: {
      id: `meal-alt-${Date.now()}`,
      slot: 'breakfast',
      slotTime: '07:00',
      slotLabel: 'Bữa sáng',
      title: 'Bún riêu chay nấm đùi gà & Đậu hũ chiên nghệ',
      description: 'Nước dùng chua thanh từ cà chua và giấm bỗng, riêu làm từ đậu nành xay nhuyễn xào nấm...',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      calories: 410,
      protein: 17.2,
      fat: 7.8,
      carbs: 64.0,
      tags: ['Thuần chay', 'Thanh đạm', 'Giàu canxi'],
      matchRate: 96,
      matchNote: 'Món nước truyền thống dễ ăn',
    },
    lunch: {
      id: `meal-alt-${Date.now()}`,
      slot: 'lunch',
      slotTime: '12:00',
      slotLabel: 'Bữa trưa',
      title: 'Cơm tấm sườn chay nướng ngũ vị & Chả nấm mộc',
      description: 'Sườn đậu nành ướp sốt ngũ vị thơm lừng nướng xém, ăn kèm chả nấm hấp và dưa chua giòn...',
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
      calories: 630,
      protein: 26.0,
      fat: 13.5,
      carbs: 85.0,
      tags: ['Thuần chay', 'Đậm đà', 'Giàu đạm'],
      matchRate: 97,
      matchNote: 'Năng lượng chuẩn cho buổi trưa',
    },
    snack: {
      id: `meal-alt-${Date.now()}`,
      slot: 'snack',
      slotTime: '15:30',
      slotLabel: 'Bữa phụ chiều',
      title: 'Chè hạt sen long nhãn táo đỏ thanh mát',
      description: 'Vị ngọt thanh từ đường phèn tự nhiên và hạt sen tươi bùi bở giúp an thần dưỡng tâm...',
      imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&auto=format&fit=crop&q=80',
      calories: 195,
      protein: 5.0,
      fat: 2.0,
      carbs: 38.0,
      tags: ['Thanh nhiệt', 'Ít béo', 'An thần'],
      matchRate: 98,
    },
    dinner: {
      id: `meal-alt-${Date.now()}`,
      slot: 'dinner',
      slotTime: '18:30',
      slotLabel: 'Bữa tối',
      title: 'Canh kim chi đậu hũ non & Cơm gạo lứt huyết rồng',
      description: 'Vị cay nồng ấm bụng từ kim chi chay lên men tự nhiên, đậu hũ non béo ngậy bổ sung protein...',
      imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=80',
      calories: 490,
      protein: 20.5,
      fat: 11.0,
      carbs: 62.0,
      tags: ['Probiotics', 'Ấm bụng', 'Dễ tiêu'],
      matchRate: 95,
    },
  }

  return alternatives[slot]
}

// 3. Export PDF simulation
export async function exportMealPlanPdf(dietType: DietType): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 800))
  return `Thuc_Don_${dietType.toUpperCase()}_Vegetarian_Support.pdf`
}

// ==========================================
// Phase 2: Recommended Meal Plans Mock API
// ==========================================

const MOCK_RECOMMENDED_PLAN: RecommendedMealPlanData = {
  userInfo: {
    bmi: 22.5,
    bmiCategory: 'Bình thường',
    goal: 'Duy trì cân nặng',
    preferredIngredients: ['Đậu hũ', 'Nấm', 'Cà rốt', 'Gạo lứt'],
    allergens: ['Đậu phộng'],
    mealsPerDay: '3 bữa/ngày + 1 bữa phụ',
  },
  activeDay: 'mon',
  days: [
    {
      dayId: 'mon',
      label: 'Thứ Hai',
      calories: 1820,
      meals: [
        {
          id: 'rec-meal-mon-1',
          slot: 'breakfast',
          slotTime: '07:00',
          slotLabel: 'BỮA SÁNG',
          categoryTag: 'Cháo / Yến mạch',
          title: 'Yến mạch chuối và hạt chia',
          calories: 420,
          protein: 16.5,
          cookTimeMinutes: 15,
          description:
            'Món sáng nhẹ nhàng giàu chất xơ hòa tan beta-glucan giúp ổn định đường huyết, kết hợp sữa tự nhiên béo thơm.',
          imageUrl:
            'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=600&auto=format&fit=crop&q=80',
          recipeId: 'rec-1',
        },
        {
          id: 'rec-meal-mon-2',
          slot: 'lunch',
          slotTime: '12:00',
          slotLabel: 'BỮA TRƯA',
          categoryTag: 'Cơm / Món mặn',
          title: 'Cơm gạo lứt đậu hũ sốt nấm',
          isOptimal: true,
          calories: 650,
          protein: 24,
          cookTimeMinutes: 25,
          description:
            'Hương vị đậm đà từ đậu hũ áp chảo mềm ngọt quyện sốt nấm đông cô, cung cấp dồi dào canxi và đạm thực vật.',
          imageUrl:
            'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
          recipeId: 'rec-2',
        },
        {
          id: 'rec-meal-mon-3',
          slot: 'dinner',
          slotTime: '18:30',
          slotLabel: 'BỮA TỐI',
          categoryTag: 'Dễ tiêu hóa',
          title: 'Canh nấm rau củ và khoai lang',
          calories: 450,
          protein: 20,
          cookTimeMinutes: 25,
          description:
            'Món tối thanh nhẹ dễ tiêu hóa, giữ trọn vị ngọt tự nhiên từ củ cải, nấm ngọt và nhân rau củ thanh mát.',
          imageUrl:
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
          recipeId: 'rec-3',
        },
      ],
    },
    {
      dayId: 'tue',
      label: 'Thứ Ba',
      calories: 1810,
      meals: [
        {
          id: 'rec-meal-tue-1',
          slot: 'breakfast',
          slotTime: '07:00',
          slotLabel: 'BỮA SÁNG',
          categoryTag: 'Món nước',
          title: 'Phở nấm hương nước dùng lê',
          calories: 410,
          protein: 16,
          cookTimeMinutes: 20,
          description: 'Hương vị phở thanh tao từ nước hầm lê và mía lau.',
          imageUrl:
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        },
        {
          id: 'rec-meal-tue-2',
          slot: 'lunch',
          slotTime: '12:00',
          slotLabel: 'BỮA TRƯA',
          categoryTag: 'Cơm / Món mặn',
          title: 'Cà ri đậu gà nước cốt dừa & Cơm gạo lứt',
          isOptimal: true,
          calories: 670,
          protein: 25,
          cookTimeMinutes: 30,
          description: 'Đậu gà bùi ngậy sốt cà ri thơm lừng ăn kèm cơm gạo lứt.',
          imageUrl:
            'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=80',
        },
        {
          id: 'rec-meal-tue-3',
          slot: 'dinner',
          slotTime: '18:30',
          slotLabel: 'BỮA TỐI',
          categoryTag: 'Thanh nhẹ',
          title: 'Súp bí đỏ kem hạnh nhân & Bánh mì nguyên cám',
          calories: 440,
          protein: 18,
          cookTimeMinutes: 20,
          description: 'Súp bí đỏ sánh mịn giàu beta-carotene bảo vệ mắt.',
          imageUrl:
            'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=80',
        },
      ],
    },
    {
      dayId: 'wed',
      label: 'Thứ Tư',
      calories: 1830,
      meals: [
        {
          id: 'rec-meal-wed-1',
          slot: 'breakfast',
          slotTime: '07:00',
          slotLabel: 'BỮA SÁNG',
          categoryTag: 'Bánh nướng',
          title: 'Bánh mì sandwich bơ đậu nành & Trái cây',
          calories: 430,
          protein: 17,
          cookTimeMinutes: 10,
          description: 'Nhanh gọn, tràn đầy vitamin và năng lượng cho buổi sáng.',
          imageUrl:
            'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80',
        },
        {
          id: 'rec-meal-wed-2',
          slot: 'lunch',
          slotTime: '12:00',
          slotLabel: 'BỮA TRƯA',
          categoryTag: 'Món sợi',
          title: 'Bún chả giò chay & Rau sống sốt chua ngọt',
          isOptimal: true,
          calories: 660,
          protein: 23,
          cookTimeMinutes: 25,
          description: 'Chả giò nấm giòn rụm kết hợp bún tươi và nước mắm chay.',
          imageUrl:
            'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
        },
        {
          id: 'rec-meal-wed-3',
          slot: 'dinner',
          slotTime: '18:30',
          slotLabel: 'BỮA TỐI',
          categoryTag: 'Dễ tiêu',
          title: 'Canh rong biển đậu non & Cơm hạt kê',
          calories: 460,
          protein: 19,
          cookTimeMinutes: 20,
          description: 'Canh rong biển thanh mát đào thải độc tố cơ thể.',
          imageUrl:
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        },
      ],
    },
    { dayId: 'thu', label: 'Thứ Năm', calories: 1800, meals: [] },
    { dayId: 'fri', label: 'Thứ Sáu', calories: 1850, meals: [] },
    { dayId: 'sat', label: 'Thứ Bảy', calories: 1800, meals: [] },
    { dayId: 'sun', label: 'Chủ Nhật', calories: 1820, meals: [] },
  ],
  replacements: {
    'rec-meal-mon-2': [
      {
        id: 'rep-1',
        label: 'Gợi ý 1',
        matchRate: 98,
        title: 'Súp chay đậu hũ',
        calories: 620,
        protein: 24,
        cookTimeMinutes: 20,
        description: 'Nước dùng rau củ thanh ngọt thanh mát, đậu hũ chiên giòn rắc tiêu thơm.',
      },
      {
        id: 'rep-2',
        label: 'Gợi ý 2',
        matchRate: 95,
        title: 'Mì xào nấm rau củ',
        calories: 660,
        protein: 21,
        cookTimeMinutes: 20,
        description: 'Sợi mì kiều mạch dai giòn, xào cùng nấm đùi gà và cà rốt bào sợi.',
      },
      {
        id: 'rep-3',
        label: 'Gợi ý 3',
        matchRate: 92,
        title: 'Cơm đậu gà và rau củ',
        calories: 640,
        protein: 23,
        cookTimeMinutes: 25,
        description: 'Đậu gà hầm nhừ đậm đà, bổ sung sắt và chất đạm tương đương thịt bò.',
      },
    ],
  },
  nutritionSummary: {
    caloriesConsumed: 1490,
    targetCalories: 1800,
    energyPercentNote: '83% năng lượng / Duy trì cân nặng',
    proteinConsumed: 64,
    targetProtein: 60,
    proteinNote: '✓ Đạt chuẩn mức duy trì cơ bắp',
    carbsGrams: 185,
    carbsNote: 'Từ yến mạch, gạo lứt & củ',
    fatGrams: 48,
    fatNote: 'Chủ yếu từ quả bơ và hạt',
  },
  pantryUtilization: {
    availableIngredients: ['Đậu hũ', 'Nấm', 'Cà rốt', 'Gạo lứt'],
    buyMoreNote: 'Cải bó xôi, chuối xanh (khoảng ~25.000đ)',
  },
  weeklyOverview: {
    avgCalories: 1820,
    avgCaloriesNote: '✓ Ổn định',
    avgProtein: 76,
    avgProteinNote: '1.2g / kg thể lực',
    uniqueMealCount: 21,
    uniqueMealNote: 'Không lặp lại nguyên vị',
    pantryUsedPercent: 82,
    pantryUsedNote: 'Tiết kiệm chi phí',
    goalMatchPercent: 98,
    goalMatchNote: 'Đánh giá: Rất tốt',
  },
  aiExplanation:
    'Thực đơn ưu tiên protein thực vật từ đậu hũ và đậu gà, đồng thời tận dụng tối đa các nguyên liệu bạn đang có sẵn trong bếp và loại bỏ hoàn toàn các thực phẩm chứa đậu phộng theo yêu cầu dị ứng của bạn. Mỗi bữa ăn đều được tính toán để bạn nấu xong trong dưới 30 phút.',
}

export async function getRecommendedMealPlan(): Promise<RecommendedMealPlanData> {
  await new Promise((resolve) => setTimeout(resolve, 600))
  return JSON.parse(JSON.stringify(MOCK_RECOMMENDED_PLAN))
}

export async function regenerateRecommendedPlan(): Promise<RecommendedMealPlanData> {
  await new Promise((resolve) => setTimeout(resolve, 900))
  return JSON.parse(JSON.stringify(MOCK_RECOMMENDED_PLAN))
}

export async function saveRecommendedPlan(): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 700))
  return true
}

export async function swapRecommendedMeal(
  _dayId: DayOfWeek,
  _mealId: string,
  replacement: MealReplacementOption
): Promise<RecommendedMealItem> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return {
    id: `swapped-${Date.now()}`,
    slot: 'lunch',
    slotTime: '12:00',
    slotLabel: 'BỮA TRƯA',
    categoryTag: 'Món thay thế',
    title: replacement.title,
    calories: replacement.calories,
    protein: replacement.protein,
    cookTimeMinutes: replacement.cookTimeMinutes,
    description: replacement.description,
    imageUrl:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
  }
}

// ==========================================
// Phase 3: Personalization Setup Mock API
// ==========================================

export function calculateBmiAndCalories(
  heightCm: number,
  weightKg: number,
  age: number,
  gender: 'male' | 'female',
  activityLevel: 'sedentary' | 'moderate' | 'active',
  goal: 'maintain' | 'weight-loss' | 'muscle-gain' | 'detox'
): BmiAnalysisResult {
  const heightM = (heightCm || 170) / 100
  const weight = weightKg || 65
  const rawBmi = weight / (heightM * heightM)
  const bmi = Math.round(rawBmi * 10) / 10

  let category = 'Thể trạng bình thường'
  let categoryClass = 'bg-[#EAF5EE] text-[#1E6531]'

  if (bmi < 18.5) {
    category = 'Thiếu cân'
    categoryClass = 'bg-amber-50 text-amber-700'
  } else if (bmi > 24.9) {
    category = 'Thừa cân'
    categoryClass = 'bg-rose-50 text-rose-700'
  }

  // Harris-Benedict BMR calculation approximation
  let bmr =
    gender === 'male'
      ? 10 * weight + 6.25 * heightCm - 5 * (age || 28) + 5
      : 10 * weight + 6.25 * heightCm - 5 * (age || 28) - 161

  const activityMultiplier =
    activityLevel === 'sedentary' ? 1.2 : activityLevel === 'moderate' ? 1.45 : 1.7
  let tdee = Math.round(bmr * activityMultiplier)

  if (goal === 'weight-loss') tdee -= 300
  else if (goal === 'muscle-gain') tdee += 250
  else if (goal === 'detox') tdee -= 150

  const estimatedCalories = Math.max(1400, Math.min(2600, tdee))

  return {
    bmi,
    category,
    categoryClass,
    estimatedCalories,
    note: `Chỉ số BMI của bạn nằm trong mức hoàn toàn lý tưởng. Nhu cầu năng lượng ước tính: ${estimatedCalories.toLocaleString()} kcal/ngày.`,
  }
}

export function getDefaultPersonalizationValues(): PersonalizationFormValues {
  return {
    gender: 'male',
    heightCm: 170,
    weightKg: 65,
    age: 28,
    activityLevel: 'moderate',
    goal: 'maintain',
    dietType: 'vegan',
    availableIngredients: [
      'Đậu hũ',
      'Nấm hương',
      'Yến mạch',
      'Cà rốt',
      'Gạo lứt đỏ',
      'Đậu gà',
    ],
    allergens: ['Đậu phộng'],
    preferences: ['Nhiều protein', 'Dưới 30 phút'],
  }
}

export async function submitPersonalizationPreferences(
  formData: PersonalizationFormValues
): Promise<GeneratedPersonalizedPlan> {
  await new Promise((resolve) => setTimeout(resolve, 800))

  const analysis = calculateBmiAndCalories(
    formData.heightCm,
    formData.weightKg,
    formData.age,
    formData.gender,
    formData.activityLevel,
    formData.goal
  )

  return {
    formData,
    bmiAnalysis: analysis,
    dayPreview: {
      dayId: 'mon',
      label: 'Thứ Hai',
      calories: 1450,
      meals: [
        {
          id: 'prev-1',
          slot: 'breakfast',
          slotTime: '07:00',
          slotLabel: 'Bữa sáng',
          categoryTag: 'Cơm / Món nước',
          title: 'Yến mạch chuối, hạt chia và việt quất',
          calories: 420,
          protein: 16.5,
          cookTimeMinutes: 15,
          description:
            'Bổ sung năng lượng ngay đầu ngày với yến mạch giàu chất xơ hòa tan, giúp no lâu và duy trì lượng đường huyết ổn định.',
          imageUrl:
            'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=600&auto=format&fit=crop&q=80',
          recipeId: 'rec-1',
        },
        {
          id: 'prev-2',
          slot: 'lunch',
          slotTime: '12:00',
          slotLabel: 'Bữa trưa',
          categoryTag: 'Trứng / Thay thế đậu',
          title: 'Đậu hũ sốt nấm hương ăn kèm cơm gạo lứt',
          isOptimal: true,
          calories: 650,
          protein: 24,
          cookTimeMinutes: 25,
          description:
            'Nguồn đạm dồi dào từ đậu hũ non và nấm đông cô tươi, ăn cùng gạo lứt đỏ giàu khoáng chất giúp tiêu hóa nhẹ bụng.',
          imageUrl:
            'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
          recipeId: 'rec-2',
        },
        {
          id: 'prev-3',
          slot: 'dinner',
          slotTime: '18:30',
          slotLabel: 'Bữa tối',
          categoryTag: 'Thanh nhẹ, dễ ngủ',
          title: 'Canh nấm dưỡng sinh và rau củ tươi',
          calories: 450,
          protein: 20,
          cookTimeMinutes: 25,
          description: 'Sự kết hợp hoàn hảo từ củ sen, ngô ngọt và các loại nấm tươi giúp thanh nhiệt cơ thể và có giấc ngủ sâu.',
          imageUrl:
            'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=80',
          recipeId: 'rec-3',
        },
      ],
    },
    dailyNutrition: {
      calories: 1450,
      targetCalories: 1820,
      percentAchieved: 96,
      micronutrientsNote: 'Đầy đủ: Vitamin B12, Sắt, Kẽm, Canxi',
      carbsGrams: 185,
      targetCarbs: 210,
      proteinGrams: 62,
      targetProtein: 65,
    },
    weeklySummary: {
      avgCalories: 1480,
      avgCaloriesNote: 'Chuẩn duy trì BMI',
      pantryUsedPercent: 85,
      pantryUsedNote: 'Giảm chi phí mua thêm',
      goalMatchPercent: 98,
      goalMatchNote: 'Theo tiêu chí ăn sạch',
      uniqueMealsCount: 21,
      uniqueMealsNote: 'Không trùng lặp',
      benefitNote:
        'Đặc quyền: Đã đầy đủ nhóm vitamin B12, kẽm và sắt hữu cơ không gây mệt mỏi (hỗ trợ đề xuất công thức).',
    },
  }
}


