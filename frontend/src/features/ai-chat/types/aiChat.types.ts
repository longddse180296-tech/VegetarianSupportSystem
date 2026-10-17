export type ChatRole = 'user' | 'assistant'
export type AppRole = 'Guest' | 'User' | 'Admin'

// ---------- User Profile & Guest Session ----------
export interface UserProfile {
  bmi: number // 22.5
  bmiStatus: string // 'Bình thường'
  target: string // 'Duy trì cân nặng'
  dietType: string // 'Thuần chay (Vegan)'
  nutritionPreference: string // 'Giàu đạm, ít dầu mỡ'
  allergyAvoid: string // 'Đậu phộng'
}

export interface GuestSession {
  remainingQuestions: number // default 3
  maxQuestions: number // 3
  isLocked: boolean
}

// ---------- BMI Information & Asian Standard Scale ----------
export type BMIStatusTone = 'underweight' | 'normal' | 'overweight' | 'obese'

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

export interface BMIResult extends BmiInfo {
  label: string
  dailyKcalRangeMin: number
  dailyKcalRangeMax: number
  dailyProteinG: number
  noteAvoid: string
  disclaimer: string
}

// ---------- Meal Suggestion Card ----------
export interface MealCard {
  id: string
  tag: string // 'Tối • Thanh lọc' | 'Tối • Dễ tiêu'
  kcal: number // 380 | 310
  name: string // 'Salad bơ đậu gà sốt mè'
  description: string
  protein: string // '14g' | '15g'
  recipeId?: string
}

export interface RecipePreviewTag {
  label: string
  tone: 'green' | 'teal' | 'amber' | 'neutral'
}

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
export interface PersonalProfileField {
  key: string
  label: string
  value: string
  tone: 'ok' | 'soft' | 'warn' | 'info'
}

export interface FaqItem {
  id: string
  icon?: string
  question: string
  answer?: string
}

export interface HistoryItem {
  id: string
  title: string
  messages: number
  dateLabel: string
  tone: 'recent' | 'mid' | 'old'
}

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

export interface ChatConversation {
  id: string
  title: string
  summary: string
  lastMessageAt: string
  preview: string
  roleLabel?: AppRole
}

export interface ProfileSummary {
  displayName: string
  role: AppRole
  profileType: string
  target: string
  bmiRange: string
  joinAt: string
}

export interface AiReplyPayload {
  reply: string
  recipeSuggestions?: RecipeSuggestion[]
  richData?: {
    bmiData?: BmiInfo
    mealSuggestions?: MealCard[]
  }
}

export interface GuestChatState {
  questionsRemaining: number
  limit: number
  locked: boolean
}
