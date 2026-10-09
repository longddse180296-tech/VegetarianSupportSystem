import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CircleUserRound,
  History as HistoryIcon,
  Leaf,
  Lock,
  LogIn,
  MessageCircleQuestionMark,
  Plus,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react'

import { Button, Modal, StatusBadge } from '../../../shared/components'
import {
  buildUserMessage,
  getWelcomeSuggestions,
  sendMessageToAi,
} from '../api/aiChatApi'
import { ChatMessageView } from '../components/ChatMessage'
import { ChatInputBar } from '../components/ChatInput'
import { SuggestionCard } from '../components/SuggestionCard'
import type {
  AppRole,
  ChatConversation,
  ChatMessage,
  FaqItem,
  GuestChatState,
  ProfileSummary,
  RecipeSuggestion,
} from '../types/aiChat.types'

type SidebarTab = 'profile' | 'faqs' | 'history'

interface AiChatPageProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

const SUGGESTION_PROMPTS: string[] = [
  'Gợi ý bữa sáng 350 kcal thuần thực vật',
  'Thay thế đậu phụ trong thực đơn 7 ngày',
  'Phụ gia E-number nào có nguồn gốc động vật?',
  'Thực đơn 1400 kcal 7 ngày cho người mới',
]

export default function AiChatPage({ onNavigate, isLoggedIn }: AiChatPageProps) {
  const appRole = (isLoggedIn ? 'User' : 'Guest') as AppRole
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('history')

  const [welcomeLoaded, setWelcomeLoaded] = useState(false)
  const [greeting, setGreeting] = useState('')
  const [recipes, setRecipes] = useState<RecipeSuggestion[]>([])
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [conversations, setConversations] = useState<ChatConversation[]>([])
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

  const scrollRef = useRef<HTMLDivElement>(null)
  const conversationId = useRef<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const data = await getWelcomeSuggestions(appRole)
      if (!alive) return
      setGreeting(data.greeting)
      setRecipes(data.recipes)
      setFaqs(data.faqs)
      setConversations(data.conversations)
      setProfile(data.profile)
      setGuestState(data.guestState)
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

  const sideContentForRole = useMemo(() => {
    const badgeRole: 'success' | 'info' | 'warning' =
      appRole === 'Admin' ? 'warning' : appRole === 'User' ? 'success' : 'info'
    return { badgeRole }
  }, [appRole])

  const pickSuggestion = (text: string) => setDraft((d) => d || text)

  const streamMessage = (fullMsg: ChatMessage) => {
    const text = fullMsg.content
    setMessages((prev) => [
      ...prev,
      { ...fullMsg, content: '', typingStreamed: true },
    ])
    setStreamingId(fullMsg.id)
    let i = 0
    const tick = () => {
      i = Math.min(text.length, i + 1)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === fullMsg.id ? { ...m, content: text.slice(0, i) } : m,
        ),
      )
      if (i < text.length) {
        setTimeout(tick, 20)
      } else {
        setStreamingId(null)
      }
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

  const handleSend = async () => {
    const content = draft.trim()
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

  const limitHint =
    appRole === 'Guest'
      ? guestState.questionsRemaining > 0
        ? `Guest · Còn ${guestState.questionsRemaining} / ${guestState.limit} lượt hỏi`
        : 'Guest · Đã hết lượt hỏi, đăng nhập để tiếp tục'
      : `Đăng nhập · ${appRole} · Không giới hạn lượt hỏi`

  const handleFaqAsk = (faq: FaqItem) => {
    setDraft(faq.question)
  }

  const handleLoginFromModal = () => {
    setShowLoginModal(false)
    onNavigate?.('/login')
  }

  return (
    <div className="min-h-screen bg-[#f6faf7] text-[#1f2937]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f5e9] px-3 py-1 text-[11px] font-extrabold text-[#2e7d32]">
              <Sparkles size={12} /> Trợ lý AI · Dinh dưỡng thuần thực vật
            </span>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#1f2937] sm:text-3xl">
              Trợ lý AI Dinh dưỡng Thuần thực vật
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-[#6b7280]">
              Hỏi về thực đơn 7 ngày, cách thay thế đậu phụ, các phụ gia E-number có nguồn gốc động vật
              hay cách xây dựng khẩu phần 1400 kcal phù hợp BMI của bạn.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              status={sideContentForRole.badgeRole}
              label={
                profile ? `${profile.role} · ${profile.profileType}` : `Vai trò: ${appRole}`
              }
              size="sm"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Plus size={13} />}
              onClick={() => {
                setMessages([])
                conversationId.current = null
              }}
            >
              Hội thoại mới
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,22rem)]">
          {/* MAIN CHAT */}
          <section className="flex flex-col gap-5">
            {/* Welcome banner */}
            {welcomeLoaded && messages.length === 0 ? (
              <div className="rounded-[20px] border border-[#c8e6c9] bg-white p-6 shadow-xs">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#2e7d32] px-3 py-1 text-[11px] font-extrabold text-white shadow-sm">
                      <Leaf size={12} /> Mới: 3 gợi ý theo hồ sơ của bạn
                    </div>
                    <h2 className="mt-3 text-xl font-extrabold tracking-tight text-[#1f2937]">
                      Xin chào 👋 {profile?.displayName ?? 'bạn'}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-[#6b7280]">{greeting}</p>
                  </div>
                  <div className="hidden rounded-[16px] border border-[#e5e7eb] bg-[#e8f5e9]/50 p-3 text-center sm:block">
                    <div className="text-[10px] font-bold text-[#2e7d32]">MỤC TIÊU</div>
                    <div className="mt-1 text-lg font-extrabold text-[#1f2937]">
                      {profile?.target ?? 'Bắt đầu thôi'}
                    </div>
                    <div className="mt-1 text-[11px] text-[#6b7280]">{profile?.bmiRange ?? 'BMI chưa đo'}</div>
                  </div>
                </div>

                {/* Hero recipe cards */}
                <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {recipes.map((r) => (
                    <SuggestionCard
                      key={r.id}
                      recipe={r}
                      variant="hero-card"
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {/* Message list */}
            <div
              ref={scrollRef}
              className="max-h-[58vh] min-h-[300px] overflow-y-auto rounded-[20px] border border-[#e5e7eb] bg-white/80 p-4 shadow-xs sm:p-5"
            >
              <div className="flex flex-col gap-5">
                {!welcomeLoaded ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3"
                      >
                        <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-slate-200" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-5/6 animate-pulse rounded-lg bg-slate-200" />
                          <div className="h-4 w-4/6 animate-pulse rounded-lg bg-slate-200" />
                          <div className="h-4 w-2/3 animate-pulse rounded-lg bg-slate-200" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  messages.map((m) => (
                    <ChatMessageView
                      key={m.id}
                      message={m}
                      onNavigate={onNavigate}
                      isStreaming={streamingId === m.id}
                    />
                  ))
                )}

                {isBotBusy && streamingId == null && (
                  <div className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#2e7d32] shadow-sm ring-1 ring-[#c8e6c9]">
                      <Zap size={15} />
                    </span>
                    <div className="flex items-center gap-1.5 rounded-[16px] rounded-tl-[6px] bg-[#e8f5e9] px-4 py-3 shadow-sm ring-1 ring-[#c8e6c9]">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-[#2e7d32]" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-[#2e7d32]" style={{ animationDelay: '120ms' }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-[#2e7d32]" style={{ animationDelay: '240ms' }} />
                      <span className="ml-2 text-xs font-semibold text-[#2e7d32]">
                        AI đang soạn câu trả lời...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input */}
            <ChatInputBar
              value={draft}
              onChange={setDraft}
              onSend={handleSend}
              disabled={isBotBusy}
              locked={guestState.locked && appRole === 'Guest'}
              limitHint={limitHint}
              onPickSuggestion={pickSuggestion}
              suggestions={messages.length === 0 ? SUGGESTION_PROMPTS : []}
            />
          </section>

          {/* SIDEBAR */}
          <aside className="flex flex-col gap-4">
            {/* Tabs */}
            <div className="flex flex-wrap gap-1 rounded-[12px] border border-[#e5e7eb] bg-white p-1 shadow-xs">
              <Button
                type="button"
                size="sm"
                variant={sidebarTab === 'history' ? 'primary' : 'ghost'}
                leftIcon={<HistoryIcon size={12} />}
                onClick={() => setSidebarTab('history')}
              >
                Lịch sử
              </Button>
              <Button
                type="button"
                size="sm"
                variant={sidebarTab === 'faqs' ? 'primary' : 'ghost'}
                leftIcon={<MessageCircleQuestionMark size={12} />}
                onClick={() => setSidebarTab('faqs')}
              >
                FAQ
              </Button>
              <Button
                type="button"
                size="sm"
                variant={sidebarTab === 'profile' ? 'primary' : 'ghost'}
                leftIcon={<CircleUserRound size={12} />}
                onClick={() => setSidebarTab('profile')}
              >
                Hồ sơ
              </Button>
            </div>

            {/* Tab content */}
            <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-4 shadow-xs">
              {sidebarTab === 'history' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-[#1f2937]">Hội thoại gần đây</div>
                    <Button type="button" variant="ghost" size="sm" leftIcon={<Plus size={12} />}>
                      Mới
                    </Button>
                  </div>
                  {welcomeLoaded ? (
                    conversations.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="block w-full rounded-[12px] border border-transparent p-3 text-left transition hover:border-[#c8e6c9] hover:bg-[#e8f5e9]/60"
                        onClick={() => {
                          setMessages([])
                          conversationId.current = c.id
                        }}
                      >
                        <div className="line-clamp-1 text-[13px] font-extrabold text-[#1f2937]">
                          {c.title}
                        </div>
                        <div className="mt-0.5 line-clamp-2 text-xs text-[#6b7280]">{c.summary}</div>
                        <div className="mt-1 text-[10px] text-[#6b7280]">
                          {new Date(c.lastMessageAt).toLocaleString('vi-VN')}
                        </div>
                      </button>
                    ))
                  ) : (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="space-y-2 rounded-[12px] p-3"
                      >
                        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
                      </div>
                    ))
                  )}
                </div>
              )}

              {sidebarTab === 'faqs' && (
                <div className="space-y-3">
                  <div className="text-sm font-bold text-[#1f2937]">Câu hỏi thường gặp</div>
                  {welcomeLoaded ? (
                    faqs.map((f) => (
                      <details
                        key={f.id}
                        className="group rounded-[12px] border border-[#e5e7eb] bg-slate-50/70 p-3 open:bg-white open:ring-1 open:ring-[#c8e6c9]"
                      >
                        <summary className="flex cursor-pointer items-start justify-between gap-3 list-none">
                          <span className="text-[13px] font-bold text-[#1f2937]">{f.question}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.preventDefault()
                              handleFaqAsk(f)
                            }}
                          >
                            Hỏi
                          </Button>
                        </summary>
                        <p className="mt-2 text-xs leading-5 text-[#1f2937]">{f.answer}</p>
                      </details>
                    ))
                  ) : (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-2 p-3">
                        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                        <div className="h-3 w-4/5 animate-pulse rounded bg-slate-200" />
                      </div>
                    ))
                  )}
                </div>
              )}

              {sidebarTab === 'profile' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-[12px] border border-[#c8e6c9] bg-[#e8f5e9]/60 p-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2e7d32] text-white shadow-sm">
                      <CircleUserRound size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-1 text-[13px] font-extrabold text-[#1f2937]">
                        {profile?.displayName ?? 'Đang nạp...'}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#6b7280]">
                        {profile?.profileType ?? '...'}
                      </div>
                      <div className="mt-1">
                        <StatusBadge
                          status={sideContentForRole.badgeRole}
                          label={profile?.role ?? appRole}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-[10px] border border-[#e5e7eb] bg-slate-50 p-2.5">
                      <div className="flex items-center gap-1 font-bold text-[#2e7d32]">
                        <Target size={12} /> Mục tiêu
                      </div>
                      <div className="mt-1 leading-5 text-[#1f2937]">
                        {profile?.target ?? '...'}
                      </div>
                    </div>
                    <div className="rounded-[10px] border border-[#e5e7eb] bg-slate-50 p-2.5">
                      <div className="flex items-center gap-1 font-bold text-[#2e7d32]">
                        <Sparkles size={12} /> BMI
                      </div>
                      <div className="mt-1 leading-5 text-[#1f2937]">
                        {profile?.bmiRange ?? '...'}
                      </div>
                    </div>
                  </div>

                  {appRole === 'Guest' ? (
                    <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-3">
                      <div className="flex items-start gap-2">
                        <Lock size={14} className="mt-0.5 shrink-0 text-amber-700" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-extrabold text-amber-800">
                            Tài khoản khách · Hạn chế {guestState.limit} lượt hỏi
                          </div>
                          <p className="mt-1 text-xs leading-5 text-amber-900/80">
                            Còn {Math.max(guestState.questionsRemaining, 0)} / {guestState.limit} lượt.
                            Đăng nhập để lưu lịch sử, nhận gợi ý theo hồ sơ và hỏi không giới hạn.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="primary"
                              leftIcon={<LogIn size={12} />}
                              onClick={() => setShowLoginModal(true)}
                            >
                              Đăng nhập / Đăng ký
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => onNavigate?.('/food-scan')}
                            >
                              Thử quét nhãn sản phẩm
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      fullWidth
                      onClick={() => onNavigate?.('/pantry')}
                    >
                      Quản lý Tủ bếp AI
                    </Button>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* ===== GUEST LOCKED MODAL ===== */}
      <Modal
        isOpen={showLoginModal}
        onClose={() => {
          if (isLoggedIn) setShowLoginModal(false)
          // Guest luôn cho phép đóng bằng Esc/X nhưng ô input vẫn lock:
          if (!isLoggedIn) setShowLoginModal(false)
        }}
        maxWidth="md"
        title={
          <span className="flex items-center gap-2">
            <Lock size={18} className="text-[#2e7d32]" />
            Đăng nhập để tiếp tục hỏi Trợ lý AI
          </span>
        }
        description="Bạn đã dùng hết 3 lượt hỏi cho vai trò khách. Đăng nhập tài khoản Vegetarian Support để hỏi không giới hạn, lưu lịch sử hội thoại và gợi ý theo hồ sơ dinh dưỡng của bạn."
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowLoginModal(false)}
            >
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
        <div className="space-y-4 text-sm">
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <Leaf size={16} className="mt-0.5 shrink-0 text-[#2e7d32]" />
              <span>
                <strong>Không giới hạn</strong> lượt hỏi AI dinh dưỡng, lưu lịch sử hội thoại qua các
                ngày.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles size={16} className="mt-0.5 shrink-0 text-[#2e7d32]" />
              <span>
                <strong>Gợi ý món ăn theo BMI &amp; mục tiêu calo</strong> thực tế của hồ sơ bạn đã
                khai báo.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <HistoryIcon size={16} className="mt-0.5 shrink-0 text-[#2e7d32]" />
              <span>
                Đồng bộ giữa <strong>Tủ bếp AI, Quét thực phẩm &amp; Thực đơn 7 ngày</strong> trong cùng
                1 tài khoản.
              </span>
            </li>
          </ul>
          <div className="rounded-[12px] border border-[#c8e6c9] bg-[#e8f5e9]/60 p-3 text-xs leading-5 text-[#1f2937]">
            <strong>Mẹo nhanh:</strong> Nếu bạn chưa có tài khoản, hãy chọn Đăng ký với email — mất 15
            giây là xong. Sau đó quay lại đây để đặt các câu hỏi dài hơn!
          </div>
        </div>
      </Modal>
    </div>
  )
}
