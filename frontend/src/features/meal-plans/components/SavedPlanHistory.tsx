import { History, MoreHorizontal, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { addPlanDays, formatPlanDate } from '../api/mealPlanApi'
import type { SavedPlanSummary } from '../types/mealPlanBackend.types'

interface Props {
  compact?: boolean
  plans: SavedPlanSummary[]
  selectedId?: string
  disabled: boolean
  onSelect: (id: string) => void
  onDelete: (plan: SavedPlanSummary) => void
}

export function SavedPlanHistory({ compact = false, plans, selectedId, disabled, onSelect, onDelete }: Props) {
  const [menuId, setMenuId] = useState<string | null>(null)
  const sorted = [...plans].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10)
  return (
    <section aria-label="Lịch sử thực đơn" className={compact ? 'mt-4 border-t border-slate-100 pt-4' : 'rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs'}>
      <div className="mb-3 flex items-center justify-between gap-2 text-[15px] font-bold text-slate-800">
        <h2 className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[#2E7D32]"><History size={15} /></span>
          Lịch sử thực đơn
        </h2>
        <span className="shrink-0 text-[11px] font-semibold text-slate-400">{sorted.length} thực đơn</span>
      </div>
      {!sorted.length && <p className="py-4 text-center text-xs text-slate-400">Chưa có thực đơn đã lưu.</p>}
      <div className={compact ? 'grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2' : 'max-h-[36rem] space-y-2 overflow-y-auto'}>
        {sorted.map((plan) => (
          <div key={plan.id} className={`group relative flex flex-wrap items-center rounded-xl border transition-colors ${selectedId === plan.id ? 'border-emerald-300 bg-emerald-50' : 'border-transparent hover:border-emerald-200 hover:bg-slate-50'}`}>
            <button type="button" disabled={disabled} onClick={() => onSelect(plan.id)}
              aria-current={selectedId === plan.id ? 'true' : undefined}
              title={`${plan.name} · ${formatPlanDate(plan.weekStartDate)} – ${formatPlanDate(addPlanDays(plan.weekStartDate, 6))}`}
              className="min-w-0 flex-1 cursor-pointer p-2.5 text-left disabled:cursor-not-allowed disabled:opacity-50">
              <span className="block truncate text-[13px] font-bold text-slate-800 group-hover:text-[#2E7D32]">{plan.name}</span>
              <span className="mt-1 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                <span>{plan.mealCount} bữa ăn</span>
                <span>{formatPlanDate(plan.weekStartDate)}</span>
              </span>
            </button>
              <button type="button" disabled={disabled} aria-label={`Thao tác với ${plan.name}`}
                aria-expanded={menuId === plan.id}
                onClick={() => setMenuId(menuId === plan.id ? null : plan.id)}
                className="mr-1 flex shrink-0 cursor-pointer rounded-md p-1.5 text-slate-400 hover:bg-slate-100">
                <MoreHorizontal size={17} />
              </button>
              {menuId === plan.id && <div className="w-full border-t border-slate-200/70 p-1">
                <button type="button" disabled={disabled} onClick={() => { setMenuId(null); onDelete(plan) }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                  <Trash2 size={15} />Xóa thực đơn
                </button>
              </div>}
          </div>
        ))}
      </div>
    </section>
  )
}
