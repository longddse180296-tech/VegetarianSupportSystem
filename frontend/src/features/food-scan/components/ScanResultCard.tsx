import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CheckSquare,
  ScanLine,
  XCircle,
} from 'lucide-react'
import {
  Button,
  EmptyState,
  SkeletonLoader,
  StatusBadge,
} from '../../../shared/components'
import type {
  FlaggedIngredient,
  FoodScanResult,
  ScanInputForm,
  ScanStatus,
} from '../types/foodScan.types'

const statusTitle = (s: ScanStatus): string => {
  if (s === 'suitable') return 'Phù hợp theo thông tin đã cung cấp'
  if (s === 'unsuitable') return 'Không phù hợp theo thông tin đã cung cấp'
  return 'Chưa đủ thông tin để kết luận'
}

export interface ScanResultCardProps {
  isScanning: boolean
  result: FoodScanResult | null
  form: ScanInputForm
  countAnswered: number
  totalConfirmQuestions: number
  confirmQuestionsLength: number
  resultStatusNote?: string
  flaggedIngredients: FlaggedIngredient[]
  resultBasedOn: ('image' | 'ingredient-text' | 'confirm-checklist')[]
  resultProductName: string
  resultScannedAt: string
  resultTotalCount: number
  resultSafeCount: number
  onGoScanner: () => void
  onGoConfirm: () => void
  onResetAll: () => void
  onLoadHistory: () => void
  isLoggedIn: boolean
  onNavigateRecipes?: () => void
  onNavigateHistory?: () => void
}

export default function ScanResultCard(props: ScanResultCardProps) {
  const {
    isScanning,
    result,
    form,
    countAnswered,
    totalConfirmQuestions,
    flaggedIngredients,
    resultBasedOn,
    resultProductName,
    resultScannedAt,
    resultTotalCount,
    resultSafeCount,
    onGoScanner,
    onGoConfirm,
    onResetAll,
    isLoggedIn,
    onNavigateRecipes,
    onNavigateHistory,
    onLoadHistory,
  } = props

  if (isScanning) {
    return (
      <section className="flex flex-col gap-6">
        <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-[#1f2937]">
            <div className="h-3 w-3 animate-pulse rounded-full bg-[#2e7d32]" />
            Đang tổng hợp kết quả tham chiếu...
          </div>
          <SkeletonLoader count={2} variant="card" />
        </div>
      </section>
    )
  }

  if (!result) {
    return (
      <section className="flex flex-col gap-6">
        <EmptyState
          title="Chưa có kết quả"
          description="Quay về tab 1 để tải ảnh hoặc nhập thành phần, sau đó bấm Bắt đầu quét và hoàn thành tab 2 để có kết quả tham chiếu."
          icon={<BarChart3 size={30} className="text-[#2e7d32]" />}
          actionLabel="Vào tab Quét & Nhập"
          onAction={onGoScanner}
        />
      </section>
    )
  }

  const insufficientHints: string[] = []
  if (!form.imagePreview) insufficientHints.push('Tải ảnh nhãn sản phẩm (phần in thành phần).')
  if (form.ingredientText.trim().length < 20) {
    insufficientHints.push('Nhập đủ tối thiểu 20 ký tự danh sách thành phần in trên nhãn.')
  }
  if (countAnswered < totalConfirmQuestions) {
    insufficientHints.push(
      `Hoàn thành ${totalConfirmQuestions - countAnswered} câu hỏi bổ sung còn lại ở tab 2.`,
    )
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={result.status} size="md" />
              <span className="text-xs text-[#6b7280]">
                Thời gian quét: {new Date(resultScannedAt).toLocaleString('vi-VN')}
              </span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-[#1f2937]">
              {statusTitle(result.status)}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#1f2937]">{result.note}</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-[#6b7280]">Sản phẩm</div>
            <div className="mt-0.5 text-base font-bold text-[#1f2937]">{resultProductName}</div>
            <div className="mt-2 inline-flex flex-wrap items-center gap-1 text-[11px]">
              {resultBasedOn.includes('image') && (
                <span className="rounded-full bg-[#e8f5e9] px-2 py-0.5 font-bold text-[#2e7d32]">
                  ảnh nhãn
                </span>
              )}
              {resultBasedOn.includes('ingredient-text') && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                  thành phần
                </span>
              )}
              {resultBasedOn.includes('confirm-checklist') && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 font-bold text-amber-800">
                  đã xác nhận
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[12px] border border-[#e5e7eb] bg-slate-50 p-4">
            <div className="text-xs font-bold text-[#6b7280]">Tổng thành phần tham chiếu</div>
            <div className="mt-1 text-2xl font-extrabold text-[#1f2937]">
              {resultTotalCount}
            </div>
          </div>
          <div className="rounded-[12px] border border-[#c8e6c9] bg-[#e8f5e9]/60 p-4">
            <div className="mb-1 flex items-center gap-1 text-xs font-bold text-[#2e7d32]">
              <CheckCircle2 size={12} /> Không phát hiện dấu hiệu đặc biệt
            </div>
            <div className="text-2xl font-extrabold text-[#2e7d32]">{resultSafeCount}</div>
          </div>
          <div
            className={`rounded-[12px] border p-4 ${
              result.status === 'unsuitable'
                ? 'border-red-200 bg-red-50'
                : 'border-amber-200 bg-amber-50'
            }`}
          >
            <div
              className={`mb-1 flex items-center gap-1 text-xs font-bold ${
                result.status === 'unsuitable' ? 'text-red-700' : 'text-amber-800'
              }`}
            >
              {result.status === 'unsuitable' ? (
                <XCircle size={12} />
              ) : (
                <AlertTriangle size={12} />
              )}
              Điểm cần đối chiếu thêm
            </div>
            <div
              className={`text-2xl font-extrabold ${
                result.status === 'unsuitable' ? 'text-red-700' : 'text-amber-800'
              }`}
            >
              {flaggedIngredients.length}
            </div>
          </div>
        </div>
      </div>

      {flaggedIngredients.length > 0 && (
        <div className="rounded-[16px] border border-red-200 bg-red-50/60 p-5 shadow-xs">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold text-red-800">
                <XCircle size={16} /> Các yếu tố thường không phù hợp đã phát hiện
              </h3>
              <p className="mt-1 text-xs text-red-700/80">
                Dựa trên thông tin bạn cung cấp, các yếu tố sau thường không phù hợp với chế độ
                thuần thực vật. Vui lòng kiểm tra kỹ nhãn hoặc liên hệ nhà sản xuất.
              </p>
            </div>
          </div>
          <ul className="grid gap-3 md:grid-cols-2">
            {flaggedIngredients.map((f) => (
              <li
                key={f.id}
                className="rounded-[12px] border border-red-200 bg-white p-4 shadow-xs"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <div className="text-sm font-bold text-[#1f2937]">{f.name}</div>
                  {f.enumber && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
                      {f.enumber}
                    </span>
                  )}
                  <span className="ml-auto text-[11px] font-bold text-red-700">
                    {(f.confidence * 100).toFixed(0)}% độ tương đồng mô tả
                  </span>
                </div>
                {f.source && (
                  <div className="mb-1 text-xs font-semibold text-[#6b7280]">{f.source}</div>
                )}
                <p className="text-xs leading-5 text-[#1f2937]">{f.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.status === 'insufficient' && insufficientHints.length > 0 && (
        <div className="rounded-[16px] border border-amber-200 bg-amber-50/60 p-5 shadow-xs">
          <div className="mb-2 flex items-center gap-2 text-base font-bold text-amber-800">
            <AlertTriangle size={16} /> Đề xuất bổ sung để có đánh giá đáng tin cậy hơn
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">
            {insufficientHints.map((hint, i) => (
              <li key={i}>{hint}</li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<CheckSquare size={13} />}
              onClick={onGoConfirm}
            >
              Vào tab 2 để trả lời tiếp
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<ScanLine size={13} />}
              onClick={onGoScanner}
            >
              Quay lại tab 1
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
        <div className="text-sm text-[#1f2937]">
          <strong>Xong 1 lượt kiểm tra?</strong> Bạn có thể bắt đầu lại với sản phẩm khác, hoặc nếu
          đã đăng nhập, xem lịch sử các lần quét trước.
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="primary" size="md" onClick={onResetAll}>
            Quét sản phẩm khác
          </Button>
          {isLoggedIn && onNavigateHistory && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => {
                onLoadHistory()
                onNavigateHistory()
              }}
            >
              Xem lịch sử
            </Button>
          )}
          {isLoggedIn && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => {
                onLoadHistory()
              }}
            >
              Tải lại lịch sử
            </Button>
          )}
          {onNavigateRecipes && (
            <Button type="button" variant="ghost" size="md" onClick={onNavigateRecipes}>
              Khám phá công thức thay thế
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
