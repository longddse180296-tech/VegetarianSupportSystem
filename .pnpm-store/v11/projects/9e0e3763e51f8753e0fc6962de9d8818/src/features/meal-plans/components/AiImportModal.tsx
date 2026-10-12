import React, { useState } from 'react'
import { X, Sparkles, Bot, ArrowRight } from 'lucide-react'

interface AiImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportPrompt?: (prompt: string) => void
  onNavigateToAiChat?: () => void
}

export const AiImportModal: React.FC<AiImportModalProps> = ({
  isOpen,
  onClose,
  onImportPrompt,
  onNavigateToAiChat,
}) => {
  const [aiPrompt, setAiPrompt] = useState(
    'Tạo thực đơn 7 ngày thuần chay giàu Protein cho người nặng 60kg, cao 170cm, muốn duy trì vóc dáng và hạn chế đậu nành.',
  )

  if (!isOpen) return null

  const handleApply = () => {
    onImportPrompt?.(aiPrompt)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-xl border border-slate-100 p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Nhập thực đơn từ Trợ lý AI
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Sử dụng mô hình AI dinh dưỡng để tự động tạo kế hoạch tuần
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Input box */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">
            Mô tả nhu cầu hoặc dán gợi ý từ Gemini AI:
          </label>
          <textarea
            rows={4}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 p-3.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs leading-relaxed"
          />
        </div>

        {/* Helper suggestions */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400">
            Gợi ý nhanh:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              'Thực đơn 1.500 kcal giảm mỡ',
              'Ăn chay Lacto-Ovo cho người tập gym',
              'Thực đơn thanh lọc 7 ngày không dầu mỡ',
            ].map((suggest) => (
              <button
                key={suggest}
                type="button"
                onClick={() => setAiPrompt(suggest)}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                {suggest}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onNavigateToAiChat}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Mở Trợ lý AI Chat</span>
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#184d28] hover:bg-[#123e1f] py-2.5 text-xs font-bold text-white shadow-2xs transition-all"
          >
            <span>Tạo thực đơn ngay</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
