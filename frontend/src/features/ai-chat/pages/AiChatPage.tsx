import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import {
  Bot as BotIcon,
  ChevronDown,
  ChevronUp,
  CircleUserRound,
  ClipboardList,
  HelpCircle,
  History as HistoryIcon,
  Lock,
  LogIn,
  Paperclip as PaperclipIcon,
  RefreshCw,
  Send as SendIcon,
  Sparkles,
  Target,
  TriangleAlert,
  User as UserIcon,
} from 'lucide-react'

import { Button, Input, Modal, StatusBadge } from '../../../shared/components'
import {
  buildUserMessage,
  getChatHistoryFigma,
  getDefaultBmi,
  getFaqsFigma,
  getRecipeSuggestions,
  getUserProfileFields,
  getWelcomeSuggestions,
  sendMessageToAi,
} from '../api/aiChatApi'
import type {
  AppRole,
  BMIResult,
  ChatConversation,
  ChatMessage,
  FaqItem,
  GuestChatState,
  HistoryItem,
  PersonalProfileField,
  ProfileSummary,
  RecipePreview,
} from '../types/aiChat.types'

const INITIAL_USER_BUBBLE_QUESTION =
  'Chỉ số BMI 22.5 của tôi có ý nghĩa gì đối với chế độ ăn chay?'

const INITIAL_BOT_BUBBLE_HEADER =
  'Chỉ số BMI 22.5 của bạn nằm trong ngưỡng Bình thường (18.5 – 22.9) theo chuẩn Tổ chức Y tế Thế giới (WHO) dành cho người trưởng thành châu Á.'

const INITIAL_BOT_RECIPE_INTRO =
  'Dưới đây là 2 thực đơn bữa tối thanh nhẹ dưới 500 kcal rất phù hợp với chỉ số BMI của bạn hôm nay:'

/* =====================================================
 * Helpers
 * =====================================================*/
function toneToClass(tone: 'ok' | 'soft' | 'warn' | 'info' | 'green' | 'teal' | 'amber' | 'neutral' | 'recent' | 'mid' | 'old'): string {
  switch (tone) {
    case 'ok':
    case 'green':
      return 'border-[#C8E6C9] bg-[#E8F5E9] text-[#2E7D32]'
    case 'soft':
    case 'info':
    case 'neutral':
      return 'border-[#E5E7EB] bg-white text-[#1F2937]'
    case 'warn':
    case 'amber':
      return 'border-amber-200 bg-amber-50 text-amber-800'
    case 'teal':
      return 'border-[#B6E3DB] bg-[#E8FFFB] text-[#115E59]'
    case 'recent':
      return 'text-[#1F2937]'
    case 'mid':
      return 'text-[#4B5563]'
    case 'old':
      return 'text-[#6B7280]'
    default:
      return 'border-[#E5E7EB] bg-white text-[#1F2937]'
  }
}

interface AiChatPageProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

export default function AiChatPage({ onNavigate, isLoggedIn }: AiChatPageProps) {
  const appRole = (isLoggedIn ? 'User' : 'Guest') as AppRole

  // ================= STATES - GIỮ NGUYÊN LOGIC GIAO TIẾP =================
  const [welcomeLoaded, setWelcomeLoaded] = useState(false)
  const [greeting, setGreeting] = useState('')
  const [_recipes, setRecipes] = useState<unknown[]>([]) // keep for api compatibility
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [_conversations, setConversations] = useState<ChatConversation[]>([])
  const [profile, setProfile] = useState<ProfileSummary | null>(null)
  const [guestState, setGuestState] = useState<GuestChatState>({
    questionsRemaining: 3,
    limit: 3,
    locked: false,
  })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [isBotBusy, setIsBotBusy] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)

  // NEW: states for data loaded from API wrappers
  const [profileFields, setProfileFields] = useState<PersonalProfileField[]>([])
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [defaultBmi, setDefaultBmi] = useState<BMIResult | null>(null)
  const [recipePreviews, setRecipePreviews] = useState<RecipePreview[]>([])

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const conversationId = useRef<string | null>(null)

  // ====== EFFECT LOAD WELCOME + 5 FIGMA API WRAPPERS (delay 500) ======
  useEffect(() => {
    let alive = true
    ;(async () => {
      const [welcomeData, fields, faqsFigma, historyFigma, bmi, recipes] = await Promise.all([
        getWelcomeSuggestions(appRole),
        getUserProfileFields(),
        getFaqsFigma(),
        getChatHistoryFigma(),
        getDefaultBmi(),
        getRecipeSuggestions(22.5),
      ])
      if (!alive) return
      setGreeting(welcomeData.greeting)
      setRecipes(welcomeData.recipes as unknown as [])
      setFaqs(faqsFigma) // override để hiển thị đúng 3 câu hỏi Figma
      setConversations(welcomeData.conversations)
      setProfile(welcomeData.profile)
      setGuestState(welcomeData.guestState)
      setProfileFields(fields)
      setHistoryItems(historyFigma)
      setDefaultBmi(bmi)
      setRecipePreviews(recipes)
      // —— NEW: Inject 2 bubbles mặc định cho Figma layout ——
      setMessages([
        {
          id: 'seed-user-q',
          role: 'user',
          content: INITIAL_USER_BUBBLE_QUESTION,
          timestamp: new Date(Date.now() - 2 * 60_000).toISOString(),
        },
        {
          id: 'seed-bot-a',
          role: 'assistant',
          content: INITIAL_BOT_BUBBLE_HEADER,
          timestamp: new Date(Date.now() - 60_000).toISOString(),
          bmiAnalysis: bmi,
          recipePreview: recipes,
          disclaimer: bmi.disclaimer,
        },
      ])
      setWelcomeLoaded(true)
    })()
    return () => {
      alive = false
    }
  }, [appRole])

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, isBotBusy, streamingId])

  const creditsDisplay = useMemo(() => {
    if (appRole !== 'Guest') {
      return { used: -1, limit: -1, text: 'User · Không giới hạn', tone: 'info' as const }
    }
    const used = guestState.limit - guestState.questionsRemaining
    return {
      used: Math.max(0, Math.min(3, used)),
      limit: 3,
      text: `Bạn còn ${guestState.questionsRemaining} lượt hỏi thử miễn phí hôm nay`,
      tone: 'ok' as const,
    }
  }, [appRole, guestState])

  // ====== GIỮ NGUYÊN STREAM + GUEST LIMIT ======
  const streamMessage = (fullMsg: ChatMessage) => {
    const text = fullMsg.content
    setMessages((prev) => [...prev, { ...fullMsg, content: '', typingStreamed: true }])
    setStreamingId(fullMsg.id)
    let i = 0
    const tick = () => {
      i = Math.min(text.length, i + 1)
      setMessages((prev) =>
        prev.map((m) => (m.id === fullMsg.id ? { ...m, content: text.slice(0, i) } : m)),
      )
      if (i < text.length) setTimeout(tick, 20)
      else setStreamingId(null)
    }
    setTimeout(tick, 120)
  }

  const consumeGuestQuota = (): boolean => {
    if (appRole !== 'Guest') return true
    let allow = true
    setGuestState((prev) => {
      if (prev.locked || prev.questionsRemaining <= 0) {
        allow = false
        return { ...prev, locked: true }
      }
      const next = prev.questionsRemaining - 1
      const locked = next <= 0
      if (locked) setTimeout(() => setShowLoginModal(true), 400)
      return { ...prev, questionsRemaining: next, locked }
    })
    return allow
  }

  const handleSend = async (forceText?: string) => {
    const content = (forceText ?? draft).trim()
    if (!content) return
    if (isBotBusy) return
    if (guestState.locked) {
      setShowLoginModal(true)
      return
    }
    if (!consumeGuestQuota()) {
      setShowLoginModal(true)
      return
    }
    const userMsg = buildUserMessage(content)
    setMessages((prev) => [...prev, userMsg])
    setDraft('')
    setIsBotBusy(true)
    try {
      const reply = await sendMessageToAi(userMsg.role, userMsg.content, conversationId.current)
      streamMessage(reply)
    } finally {
      setTimeout(() => setIsBotBusy(false), 260)
    }
  }

  const handleNewChat = () => {
    setMessages([])
    conversationId.current = null
  }

  const handleFaqClick = (faq: FaqItem) => {
    void handleSend(faq.question)
  }

  const handleLoginFromModal = () => {
    setShowLoginModal(false)
    onNavigate?.('/login')
  }

  return (
    <div className="min-h-screen bg-[#F8F9FF] text-[#1F2937] font-['Inter']">
      {/* ============ MAX-WIDTH 1200 CONTAINER ============ */}
      <div className="mx-auto w-full max-w-[1200px] px-[24px] py-8 sm:px-[16px]">
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 font-normal text-[#6B7280]"
          style={{ fontSize: '14px', lineHeight: '20px' }}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => (window.location.hash = '/')}
            className="!rounded-full !px-2.5 !py-1 !text-[#6B7280] hover:!text-[#2E7D32]"
          >
            Trang chủ
          </Button>
          <span aria-hidden className="text-[#9CA3AF]">
            ›
          </span>
          <span className="text-[#1F2937]">Trợ lý AI</span>
        </nav>

        {/* ======= PAGE HEADER + CREDITS PANEL (inline row Figma) ======= */}
        <header className="mb-8 grid grid-cols-12 items-start gap-6">
          <div className="col-span-12 xl:col-span-8">
            <div className="flex flex-wrap items-center gap-3">
              <h1
                className="font-bold tracking-[-0.015em] text-[#121C2A] sm:text-[26px] sm:leading-[34px]"
                style={{ fontSize: '36px', lineHeight: '44px' }}
              >
                Trợ lý dinh dưỡng AI
              </h1>
              <StatusBadge
                status="suitable"
                size="md"
                label="Trợ lý ảo dinh dưỡng thực vật"
              />
            </div>
            <p
              className="mt-3 max-w-[640px] font-normal text-[#6B7280]"
              style={{ fontSize: '16px', lineHeight: '24px' }}
            >
              {greeting ||
                'Hỏi đáp về dinh dưỡng chay, nguyên liệu thay thế, BMI, calo và nhận gợi ý bữa ăn khoa học được cá nhân hóa cho bạn.'}
            </p>
          </div>

          <div className="col-span-12 xl:col-span-4 xl:justify-end">
            <div
              className="flex items-center gap-3 rounded-[16px] border border-[#E5E7EB] bg-[#F0F5FF] p-4"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white ring-1 ring-[#E5E7EB]">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <circle cx="12" cy="13" r="6" stroke="#2E7D32" strokeWidth="2" />
                  <path
                    d="M12 10v3l2 1M12 3v2M4.22 5.22l1.42 1.42M2 13h2M19.78 5.22l-1.42 1.42M22 13h-2"
                    stroke="#2E7D32"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="flex items-center gap-2 font-semibold text-[#1F2937]"
                  style={{ fontSize: '14px', lineHeight: '20px' }}
                >
                  <span>Chế độ trải nghiệm</span>
                  {appRole === 'Guest' ? (
                    <span className="inline-flex items-center rounded-full bg-[#1F2937] px-2 py-0.5 text-[11px] font-bold text-white">
                      {3 - creditsDisplay.used}/3
                    </span>
                  ) : (
                    <StatusBadge status="success" size="sm" label="Unlimited" />
                  )}
                </div>
                <p
                  className="mt-0.5 truncate font-normal text-[#4B5563]"
                  style={{ fontSize: '12px', lineHeight: '16px' }}
                >
                  {creditsDisplay.text}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ======= MAIN 2 CỘT FIGMA: lg:grid lg:grid-cols-[1.35fr_0.8fr] ======= */}
        <div className="lg:grid lg:grid-cols-[1.35fr_0.8fr] gap-6">
          {/* =========================================================
           * CỘT TRÁI: KHUNG CHAT CHÍNH
           * ========================================================= */}
          <section className="flex flex-col gap-0 overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-white" style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}>
            {/* Chat Header */}
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#E8F5E9] text-[#2E7D32]">
                    <BotIcon size={20} strokeWidth={2} />
                  </div>
                  <span
                    aria-hidden
                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#22C55E] ring-2 ring-white"
                  />
                </div>
                <div>
                  <div
                    className="flex items-center gap-2"
                    style={{ fontSize: '16px', lineHeight: '24px' }}
                  >
                    <h2 className="font-semibold tracking-tight text-[#1F2937]">
                      Vegetarian AI Assistant
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5E9] px-2 py-0.5 text-[11px] font-semibold text-[#2E7D32]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                      Đang hoạt động
                    </span>
                  </div>
                  <p
                    className="font-normal text-[#6B7280]"
                    style={{ fontSize: '13px', lineHeight: '18px' }}
                  >
                    Phân tích dinh dưỡng thực vật chuẩn khoa học
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  leftIcon={<RefreshCw size={16} />}
                  onClick={handleNewChat}
                >
                  Làm mới hội thoại
                </Button>
                {profile && (
                  <StatusBadge
                    size="md"
                    status="neutral"
                    label={profile.role}
                  />
                )}
              </div>
            </header>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex max-h-[640px] min-h-[360px] flex-col gap-6 overflow-y-auto bg-[#FFFFFF] px-6 py-8 sm:px-8"
            >
              {!welcomeLoaded ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-5/6 animate-pulse rounded-lg bg-slate-200" />
                      <div className="h-4 w-4/6 animate-pulse rounded-lg bg-slate-200" />
                      <div className="h-4 w-3/5 animate-pulse rounded-lg bg-slate-200" />
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {messages.map((m) =>
                    m.role === 'user' ? (
                      <UserBubble key={m.id} text={m.content} />
                    ) : (
                      <AssistantBubble
                        key={m.id}
                        text={m.content}
                        bmi={m.bmiAnalysis}
                        recipes={m.recipePreview}
                        disclaimer={m.disclaimer}
                        onNavigate={onNavigate}
                      />
                    ),
                  )}

                  {/* Typing indicator */}
                  {isBotBusy && streamingId == null && (
                    <div className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#E8F5E9] text-[#2E7D32]">
                        <Sparkles size={16} />
                      </span>
                      <div className="flex items-center gap-1.5 bg-[#E8F5E9] text-[#1F2937] rounded-[16px] rounded-tl-none px-4 py-3 ring-1 ring-[#C8E6C9] max-w-[85%]">
                        <span
                          className="h-2 w-2 animate-bounce rounded-full bg-[#2E7D32]"
                          style={{ animationDelay: '0ms' }}
                        />
                        <span
                          className="h-2 w-2 animate-bounce rounded-full bg-[#2E7D32]"
                          style={{ animationDelay: '120ms' }}
                        />
                        <span
                          className="h-2 w-2 animate-bounce rounded-full bg-[#2E7D32]"
                          style={{ animationDelay: '240ms' }}
                        />
                        <span
                          className="ml-2 font-medium text-[#2E7D32]"
                          style={{ fontSize: '12px', lineHeight: '16px' }}
                        >
                          AI đang soạn câu trả lời...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* —— BOT KHỞI ĐỘNG: RECIPE PREVIEW BANNER INTRO nếu chưa có recipe msg —— */}
                  {messages.every((m) => !m.recipePreview || m.recipePreview.length === 0) && (
                    <div className="mt-4">
                      <p
                        className="mb-3 font-medium text-[#1F2937]"
                        style={{ fontSize: '14px', lineHeight: '22px' }}
                      >
                        {INITIAL_BOT_RECIPE_INTRO}
                      </p>
                      <RecipePreviewGrid
                        items={recipePreviews}
                        onNavigate={onNavigate}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Input bar bottom */}
            <footer className="border-t border-[#E5E7EB] bg-[#FFFFFF] px-6 py-5 sm:px-8">
              <div className="flex items-end gap-2 rounded-[20px] border border-[#E5E7EB] bg-[#F8FAF8] p-2 focus-within:border-[#2E7D32] focus-within:ring-4 focus-within:ring-[#E8F5E9]/70">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  aria-label="Đính kèm tệp / ảnh"
                  className="!h-11 !w-11 !rounded-full !p-0 shrink-0 text-slate-500 hover:!bg-white"
                  onClick={() => {
                    /* keep no-op for future attach menu */
                  }}
                >
                  <PaperclipIcon size={18} />
                </Button>

                <div className="flex-1">
                  <Input
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
                    fullWidth
                    className="!border-0 !bg-transparent !shadow-none !p-0 focus:!ring-0 h-11 text-[15px] font-normal text-[#1F2937] placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <div
                    className="hidden items-center gap-1 px-1 text-slate-500 sm:flex"
                    style={{ fontSize: '12px', lineHeight: '16px' }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <rect
                        x="4"
                        y="4"
                        width="16"
                        height="16"
                        rx="4"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M8 10c2-5 6-5 8 0-1 2-2 4-4 4s-3-2-4-4z"
                        fill="currentColor"
                        opacity="0.15"
                      />
                    </svg>
                    <span>Shift + Enter xuống hàng</span>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    aria-label="Gửi câu hỏi"
                    className="!h-11 !w-11 !rounded-full !p-0 shrink-0"
                    isLoading={isBotBusy}
                    onClick={() => void handleSend()}
                  >
                    <SendIcon size={18} />
                  </Button>
                </div>
              </div>

              {/* Disclaimer bar */}
              <div
                className="mt-3 flex flex-wrap items-center justify-between gap-3 font-normal text-[#6B7280]"
                style={{ fontSize: '12px', lineHeight: '18px' }}
              >
                <div className="flex items-center gap-1.5">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 8.5v4.5M12 17.3h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>
                    AI chỉ cung cấp kiến thức dinh dưỡng thực vật thường thức, không thay thế chẩn đoán hay điều trị y khoa.
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  Nhấn Enter để gửi
                </span>
              </div>
            </footer>
          </section>

          {/* =========================================================
           * CỘT PHẢI: SIDEBAR 3 stacked cards
           * ========================================================= */}
          <aside className="flex flex-col gap-6 mt-6 lg:mt-0">
            {/* —— Card 1: Hồ sơ cá nhân hóa —— */}
            <PersonalProfileCard profile={profile} profileFields={profileFields} />

            {/* —— Card 2: Câu hỏi thường gặp FAQ accordion —— */}
            <FaqCard faqs={faqs} onAsk={handleFaqClick} />

            {/* —— Card 3: Lịch sử gần đây —— */}
            <RecentHistoryCard
              items={historyItems}
              onNewChat={handleNewChat}
              onPickHistory={(id) => {
                setMessages([])
                conversationId.current = id
              }}
            />

            {/* —— Extra Panel (inline) nếu User thì hiển thị call-to pantry —— */}
            {appRole !== 'Guest' && (
              <div className="rounded-[16px] border border-[#C8E6C9] bg-[#E8F5E9]/60 p-5">
                <div
                  className="flex items-center gap-2 font-semibold text-[#2E7D32]"
                  style={{ fontSize: '14px', lineHeight: '20px' }}
                >
                  <Target size={16} />
                  Đồng bộ Tủ bếp AI &amp; Gợi ý món
                </div>
                <p
                  className="mt-2 font-normal text-[#1F2937]/90"
                  style={{ fontSize: '13px', lineHeight: '20px' }}
                >
                  Nạp nguyên liệu bạn đang có để AI gợi ý món ăn theo đúng tủ bếp hôm nay.
                </p>
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={() => onNavigate?.('/pantry')}
                  >
                    Mở Tủ bếp AI
                  </Button>
                </div>
              </div>
            )}

            {/* keep reference to defaultBmi to silence unused-var when not yet loaded */}
            <span className="hidden">{defaultBmi?.tone}</span>
          </aside>
        </div>
      </div>

      {/* ===== GUEST LOCKED MODAL - GIỮ NGUYÊN LOGIC ===== */}
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
        description="Bạn đã dùng hết 3 lượt hỏi cho vai trò khách. Đăng nhập tài khoản Vegetarian Support để hỏi không giới hạn, lưu lịch sử hội thoại và gợi ý theo hồ sơ dinh dưỡng của bạn."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setShowLoginModal(false)}>
              Để sau
            </Button>
            <Button
              type="button"
              variant="primary"
              leftIcon={<LogIn size={14} />}
              onClick={handleLoginFromModal}
            >
              Đăng nhập / Đăng ký ngay
            </Button>
          </>
        }
      >
        <ul className="space-y-3 text-sm leading-6 text-[#1F2937]">
          <li className="flex gap-2.5">
            <Sparkles size={16} className="mt-0.5 shrink-0 text-[#2E7D32]" />
            <span>
              <strong>Không giới hạn</strong> lượt hỏi AI dinh dưỡng, lưu lịch sử hội thoại.
            </span>
          </li>
          <li className="flex gap-2.5">
            <Target size={16} className="mt-0.5 shrink-0 text-[#2E7D32]" />
            <span>
              <strong>Gợi ý món ăn theo BMI &amp; mục tiêu calo</strong> cá nhân hóa.
            </span>
          </li>
          <li className="flex gap-2.5">
            <HistoryIcon size={16} className="mt-0.5 shrink-0 text-[#2E7D32]" />
            <span>
              Đồng bộ giữa <strong>Tủ bếp AI, Quét thực phẩm &amp; Thực đơn 7 ngày</strong>.
            </span>
          </li>
        </ul>
      </Modal>
    </div>
  )
}

/* ============================================================
 * SUB COMPONENTS (inline trong cùng file để không tách logic state)
 * ============================================================ */

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex items-start justify-end gap-3">
      <div className="bg-[#2E7D32] text-white rounded-[16px] rounded-tr-none max-w-[85%] ml-auto px-5 py-3 shadow-sm" style={{ boxShadow: '0 1px 2px 0 rgba(46,125,50,0.18)' }}>
        <p
          className="whitespace-pre-wrap font-normal leading-7"
          style={{ fontSize: '15px', lineHeight: '26px' }}
        >
          {text}
        </p>
      </div>
      <div
        aria-hidden
        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#1F2937] text-white"
      >
        <UserIcon size={18} />
      </div>
    </div>
  )
}

function AssistantBubble({
  text,
  bmi,
  recipes,
  disclaimer,
  onNavigate,
}: {
  text: string
  bmi?: BMIResult
  recipes?: RecipePreview[]
  disclaimer?: string
  onNavigate?: (p: string) => void
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        aria-hidden
        className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#2E7D32] text-white"
      >
        <Sparkles size={16} />
      </div>

      <div className="max-w-[85%] min-w-0 flex-1 space-y-4">
        <div
          className="bg-[#E8F5E9] text-[#1F2937] rounded-[16px] rounded-tl-none px-5 py-4 ring-1 ring-[#C8E6C9]"
          style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.03)' }}
        >
          <p
            className="whitespace-pre-wrap font-normal"
            style={{ fontSize: '15px', lineHeight: '26px' }}
          >
            {text}
          </p>
        </div>

        {bmi ? <BMIRulerCard score={bmi.value} /> : null}

        {recipes && recipes.length > 0 ? (
          <div>
            <p
              className="mb-3 font-medium text-[#1F2937]"
              style={{ fontSize: '14px', lineHeight: '22px' }}
            >
              {INITIAL_BOT_RECIPE_INTRO}
            </p>
            <RecipePreviewGrid items={recipes} onNavigate={onNavigate} />
          </div>
        ) : null}

        {disclaimer ? (
          <div className="rounded-[12px] border border-[#C8E6C9] bg-[#F4FBF5] px-4 py-3">
            <p
              className="flex gap-2 font-medium text-[#1F2937]/90"
              style={{ fontSize: '13px', lineHeight: '20px' }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="mt-0.5 shrink-0"
                aria-hidden
              >
                <circle cx="12" cy="12" r="9" stroke="#2E7D32" strokeWidth="2" />
                <path
                  d="M12 9v4M12 17.2h.01"
                  stroke="#2E7D32"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span>{disclaimer}</span>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

/* ============== TASK C: BMI Ruler Card Figma spec ============== */
function BMIRulerCard({ score }: { score: number }) {
  const val = typeof score === 'number' && !Number.isNaN(score) ? score : 22.5
  // Clamp display to 14..32 range then interpolate 0..100% x-position
  const min = 14
  const max = 32
  const clamped = Math.max(min, Math.min(max, val))
  const pct = ((clamped - min) / (max - min)) * 100

  return (
    <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-4">
      <div className="mb-2 flex justify-between text-[11px] font-bold">
        <span>Thước đo chuẩn Châu Á</span>
        <span>Điểm số hiện tại: {val.toFixed(1)}</span>
      </div>

      {/* BMI pointer bubble + caret */}
      <div className="relative h-8 w-full">
        <div
          className="pointer-events-none absolute -translate-x-1/2"
          style={{ left: `${pct}%`, top: '0px' }}
        >
          <div className="flex flex-col items-center gap-0.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#111827] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" aria-hidden />
              BMI hiện tại: {val.toFixed(1)}
            </span>
            <span className="text-[#111827]" aria-hidden style={{ fontSize: '10px', lineHeight: '1' }}>
              ▼
            </span>
          </div>
        </div>
      </div>

      <div className="relative h-3 w-full rounded-full overflow-hidden grid grid-cols-4 gap-0">
        <div className="bg-slate-300" /> {/* < 18.5 thiếu cân */}
        <div className="bg-[#2E7D32]" /> {/* 18.5-22.9 chuẩn */}
        <div className="bg-amber-400" /> {/* 23-24.9 thừa cân */}
        <div className="bg-rose-400" /> {/* ≥25 béo phì */}
      </div>
      <div className="mt-1 grid grid-cols-4 text-[10px] font-semibold text-[#6B7280]">
        <span>{'<'} 18.5 Thiếu cân</span>
        <span>18.5 - 22.9 Chuẩn</span>
        <span>23 - 24.9 Thừa cân</span>
        <span>≥ 25 Béo phì</span>
      </div>
    </div>
  )
}

/* ============== TASK D: 2 Recipe Suggestion Cards side-by-side ============== */
function RecipePreviewGrid({
  items,
  onNavigate,
}: {
  items: RecipePreview[]
  onNavigate?: (p: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((r) => (
        <div
          key={r.id}
          className="rounded-[16px] border border-[#E5E7EB] bg-white p-4"
        >
          {/* Top row: tag pill left + kcal right */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="inline-flex items-center rounded-full bg-[#E8F5E9] px-2.5 py-1 text-xs font-bold text-[#2E7D32]">
              {r.tags && r.tags[0] ? r.tags[0].label : 'Tối • Thạnh lọc'}
            </span>
            <span className="text-sm font-bold tabular-nums text-[#1f2937]">
              {r.kcal} kcal
            </span>
          </div>

          {/* Middle: title + desc */}
          <h3 className="font-bold text-[#1f2937]" style={{ fontSize: '15px', lineHeight: '22px' }}>
            {r.name}
          </h3>
          <p className="mt-1 text-xs text-[#6B7280]" style={{ lineHeight: '18px' }}>
            {r.description}
          </p>

          {/* Bottom row: protein left + button right */}
          <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-dashed border-[#E5E7EB]">
            <span className="text-xs font-semibold text-[#6B7280]">
              {r.nutrientLabel}: <span className="text-[#1f2937]">{r.nutrientValue}</span>
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onNavigate?.(`/recipes/${encodeURIComponent(r.id)}`)}
            >
              Chi tiết
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ============== TASK E: Card 1 - Profile personalization ============== */
function PersonalProfileCard({
  profile,
  profileFields,
}: {
  profile: ProfileSummary | null
  profileFields: PersonalProfileField[]
}) {
  return (
    <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-4">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#E8F5E9] text-[#2E7D32]">
            <CircleUserRound size={18} />
          </span>
          <div>
            <h3
              className="font-semibold tracking-[-0.01em] text-[#1F2937]"
              style={{ fontSize: '16px', lineHeight: '24px' }}
            >
              Hồ sơ cá nhân hóa
            </h3>
            {profile && (
              <p
                className="font-medium text-[#6B7280]"
                style={{ fontSize: '12px', lineHeight: '16px' }}
              >
                {profile.displayName} · {profile.profileType}
              </p>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="!rounded-full !bg-[#F8FAF8] !px-2.5 !py-1 !font-semibold !text-[#2E7D32] hover:!bg-[#E8F5E9]"
        >
          Chỉnh sửa
        </Button>
      </header>

      <dl className="space-y-2.5">
        {profileFields.map((f) => (
          <div
            key={f.key}
            className="flex items-center justify-between gap-3"
            style={{ fontSize: '13px', lineHeight: '20px' }}
          >
            <dt className="shrink-0 font-medium text-[#1F2937]/80">
              {f.label
                .replace('Chỉ số BMI:', 'Chỉ số BMI')
                .replace('Mục tiêu thể chất:', 'Mục tiêu tiêu chất')
                .replace('Chế độ ăn:', 'Chế độ ăn')
                .replace('Sở thích dinh dưỡng:', 'Sở thích')
                .replace('Dị ứng cần tránh:', 'Dị ứng cần tránh')}
            </dt>
            {f.key === 'bmi' ? (
              <dd className="inline-flex justify-end rounded-full bg-[#E8F5E9] px-2.5 py-1 text-right text-xs font-bold text-[#2E7D32]">
                22.5 (Bình thường)
              </dd>
            ) : f.key === 'allergy' ? (
              <dd className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-right text-xs font-bold text-rose-600">
                <TriangleAlert size={12} aria-hidden />
                {f.value}
              </dd>
            ) : (
              <dd className="text-right font-semibold text-[#1F2937] text-xs">
                {f.value}
              </dd>
            )}
          </div>
        ))}
      </dl>

      <div className="mt-4 rounded-[10px] bg-[#E8F5E9] p-3 text-xs">
        <p className="flex gap-2 font-medium text-[#1F2937]" style={{ lineHeight: '18px' }}>
          <Sparkles size={14} className="mt-0.5 shrink-0 text-[#2E7D32]" />
          <span>
            AI tự động đối chiếu thông tin này để đưa ra gợi ý chuẩn xác nhất cho bạn.
          </span>
        </p>
      </div>
    </div>
  )
}

/* ============== TASK E: Card 2 - FAQ accordion with shared Button triggers ============== */
function FaqCard({
  faqs,
  onAsk,
}: {
  faqs: FaqItem[]
  onAsk: (faq: FaqItem) => void
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  return (
    <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-4">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#E8F5E9] text-[#2E7D32]">
            <HelpCircle size={16} />
          </span>
          <h3
            className="font-semibold tracking-[-0.01em] text-[#1F2937]"
            style={{ fontSize: '15px', lineHeight: '22px' }}
          >
            Câu hỏi thường gặp
          </h3>
        </div>
      </header>

      <ul className="space-y-2">
        {faqs.map((f) => {
          const isOpen = openId === f.id
          return (
            <li key={f.id} className="rounded-[12px] border border-[#E5E7EB] bg-[#F8FAF8] overflow-hidden">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-between flex-row-reverse! !px-4 !py-3 !rounded-none text-left normal-case hover:!bg-[#E8F5E9]/40"
                onClick={() => {
                  setOpenId(isOpen ? null : f.id)
                  onAsk(f)
                }}
              >
                <span className="flex items-center gap-1 text-[#2E7D32]">
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
                <span className="flex items-center gap-3 flex-1 min-w-0">
                  <span
                    aria-hidden
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-white ring-1 ring-[#E5E7EB] text-[#2E7D32]"
                  >
                    <ClipboardList size={12} />
                  </span>
                  <span
                    className="font-medium text-[#1F2937] truncate"
                    style={{ fontSize: '13px', lineHeight: '20px' }}
                  >
                    {f.question}
                  </span>
                </span>
              </Button>
              {isOpen && f.answer && (
                <div className="px-4 pb-3 pt-0 text-xs text-[#6B7280] border-t border-[#E5E7EB]/50">
                  <p className="pt-2">{f.answer}</p>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ============== TASK E: Card 3 - Recent history ============== */
function RecentHistoryCard({
  items,
  onNewChat,
  onPickHistory,
}: {
  items: HistoryItem[]
  onNewChat: () => void
  onPickHistory: (id: string) => void
}) {
  return (
    <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-4">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#E8F5E9] text-[#2E7D32]">
            <HistoryIcon size={16} />
          </span>
          <h3
            className="font-semibold tracking-[-0.01em] text-[#1F2937]"
            style={{ fontSize: '15px', lineHeight: '22px' }}
          >
            Lịch sử gần đây
          </h3>
        </div>
        <div className="text-[11px] font-semibold text-[#6B7280] flex items-center gap-1">
          {items.length} hội thoại
        </div>
      </header>

      <div className="mb-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          fullWidth
          leftIcon={<RefreshCw size={14} />}
          onClick={onNewChat}
        >
          Hội thoại mới
        </Button>
      </div>

      <ul className="space-y-1.5">
        {items.map((h) => (
          <li key={h.id}>
            <Button
              type="button"
              variant="ghost"
              className="!w-full !flex-col !items-start !gap-1 !rounded-[12px] !border !border-transparent !px-3 !py-2.5 !text-left !normal-case hover:!border-[#C8E6C9] hover:!bg-[#E8F5E9]/50"
              onClick={() => onPickHistory(h.id)}
            >
              <div
                className="line-clamp-1 w-full font-semibold text-[#1F2937]"
                style={{ fontSize: '13px', lineHeight: '18px' }}
              >
                {h.title}
              </div>
              <div className="flex w-full items-center justify-between gap-2">
                <span
                  className="font-medium text-[#6B7280]"
                  style={{ fontSize: '11px', lineHeight: '14px' }}
                >
                  {h.messages} tin nhắn
                </span>
                <span
                  className={`font-medium ${toneToClass(h.tone).split(' ').slice(-1)[0]}`}
                  style={{ fontSize: '11px', lineHeight: '14px' }}
                >
                  {h.dateLabel}
                </span>
              </div>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
