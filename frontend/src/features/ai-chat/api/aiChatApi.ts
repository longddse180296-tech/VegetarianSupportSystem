import { apiClient, getStoredToken } from '../../../shared/api/apiClient'
import type {
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

export const GUEST_SESSION_DEFAULT: GuestSession = {
  remainingQuestions: 3,
  maxQuestions: 3,
  isLocked: false,
}

const FAQS_FIGMA: FaqItem[] = [
  { id: 'f-1', icon: 'HelpCircle', question: 'Món này có thuần chay không?' },
  { id: 'f-2', icon: 'HelpCircle', question: 'Thành phần này có phù hợp với tôi không?' },
  { id: 'f-3', icon: 'HelpCircle', question: 'Gợi ý món chay giàu protein hôm nay' },
]

export async function getUserProfile(): Promise<UserProfile | null> {
  return null
}

export async function getUserProfileFields(): Promise<PersonalProfileField[]> {
  const token = getStoredToken()
  if (token) {
    try {
      const p = await apiClient.get<{
        diet: string | null
        bmi: number | null
        adultBmiCategory: string | null
        weightGoal: string | null
        allergies: Array<{ name: string }> | null
      }>('/api/profile/me')
      if (p) {
        const dietMap: Record<string, string> = {
          Vegan: 'Thuần chay (Vegan)',
          Lacto: 'Ăn chay có sữa (Lacto)',
          LactoVegetarian: 'Ăn chay có sữa (Lacto)',
          'Lacto-vegetarian': 'Ăn chay có sữa (Lacto)',
          Ovo: 'Chay có trứng (Ovo)',
          OvoVegetarian: 'Chay có trứng (Ovo)',
          'Ovo-vegetarian': 'Chay có trứng (Ovo)',
          LactoOvo: 'Trứng & Sữa (Lacto-ovo)',
          LactoOvoVegetarian: 'Trứng & Sữa (Lacto-ovo)',
          'Lacto-ovo vegetarian': 'Trứng & Sữa (Lacto-ovo)',
        }
        const dietLabel = p.diet && dietMap[p.diet] ? dietMap[p.diet] : 'Chưa thiết lập'

        const categoryMap: Record<string, string> = {
          Underweight: 'Thiếu cân',
          HealthyWeight: 'Bình thường',
          Overweight: 'Thừa cân',
          Obesity: 'Béo phì',
          underweight: 'Thiếu cân',
          normal: 'Bình thường',
          overweight: 'Thừa cân',
          obese: 'Béo phì',
        }
        const catLabel = p.adultBmiCategory && categoryMap[p.adultBmiCategory]
          ? categoryMap[p.adultBmiCategory]
          : 'Chưa phân loại'
        const bmiVal = typeof p.bmi === 'number'
          ? `${p.bmi.toFixed(1)} (${catLabel})`
          : 'Chưa đủ dữ liệu'

        const goalMap: Record<string, string> = {
          Lose: 'Giảm mỡ & thanh lọc cơ thể',
          LoseWeight: 'Giảm mỡ & thanh lọc cơ thể',
          weight_loss: 'Giảm mỡ & thanh lọc cơ thể',
          Maintain: 'Duy trì cân nặng',
          MaintainWeight: 'Duy trì cân nặng',
          maintain: 'Duy trì cân nặng',
          Gain: 'Tăng cân & phát triển cơ bắp',
          GainWeight: 'Tăng cân & phát triển cơ bắp',
          muscle_gain: 'Tăng cân & phát triển cơ bắp',
          general_health: 'Khám phá món chay khoa học',
        }
        const goalLabel = p.weightGoal && goalMap[p.weightGoal]
          ? goalMap[p.weightGoal]
          : 'Chưa thiết lập'

        const allergies = p.allergies
        const hasAllergies = Boolean(allergies && allergies.length > 0)
        const allergiesLabel = allergies && allergies.length > 0
          ? allergies.map((a) => a.name).join(', ')
          : 'Chưa khai báo'

        return [
          { key: 'diet', label: 'Chế độ ăn', value: dietLabel, tone: 'ok' },
          { key: 'bmi', label: 'Chỉ số BMI', value: bmiVal, tone: 'ok' },
          { key: 'goal', label: 'Mục tiêu', value: goalLabel, tone: 'info' },
          {
            key: 'allergy',
            label: 'Dị ứng cảnh báo',
            value: allergiesLabel,
            tone: hasAllergies ? 'warn' : 'soft',
          },
        ]
      }
    } catch {
      // offline / unauthorized
    }
  }

  return []
}

export async function getFaqsFigma(): Promise<FaqItem[]> {
  return FAQS_FIGMA
}

export async function getChatHistory(): Promise<HistoryItem[]> {
  if (!getStoredToken()) return []

  const page = await apiClient.get<{
    items: Array<{ id: string; updatedAtUtc: string }>
  }>('/api/ai-chat/conversations?page=1&pageSize=5')
  const details = await Promise.all((page?.items ?? []).map(async (conversation) => {
    const firstPage = await apiClient.get<{
      items: Array<{ role: string; content: string }>
      totalCount: number
    }>(`/api/ai-chat/conversations/${conversation.id}/messages?page=1&pageSize=1`)
    if (!firstPage?.totalCount) return null
    const firstMessage = firstPage.items[0]
    const title = firstMessage?.role.toLowerCase() === 'user'
      ? firstMessage.content.trim().replace(/\s+/g, ' ')
      : 'Cuộc trò chuyện'
    return {
      id: conversation.id,
      title: title.length > 48 ? `${title.slice(0, 48).trimEnd()}…` : title,
      messages: firstPage.totalCount,
      dateLabel: new Date(conversation.updatedAtUtc).toLocaleDateString('vi-VN'),
      tone: 'recent',
    } satisfies HistoryItem
  }))
  return details.filter((item): item is NonNullable<typeof item> => item !== null)
}

export async function getDefaultBmi(): Promise<BMIResult | null> {
  return null
}

export async function getRecipeSuggestions(_bmiScore = 22.5): Promise<RecipePreview[]> {
  return []
}

export async function getMealSuggestions(_bmiScore = 22.5): Promise<MealCard[]> {
  return []
}

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
  let guestState: GuestChatState =
    appRole === 'Guest'
      ? { questionsRemaining: 3, limit: 3, locked: false }
      : { questionsRemaining: -1, limit: -1, locked: false }

  let realConversations: ChatConversation[] = []

  // If Guest, check real session
  if (appRole === 'Guest') {
    try {
      const session = await apiClient.get<{ remainingQuestions: number; isLocked: boolean }>(
        '/api/ai-chat/guest/session',
        { requiresAuth: false, credentials: 'include' },
      )
      if (session) {
        guestState = {
          questionsRemaining: session.remainingQuestions,
          limit: 3,
          locked: session.isLocked,
        }
      }
    } catch {
      // Offline/unreachable
    }
  } else {
    // If User, fetch real conversations
    try {
      const page = await apiClient.get<{
        items: Array<{ id: string; createdAtUtc: string; updatedAtUtc: string }>
      }>('/api/ai-chat/conversations?page=1&pageSize=20')
      if (page && Array.isArray(page.items) && page.items.length > 0) {
        realConversations = page.items.map((c, idx) => ({
          id: c.id,
          title: `Hội thoại tư vấn #${idx + 1}`,
          summary: new Date(c.updatedAtUtc).toLocaleDateString('vi-VN'),
          lastMessageAt: c.updatedAtUtc,
          preview: 'Cuộc trò chuyện cùng Trợ lý ăn chay AI...',
        }))
      }
    } catch {
      // Offline/unreachable
    }
  }

  const profile: ProfileSummary =
    appRole === 'Guest'
      ? {
          displayName: 'Khách',
          role: 'Guest',
          profileType: 'Chưa đăng nhập',
          target: 'Khám phá ăn chay khoa học',
          bmiRange: 'Chưa cập nhật',
          joinAt: new Date().toISOString(),
        }
      : {
          displayName: 'Thành viên',
          role: appRole,
          profileType: 'Hồ sơ dinh dưỡng cá nhân',
          target: 'Chế độ ăn chay cá nhân hóa',
          bmiRange: 'Đã thiết lập',
          joinAt: new Date().toISOString(),
        }

  return {
    greeting:
      'Hỏi đáp về dinh dưỡng chay, nguyên liệu thay thế, BMI, calo và nhận gợi ý bữa ăn khoa học trực tiếp từ Trợ lý AI.',
    recipes: [],
    faqs: FAQS_FIGMA,
    conversations: realConversations,
    profile,
    guestState,
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

export async function createChatConversation(): Promise<string> {
  const conversation = await apiClient.post<{ id: string }>('/api/ai-chat/conversations')
  if (!conversation?.id) throw new Error('Không thể tạo hội thoại mới.')
  return conversation.id
}

export async function sendMessageToAi(
  _role: ChatRole,
  content: string,
  _conversationId: string | null,
): Promise<ChatMessage> {
  const token = getStoredToken()

  // 1. Try real User conversation if logged in
  if (token) {
    if (_conversationId) {
      const userMsgUrl = `/api/ai-chat/conversations/${_conversationId}/messages`
      try {
        const sub = await apiClient.post<{
          userMessage: { id: string; content: string; createdAtUtc: string }
          assistantMessage: { id: string; content: string; createdAtUtc: string } | null
          answerStatus: string
        }>(userMsgUrl, { content })

        if (sub?.assistantMessage?.content) {
          return {
            id: sub.assistantMessage.id || makeId(),
            sender: 'assistant',
            role: 'assistant',
            content: sub.assistantMessage.content,
            timestamp: sub.assistantMessage.createdAtUtc || new Date().toISOString(),
          }
        }
      } catch (err) {
        console.error('[aiChatApi.sendChatMessage] Lỗi khi gọi API: ' + userMsgUrl, err)
        throw err
      }
    }
    throw new Error('Không thể nhận phản hồi từ AI lúc này. Vui lòng thử lại sau.')
  }

  // 2. Try real Guest message if guest
  const guestUrl = '/api/ai-chat/guest/messages'
  try {
    const guestRes = await apiClient.post<{
      status: string
      answer: string | null
      remainingQuestions: number
    }>(guestUrl, { content }, { requiresAuth: false, credentials: 'include' })

    if (guestRes?.answer) {
      return {
        id: makeId(),
        sender: 'assistant',
        role: 'assistant',
        content: guestRes.answer,
        timestamp: new Date().toISOString(),
      }
    }
  } catch (err) {
    console.error('[aiChatApi.sendChatMessage] Lỗi khi gọi API: ' + guestUrl, err)
    throw err
  }

  throw new Error('Đã hết lượt câu hỏi của khách hoặc xảy ra lỗi kết nối AI.')
}

/**
 * Stream từng ký tự theo thời gian thực (20-40ms).
 */
export function streamAiText(
  fullText: string,
  onChunk: (partial: string) => void,
  onComplete: () => void,
  intervalMs = 25,
): () => void {
  let index = 0
  const timer = setInterval(() => {
    index = Math.min(fullText.length, index + 2)
    onChunk(fullText.slice(0, index))
    if (index >= fullText.length) {
      clearInterval(timer)
      onComplete()
    }
  }, intervalMs)

  return () => clearInterval(timer)
}

/**
 * Lấy lịch sử tin nhắn của một cuộc hội thoại từ backend
 */
export async function getConversationMessages(
  conversationId: string,
): Promise<ChatMessage[]> {
  const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationId)
  if (!isGuid || !getStoredToken()) throw new Error('Không thể mở hội thoại này.')

  const messages: ChatMessage[] = []
  let page = 1
  while (true) {
    const res = await apiClient.get<{
      items: Array<{
        id: string
        role: 'User' | 'Assistant' | string
        content: string
        createdAtUtc: string
      }>
      totalCount: number
    }>(`/api/ai-chat/conversations/${conversationId}/messages?page=${page}&pageSize=100`)
    if (!res || !Array.isArray(res.items)) throw new Error('Không thể tải tin nhắn của hội thoại.')
    messages.push(...res.items.map((m): ChatMessage => {
        const isAsst = m.role.toLowerCase() === 'assistant'
        return {
          id: m.id,
          sender: isAsst ? 'assistant' : 'user',
          role: isAsst ? 'assistant' : 'user',
          content: m.content,
          timestamp: m.createdAtUtc,
        }
      }))
    if (res.items.length === 0 || messages.length >= res.totalCount) return messages
    page += 1
  }
}
