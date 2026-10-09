export type ChatRole = 'user' | 'assistant'
export type AppRole = 'Guest' | 'User' | 'Admin'

// —— NEW TYPES for Figma UI (no behaviour change) ——
export type BMIStatusTone = 'underweight' | 'normal' | 'overweight' | 'obese'

export interface BMIThresholds {
  underweight: number // <18.5
  normalStart: number
  normalEnd: number // 22.9
  overweightEnd: number // 24.9
}

export interface BMIResult {
  value: number // e.g 22.5
  label: string // e.g "Bình thường"
  tone: BMIStatusTone
  rangeLabel: string // e.g "18.5 - 22.9"
  whoNote: string
  dailyKcalRangeMin: number
  dailyKcalRangeMax: number
  dailyProteinG: number
  noteAvoid: string
  disclaimer: string
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
  nutrientLabel: string // e.g "Protein"
  nutrientValue: string // e.g "14g"
}

export interface ExperienceCreditsState {
  used: number
  limit: number
  locked: boolean
}

export interface PersonalProfileField {
  key: string
  label: string
  value: string
  tone: 'ok' | 'soft' | 'warn' | 'info'
}

export interface FaqItem {
  id: string
  icon?: string // lucide name (optional for legacy items)
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

// —— EXISTING types preserved ——
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

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: string
  recipeSuggestions?: RecipeSuggestion[]
  typingStreamed?: boolean
  // NEW optional attachments for Figma UI blocks within bot bubbles
  bmiAnalysis?: BMIResult
  recipePreview?: RecipePreview[]
  disclaimer?: string
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
}

export interface GuestChatState {
  questionsRemaining: number
  limit: number
  locked: boolean
}
