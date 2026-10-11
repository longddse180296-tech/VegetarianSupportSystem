import { SkeletonLoader, StatusBadge } from '../../../shared/components'
import type { ScanHistoryItem } from '../types/foodScan.types'

export interface ScanHistoryListProps {
  historyState: 'idle' | 'loading' | 'done'
  history: ScanHistoryItem[]
  totalCount: number
  error: string | null
  onRetry: () => void
  onLoadMore: () => void
  onSelect: (id: string) => void
}

export default function ScanHistoryList({
  historyState,
  history,
  totalCount,
  error,
  onRetry,
  onLoadMore,
  onSelect,
}: ScanHistoryListProps) {
  if (historyState === 'idle') return null
  return (
    <div className="mt-4">
      <div className="mb-2 text-xs font-bold text-[#1f2937]">Lịch sử gần đây</div>
      {historyState === 'loading' && history.length === 0 && !error ? (
        <SkeletonLoader count={3} variant="text" />
      ) : null}
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          <p>{error}</p>
          <button type="button" className="mt-2 font-bold underline" onClick={onRetry}>
            Thử tải lại
          </button>
        </div>
      )}
      {historyState === 'done' && history.length === 0 && !error && (
        <div className="text-xs text-[#6b7280]">Bạn chưa có lần quét nào được lưu.</div>
      )}
      {history.length > 0 && (
        <ul className="space-y-2" role="list">
          {history.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => onSelect(h.id)}
                className="flex w-full items-start justify-between gap-3 rounded-[10px] border border-[#e5e7eb] bg-slate-50 px-3 py-2 text-left hover:border-[#2e7d32] focus-visible:outline-2 focus-visible:outline-[#2e7d32]"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-[#1f2937]">
                    {h.productName}
                  </div>
                  <div className="text-[11px] text-[#6b7280]">
                    {new Date(h.scannedAt).toLocaleString('vi-VN')} · {h.dietLabel}
                    {h.resultVersion > 1 && ` · Lần đánh giá ${h.resultVersion}`}
                  </div>
                  <div className="line-clamp-2 text-[11px] text-[#6b7280]">{h.noteShort}</div>
                </div>
                <StatusBadge status={h.status} size="sm" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {history.length > 0 && history.length < totalCount && !error && (
        <button
          type="button"
          className="mt-3 text-xs font-bold text-[#2e7d32] underline disabled:opacity-50"
          disabled={historyState === 'loading'}
          onClick={onLoadMore}
        >
          {historyState === 'loading' ? 'Đang tải...' : `Xem thêm (${history.length}/${totalCount})`}
        </button>
      )}
    </div>
  )
}
