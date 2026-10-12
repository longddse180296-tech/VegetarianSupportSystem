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

function suitabilityMessage(s: PantrySuitability) {
  switch (s) {
    case 'suitable':
      return '✅ Đã xác minh thuần thực vật — an toàn cho chế độ ăn chay.'
    case 'warning':
      return '⚠️ Có thể chứa sữa/trứng/phô mai — đọc kỹ nhãn hoặc hỏi nhà cung cấp trước khi dùng.'
    case 'unsuitable':
      return '🚫 Phát hiện chất không phù hợp ăn chay — không khuyến nghị sử dụng trong món ăn chay.'
    case 'unchecked':
      return '🔍 Chưa kiểm tra — quét tại "Quét thực phẩm" để xác minh chi tiết.'
    default:
      return ''
  }
}

export const PantryItemList: React.FC<PantryItemListProps> = ({
  items,
  isLoading,
  onDelete,
  emptyState,
}) => {
  if (isLoading) {
    return (
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2" aria-busy="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            aria-hidden
            className="rounded-[16px] border border-[#E5E7EB] bg-white p-5"
            style={{ boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.04)' }}
          >
            <div className="flex gap-4">
              <div className="h-16 w-16 shrink-0 animate-pulse rounded-[12px] bg-slate-200" />
              <div className="min-w-0 flex-1">
                <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
                <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                <div className="mt-3 flex gap-2">
                  <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
                </div>
              </div>
            </div>
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-slate-200" />
          </li>
        ))}
      </ul>
    )
  }

  if (items.length === 0) return <>{emptyState ?? null}</>

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="group relative flex flex-col rounded-[16px] border border-[#E5E7EB] bg-white p-5 transition hover:-translate-y-[1px] hover:border-[#2E7D32]/30"
          style={{ boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.04)' }}
        >
          <div className="flex gap-4">
            {/* Icon thumbnail 64x64 rounded-[12px] */}
            <div
              aria-hidden
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[12px] bg-[#E8F5E9]"
            >
              <span className="text-2xl" aria-hidden>
                {item.isSuitable === 'unsuitable'
                  ? '🚫'
                  : item.isSuitable === 'warning'
                  ? '⚠️'
                  : item.category === 'hat-ngu-coc'
                  ? '🌾'
                  : item.category === 'nam'
                  ? '🍄'
                  : item.category === 'trai-cay'
                  ? '🍎'
                  : item.category === 'gia-vi'
                  ? '🧂'
                  : item.category === 'rau-cu-qua'
                  ? '🥬'
                  : item.category === 'dau-mem-san-xuat'
                  ? '🧀'
                  : item.category === 'sua-hat'
                  ? '🥛'
                  : item.category === 'thuc-pham-che-bien'
                  ? '🥫'
                  : '🧺'}
              </span>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3
                  className="min-w-0 flex-1 font-semibold tracking-[-0.005em] text-[#1F2937]"
                  style={{ fontSize: '18px', lineHeight: '26px' }}
                  title={item.name}
                >
                  {item.name}
                </h3>
                <StatusBadge status={mapStatus(item.isSuitable)} size="sm" />
              </div>

              {/* Pills: category, quantity, addedAt */}
              <div
                className="mt-2 flex flex-wrap items-center gap-2"
                style={{ fontSize: '12px', lineHeight: '16px' }}
              >
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5E9] px-2.5 py-1 font-medium text-[#2E7D32]">
                  {PANTRY_CATEGORY_LABELS[item.category] ?? 'Khác'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 font-semibold tabular-nums text-[#1F2937]">
                  {item.quantity > 0 ? `${item.quantity} ${item.unit}` : 'Chưa nhập số lượng'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F8FAF8] px-2.5 py-1 font-medium text-[#6B7280]">
                  Thêm {new Date(item.addedAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>

          {/* Suitability note / description */}
          <p
            className="mt-4 font-normal text-[#1F2937]"
            style={{ fontSize: '14px', lineHeight: '22px' }}
          >
            {item.suitableNote ?? suitabilityMessage(item.isSuitable)}
          </p>

          {/* Footer actions */}
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-dashed border-[#E5E7EB] pt-4">
            <div className="truncate font-medium text-[#6B7280]" style={{ fontSize: '12px', lineHeight: '16px' }}>
              #{item.id}
            </div>
            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={() => onDelete(item.id)}
              leftIcon={<Trash2 size={14} />}
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
