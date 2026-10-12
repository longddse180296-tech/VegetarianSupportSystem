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
  if (loading) return <p>Đang tải chi tiết lần quét...</p>
  if (error) {
    return (
      <div role="alert" className="space-y-2 text-red-800">
        <p>{error}</p>
        <button type="button" className="font-bold underline" onClick={onRetry}>
          Thử tải lại
        </button>
      </div>
    )
  }
  if (!scan) return null

  const summary = toScanHistoryItem(scan)

  return (
    <div className="space-y-5 text-sm">
      <div className="space-y-2">
        <StatusBadge status={summary.status} size="md" />
        <h3 className="text-lg font-bold text-[#1f2937]">{summary.productName}</h3>
        <p className="text-xs text-slate-500">
          {new Date(scan.createdAtUtc).toLocaleString('vi-VN')} · {summary.dietLabel} · Phiên bản kết quả {scan.resultVersion}
        </p>
        <p className="leading-6">{scan.note}</p>
      </div>

      <section className="space-y-2">
        <h4 className="font-bold">Đánh giá theo bốn chế độ ăn</h4>
        <div className="grid gap-2 sm:grid-cols-2">
          {scan.assessments.map((assessment) => (
            <div key={assessment.diet} className="flex items-center justify-between gap-2 rounded-xl border p-3">
              <span className="font-semibold">
                {DIET_LABELS[assessment.diet] || assessment.diet}
                {assessment.diet === scan.profileSnapshot.diet && ' · Hồ sơ của bạn'}
              </span>
              <StatusBadge status={assessmentStatus(assessment.status)} size="sm" />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h4 className="font-bold">Nguyên liệu đã lưu</h4>
        {scan.ingredients.length ? (
          <ul className="space-y-1 rounded-xl border bg-slate-50 p-3">
            {scan.ingredients.map((ingredient, index) => (
              <li key={`${ingredient.name}-${index}`}>
                <div className="flex justify-between gap-3">
                  <span className="break-words">{ingredient.name}</span>
                  <span className="shrink-0 text-slate-500">
                    {INGREDIENT_KIND_LABELS[ingredient.kind] || ingredient.kind}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {INGREDIENT_SOURCE_LABELS[ingredient.source] || ingredient.source}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500">Chưa có nguyên liệu được lưu.</p>
        )}
      </section>

      {scan.correctedLabelText && (
        <section className="space-y-2">
          <h4 className="font-bold">Nội dung nhãn đã xác nhận</h4>
          <p className="whitespace-pre-wrap rounded-xl border bg-slate-50 p-3">
            {scan.correctedLabelText}
          </p>
        </section>
      )}

      {scan.unknownAnswers.length > 0 && (
        <section className="space-y-2">
          <h4 className="font-bold">Thông tin còn chưa rõ</h4>
          <ul className="list-disc space-y-1 pl-5">
            {scan.unknownAnswers.map((answer, index) => (
              <li key={index}>{answer}</li>
            ))}
          </ul>
        </section>
      )}

      {scan.allergyWarnings.length > 0 && (
        <section className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <h4 className="font-bold text-amber-900">Cảnh báo dị ứng</h4>
          <ul className="list-disc space-y-1 pl-5">
            {scan.allergyWarnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-slate-500">{scan.allergyNote}</p>

      {scan.catalogEvidence?.length > 0 && (
        <section className="space-y-2">
          <h4 className="font-bold">Đối chiếu dữ liệu nguyên liệu</h4>
          <ul className="space-y-1 text-xs text-slate-600">
            {scan.catalogEvidence.map((item) => (
              <li key={item.ingredientId}>
                {item.name} · {INGREDIENT_KIND_LABELS[item.kind] || item.kind}
                {item.source && ` · ${item.source}`}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-slate-500">
        Lịch sử lưu kết quả đánh giá và thông tin đã cung cấp; ảnh gốc không được lưu cùng bản ghi này.
      </p>
    </div>
  )
}
