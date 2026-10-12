import { Button, StatusBadge } from '../../../shared/components'
import {
  assessmentStatus,
  DIET_LABELS,
  INGREDIENT_KIND_LABELS,
  INGREDIENT_SOURCE_LABELS,
  type SavedFoodScan,
} from '../api/foodScanApi'

interface ScanResultCardProps {
  result: SavedFoodScan | null
  onResetAll: () => void
  onReevaluate: () => void
  onLoadHistory: () => void
  isLoggedIn: boolean
}

export default function ScanResultCard({
  result,
  onResetAll,
  onReevaluate,
  onLoadHistory,
  isLoggedIn,
}: ScanResultCardProps) {
  if (!result) {
    return (
      <div className="rounded-2xl border bg-white p-6">
        <p>Chưa có kết quả. Hãy tải ảnh và xác nhận nguyên liệu trước khi đánh giá.</p>
        <Button type="button" className="mt-4" onClick={onResetAll}>Bắt đầu quét</Button>
      </div>
    )
  }

  const currentDiet = result.profileSnapshot.diet
  const currentAssessment = result.assessments.find((item) => item.diet === currentDiet)

  return (
    <div className="space-y-5">
      <section className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#2e7d32]">Kết quả đã lưu từ BE</p>
            <h2 className="mt-1 text-xl font-extrabold text-[#1f2937]">
              {result.sourceType === 'Dish' ? 'Ảnh món ăn' : 'Ảnh nhãn thành phần'}
            </h2>
            <p className="mt-1 text-xs text-[#6b7280]">
              {new Date(result.createdAtUtc).toLocaleString('vi-VN')} · Phiên bản {result.resultVersion}
            </p>
          </div>
          {currentAssessment && <StatusBadge status={assessmentStatus(currentAssessment.status)} size="md" />}
        </div>
        <p className="mt-4 text-sm leading-6">{result.note}</p>
        <p className="mt-2 text-xs text-slate-500">
          Đánh giá dựa trên nguyên liệu bạn xác nhận và hồ sơ tại thời điểm quét; không chứng nhận thành phần ẩn hay an toàn dị ứng.
        </p>
      </section>

      <section className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
        <h3 className="font-bold">Đánh giá theo từng chế độ ăn</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {result.assessments.map((assessment) => (
            <div
              key={assessment.diet}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 ${
                assessment.diet === currentDiet ? 'border-[#2e7d32] bg-[#e8f5e9]/50' : 'border-[#e5e7eb]'
              }`}
            >
              <div>
                <p className="text-sm font-bold">{DIET_LABELS[assessment.diet] || assessment.diet}</p>
                {assessment.diet === currentDiet && <p className="text-xs text-[#2e7d32]">Chế độ trong hồ sơ của bạn</p>}
              </div>
              <StatusBadge status={assessmentStatus(assessment.status)} size="sm" />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
        <h3 className="font-bold">Nguyên liệu đã gửi đánh giá</h3>
        {result.ingredients.length ? (
          <ul className="mt-3 space-y-2">
            {result.ingredients.map((item, index) => (
              <li key={`${item.name}-${index}`} className="rounded-xl border border-[#e5e7eb] bg-slate-50 p-3">
                <div className="flex justify-between gap-3 text-sm">
                  <strong>{item.name}</strong>
                  <span>{INGREDIENT_KIND_LABELS[item.kind] || item.kind}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{INGREDIENT_SOURCE_LABELS[item.source] || item.source}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Chưa có nguyên liệu được xác nhận.</p>
        )}
      </section>

      {result.catalogEvidence.length > 0 && (
        <section className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
          <h3 className="font-bold">Đối chiếu kho nguyên liệu của BE</h3>
          <p className="mt-1 text-xs text-slate-500">BE dùng loại nguyên liệu trong kho khi phát hiện thành phần động vật, trứng, sữa hoặc mật ong.</p>
          <ul className="mt-3 space-y-2">
            {result.catalogEvidence.map((item) => (
              <li key={item.ingredientId} className="flex flex-wrap justify-between gap-2 rounded-xl border border-[#e5e7eb] p-3 text-sm">
                <strong>{item.name}</strong>
                <span>{INGREDIENT_KIND_LABELS[item.kind] || item.kind}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.unknownAnswers.length > 0 && (
        <section className="rounded-[16px] border border-amber-200 bg-amber-50 p-5">
          <h3 className="font-bold text-amber-900">Thông tin chưa rõ</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
            {result.unknownAnswers.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>
      )}

      <section className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
        <h3 className="font-bold">Cảnh báo dị ứng</h3>
        {result.allergyWarnings.length ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
            {result.allergyWarnings.map((warning, index) => <li key={index}>{warning}</li>)}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-600">Không có cảnh báo từ thông tin đã cung cấp.</p>
        )}
        <p className="mt-2 text-xs text-slate-500">{result.allergyNote}</p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={onReevaluate}>Bổ sung thông tin / đánh giá lại</Button>
        <Button type="button" onClick={onResetAll}>Quét ảnh khác</Button>
        {isLoggedIn && <Button type="button" variant="outline" onClick={onLoadHistory}>Xem lịch sử</Button>}
      </div>
    </div>
  )
}
