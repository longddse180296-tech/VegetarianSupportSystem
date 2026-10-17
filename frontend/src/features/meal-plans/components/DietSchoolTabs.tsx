import React from 'react'
import { Check } from 'lucide-react'
import type { DietType } from '../types/mealPlans.types'

interface DietSchoolTabsProps {
  activeDiet: DietType
  onSelectDiet: (diet: DietType) => void
}

interface SchoolItem {
  id: DietType
  title: string
  badge: string
  desc: string
  sub: string
}

const SCHOOLS: SchoolItem[] = [
  {
    id: 'vegan',
    title: 'Thuần chay',
    badge: '100% Thực vật',
    desc: 'Không thịt, trứng, sữa, mật ong',
    sub: 'Vegan Standard',
  },
  {
    id: 'lacto',
    title: 'Chay có sữa',
    badge: 'Có sữa/phô mai',
    desc: 'Không thịt, không trứng',
    sub: 'Lacto-Vegetarian',
  },
  {
    id: 'ovo',
    title: 'Chay có trứng',
    badge: 'Có trứng hữu cơ',
    desc: 'Không thịt, không sữa bò',
    sub: 'Ovo-Vegetarian',
  },
  {
    id: 'lacto-ovo',
    title: 'Trứng & Sữa',
    badge: 'Đa dạng dưỡng chất',
    desc: 'Linh hoạt & phổ biến nhất',
    sub: 'Lacto-Ovo Vegetarian',
  },
]

export const DietSchoolTabs: React.FC<DietSchoolTabsProps> = ({
  activeDiet,
  onSelectDiet,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {SCHOOLS.map((school) => {
        const isActive = school.id === activeDiet
        return (
          <div
            key={school.id}
            onClick={() => onSelectDiet(school.id)}
            className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between border ${
              isActive
                ? 'bg-[#184d28] text-white border-[#184d28] shadow-sm'
                : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300 hover:shadow-2xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-sm tracking-tight">
                  {school.title}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? 'bg-emerald-700/80 text-emerald-100'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                  }`}
                >
                  {school.badge}
                </span>
              </div>
              <p
                className={`mt-1.5 text-xs line-clamp-1 ${
                  isActive ? 'text-emerald-100/90' : 'text-slate-500'
                }`}
              >
                {school.desc}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
              {isActive ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-200">
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Đang áp dụng</span>
                </div>
              ) : (
                <span className="text-[11px] font-medium text-slate-400">
                  {school.sub}
                </span>
              )}

              <div
                className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                  isActive
                    ? 'border-white bg-white text-[#184d28]'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {isActive && <div className="h-2 w-2 rounded-full bg-[#184d28]" />}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
