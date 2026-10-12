import React from 'react'
import { Bot, MessageSquare } from 'lucide-react'

interface AiNutritionAdviceCardProps {
  advice: string
  onOpenAiChat?: () => void
}

export const AiNutritionAdviceCard: React.FC<AiNutritionAdviceCardProps> = ({
  advice,
  onOpenAiChat,
}) => {
  return (
    <div className="bg-[#EAF5EE] rounded-3xl p-6 border border-emerald-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="font-bold text-[#1E6531] text-sm">
            Trợ lý dinh dưỡng AI
          </h3>
        </div>

        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#1E6531] border border-emerald-200">
          Gemini Nutrition
        </span>
      </div>

      {/* Quote Box */}
      <div className="p-4 bg-white/80 backdrop-blur-xs rounded-2xl border border-emerald-100 text-xs text-gray-700 leading-relaxed relative">
        <p className="italic">"{advice}"</p>
      </div>

      {/* CTA Button */}
      <button
        type="button"
        onClick={onOpenAiChat}
        className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-emerald-50 text-[#1E6531] border border-emerald-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
      >
        <Bot className="w-4 h-4 text-emerald-600" />
        <span>Hỏi đáp thêm với AI</span>
        <MessageSquare className="w-3.5 h-3.5 text-emerald-500 ml-1" />
      </button>
    </div>
  )
}
export default AiNutritionAdviceCard
