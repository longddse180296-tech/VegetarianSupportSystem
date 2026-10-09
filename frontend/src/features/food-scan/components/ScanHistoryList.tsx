import { SkeletonLoader, StatusBadge } from '../../../shared/components'
import type { ScanHistoryItem } from '../types/foodScan.types'

export interface ScanHistoryListProps {
  historyState: 'idle' | 'loading' | 'done'
  history: ScanHistoryItem[]
}

export default function ScanHistoryList({ historyState, history }: ScanHistoryListProps) {
  if (historyState === 'idle') return null
  return (
    <div className="mt-4">
      <div className="mb-2 text-xs font-bold text-[#1f2937]">Lịch sử gần đây</div>
      {historyState === 'loading' ? (
        <SkeletonLoader count={3} variant="text" />
      ) : history.length === 0 ? (
        <div className="text-xs text-[#6b7280]">Chưa có lịch sử.</div>
      ) : (
        <ul className="space-y-2" role="list">
          {history.map((h) => (
            <li
              key={h.id}
              className="flex items-start justify-between gap-3 rounded-[10px] border border-[#e5e7eb] bg-slate-50 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-[#1f2937]">
                  {h.productName}
                </div>
                <div className="text-[11px] text-[#6b7280]">{h.noteShort}</div>
              </div>
              <StatusBadge status={h.status} size="sm" />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
