import React from 'react'
import { Sparkles, Plus, Bot } from 'lucide-react'

interface MyPlanBannerProps {
  onCreateNewPlan?: () => void
  onOpenAiImport?: () => void
}

export const MyPlanBanner: React.FC<MyPlanBannerProps> = ({
  onCreateNewPlan,
  onOpenAiImport,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#174826] via-[#1a532c] to-[#123e1f] p-6 md:p-8 text-white shadow-md border border-emerald-800/40">
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 -bottom-12 h-48 w-48 rounded-full bg-emerald-300/10 blur-2xl" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left column: Icon + Copy */}
        <div className="flex items-start md:items-center gap-4.5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 text-emerald-300 shadow-inner">
            <Sparkles className="h-7 w-7 text-emerald-300" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
                Tạo thực đơn mới
              </h2>
              <span className="rounded-full bg-emerald-200/90 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#123e1f] shadow-xs">
                Cá nhân hóa
              </span>
            </div>
            <p className="mt-1.5 text-xs md:text-sm text-emerald-100/90 max-w-xl leading-relaxed">
              Tạo kế hoạch bữa ăn dựa trên BMI, mục tiêu sức khỏe và nguyên liệu bạn đang có trong tủ bếp.
            </p>
          </div>
        </div>

        {/* Right column: Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onCreateNewPlan}
            className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs md:text-sm font-bold text-[#174826] shadow-sm hover:bg-emerald-50 active:scale-[0.98] transition-all"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Tạo thực đơn mới</span>
          </button>

          <button
            type="button"
            onClick={onOpenAiImport}
            className="flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 backdrop-blur-sm px-5 py-3 text-xs md:text-sm font-semibold text-white hover:bg-white/20 active:scale-[0.98] transition-all"
          >
            <Bot className="h-4 w-4 text-emerald-300" />
            <span>Nhập từ Trợ lý AI</span>
          </button>
        </div>
      </div>
    </div>
  )
}
