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
    <div className="mt-4 pt-3 border-t border-slate-100">
      <div className="mb-2 text-xs font-bold text-slate-700">Lịch sử quét gần đây</div>
      {historyState === 'loading' && history.length === 0 && !error ? (
        <SkeletonLoader count={3} variant="text" />
      ) : null}
      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <p>{error}</p>
          <button type="button" className="mt-1.5 font-bold text-rose-700 underline cursor-pointer" onClick={onRetry}>
            Thử tải lại
          </button>
        </div>
      )}
      {historyState === 'done' && history.length === 0 && !error && (
        <div className="text-xs text-slate-500 py-2">Bạn chưa có lần quét nào được lưu.</div>
      )}
      {history.length > 0 && (
        <ul className="space-y-2" role="list">
          {history.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => onSelect(h.id)}
                className="group flex w-full items-start justify-between gap-2.5 rounded-xl border border-slate-200/90 bg-slate-50/70 p-3 text-left hover:border-emerald-300 hover:bg-emerald-50/40 transition-all cursor-pointer shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-slate-800 group-hover:text-emerald-800 transition-colors">
                    {h.productName}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {new Date(h.scannedAt).toLocaleDateString('vi-VN')} · {h.dietLabel}
                    {h.resultVersion > 1 && ` · Lần ${h.resultVersion}`}
                  </div>
                  <div className="line-clamp-1 text-[11px] text-slate-500 mt-1">{h.noteShort}</div>
                </div>
                <div className="shrink-0 mt-0.5">
                  <StatusBadge status={h.status} size="sm" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {history.length > 0 && history.length < totalCount && !error && (
        <button
          type="button"
          className="mt-3 text-xs font-bold text-[#2E7D32] hover:text-[#1B5E20] hover:underline disabled:opacity-50 cursor-pointer block text-center w-full"
          disabled={historyState === 'loading'}
          onClick={onLoadMore}
        >
          {historyState === 'loading' ? 'Đang tải thêm...' : `Xem thêm (${history.length}/${totalCount})`}
        </button>
      )}
    </div>
  )
}
