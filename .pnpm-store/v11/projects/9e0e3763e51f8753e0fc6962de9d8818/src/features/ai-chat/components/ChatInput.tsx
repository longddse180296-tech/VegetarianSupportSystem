import { forwardRef } from 'react'
import { ImagePlus, Paperclip, Send, Sparkles } from 'lucide-react'
import { Button, Input } from '../../../shared/components'

interface ChatInputBarProps {
  value: string
  onChange: (next: string) => void
  onSend: () => void
  disabled?: boolean
  locked?: boolean
  limitHint?: string
  onPickSuggestion?: (text: string) => void
  suggestions?: string[]
}

const ChatInputBarInner: React.ForwardRefRenderFunction<HTMLDivElement, ChatInputBarProps> = (
  { value, onChange, onSend, disabled, locked, limitHint, onPickSuggestion, suggestions = [] },
  ref,
) => {
  return (
    <div ref={ref} className="space-y-3">
      {suggestions.length > 0 && !locked && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <Button
              key={s}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onPickSuggestion?.(s)}
              leftIcon={<Sparkles size={12} />}
            >
              {s}
            </Button>
          ))}
        </div>
      )}
      <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-2 shadow-xs ring-1 ring-slate-50">
        <div className="flex items-end gap-2">
          <div className="flex gap-1 pb-2 pl-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled || locked}
              aria-label="Đính kèm ảnh"
            >
              <ImagePlus size={15} />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled || locked}
              aria-label="Đính kèm tệp"
            >
              <Paperclip size={15} />
            </Button>
          </div>
          <div className="min-w-0 flex-1">
            <Input
              placeholder={
                locked
                  ? 'Bạn đã dùng hết 3 lượt cho khách. Đăng nhập để tiếp tục trò chuyện không giới hạn.'
                  : 'Hỏi về bữa sáng, thực đơn 7 ngày, thay thế đậu phụ, mã E-number...'
              }
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !disabled && !locked) {
                  e.preventDefault()
                  onSend()
                }
              }}
              disabled={disabled || locked}
              error={locked ? 'Đã hết 3 lượt hỏi (Guest)' : undefined}
              helperText={limitHint}
              fullWidth
            />
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            isLoading={disabled && !locked}
            onClick={onSend}
            disabled={locked || !value.trim()}
            leftIcon={<Send size={14} />}
          >
            Gửi
          </Button>
        </div>
      </div>
    </div>
  )
}

export const ChatInputBar = forwardRef(ChatInputBarInner)
ChatInputBar.displayName = 'ChatInputBar'

export default ChatInputBar
