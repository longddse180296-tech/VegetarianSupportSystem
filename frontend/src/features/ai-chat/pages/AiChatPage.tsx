import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import {
  Clock,
  HelpCircle,
  History as HistoryIcon,
  Leaf,
  Lock,
  LogIn,
  RefreshCw,
  Scan,
  Send as SendIcon,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  User as UserIcon,
} from 'lucide-react'

import { Button, Modal } from '../../../shared/components'
import {
  buildUserMessage,
  getChatHistoryFigma,
  getDefaultBmi,
  getFaqsFigma,
  getRecipeSuggestions,
  getUserProfileFields,
  sendMessageToAi,
  streamAiText,
} from '../api/aiChatApi'
import type {
  AppRole,
  BMIResult,
  ChatMessage,
  FaqItem,
  GuestChatState,
  HistoryItem,
  PersonalProfileField,
  RecipePreview,
} from '../types/aiChat.types'

const INITIAL_USER_QUESTION =
  'Chỉ số BMI 22.5 của tôi có ý nghĩa gì đối với chế độ ăn chay?'

const INITIAL_BOT_REPLY_1 =
  'Chỉ số BMI 22.5 của bạn nằm trong ngưỡng Bình thường (18.5 – 22.9) theo chuẩn Tổ chức Y tế Thế giới (WHO) dành cho người trưởng thành châu Á.'

const INITIAL_BOT_REPLY_2 =
  'Dưới đây là 2 thực đơn bữa tối thanh nhẹ dưới 500 kcal rất hợp với chỉ số BMI của bạn hôm nay:'

interface AiChatPageProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

export default function AiChatPage({ onNavigate, isLoggedIn }: AiChatPageProps) {
  const appRole: AppRole = isLoggedIn ? 'User' : 'Guest'

  // Guest quota: maximum 3 questions
  const [guestState, setGuestState] = useState<GuestChatState>({
    questionsRemaining: 3,
    limit: 3,
    locked: false,
  })

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [isBotBusy, setIsBotBusy] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Sidebar mock data from API
  const [profileFields, setProfileFields] = useState<PersonalProfileField[]>([])
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [defaultBmi, setDefaultBmi] = useState<BMIResult | null>(null)
  const [mealRecipes, setMealRecipes] = useState<RecipePreview[]>([])
  const [isLoadingInit, setIsLoadingInit] = useState(true)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const cancelStreamRef = useRef<(() => void) | null>(null)

  // Load Initial Data
  useEffect(() => {
    let alive = true
    void (async () => {
      setIsLoadingInit(true)
      const [fields, faqsData, historyData, bmi, recipes] = await Promise.all([
        getUserProfileFields(),
        getFaqsFigma(),
        getChatHistoryFigma(),
        getDefaultBmi(),
        getRecipeSuggestions(22.5),
      ])
      if (!alive) return
      setProfileFields(fields)
      setFaqs(faqsData)
      setHistoryItems(historyData)
      setDefaultBmi(bmi)
      setMealRecipes(recipes)

      // Seed initial conversation matching Figma design
      setMessages([
        {
          id: 'msg-seed-user',
          sender: 'user',
          role: 'user',
          content: INITIAL_USER_QUESTION,
          timestamp: new Date(Date.now() - 120_000).toISOString(),
        },
        {
          id: 'msg-seed-bot-1',
          sender: 'assistant',
          role: 'assistant',
          content: INITIAL_BOT_REPLY_1,
          timestamp: new Date(Date.now() - 60_000).toISOString(),
          bmiAnalysis: bmi,
          disclaimer: bmi.medicalDisclaimer,
        },
        {
          id: 'msg-seed-bot-2',
          sender: 'assistant',
          role: 'assistant',
          content: INITIAL_BOT_REPLY_2,
          timestamp: new Date(Date.now() - 30_000).toISOString(),
          recipePreview: recipes,
        },
      ])
      setIsLoadingInit(false)
    })()

    return () => {
      alive = false
      if (cancelStreamRef.current) cancelStreamRef.current()
    }
  }, [appRole])

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isBotBusy, streamingMessageId])

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
    if (!textToSend || isBotBusy) return

    if (!consumeQuota()) return

    const userMsg = buildUserMessage(textToSend)
    setMessages((prev) => [...prev, userMsg])
    setDraft('')
    setIsBotBusy(true)

    try {
      const response = await sendMessageToAi('user', textToSend, null)

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
    } catch {
      setIsBotBusy(false)
      setStreamingMessageId(null)
    }
  }

  // Reset Conversation
  const handleResetChat = () => {
    if (cancelStreamRef.current) cancelStreamRef.current()
    setIsBotBusy(false)
    setStreamingMessageId(null)
    if (defaultBmi && mealRecipes.length > 0) {
      setMessages([
        {
          id: `msg-${Date.now()}-u`,
          sender: 'user',
          role: 'user',
          content: INITIAL_USER_QUESTION,
          timestamp: new Date().toISOString(),
        },
        {
          id: `msg-${Date.now()}-b1`,
          sender: 'assistant',
          role: 'assistant',
          content: INITIAL_BOT_REPLY_1,
          timestamp: new Date().toISOString(),
          bmiAnalysis: defaultBmi,
          disclaimer: defaultBmi.medicalDisclaimer,
        },
        {
          id: `msg-${Date.now()}-b2`,
          sender: 'assistant',
          role: 'assistant',
          content: INITIAL_BOT_REPLY_2,
          timestamp: new Date().toISOString(),
          recipePreview: mealRecipes,
        },
      ])
    } else {
      setMessages([])
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#1F2937] font-['Inter']">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6">
        {/* ============= BREADCRUMBS ============= */}
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-2 text-[14px] text-[#6B7280]"
        >
          <button
            type="button"
            onClick={() => onNavigate?.('/')}
            className="hover:text-[#2E7D32] transition"
          >
            Trang chủ
          </button>
          <span className="text-[#9CA3AF]" aria-hidden>
            ›
          </span>
          <span className="text-[#1F2937] font-medium">Trợ lý AI</span>
        </nav>

        {/* ============= PAGE HEADER ============= */}
        <header className="mb-6 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] sm:text-[32px] font-extrabold tracking-tight text-[#111827]">
              Trợ lý dinh dưỡng AI
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C8E6C9] bg-[#E8F5E9] px-3 py-1 text-[12px] font-bold text-[#2E7D32]">
              <Leaf size={13} className="fill-[#2E7D32]" />
              Trợ lý ảo dinh dưỡng thực vật
            </span>
          </div>
          <p className="text-[14px] sm:text-[15px] text-[#6B7280] max-w-[720px]">
            Hỏi đáp về dinh dưỡng chay, nguyên liệu thay thế, BMI, calo và nhận gợi ý bữa ăn khoa học được cá nhân hóa cho bạn.
          </p>
        </header>

        {/* ============= MAIN 2 COLUMNS ============= */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* =========================================================
           * CỘT TRÁI (KHUNG CHAT CHÍNH): lg:col-span-8
           * ========================================================= */}
          <section className="lg:col-span-8 flex flex-col rounded-[16px] border border-[#E5E7EB] bg-white shadow-sm overflow-hidden min-h-[640px]">
            {/* Header hộp chat */}
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4 bg-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]">
                  <Leaf size={20} className="fill-[#2E7D32]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[15px] font-bold text-[#1F2937]">
                      Vegetarian AI Assistant
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-semibold text-[#2E7D32]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                      Đang hoạt động
                    </span>
                  </div>
                  <p className="text-[12px] text-[#6B7280]">
                    Phân tích dinh dưỡng thực vật chuẩn khoa học
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetChat}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#4B5563] hover:text-[#2E7D32] transition"
              >
                <RefreshCw size={14} />
                Làm mới hội thoại
              </button>
            </div>

            {/* Khung tin nhắn */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6 bg-[#FFFFFF] max-h-[560px]"
            >
              {isLoadingInit ? (
                <div className="space-y-4">
                  <div className="h-12 w-2/3 bg-slate-100 animate-pulse rounded-[12px]" />
                  <div className="h-28 w-5/6 bg-slate-100 animate-pulse rounded-[12px]" />
                </div>
              ) : (
                messages.map((m) =>
                  m.role === 'user' ? (
                    <div key={m.id} className="flex justify-end items-start gap-2.5">
                      <div className="rounded-[16px] rounded-tr-none bg-[#2E7D32] px-4 py-3 text-[14px] text-white shadow-sm max-w-[82%] leading-relaxed">
                        {m.content}
                      </div>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1F2937] text-white">
                        <UserIcon size={16} />
                      </div>
                    </div>
                  ) : (
                    <div key={m.id} className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2E7D32] text-white shadow-sm">
                        <Leaf size={16} className="fill-white" />
                      </div>
                      <div className="flex-1 space-y-3.5 max-w-[90%]">
                        {/* Text bubble */}
                        <div className="rounded-[16px] rounded-tl-none bg-[#E8F5E9] border border-[#C8E6C9] p-4 text-[14px] leading-relaxed text-[#1F2937]">
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          {streamingMessageId === m.id && (
                            <span className="inline-block h-3.5 w-1.5 animate-pulse bg-[#2E7D32] ml-1 align-middle" />
                          )}
                        </div>

                        {/* Special Rich Component: Thước đo chuẩn Châu Á */}
                        {m.bmiAnalysis && (
                          <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-4 shadow-xs">
                            <div className="mb-2 flex items-center justify-between text-[11px] font-bold">
                              <span className="text-[#1F2937]">Thước đo chuẩn Châu Á</span>
                              <span className="text-[#2E7D32]">
                                Điểm số hiện tại: {m.bmiAnalysis.value.toFixed(1)}
                              </span>
                            </div>

                            {/* Scrubber indicator */}
                            <div className="relative h-6 w-full">
                              <div
                                className="absolute -translate-x-1/2 flex flex-col items-center"
                                style={{ left: '48%' }}
                              >
                                <span className="text-[10px] font-bold text-[#1F2937] leading-none">
                                  22.5
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
                            <div className="mt-1.5 grid grid-cols-4 text-[10px] font-semibold text-[#6B7280]">
                              <span>{'<'} 18.5 Thiếu cân</span>
                              <span className="text-[#2E7D32]">18.5 - 22.9 Chuẩn</span>
                              <span>23 - 24.9 Thừa cân</span>
                              <span>≥ 25 Béo phì</span>
                            </div>
                          </div>
                        )}

                        {/* Calorie & Protein recommendation text box */}
                        {m.bmiAnalysis && (
                          <div className="text-[13px] text-[#374151] leading-relaxed">
                            Để duy trì cân nặng lý tưởng và năng lượng bền bỉ, bạn nên nạp khoảng{' '}
                            <strong>1.800 - 1.900 kcal/ngày</strong> với{' '}
                            <strong>60 - 70g protein</strong> từ đậu, hạt và ngũ cốc nguyên cám.
                          </div>
                        )}

                        {/* Medical Disclaimer */}
                        {m.disclaimer && (
                          <div className="rounded-[10px] border border-[#DCFCE7] bg-[#F0FDF4] p-3 text-[12px] text-[#374151] flex items-center gap-2">
                            <ShieldAlert size={15} className="text-[#2E7D32] shrink-0" />
                            <span>{m.disclaimer}</span>
                          </div>
                        )}

                        {/* Special Rich Component: 2 Meal Suggestion Cards side-by-side */}
                        {m.recipePreview && m.recipePreview.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {m.recipePreview.map((card) => (
                              <div
                                key={card.id}
                                className="rounded-[14px] border border-[#E5E7EB] bg-white p-3.5 shadow-xs flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="rounded-full bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-bold text-[#2E7D32]">
                                      {card.tags[0]?.label ?? 'Tối • Thanh lọc'}
                                    </span>
                                    <span className="text-[12px] font-bold text-[#1F2937]">
                                      {card.kcal} kcal
                                    </span>
                                  </div>
                                  <h4 className="text-[14px] font-bold text-[#1F2937] mb-1">
                                    {card.name}
                                  </h4>
                                  <p className="text-[11px] text-[#6B7280] leading-snug line-clamp-2">
                                    {card.description}
                                  </p>
                                </div>
                                <div className="mt-3 pt-2 border-t border-dashed border-[#E5E7EB] flex items-center justify-between text-[12px]">
                                  <span className="font-semibold text-[#4B5563]">
                                    Protein: <strong>{card.nutrientValue}</strong>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onNavigate?.(`/recipes/${card.id}`)}
                                    className="font-bold text-[#2E7D32] hover:underline"
                                  >
                                    Chi tiết
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
            </div>

            {/* Input & Control Footer */}
            <div className="border-t border-[#E5E7EB] p-4 bg-white">
              <div className="flex items-center gap-2 rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] p-2 focus-within:border-[#2E7D32] focus-within:bg-white transition">
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
                  disabled={isBotBusy || guestState.locked}
                  className="flex-1 bg-transparent border-none text-[14px] text-[#1F2937] placeholder:text-[#9CA3AF] px-2 focus:outline-none"
                />

                {/* Scan Button */}
                <button
                  type="button"
                  title="Quét thực phẩm"
                  onClick={() => onNavigate?.('/food-scan')}
                  className="flex h-9 w-9 items-center justify-center rounded-[8px] text-[#6B7280] hover:bg-[#E8F5E9] hover:text-[#2E7D32] transition"
                >
                  <Scan size={18} />
                </button>

                {/* Send Button */}
                <button
                  type="button"
                  disabled={isBotBusy || !draft.trim() || guestState.locked}
                  onClick={() => void handleSend()}
                  className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#2E7D32] hover:bg-[#1B5E20] text-white disabled:opacity-50 transition"
                >
                  <SendIcon size={16} />
                </button>
              </div>

              {/* Footnote */}
              <div className="mt-2.5 flex flex-wrap items-center justify-between text-[11px] text-[#6B7280]">
                <span>
                  ⓘ AI chỉ cung cấp kiến thức dinh dưỡng thực vật thường thức, không thay thế chẩn đoán hay điều trị y khoa.
                </span>
                <span className="font-medium text-[#4B5563]">Nhấn Enter để gửi</span>
              </div>
            </div>
          </section>

          {/* =========================================================
           * CỘT PHẢI (SIDEBAR THÔNG TIN): lg:col-span-4
           * ========================================================= */}
          <aside className="lg:col-span-4 flex flex-col gap-5">
            {/* Card 1: Chế độ trải nghiệm */}
            <div className="rounded-[16px] border border-[#E5E7EB] bg-[#F4F9F5] p-4 flex items-center gap-3.5 shadow-xs">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white text-[#2E7D32] shadow-xs border border-[#C8E6C9]">
                <Clock size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[14px] font-bold text-[#1F2937]">
                  <span>Chế độ trải nghiệm</span>
                  <span className="rounded-full bg-[#2E7D32] px-2 py-0.5 text-[10px] font-bold text-white">
                    {appRole === 'Guest' ? `${guestState.questionsRemaining}/3` : 'VIP'}
                  </span>
                </div>
                <p className="text-[12px] text-[#6B7280] mt-0.5">
                  {appRole === 'Guest'
                    ? `Bạn còn ${guestState.questionsRemaining} lượt hỏi thử miễn phí hôm nay`
                    : 'Trò chuyện không giới hạn'}
                </p>
              </div>
            </div>

            {/* Card 2: Hồ sơ cá nhân hóa */}
            <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-5 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[15px] font-bold text-[#1F2937]">
                  <UserIcon size={17} className="text-[#2E7D32]" />
                  <span>Hồ sơ cá nhân hóa</span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate?.('/profile')}
                  className="text-[12px] font-bold text-[#2E7D32] hover:underline"
                >
                  Chỉnh sửa
                </button>
              </div>

              <div className="space-y-3 text-[13px]">
                {profileFields.map((f) => (
                  <div key={f.key} className="flex items-center justify-between">
                    <span className="text-[#6B7280]">{f.label}</span>
                    {f.key === 'bmi' ? (
                      <span className="rounded-full bg-[#E8F5E9] px-2.5 py-0.5 text-[11px] font-bold text-[#2E7D32]">
                        {f.value}
                      </span>
                    ) : f.key === 'allergy' ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                        <TriangleAlert size={11} />
                        {f.value}
                      </span>
                    ) : (
                      <span className="font-semibold text-[#1F2937]">{f.value}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-[10px] bg-[#E8F5E9] p-3 text-[11px] text-[#2E7D32] flex items-start gap-2">
                <Sparkles size={14} className="shrink-0 mt-0.5" />
                <span>AI tự động đối chiếu thông tin này để đưa ra gợi ý chuẩn xác nhất cho bạn.</span>
              </div>
            </div>

            {/* Card 3: Câu hỏi thường gặp */}
            <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-5 shadow-xs">
              <div className="mb-3.5 flex items-center gap-2 text-[15px] font-bold text-[#1F2937]">
                <HelpCircle size={17} className="text-[#2E7D32]" />
                <span>Câu hỏi thường gặp</span>
              </div>

              <div className="space-y-2">
                {faqs.map((faq) => (
                  <button
                    key={faq.id}
                    type="button"
                    onClick={() => void handleSend(faq.question)}
                    className="w-full text-left p-3 rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#C8E6C9] hover:bg-[#E8F5E9]/50 text-[#1F2937] text-[13px] font-medium flex items-center gap-2.5 transition"
                  >
                    <span className="text-[#2E7D32]">💬</span>
                    <span className="truncate">{faq.question}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Card 4: Lịch sử gần đây */}
            <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-5 shadow-xs">
              <div className="mb-3 flex items-center justify-between text-[15px] font-bold text-[#1F2937]">
                <div className="flex items-center gap-2">
                  <HistoryIcon size={17} className="text-[#2E7D32]" />
                  <span>Lịch sử gần đây</span>
                </div>
                <span className="text-[11px] font-normal text-[#6B7280]">3 hội thoại</span>
              </div>

              <div className="space-y-2.5">
                {historyItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void handleSend(item.title)}
                    className="w-full text-left p-2.5 rounded-[10px] hover:bg-[#F9FAFB] transition group"
                  >
                    <div className="text-[13px] font-bold text-[#1F2937] group-hover:text-[#2E7D32] line-clamp-1">
                      {item.title}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#6B7280] mt-1">
                      <span>{item.messages} tin nhắn</span>
                      <span>{item.dateLabel}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
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
