import type {
  AiReplyPayload,
  AppRole,
  BMIResult,
  ChatConversation,
  ChatMessage,
  ChatRole,
  FaqItem,
  GuestChatState,
  GuestSession,
  HistoryItem,
  MealCard,
  PersonalProfileField,
  ProfileSummary,
  RecipePreview,
  RecipeSuggestion,
  UserProfile,
} from '../types/aiChat.types'

function delay(ms = 500): Promise<void> {
  return new Promise((res) => setTimeout(res, ms))
}

/* =====================================================
 * STATIC FIGMA DATA
 * =====================================================*/
export const USER_PROFILE_MOCK: UserProfile = {
  bmi: 22.5,
  bmiStatus: 'Bình thường',
  target: 'Duy trì cân nặng',
  dietType: 'Thuần chay (Vegan)',
  nutritionPreference: 'Giàu đạm, ít dầu mỡ',
  allergyAvoid: 'Đậu phộng',
}

export const GUEST_SESSION_DEFAULT: GuestSession = {
  remainingQuestions: 3,
  maxQuestions: 3,
  isLocked: false,
}

const PROFILE_FIELDS: PersonalProfileField[] = [
  { key: 'bmi', label: 'Chỉ số BMI:', value: '22.5 (Bình thường)', tone: 'ok' },
  { key: 'goal', label: 'Mục tiêu thể chất:', value: 'Duy trì cân nặng', tone: 'soft' },
  { key: 'diet', label: 'Chế độ ăn:', value: 'Thuần chay (Vegan)', tone: 'ok' },
  { key: 'pref', label: 'Sở thích dinh dưỡng:', value: 'Giàu đạm, ít dầu mỡ', tone: 'soft' },
  { key: 'allergy', label: 'Dị ứng cần tránh:', value: 'Đậu phộng', tone: 'warn' },
]

const FAQS_FIGMA: FaqItem[] = [
  { id: 'f-figma-1', icon: 'HelpCircle', question: 'Món này có chay không?' },
  { id: 'f-figma-2', icon: 'HelpCircle', question: 'Thành phần này có phù hợp với tôi không?' },
  { id: 'f-figma-3', icon: 'HelpCircle', question: 'Hôm nay tôi nên ăn gì?' },
]

const HISTORY_FIGMA: HistoryItem[] = [
  { id: 'h1', title: 'Nhu cầu protein cho người tập gym', messages: 12, dateLabel: 'Hôm qua', tone: 'recent' },
  { id: 'h2', title: 'Thay thế đậu nành khi bị dị ứng', messages: 8, dateLabel: '3 ngày trước', tone: 'mid' },
  { id: 'h3', title: 'Cách làm sữa hạt dinh dưỡng tại nhà', messages: 15, dateLabel: 'Tuần trước', tone: 'old' },
]

const DEFAULT_BMI: BMIResult = {
  value: 22.5,
  label: 'Bình thường',
  statusLabel: 'Chuẩn',
  tone: 'normal',
  rangeLabel: '18.5 – 22.9',
  whoNote:
    'Chỉ số BMI 22.5 của bạn nằm trong ngưỡng Bình thường (18.5 – 22.9) theo chuẩn Tổ chức Y tế Thế giới (WHO) dành cho người trưởng thành châu Á.',
  dailyKcalRange: '1.800 - 1.900 kcal/ngày',
  dailyProtein: '60 - 70g protein',
  dailyKcalRangeMin: 1800,
  dailyKcalRangeMax: 1900,
  dailyProteinG: 65,
  noteAvoid: '70g protein từ đậu, hạt và ngũ cốc nguyên cám.',
  medicalDisclaimer:
    'Lưu ý: AI chỉ cung cấp kiến thức dinh dưỡng thực vật thường thức, không thay thế chẩn đoán hay điều trị y khoa.',
  disclaimer:
    'Lưu ý: AI chỉ cung cấp kiến thức dinh dưỡng thực vật thường thức, không thay thế chẩn đoán hay điều trị y khoa.',
}

export const MEAL_SUGGESTIONS_MOCK: MealCard[] = [
  {
    id: 'salad-bo-dau-ga',
    tag: 'Tối • Thanh lọc',
    kcal: 380,
    name: 'Salad bơ đậu gà sốt mè',
    description: 'Bơ sáp, đậu gà luộc mềm, xà lách romaine và hạt hướng dương thơm bùi.',
    protein: '14g',
    recipeId: 'salad-bo-dau-ga',
  },
  {
    id: 'canh-nam-rau-cu-dau-hu',
    tag: 'Tối • Dễ tiêu',
    kcal: 310,
    name: 'Canh nấm rau củ đậu hũ',
    description: 'Nấm rơm, bắp ngọt, cà rốt và đậu hũ non thanh ngọt sảng khoái.',
    protein: '15g',
    recipeId: 'canh-nam-rau-cu-dau-hu',
  },
]

const RECIPE_PREVIEWS_FIGMA: RecipePreview[] = [
  {
    id: 'salad-bo-dau-ga',
    tags: [{ label: 'Tối • Thanh lọc', tone: 'green' }],
    kcal: 380,
    name: 'Salad bơ đậu gà sốt mè',
    description: 'Bơ sáp, đậu gà luộc mềm, xà lách romaine và hạt hướng dương thơm bùi.',
    nutrientLabel: 'Protein',
    nutrientValue: '14g',
  },
  {
    id: 'canh-nam-rau-cu-dau-hu',
    tags: [{ label: 'Tối • Dễ tiêu', tone: 'teal' }],
    kcal: 310,
    name: 'Canh nấm rau củ đậu hũ',
    description: 'Nấm rơm, bắp ngọt, cà rốt và đậu hũ non thanh ngọt sảng khoái.',
    nutrientLabel: 'Protein',
    nutrientValue: '15g',
  },
]

/* =====================================================
 * Async API calls with delay(500)
 * =====================================================*/
export async function getUserProfile(): Promise<UserProfile> {
  await delay(500)
  return USER_PROFILE_MOCK
}

export async function getUserProfileFields(): Promise<PersonalProfileField[]> {
  await delay(500)
  return PROFILE_FIELDS
}

export async function getFaqsFigma(): Promise<FaqItem[]> {
  await delay(500)
  return FAQS_FIGMA
}

export async function getChatHistoryFigma(): Promise<HistoryItem[]> {
  await delay(500)
  return HISTORY_FIGMA
}

export async function getDefaultBmi(): Promise<BMIResult> {
  await delay(500)
  return DEFAULT_BMI
}

export async function getRecipeSuggestions(_bmiScore = 22.5): Promise<RecipePreview[]> {
  await delay(500)
  return RECIPE_PREVIEWS_FIGMA
}

export async function getMealSuggestions(_bmiScore = 22.5): Promise<MealCard[]> {
  await delay(500)
  return MEAL_SUGGESTIONS_MOCK
}

const WELCOME_RECIPES: RecipeSuggestion[] = [
  {
    id: 'buddha-bowl-quinoa',
    title: 'Buddha Bowl Đậu Nướng & Quinoa',
    subtitle: 'Chỉ 20 phút · Dễ · Đủ 4 nhóm chất',
    cover:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
    kcal: 520,
    timeMin: 20,
    tag: 'Giảm cân · Vegan',
    matchReason: 'Đầy đủ protein thực vật, phù hợp BMI 20-24.',
  },
  {
    id: 'yen-mach-hat-dieu',
    title: 'Cháo Yến Mạch Hạt Điều & Quế',
    subtitle: 'Bữa sáng 10 phút · Bão hòa năng lượng',
    cover:
      'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=400&q=80',
    kcal: 410,
    timeMin: 10,
    tag: 'Breakfast · Budget',
    matchReason: 'Tốt cho người mới bắt đầu ăn thuần thực vật, không cần nguyên liệu lạ.',
  },
]

export async function getWelcomeSuggestions(
  appRole: AppRole,
): Promise<{
  greeting: string
  recipes: RecipeSuggestion[]
  faqs: FaqItem[]
  conversations: ChatConversation[]
  profile: ProfileSummary
  guestState: GuestChatState
}> {
  await delay(500)
  const profile: ProfileSummary =
    appRole === 'Guest'
      ? {
          displayName: 'Bạn (Khách)',
          role: 'Guest',
          profileType: 'Chưa tạo hồ sơ',
          target: 'Khám phá ăn chay khoa học',
          bmiRange: '22.5 · Bình thường',
          joinAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        }
      : {
          displayName: appRole === 'Admin' ? 'Admin Toàn' : 'Nguyễn An Nhiên',
          role: appRole,
          profileType: 'Thuần chay nghiêm ngặt (Strict Vegan)',
          target: 'Duy trì cân nặng · Ăn 1.850 kcal/ngày',
          bmiRange: '22.5 · Bình thường',
          joinAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
        }

  const conversations: ChatConversation[] = [
    {
      id: 'conv-1',
      title: 'Nhu cầu protein cho người tập gym',
      summary: '12 tin nhắn · Hôm qua',
      lastMessageAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      preview: 'Tôi tập gym 4 buổi/tuần, cần bao nhiêu gram đạm thực vật...',
    },
    {
      id: 'conv-2',
      title: 'Thay thế đậu nành khi bị dị ứng',
      summary: '8 tin nhắn · 3 ngày trước',
      lastMessageAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      preview: 'Các nguồn đạm thay thế đậu nành an toàn...',
    },
    {
      id: 'conv-3',
      title: 'Cách làm sữa hạt dinh dưỡng tại nhà',
      summary: '15 tin nhắn · Tuần trước',
      lastMessageAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
      preview: 'Tỷ lệ hạt điều và yến mạch ngâm qua đêm...',
    },
  ]

  return {
    greeting:
      'Hỏi đáp về dinh dưỡng chay, nguyên liệu thay thế, BMI, calo và nhận gợi ý bữa ăn khoa học được cá nhân hóa cho bạn.',
    recipes: WELCOME_RECIPES,
    faqs: FAQS_FIGMA,
    conversations,
    profile,
    guestState:
      appRole === 'Guest'
        ? { questionsRemaining: 3, limit: 3, locked: false }
        : { questionsRemaining: -1, limit: -1, locked: false },
  }
}

function makeId(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function buildUserMessage(content: string): ChatMessage {
  return {
    id: makeId(),
    sender: 'user',
    role: 'user',
    content,
    timestamp: new Date().toISOString(),
  }
}

function composeReply(userContent: string): AiReplyPayload {
  const text = userContent.trim().toLowerCase()

  // 1 — BMI & Dinh dưỡng câu hỏi mẫu
  if (/(bmi|chỉ số|ý nghĩa|thể trạng|cân nặng)/.test(text)) {
    return {
      reply:
        'Chỉ số BMI 22.5 của bạn nằm trong ngưỡng Bình thường (18.5 – 22.9) theo chuẩn Tổ chức Y tế Thế giới (WHO) dành cho người trưởng thành châu Á.\n\nĐể duy trì cân nặng lý tưởng và năng lượng bền bỉ, bạn nên nạp khoảng 1.800 - 1.900 kcal/ngày với 60 - 70g protein từ đậu, hạt và ngũ cốc nguyên cám.',
      richData: {
        bmiData: DEFAULT_BMI,
        mealSuggestions: MEAL_SUGGESTIONS_MOCK,
      },
      recipeSuggestions: [WELCOME_RECIPES[0], WELCOME_RECIPES[1]],
    }
  }

  // 2 — Món này có chay không?
  if (/(có chay không|chay hay mặn|thuần chay|nguồn gốc)/.test(text)) {
    return {
      reply:
        'Để xác định một món ăn hoặc sản phẩm có thuần chay hay không, bạn cần kiểm tra 3 nhóm thành phần sau:\n1. Không chứa thịt, cá, mỡ động vật.\n2. Kiểm tra chất điều vị (E621, E627, E631) và phụ gia làm đông như Gelatin (E441) - nên chọn nguồn Agar/Pectin.\n3. Nếu bạn ăn thuần chay (Vegan), tránh thêm mật ong, sữa bò và trứng.\n\nBạn có thể chụp ảnh nhãn thành phần và gửi qua mục "Quét thực phẩm" để tôi phân tích từng thành phần cho bạn nhé!',
    }
  }

  // 3 — Thành phần này có phù hợp với tôi không?
  if (/(phù hợp với tôi|dị ứng|đậu phộng|thành phần này)/.test(text)) {
    return {
      reply:
        'Đối chiếu với hồ sơ cá nhân hóa của bạn:\n• Dị ứng cần tránh: ĐẬU PHỘNG (Lạc) - Cần loại trừ tuyệt đối các loại dầu lạc ép thủ công, sốt bơ đậu phộng và bánh kẹo có vết đậu phộng.\n• Chế độ ăn: Thuần chay (Vegan) giàu đạm thực vật, ít dầu mỡ.\n\nNếu sản phẩm không chứa các thành phần trên và không chiên rán nhiều dầu, bạn hoàn toàn có thể an tâm sử dụng.',
    }
  }

  // 4 — Hôm nay tôi nên ăn gì?
  if (/(hôm nay.*ăn gì|gợi ý.*món|thực đơn hôm nay|bữa tối)/.test(text)) {
    return {
      reply:
        'Dựa trên mục tiêu nạp 1.800 - 1.900 kcal/ngày và hồ sơ ăn chay giàu đạm của bạn, tôi gợi ý 2 thực đơn bữa tối thanh nhẹ dưới 500 kcal rất phù hợp:',
      richData: {
        mealSuggestions: MEAL_SUGGESTIONS_MOCK,
      },
    }
  }

  // Mặc định
  return {
    reply:
      'Tôi đã ghi nhận câu hỏi của bạn. Theo thông tin từ hồ sơ dinh dưỡng của bạn (BMI 22.5, thuần chay, dị ứng đậu phộng), tôi khuyên bạn nên tập trung vào nguồn đạm sạch từ nấm đông cô, đậu hũ, đậu gà và hạt diêm mạch quinoa. Bạn muốn tìm hiểu thêm về thực đơn món ăn hay phân tích calo chi tiết?',
    richData: {
      mealSuggestions: MEAL_SUGGESTIONS_MOCK,
    },
  }
}

export async function sendMessageToAi(
  _role: ChatRole,
  content: string,
  _conversationId: string | null,
): Promise<ChatMessage> {
  await delay(500)
  const payload = composeReply(content)
  return {
    id: makeId(),
    sender: 'assistant',
    role: 'assistant',
    content: payload.reply,
    timestamp: new Date().toISOString(),
    richData: payload.richData,
    bmiAnalysis: payload.richData?.bmiData as BMIResult | undefined,
    recipePreview: payload.richData?.mealSuggestions
      ? payload.richData.mealSuggestions.map((m) => ({
          id: m.id,
          tags: [{ label: m.tag, tone: 'green' }],
          kcal: m.kcal,
          name: m.name,
          description: m.description,
          nutrientLabel: 'Protein',
          nutrientValue: m.protein,
        }))
      : undefined,
    recipeSuggestions: payload.recipeSuggestions,
    disclaimer: DEFAULT_BMI.medicalDisclaimer,
  }
}

/**
 * Giả lập stream từng ký tự/cụm từ theo thời gian thực (20-40ms).
 */
export function streamAiText(
  fullText: string,
  onChunk: (partial: string) => void,
  onComplete: () => void,
  intervalMs = 25,
): () => void {
  let index = 0
  const timer = setInterval(() => {
    index = Math.min(fullText.length, index + 2) // stream 2 ký tự mỗi nhịp
    onChunk(fullText.slice(0, index))
    if (index >= fullText.length) {
      clearInterval(timer)
      onComplete()
    }
  }, intervalMs)

  return () => clearInterval(timer)
}
