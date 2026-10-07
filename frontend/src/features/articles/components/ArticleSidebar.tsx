import React, { useState } from 'react'

interface ArticleSidebarProps {
  trendingTags: string[]
  selectedTag?: string
  onSelectTag: (tag: string) => void
  onOpenAiChat?: () => void
}

export const ArticleSidebar: React.FC<ArticleSidebarProps> = ({
  trendingTags,
  selectedTag,
  onSelectTag,
  onOpenAiChat,
}) => {
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (newsletterEmail.trim()) {
      setSubscribed(true)
      setTimeout(() => {
        setNewsletterEmail('')
      }, 2500)
    }
  }

  return (
    <aside className="flex flex-col gap-6 w-full">
      {/* Widget 1: Trending Topics */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-emerald-600 text-lg">🏷️</span>
          <h3 className="text-sm font-bold text-gray-900">Chủ đề được quan tâm</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {trendingTags.map((tag) => {
            const isSelected = selectedTag === tag
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onSelectTag(isSelected ? '' : tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </div>

      {/* Widget 2: AI Assistant Callout */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 rounded-2xl border border-emerald-100/80 p-6 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-700 mb-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700">
            ✦
          </div>
          <h3 className="text-sm font-bold text-gray-900">Bạn chưa tìm thấy chủ đề?</h3>
        </div>
        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          Nhận câu trả lời về nhu cầu calo, gợi ý thực đơn thuần chay theo thể trạng và giải đáp thắc mắc dinh dưỡng tức thì từ AI.
        </p>
        <button
          type="button"
          onClick={() => {
            if (onOpenAiChat) {
              onOpenAiChat()
            } else {
              window.location.hash = '/ai-chat'
            }
          }}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <span>Chat với AI Dinh Dưỡng</span>
          <span>💬</span>
        </button>
      </div>

      {/* Widget 3: Newsletter Box */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-emerald-600 text-base">✉️</span>
          <h3 className="text-sm font-bold text-gray-900">Bản tin Sống Khỏe</h3>
        </div>
        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          Nhận bài viết phân tích dinh dưỡng và thực đơn chay mẫu mỗi sáng thứ Hai hàng tuần.
        </p>

        {subscribed ? (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium text-center">
            ✓ Cảm ơn bạn đã đăng ký nhận bản tin!
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="flex flex-col gap-2.5">
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Địa chỉ email của bạn..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors"
            >
              Đăng ký nhận tin
            </button>
          </form>
        )}
      </div>
    </aside>
  )
}
