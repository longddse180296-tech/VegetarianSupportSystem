// Chức năng: hội thoại hỗ trợ ăn chay. Khai báo cấu trúc dữ liệu để các màn hình và hàm xử lý dùng thống nhất.
// Cấu trúc ChatRole quy định dữ liệu trao đổi trong hội thoại hỗ trợ ăn chay.
export type ChatRole = 'user' | 'assistant'
// Cấu trúc AppRole quy định dữ liệu trao đổi trong hội thoại hỗ trợ ăn chay.
export type AppRole = 'Guest' | 'User' | 'Admin'

// ---------- User Profile & Guest Session ----------
// Cấu trúc UserProfile quy định dữ liệu trao đổi trong hội thoại hỗ trợ ăn chay.
export interface UserProfile {
  bmi: number // 22.5
  bmiStatus: string // 'Bình thường'
  target: string // 'Duy trì cân nặng'
  dietType: string // 'Thuần chay (Vegan)'
  nutritionPreference: string // 'Giàu đạm, ít dầu mỡ'
  allergyAvoid: string // 'Đậu phộng'
}

// Cấu trúc GuestSession quy định dữ liệu trao đổi trong hội thoại hỗ trợ ăn chay.
export interface GuestSession {
  remainingQuestions: number // default 3
  maxQuestions: number // 3
  isLocked: boolean
}

// ---------- BMI Information & Asian Standard Scale ----------
// Cấu trúc BMIStatusTone quy định dữ liệu trao đổi trong hội thoại hỗ trợ ăn chay.
export type BMIStatusTone = 'underweight' | 'normal' | 'overweight' | 'obese'

// Cấu trúc BmiInfo quy định dữ liệu trao đổi trong hội thoại hỗ trợ ăn chay.
export interface BmiInfo {
  value: number // 22.5
  statusLabel: string // 'Chuẩn' / 'Bình thường'
  tone: BMIStatusTone
  rangeLabel: string // '18.5 – 22.9'
  whoNote: string
  dailyKcalRange: string // '1.800 - 1.900 kcal/ngày'
  dailyProtein: string // '60 - 70g protein'
  medicalDisclaimer: string
}

// Cấu trúc BMIResult quy định dữ liệu trao đổi trong hội thoại hỗ trợ ăn chay.
export interface BMIResult extends BmiInfo {
  label: string
  dailyKcalRangeMin: number
  dailyKcalRangeMax: number
  dailyProteinG: number
  noteAvoid: string
  disclaimer: string
}

// ---------- Meal Suggestion Card ----------
// Cấu trúc MealCard quy định dữ liệu trao đổi trong hội thoại hỗ trợ ăn chay.
export interface MealCard {
  id: string
  tag: string // 'Tối • Thanh lọc' | 'Tối • Dễ tiêu'
  kcal: number // 380 | 310
  name: string // 'Salad bơ đậu gà sốt mè'
  description: string
  protein: string // '14g' | '15g'
  recipeId?: string
}

// Cấu trúc RecipePreviewTag quy định dữ liệu trao đổi trong hội thoại hỗ trợ ăn chay.
export interface RecipePreviewTag {
  label: string
  tone: 'green' | 'teal' | 'amber' | 'neutral'
}

// Cấu trúc RecipePreview quy định dữ liệu trao đổi trong hội thoại hỗ trợ ăn chay.
export interface RecipePreview {
  id: string
  tags: RecipePreviewTag[]
  kcal: number
  name: string
  description: string
  nutrientLabel: string // 'Protein'
  nutrientValue: string // '14g'
}

// ---------- Chat Message ----------
// Cấu trúc ChatMessage quy định dữ liệu trao đổi trong hội thoại hỗ trợ ăn chay.
export interface ChatMessage {
  id: string
  sender?: 'user' | 'assistant'
  role: ChatRole
  content: string
  timestamp: string
  typingStreamed?: boolean
  richData?: {
    bmiData?: BmiInfo
    mealSuggestions?: MealCard[]
  }
  bmiAnalysis?: BMIResult
  recipePreview?: RecipePreview[]
  recipeSuggestions?: RecipeSuggestion[]
  disclaimer?: string
}

// ---------- Sidebar and Navigation ----------
// Cấu trúc PersonalProfileField quy định dữ liệu trao đổi trong hội thoại hỗ trợ ăn chay.
export interface PersonalProfileField {
  key: string
  label: string
  value: string
  tone: 'ok' | 'soft' | 'warn' | 'info'
}

// Cấu trúc FaqItem quy định dữ liệu trao đổi trong hội thoại hỗ trợ ăn chay.
export interface FaqItem {
  id: string
  icon?: string
  question: string
  answer?: string
}

// Cấu trúc HistoryItem quy định dữ liệu trao đổi trong hội thoại hỗ trợ ăn chay.
export interface HistoryItem {
  id: string
  title: string
  messages: number
  dateLabel: string
  tone: 'recent' | 'mid' | 'old'
}

// Cấu trúc RecipeSuggestion quy định dữ liệu trao đổi trong hội thoại hỗ trợ ăn chay.
export interface RecipeSuggestion {
  id: string
  title: string
  subtitle: string
  cover: string
  kcal: number
  timeMin: number
  tag: string
  matchReason: string
}

// Cấu trúc ChatConversation quy định dữ liệu trao đổi trong hội thoại hỗ trợ ăn chay.
export interface ChatConversation {
  id: string
  title: string
  summary: string
  lastMessageAt: string
  preview: string
  roleLabel?: AppRole
}

// Cấu trúc ProfileSummary quy định dữ liệu trao đổi trong hội thoại hỗ trợ ăn chay.
export interface ProfileSummary {
  displayName: string
  role: AppRole
  profileType: string
  target: string
  bmiRange: string
  joinAt: string
}

// Cấu trúc AiReplyPayload quy định dữ liệu trao đổi trong hội thoại hỗ trợ ăn chay.
export interface AiReplyPayload {
  reply: string
  recipeSuggestions?: RecipeSuggestion[]
  richData?: {
    bmiData?: BmiInfo
    mealSuggestions?: MealCard[]
  }
}

// Cấu trúc GuestChatState quy định dữ liệu trao đổi trong hội thoại hỗ trợ ăn chay.
export interface GuestChatState {
  questionsRemaining: number
  limit: number
  locked: boolean
}
