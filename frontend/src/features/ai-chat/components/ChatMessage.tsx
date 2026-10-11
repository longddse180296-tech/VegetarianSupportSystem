import { Bot, User as UserIcon } from 'lucide-react'
import type { ChatMessage } from '../types/aiChat.types'
import { SuggestionCard } from './SuggestionCard'

interface ChatMessageViewProps {
  message: ChatMessage
  onNavigate?: (path: string) => void
  isStreaming?: boolean
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export const ChatMessageView: React.FC<ChatMessageViewProps> = ({
  message,
  onNavigate,
  isStreaming = false,
}) => {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] ml-auto sm:max-w-[85%]">
          <div className="flex items-start justify-end gap-2">
            <div className="flex-1" />
            <div className="bg-[#2E7D32] text-white rounded-[16px] rounded-tr-none px-4 py-3 text-[14px] leading-6 shadow-sm max-w-[85%] ml-auto">
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              {isStreaming && (
                <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-white/70 align-[-2px]" />
              )}
            </div>
            <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1b5e20] text-white shadow-sm ring-2 ring-white">
              <UserIcon size={14} />
            </span>
          </div>
          <div className="mt-1 text-right text-[11px] text-[#6b7280]">
            Bạn · {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    )
  }

  // Assistant bubble (AI)
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] sm:max-w-[85%]">
        <div className="flex items-start gap-2">
          <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#2e7d32] shadow-sm ring-1 ring-[#c8e6c9]">
            <Bot size={15} />
          </span>
          <div className="bg-[#E8F5E9] text-[#1F2937] rounded-[16px] rounded-tl-none px-4 py-3 text-[14px] leading-6 shadow-sm ring-1 ring-[#c8e6c9] max-w-[85%]">
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
            {isStreaming && (
              <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-[#2e7d32]/60 align-[-2px]" />
            )}
            {message.recipeSuggestions && message.recipeSuggestions.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="text-[11px] font-bold uppercase tracking-wide text-[#2e7d32]">
                  Gợi ý món ăn (bấm để xem chi tiết)
                </div>
                {message.recipeSuggestions.map((r) => (
                  <SuggestionCard key={r.id} recipe={r} onNavigate={onNavigate} />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mt-1 text-[11px] text-[#6b7280]">
          Trợ lý AI · {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  )
}

export default ChatMessageView
