import { Trash2 } from 'lucide-react'
import { Button, StatusBadge } from '../../../shared/components'
import type { PantryItem, PantrySuitability } from '../types/pantry.types'
import { PANTRY_CATEGORY_LABELS } from '../types/pantry.types'

interface PantryItemListProps {
  items: PantryItem[]
  isLoading: boolean
  onDelete: (id: string) => void
  emptyState?: React.ReactNode
}

function mapStatus(s: PantrySuitability) {
  if (s === 'suitable') return 'suitable' as const
  if (s === 'unsuitable') return 'unsuitable' as const
  if (s === 'warning') return 'insufficient' as const
  return 'neutral' as const
}

export const PantryItemList: React.FC<PantryItemListProps> = ({
  items,
  isLoading,
  onDelete,
  emptyState,
}) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[16px] border border-[#e5e7eb] bg-white p-4 shadow-xs"
          >
            <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="mt-4 h-8 w-1/3 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-4 h-10 w-full animate-pulse rounded-[10px] bg-slate-200" />
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) return <>{emptyState ?? null}</>

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-col justify-between rounded-[16px] border border-[#e5e7eb] bg-white p-4 shadow-xs transition hover:shadow-sm hover:-translate-y-0.5"
        >
          <div>
            <div className="flex items-start justify-between gap-2">
              <h4 className="line-clamp-1 text-[15px] font-extrabold tracking-tight text-[#1f2937]">
                {item.name}
              </h4>
              <StatusBadge status={mapStatus(item.isSuitable)} size="sm" />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#6b7280]">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e9] px-2 py-0.5 font-bold text-[#2e7d32]">
                {PANTRY_CATEGORY_LABELS[item.category] ?? 'Khác'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-semibold">
                {item.quantity > 0 ? `${item.quantity} ${item.unit}` : 'Chưa nhập số lượng'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 font-medium text-[#6b7280]">
                Thêm {new Date(item.addedAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
            <p className="mt-3 line-clamp-2 text-[12px] leading-5 text-[#1f2937]">
              {item.suitableNote}
            </p>
          </div>
          <div className="mt-4 flex items-center justify-end">
            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={() => onDelete(item.id)}
              leftIcon={<Trash2 size={12} />}
            >
              Xóa
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default PantryItemList
