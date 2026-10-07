import React from 'react'
import { Check, Calendar } from 'lucide-react'

export const SetupStepper: React.FC = () => {
  const steps = [
    { number: 1, title: 'Bước 1', subtitle: 'Thông tin cơ thể', isCompleted: true },
    { number: 2, title: 'Bước 2', subtitle: 'Mục tiêu sức khỏe', isCompleted: true },
    { number: 3, title: 'Bước 3', subtitle: 'Nguyên liệu & Quy trình', isCompleted: true },
    { number: 4, title: 'Bước 4', subtitle: 'Kế hoạch tuần', isCurrent: true },
  ]

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map((step) => (
          <div key={step.number} className="flex items-center gap-3 p-2 rounded-2xl">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                step.isCompleted
                  ? 'bg-[#1E6531] text-white shadow-xs'
                  : step.isCurrent
                  ? 'bg-emerald-100 text-[#1E6531] ring-2 ring-emerald-500/20'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {step.isCompleted ? (
                <Check className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
            </div>

            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                {step.title}
              </span>
              <p className="text-xs font-bold text-gray-900 truncate">
                {step.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
export default SetupStepper
