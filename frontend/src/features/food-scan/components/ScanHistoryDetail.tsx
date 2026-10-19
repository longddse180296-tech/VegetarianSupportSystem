import { StatusBadge } from '../../../shared/components'
import {
  assessmentStatus,
  DIET_LABELS,
  INGREDIENT_KIND_LABELS,
  INGREDIENT_SOURCE_LABELS,
  toScanHistoryItem,
  type SavedFoodScan,
} from '../api/foodScanApi'

interface ScanHistoryDetailProps {
  scan: SavedFoodScan | null
  loading: boolean
  error: string | null
  onRetry: () => void
}

export default function ScanHistoryDetail({
  scan,
  loading,
  error,
  onRetry,
}: ScanHistoryDetailProps) {
  if (loading) return <p className="text-sm text-slate-500 py-4 text-center">Đang tải chi tiết lần quét...</p>
  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 space-y-2">
        <p className="text-sm">{error}</p>
        <button type="button" className="font-bold text-rose-700 underline cursor-pointer text-xs" onClick={onRetry}>
          Thử tải lại
        </button>
      </div>
    )
  }
  if (!scan) return null

  const summary = toScanHistoryItem(scan)

  return (
    <div className="space-y-5 text-sm">
      <div className="rounded-xl bg-slate-50/80 border border-slate-200/80 p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <StatusBadge status={summary.status} size="md" />
          <span className="text-xs text-slate-500">
            {new Date(scan.createdAtUtc).toLocaleString('vi-VN')} · Đánh giá lần {scan.resultVersion}
          </span>
        </div>
        <h3 className="text-lg font-bold text-slate-900">{summary.productName}</h3>
        <p className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 inline-block px-2.5 py-0.5 rounded-full">
          Chế độ người dùng: {summary.dietLabel}
        </p>
        <p className="text-xs text-slate-700 leading-relaxed pt-1">
          {scan.note?.includes('User xác nhận') || scan.note?.includes('không xác minh thành phần ẩn')
            ? 'Kết quả phân tích dựa trên danh sách thành phần bạn đã kiểm tra và xác nhận. Do hình ảnh món ăn không thể hiện được các thành phần ẩn (như nước dùng, gia vị nêm, dầu mỡ), vui lòng đối chiếu thêm với người chế biến để đảm bảo chuẩn chay theo nhu cầu.'
            : scan.note}
        </p>
      </div>

      <section className="space-y-2">
        <h4 className="font-bold text-slate-800 text-xs">Đánh giá theo bốn chế độ ăn</h4>
        <div className="grid gap-2 sm:grid-cols-2">
          {scan.assessments.map((assessment) => (
            <div
              key={assessment.diet}
              className={`flex items-center justify-between gap-2 rounded-xl border p-3 ${
                assessment.diet === scan.profileSnapshot.diet
                  ? 'border-[#2E7D32] bg-emerald-50/50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <span className="font-semibold text-xs text-slate-800">
                {DIET_LABELS[assessment.diet] || assessment.diet}
                {assessment.diet === scan.profileSnapshot.diet && ' · Hồ sơ của bạn'}
              </span>
              <StatusBadge status={assessmentStatus(assessment.status)} size="sm" />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h4 className="font-bold text-slate-800 text-xs">Nguyên liệu đã lưu</h4>
        {scan.ingredients.length ? (
          <ul className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3 max-h-48 overflow-y-auto">
            {scan.ingredients.map((ingredient, index) => (
              <li key={`${ingredient.name}-${index}`} className="border-b border-slate-200/60 pb-1.5 last:border-none last:pb-0">
                <div className="flex justify-between gap-3 text-xs">
                  <span className="break-words font-medium text-slate-800">{ingredient.name}</span>
                  <span className="shrink-0 text-slate-500 font-semibold">
                    {INGREDIENT_KIND_LABELS[ingredient.kind] || ingredient.kind}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  {INGREDIENT_SOURCE_LABELS[ingredient.source] || ingredient.source}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500">Chưa có nguyên liệu được lưu.</p>
        )}
      </section>

      {scan.correctedLabelText && (
        <section className="space-y-1.5">
          <h4 className="font-bold text-slate-800 text-xs">Nội dung nhãn đã xác nhận</h4>
          <p className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs font-mono text-slate-700 max-h-32 overflow-y-auto">
            {scan.correctedLabelText}
          </p>
        </section>
      )}

      {scan.unknownAnswers.length > 0 && (
        <section className="space-y-1.5">
          <h4 className="font-bold text-slate-800 text-xs">Thông tin còn chưa rõ</h4>
          <ul className="list-disc space-y-1 pl-5 text-xs text-amber-900 bg-amber-50 border border-amber-200/70 p-3 rounded-xl">
            {scan.unknownAnswers.map((answer, index) => (
              <li key={index}>{answer}</li>
            ))}
          </ul>
        </section>
      )}

      {scan.allergyWarnings.length > 0 && (
        <section className="space-y-1.5 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <h4 className="font-bold text-amber-900 text-xs">Cảnh báo dị ứng</h4>
          <ul className="list-disc space-y-1 pl-5 text-xs text-amber-900 font-semibold">
            {scan.allergyWarnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-[11px] text-slate-500 leading-relaxed">{scan.allergyNote}</p>

      {scan.catalogEvidence?.length > 0 && (
        <section className="space-y-1.5">
          <h4 className="font-bold text-slate-800 text-xs">Đối chiếu dữ liệu nguyên liệu</h4>
          <ul className="space-y-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
            {scan.catalogEvidence.map((item) => (
              <li key={item.ingredientId}>
                • {item.name} · {INGREDIENT_KIND_LABELS[item.kind] || item.kind}
                {item.source && ` · ${item.source}`}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-[11px] text-slate-400 italic">
        Lịch sử lưu kết quả đánh giá và thông tin đã cung cấp; ảnh gốc không được lưu cùng bản ghi này.
      </p>
    </div>
  )
}
