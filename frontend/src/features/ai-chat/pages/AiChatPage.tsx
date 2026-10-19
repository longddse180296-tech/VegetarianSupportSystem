import { useCallback, useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import {
  Activity,
  AlertCircle,
  Check,
  ChevronDown,
  Clock,
  Copy,
  HelpCircle,
  History as HistoryIcon,
  Leaf,
  Lock,
  LogIn,
  Pencil,
  RefreshCw,
  Scan,
  Send as SendIcon,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  User as UserIcon,
} from 'lucide-react'

import { Badge, Button, Modal, PageHeading } from '../../../shared/components'
import Markdown from 'react-markdown'
import { useAuth } from '../../auth'

function AiMessageBubble({
  content,
  isStreaming,
}: {
  content: string
  isStreaming: boolean
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <div className="relative group rounded-2xl rounded-tl-xs bg-white border border-emerald-200/80 p-4.5 text-[14px] leading-relaxed text-slate-800 shadow-xs transition-all">
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? 'Đã sao chép vào bộ nhớ tạm' : 'Sao chép tin nhắn'}
        aria-label="Sao chép tin nhắn"
        className="absolute top-2.5 right-2.5 flex h-7 items-center gap-1 px-2 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-100 border border-transparent hover:border-emerald-200 transition-all text-xs font-medium cursor-pointer shadow-2xs"
      >
        {copied ? (
          <>
            <Check size={13} className="text-emerald-700 font-bold" />
            <span className="text-[11px] text-emerald-700 font-semibold">Đã chép</span>
          </>
        ) : (
          <>
            <Copy size={13} />
            <span className="text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">Chép</span>
          </>
        )}
      </button>
      <div className="pr-12 prose prose-sm max-w-none text-slate-800 [&_p]:mb-2.5 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_strong]:font-bold [&_strong]:text-emerald-950 [&_em]:italic [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_blockquote]:border-l-2 [&_blockquote]:border-emerald-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-emerald-200 [&_th]:bg-emerald-50 [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:border-emerald-100 [&_td]:px-2 [&_td]:py-1">
        <Markdown>{content}</Markdown>
      </div>
      {isStreaming && (
        <span className="inline-block h-4 w-1.5 animate-pulse bg-[#2E7D32] ml-1.5 align-middle rounded-full" />
      )}
    </div>
  )
}
import {
  buildUserMessage,
  createChatConversation,
  getChatHistory,
  getConversationMessages,
  getFaqsFigma,
  getUserProfileFields,
  sendMessageToAi,
  streamAiText,
} from '../api/aiChatApi'
import type {
  AppRole,
  ChatMessage,
  FaqItem,
  GuestChatState,
  HistoryItem,
  PersonalProfileField,
} from '../types/aiChat.types'

interface AiChatPageProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
  initialQuery?: string
}

const EXTRA_FAQS: FaqItem[] = [
  { id: 'f-4', icon: 'HelpCircle', question: 'Cách bổ sung Vitamin B12 cho người ăn chay?' },
  { id: 'f-5', icon: 'HelpCircle', question: 'Gợi ý các loại hạt giàu Omega-3?' },
]

export default function AiChatPage({ onNavigate, isLoggedIn, initialQuery = '' }: AiChatPageProps) {
  const { user } = useAuth()
  const appRole: AppRole = isLoggedIn || !!user ? 'User' : 'Guest'

  // Guest quota: maximum 3 questions
  const [guestState, setGuestState] = useState<GuestChatState>({
    questionsRemaining: 3,
    limit: 3,
    locked: false,
  })

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [draft, setDraft] = useState(initialQuery)
  const [isBotBusy, setIsBotBusy] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showMoreFaqs, setShowMoreFaqs] = useState(false)
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false)

  // Sidebar data from API
  const [profileFields, setProfileFields] = useState<PersonalProfileField[]>([])
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [historyError, setHistoryError] = useState(false)
  const [isLoadingConversation, setIsLoadingConversation] = useState(false)
  const [isLoadingInit, setIsLoadingInit] = useState(true)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const cancelStreamRef = useRef<(() => void) | null>(null)

  // Ensure page always starts at top when visiting AI Assistant
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  // Reactive reload of user profile fields
  const refreshProfileFields = useCallback(async () => {
    try {
      const fields = await getUserProfileFields()
      setProfileFields(fields)
    } catch {
      // offline / guest
    }
  }, [])

  const refreshHistory = useCallback(async () => {
    if (appRole !== 'User') return
    try {
      setHistoryItems(await getChatHistory())
      setHistoryError(false)
    } catch {
      setHistoryError(true)
    }
  }, [appRole])

  useEffect(() => {
    const handleProfileUpdate = () => {
      void refreshProfileFields()
    }
    window.addEventListener('vegetarian_user_updated', handleProfileUpdate)
    return () => {
      window.removeEventListener('vegetarian_user_updated', handleProfileUpdate)
    }
  }, [refreshProfileFields])

  // Load Initial Data
  useEffect(() => {
    let alive = true
    void (async () => {
      setIsLoadingInit(true)
      const [fields, faqsData, historyData] = await Promise.all([
        getUserProfileFields(),
        getFaqsFigma(),
        appRole === 'User' ? getChatHistory().catch(() => {
          if (alive) setHistoryError(true)
          return []
        }) : Promise.resolve([]),
      ])
      if (!alive) return
      setActiveConversationId(null)
      setProfileFields(fields)
      setFaqs(faqsData)
      setHistoryItems(historyData)

      setMessages([
        {
          id: 'msg-welcome',
          sender: 'assistant',
          role: 'assistant',
          content:
            'Xin chào! Tôi là Trợ lý AI dinh dưỡng chay. Bạn có thể hỏi tôi về thực đơn, dinh dưỡng, thành phần món ăn hoặc chọn câu hỏi gợi ý bên dưới.',
          timestamp: new Date().toISOString(),
        },
      ])
      setIsLoadingInit(false)
    })()

    return () => {
      alive = false
      if (cancelStreamRef.current) cancelStreamRef.current()
    }
  }, [appRole, user?.id])

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isBotBusy, streamingMessageId])

  const handleScrollMessages = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 140
    setShowScrollBottomBtn(!isNearBottom)
  }

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }

  // Guest Quota check
  const consumeQuota = (): boolean => {
    if (appRole !== 'Guest') return true
    if (guestState.locked || guestState.questionsRemaining <= 0) {
      setShowLoginModal(true)
      return false
    }
    const nextRemaining = guestState.questionsRemaining - 1
    const locked = nextRemaining <= 0
    setGuestState({
      limit: 3,
      questionsRemaining: nextRemaining,
      locked,
    })
    if (locked) {
      setTimeout(() => setShowLoginModal(true), 800)
    }
    return true
  }

  // Send message and trigger real-time typing stream
  const handleSend = async (forcedText?: string) => {
    const textToSend = (forcedText ?? draft).trim()
    if (!textToSend || isBotBusy || isLoadingConversation || isLoadingInit) return

    if (!consumeQuota()) return

    const userMsg = buildUserMessage(textToSend)
    setMessages((prev) => [...prev, userMsg])
    setDraft('')
    setIsBotBusy(true)

    try {
      let conversationId = activeConversationId
      if (appRole === 'User' && !conversationId) {
        conversationId = await createChatConversation()
        setActiveConversationId(conversationId)
      }
      const response = await sendMessageToAi('user', textToSend, conversationId)

      // Initialize empty bot message for streaming
      const botMsgId = response.id
      const fullContent = response.content
      setMessages((prev) => [
        ...prev,
        {
          ...response,
          content: '',
          typingStreamed: true,
        },
      ])
      setStreamingMessageId(botMsgId)

      // Stream text effect
      const stopStream = streamAiText(
        fullContent,
        (partial) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === botMsgId ? { ...m, content: partial } : m)),
          )
        },
        () => {
          setStreamingMessageId(null)
          setIsBotBusy(false)
        },
        20,
      )
      cancelStreamRef.current = stopStream
    } catch (err: unknown) {
      console.error('[AiChatPage] Send error:', err)
      setIsBotBusy(false)
      setStreamingMessageId(null)
      const errorMsg =
        err instanceof Error && err.message
          ? err.message
          : 'Mất kết nối hoặc máy chủ phản hồi quá lâu, vui lòng thử lại.'
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-error-${Date.now()}`,
          sender: 'assistant',
          role: 'assistant',
          content: `⚠️ ${errorMsg}`,
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      void refreshHistory()
    }
  }

  const handleSelectHistory = async (conversationId: string) => {
    if (isBotBusy || isLoadingConversation) return
    setIsLoadingConversation(true)
    try {
      const savedMessages = await getConversationMessages(conversationId)
      setMessages(savedMessages)
      setActiveConversationId(conversationId)
      setDraft('')
      setHistoryError(false)
    } catch {
      setHistoryError(true)
    } finally {
      setIsLoadingConversation(false)
    }
  }

  // Reset Conversation
  const handleResetChat = () => {
    if (isBotBusy || isLoadingConversation) return
    if (cancelStreamRef.current) cancelStreamRef.current()
    setIsBotBusy(false)
    setStreamingMessageId(null)
    setActiveConversationId(null)
    setDraft('')
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        role: 'assistant',
        content:
          'Xin chào! Tôi là Trợ lý AI dinh dưỡng chay. Bạn có thể hỏi tôi về thực đơn, dinh dưỡng, thành phần món ăn hoặc chọn câu hỏi gợi ý bên dưới.',
        timestamp: new Date().toISOString(),
      },
    ])
  }

  return (
    <div className="ui-page-container py-8 space-y-6">
      <PageHeading
        title="Trợ lý dinh dưỡng AI"
        description="Hỏi đáp về dinh dưỡng chay, nguyên liệu thay thế, BMI, calo và nhận gợi ý bữa ăn khoa học được cá nhân hóa cho bạn."
        breadcrumbs={[
          { label: 'Trang chủ', onClick: () => onNavigate?.('/') },
          { label: 'Trợ lý AI' },
        ]}
        eyebrow={<Badge icon={<Sparkles size={14} />}>Trợ lý AI thông minh</Badge>}
      />

        {/* ============= MAIN 2 COLUMNS ============= */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* =========================================================
           * CỘT TRÁI (KHUNG CHAT CHÍNH): lg:col-span-8 (GHIM NỔI KHI CUỘN)
           * ========================================================= */}
          <section className="lg:col-span-8 lg:sticky lg:top-20 z-10 self-start relative flex flex-col rounded-2xl border-2 border-emerald-900/15 bg-white shadow-md overflow-hidden h-[calc(100vh-105px)] min-h-[580px] max-h-[760px]">
            {/* Header hộp chat */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-gradient-to-r from-emerald-50/50 via-slate-50/30 to-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] text-white shadow-xs">
                  <Leaf size={22} className="fill-white" />
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white" />
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">
                      Vegetarian AI Assistant
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                      Sẵn sàng tư vấn
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-500">
                    Hỏi đáp khoa học · Cá nhân hóa theo chỉ số cơ thể
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetChat}
                disabled={isBotBusy || isLoadingConversation}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:text-[#2E7D32] hover:border-emerald-300 hover:bg-emerald-50/50 shadow-2xs transition active:scale-95 cursor-pointer"
                title="Bắt đầu phiên hội thoại mới"
              >
                <RefreshCw size={13} className="text-slate-500 group-hover:rotate-180 transition-transform" />
                <span>Làm mới hội thoại</span>
              </button>
            </div>

            {/* Khung tin nhắn */}
            <div
              ref={scrollRef}
              onScroll={handleScrollMessages}
              className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6 bg-[#F8FAF9]"
            >
              {isLoadingInit || isLoadingConversation ? (
                <div className="space-y-4">
                  <div className="h-12 w-2/3 bg-slate-100 animate-pulse rounded-2xl" />
                  <div className="h-28 w-5/6 bg-slate-100 animate-pulse rounded-2xl" />
                </div>
              ) : (
                messages.map((m, idx) =>
                  m.role === 'user' ? (
                    <div key={m.id} className="flex justify-end items-start gap-2.5">
                      <div className="rounded-2xl rounded-tr-xs bg-gradient-to-r from-[#2E7D32] to-[#1B5E20] px-4.5 py-3 text-[14px] text-white shadow-xs max-w-[82%] leading-relaxed font-medium">
                        {m.content}
                      </div>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white shadow-2xs">
                        <UserIcon size={16} />
                      </div>
                    </div>
                  ) : (
                    <div key={m.id} className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] text-white shadow-xs">
                        <Leaf size={16} className="fill-white" />
                      </div>
                      <div className="flex-1 space-y-3.5 max-w-[90%]">
                        {/* Text bubble with copy button */}
                        <AiMessageBubble
                          content={m.content}
                          isStreaming={streamingMessageId === m.id}
                        />

                        {/* Quick action chips under welcome message */}
                        {idx === 0 && (
                          <div className="space-y-3 pt-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[12px] font-semibold text-slate-500">Gợi ý nhanh:</span>
                              {[
                                'Tạo thực đơn hôm nay',
                                'Phân tích món này',
                                'Tính BMI cho tôi',
                              ].map((chip) => (
                                <button
                                  key={chip}
                                  type="button"
                                  onClick={() => void handleSend(chip)}
                                  className="group inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-2xs hover:border-[#2E7D32] hover:bg-emerald-50/80 hover:shadow-xs transition-all active:scale-95 cursor-pointer"
                                >
                                  <Sparkles size={12} className="text-emerald-600 group-hover:rotate-12 transition-transform shrink-0" />
                                  <span>{chip}</span>
                                </button>
                              ))}
                            </div>

                            {/* Welcome interactive prompt cards (only shown when first message) */}
                            {messages.length === 1 && (
                              <div className="mt-4 pt-3 border-t border-slate-200/70 space-y-2.5">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                  <Sparkles size={13} className="text-[#2E7D32]" />
                                  <span>Bạn có thể chọn chủ đề quan tâm để bắt đầu:</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  {[
                                    {
                                      title: '🥗 Gợi ý thực đơn hôm nay',
                                      desc: 'Thực đơn 3 bữa thanh đạm, đủ đạm & vi chất',
                                      prompt: 'Gợi ý cho tôi thực đơn chay đủ chất, cân đối cho cả ngày hôm nay',
                                    },
                                    {
                                      title: '⚖️ Đo thể trạng & Nhu cầu Calo',
                                      desc: 'Chuẩn WHO Châu Á, tính lượng protein cần nạp',
                                      prompt: 'Hãy giúp tôi tính BMI và lượng calo, protein cần thiết mỗi ngày',
                                    },
                                    {
                                      title: '🥑 Thay thế đạm động vật',
                                      desc: 'Các nguồn đạm thực vật từ đậu, hạt & nấm',
                                      prompt: 'Gợi ý các nguồn nguyên liệu thực vật giàu đạm để thay thế thịt cá',
                                    },
                                    {
                                      title: '🔍 Kiểm tra món ăn chay',
                                      desc: 'Phân tích độ phù hợp theo chế độ ăn thuần chay/Lacto/Ovo',
                                      prompt: 'Tôi muốn kiểm tra xem món canh nấm hạt sen có phù hợp ăn chay không',
                                    },
                                  ].map((card) => (
                                    <button
                                      key={card.title}
                                      type="button"
                                      onClick={() => void handleSend(card.prompt)}
                                      className="group text-left p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-[#2E7D32] hover:bg-emerald-50/40 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                                    >
                                      <div>
                                        <div className="text-[13px] font-bold text-slate-800 group-hover:text-[#2E7D32] transition-colors">
                                          {card.title}
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                                          {card.desc}
                                        </p>
                                      </div>
                                      <div className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-[#2E7D32] opacity-80 group-hover:opacity-100">
                                        <span>Bắt đầu hỏi</span>
                                        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Special Rich Component: Thước đo chuẩn Châu Á */}
                        {m.bmiAnalysis && (
                          <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-2xs">
                            <div className="mb-2.5 flex items-center justify-between text-xs font-bold">
                              <span className="flex items-center gap-1.5 text-slate-800">
                                <Activity size={14} className="text-emerald-700" />
                                Thước đo thể trạng chuẩn Châu Á (WHO Asia-Pacific)
                              </span>
                              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-emerald-800 font-bold">
                                BMI hiện tại: {m.bmiAnalysis.value.toFixed(1)}
                              </span>
                            </div>

                            {/* Scrubber indicator */}
                            <div className="relative h-6 w-full">
                              <div
                                className="absolute -translate-x-1/2 flex flex-col items-center"
                                style={{ left: '48%' }}
                              >
                                <span className="text-[10px] font-extrabold text-slate-800 leading-none bg-white px-1 py-0.5 rounded shadow-2xs border border-slate-200">
                                  {m.bmiAnalysis.value.toFixed(1)}
                                </span>
                                <span className="text-[#2E7D32] text-[10px] leading-none" aria-hidden>
                                  ▼
                                </span>
                              </div>
                            </div>

                            {/* Bar with 4 zones */}
                            <div className="h-3 w-full rounded-full overflow-hidden grid grid-cols-4 gap-0.5 bg-slate-200">
                              <div className="bg-[#D1D5DB]" title="< 18.5 Thiếu cân" />
                              <div className="bg-[#2E7D32]" title="18.5 – 22.9 Chuẩn" />
                              <div className="bg-[#FBBF24]" title="23 – 24.9 Thừa cân" />
                              <div className="bg-[#F87171]" title="≥ 25 Béo phì" />
                            </div>

                            {/* Labels below */}
                            <div className="mt-2 grid grid-cols-4 text-[10px] font-semibold text-slate-500">
                              <span>{'<'} 18.5 Thiếu cân</span>
                              <span className="text-[#2E7D32] font-bold">18.5 - 22.9 Chuẩn</span>
                              <span>23 - 24.9 Thừa cân</span>
                              <span>≥ 25 Béo phì</span>
                            </div>
                          </div>
                        )}

                        {/* Calorie & Protein recommendation text box */}
                        {m.bmiAnalysis && (
                          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 text-[13px] text-slate-700 leading-relaxed flex items-start gap-2.5">
                            <Sparkles size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                            <div>
                              Để duy trì cân nặng lý tưởng và năng lượng bền bỉ, bạn nên nạp khoảng{' '}
                              <strong className="text-emerald-900 font-bold">1.800 - 1.900 kcal/ngày</strong> với{' '}
                              <strong className="text-emerald-900 font-bold">60 - 70g protein</strong> từ đậu, hạt và ngũ cốc nguyên cám.
                            </div>
                          </div>
                        )}

                        {/* Medical Disclaimer */}
                        {m.disclaimer && (
                          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 text-[12px] text-slate-700 flex items-center gap-2">
                            <ShieldAlert size={15} className="text-[#2E7D32] shrink-0" />
                            <span>{m.disclaimer}</span>
                          </div>
                        )}

                        {/* Special Rich Component: Meal Suggestion Cards side-by-side */}
                        {m.recipePreview && m.recipePreview.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {m.recipePreview.map((card) => (
                              <div
                                key={card.id}
                                className="group rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                      {card.tags[0]?.label ?? 'Bữa tối · Thanh lọc'}
                                    </span>
                                    <span className="text-[12px] font-extrabold text-slate-800">
                                      {card.kcal} kcal
                                    </span>
                                  </div>
                                  <h4 className="text-[14px] font-bold text-slate-900 mb-1 group-hover:text-emerald-800 transition-colors">
                                    {card.name}
                                  </h4>
                                  <p className="text-[12px] text-slate-500 leading-snug line-clamp-2">
                                    {card.description}
                                  </p>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-dashed border-slate-200 flex items-center justify-between text-[12px]">
                                  <span className="font-medium text-slate-600">
                                    Protein: <strong className="text-slate-900 font-bold">{card.nutrientValue}</strong>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onNavigate?.(`/recipes/${card.id}`)}
                                    className="font-bold text-[#2E7D32] hover:text-[#1B5E20] hover:underline cursor-pointer"
                                  >
                                    Xem chi tiết →
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                )
              )}

              {/* Bot thinking / typing indicator */}
              {isBotBusy && !streamingMessageId && (
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] text-white shadow-xs">
                    <Leaf size={16} className="fill-white" />
                  </div>
                  <div className="rounded-2xl rounded-tl-xs bg-[#F4F9F5] border border-emerald-100 px-4 py-3 text-[14px] text-slate-800 flex items-center gap-2.5 shadow-2xs">
                    <span className="text-xs text-emerald-900 font-medium">Trợ lý AI đang xử lý và tổng hợp dinh dưỡng...</span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}
              {/* Ref to smoothly scroll to bottom */}
              <div ref={messagesEndRef} />
            </div>

            {/* Nút nổi cuộn xuống tin nhắn mới nhất khi người dùng lướt lên trên */}
            {showScrollBottomBtn && (
              <button
                type="button"
                onClick={scrollToBottom}
                className="absolute bottom-24 right-6 z-20 flex items-center gap-1.5 rounded-full bg-white/95 border border-slate-300 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-md hover:bg-emerald-50 hover:text-[#2E7D32] hover:border-emerald-300 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2"
                title="Cuộn xuống tin nhắn mới nhất"
              >
                <ChevronDown size={14} className="text-[#2E7D32] animate-bounce" />
                <span>Xuống tin mới</span>
              </button>
            )}

            {/* Input & Control Footer */}
            <div className="border-t border-slate-200 p-4 bg-white shrink-0">
              <div className="flex items-center gap-2 rounded-2xl border-2 border-slate-200/90 bg-slate-50/70 p-2 focus-within:border-[#2E7D32] focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all shadow-2xs">
                <input
                  type="text"
                  placeholder="Nhập câu hỏi của bạn về dinh dưỡng, món ăn, calo, nguyên liệu..."
                  value={draft}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void handleSend()
                    }
                  }}
                  disabled={isBotBusy || isLoadingConversation || guestState.locked}
                  className="flex-1 bg-transparent border-none text-[14px] text-slate-800 placeholder:text-slate-400 px-3 focus:outline-none"
                />

                {/* Scan Button */}
                <button
                  type="button"
                  title="Quét thực phẩm & nhãn bao bì"
                  onClick={() => onNavigate?.('/food-scan')}
                  className="flex h-9 items-center gap-1.5 px-2.5 rounded-xl text-slate-600 hover:bg-emerald-50 hover:text-[#2E7D32] hover:border-emerald-200 border border-transparent transition text-xs font-semibold cursor-pointer"
                >
                  <Scan size={16} />
                  <span className="hidden sm:inline">Quét ảnh</span>
                </button>

                {/* Send Button with anti-spam disabled and loading state */}
                <button
                  type="button"
                  disabled={isBotBusy || isLoadingConversation || !draft.trim() || guestState.locked}
                  onClick={() => void handleSend()}
                  aria-label="Gửi câu hỏi"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs active:scale-95"
                >
                  {isBotBusy ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    <SendIcon size={15} />
                  )}
                </button>
              </div>

              {/* Footnote */}
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[12px] text-slate-500">
                <div className="flex items-center gap-1.5 font-medium text-slate-600">
                  <AlertCircle size={14} className="text-amber-600 shrink-0" />
                  <span>
                    AI chỉ cung cấp kiến thức dinh dưỡng thực vật thường thức, không thay thế chẩn đoán hay điều trị y khoa.
                  </span>
                </div>
                <span className="font-medium text-slate-400 text-[11px]">Nhấn Enter để gửi</span>
              </div>
            </div>
          </section>

          {/* =========================================================
           * CỘT PHẢI (SIDEBAR THÔNG TIN): lg:col-span-4
           * ========================================================= */}
          <aside className="lg:col-span-4 flex flex-col gap-6">
            {/* Card 1: Chế độ trải nghiệm */}
            <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-emerald-50/60 to-white p-4.5 shadow-2xs">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#2E7D32] shadow-2xs border border-emerald-100">
                  <Clock size={19} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-bold text-slate-800">Chế độ trải nghiệm</span>
                    <span className="rounded-full bg-[#2E7D32] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-2xs">
                      {appRole === 'Guest' ? `${guestState.questionsRemaining}/3 lượt` : 'Không giới hạn'}
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-500 mt-1">
                    {appRole === 'Guest'
                      ? `Bạn còn ${guestState.questionsRemaining} câu hỏi thử nghiệm miễn phí hôm nay.`
                      : 'Tài khoản thành viên dùng không giới hạn lượt hỏi.'}
                  </p>
                  {appRole === 'Guest' && (
                    <button
                      type="button"
                      onClick={() => onNavigate?.('/login')}
                      className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-[#2E7D32] hover:underline cursor-pointer"
                    >
                      <LogIn size={13} />
                      <span>Đăng nhập để hỏi không giới hạn</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Hồ sơ cá nhân hóa (chỉ hiển thị khi đã đăng nhập) */}
            {appRole === 'User' && profileFields.length > 0 && (
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
                <div className="mb-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[15px] font-bold text-slate-800">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[#2E7D32]">
                      <UserIcon size={15} />
                    </div>
                    <span>Hồ sơ cá nhân hóa</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate?.('/profile')}
                    className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#2E7D32] hover:underline cursor-pointer"
                  >
                    <Pencil size={12} />
                    <span>Chỉnh sửa</span>
                  </button>
                </div>

                <div className="space-y-3 text-[13px]">
                  {profileFields.map((f) => (
                    <div key={f.key} className="flex items-center justify-between gap-2 py-1 border-b border-slate-50 last:border-none">
                      <span className="text-slate-500 font-medium">{f.label}</span>
                      {f.key === 'diet' ? (
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-[#2E7D32]">
                          {f.value}
                        </span>
                      ) : f.key === 'bmi' ? (
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-[#2E7D32]">
                          {f.value}
                        </span>
                      ) : f.key === 'allergy' ? (
                        f.value !== 'Không có' ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                            <TriangleAlert size={11} />
                            {f.value}
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                            Không có
                          </span>
                        )
                      ) : (
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                          {f.value}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl bg-emerald-50/70 border border-emerald-100 p-3 text-[11px] text-emerald-800 flex items-start gap-2">
                  <Sparkles size={14} className="shrink-0 mt-0.5 text-emerald-600" />
                  <span>AI tự động đối chiếu thông tin này để đưa ra gợi ý chuẩn xác nhất cho bạn.</span>
                </div>
              </div>
            )}

            {/* Card 3: Câu hỏi thường gặp */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
              <div className="mb-3.5 flex items-center gap-2 text-[15px] font-bold text-slate-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[#2E7D32]">
                  <HelpCircle size={15} />
                </div>
                <span>Câu hỏi thường gặp</span>
              </div>

              <div className="space-y-2">
                {(showMoreFaqs ? [...faqs, ...EXTRA_FAQS] : faqs).map((faq) => (
                  <button
                    key={faq.id}
                    type="button"
                    onClick={() => void handleSend(faq.question)}
                    className="group w-full text-left p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-800 text-[13px] font-medium flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <span className="text-[#2E7D32] group-hover:scale-110 transition-transform">💬</span>
                    <span className="truncate flex-1">{faq.question}</span>
                  </button>
                ))}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowMoreFaqs((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#2E7D32] hover:underline cursor-pointer"
                >
                  <span>{showMoreFaqs ? 'Thu gọn' : 'Xem thêm gợi ý'}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${showMoreFaqs ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>
            </div>

            {/* Card 4: Lịch sử gần đây */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
              <div className="mb-3 flex items-center justify-between text-[15px] font-bold text-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[#2E7D32]">
                    <HistoryIcon size={15} />
                  </div>
                  <span>Lịch sử gần đây</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  {historyItems.length} hội thoại
                </span>
              </div>

              <div className="space-y-2">
                {historyError ? (
                  <div className="py-4 text-center text-xs text-rose-600">
                    Không thể tải lịch sử. <button type="button" onClick={() => void refreshHistory()} className="font-semibold underline">Thử lại</button>
                  </div>
                ) : historyItems.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    Chưa có lịch sử hội thoại nào.
                  </div>
                ) : (
                  historyItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => void handleSelectHistory(item.id)}
                      disabled={isBotBusy || isLoadingConversation}
                      aria-current={activeConversationId === item.id ? 'true' : undefined}
                      className={`w-full text-left p-2.5 rounded-xl hover:bg-slate-50 hover:border-emerald-200 border transition group cursor-pointer disabled:cursor-not-allowed ${activeConversationId === item.id ? 'border-emerald-300 bg-emerald-50' : 'border-transparent'}`}
                    >
                      <div className="text-[13px] font-bold text-slate-800 group-hover:text-[#2E7D32] truncate max-w-full">
                        {item.title}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                        <span>{item.messages} tin nhắn</span>
                        {item.dateLabel && item.dateLabel !== 'Mẫu gợi ý' ? (
                          <span>{item.dateLabel}</span>
                        ) : null}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>

      {/* ============= MODAL ĐĂNG NHẬP (KHI HẾT LƯỢT GUEST) ============= */}
      <Modal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        maxWidth="md"
        title={
          <span className="flex items-center gap-2">
            <Lock size={18} className="text-[#2E7D32]" />
            Đăng nhập để tiếp tục hỏi Trợ lý AI
          </span>
        }
        description="Bạn đã dùng hết 3 lượt hỏi cho vai trò khách. Đăng nhập tài khoản Vegetarian Support để hỏi không giới hạn, lưu lịch sử hội thoại và nhận gợi ý theo hồ sơ dinh dưỡng của bạn."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setShowLoginModal(false)}>
              Để sau
            </Button>
            <Button
              type="button"
              variant="primary"
              leftIcon={<LogIn size={14} />}
              onClick={() => {
                setShowLoginModal(false)
                onNavigate?.('/login')
              }}
              className="!bg-[#2E7D32] hover:!bg-[#1B5E20] !text-white"
            >
              Đăng nhập / Đăng ký ngay
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-[13px] text-[#374151]">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-[#2E7D32]" />
            <span>Hỏi đáp không giới hạn với Trợ lý dinh dưỡng AI.</span>
          </div>
          <div className="flex items-center gap-2">
            <UserIcon size={15} className="text-[#2E7D32]" />
            <span>Cá nhân hóa thực đơn theo chỉ số BMI, sở thích và dị ứng.</span>
          </div>
          <div className="flex items-center gap-2">
            <HistoryIcon size={15} className="text-[#2E7D32]" />
            <span>Lưu lại toàn bộ lịch sử tư vấn và kế hoạch dinh dưỡng.</span>
          </div>
        </div>
      </Modal>
    </div>
  )
}
