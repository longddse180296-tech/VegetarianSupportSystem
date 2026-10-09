export type ChatRole = 'user' | 'assistant'
export type AppRole = 'Guest' | 'User' | 'Admin'

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

export interface FaqItem {
  id: string
  question: string
  answer: string
}

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: string
  recipeSuggestions?: RecipeSuggestion[]
  typingStreamed?: boolean
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
