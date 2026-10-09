import { ArrowLeft, CheckCircle2, CheckSquare } from 'lucide-react'
import {
  Button,
  SkeletonLoader,
  StatusBadge,
} from '../../../shared/components'
import type { ConfirmChecklistAnswers, FoodScanResult, ScanInputForm } from '../types/foodScan.types'

export interface ConfirmQuestion {
  key: keyof ConfirmChecklistAnswers
  question: string
  hint: string
}

export interface ConfirmChecklistCardProps {
  questions: ConfirmQuestion[]
  answers: ConfirmChecklistAnswers
  countAnswered: number
  isScanning: boolean
  onAnswer: (key: keyof ConfirmChecklistAnswers, value: boolean | null) => void
  form: ScanInputForm
  resultAfterFirstScan: FoodScanResult | null
  onConfirmFinish: () => void
  onBackToScanner: () => void
}

export default function ConfirmChecklistCard({
  questions,
  answers,
  countAnswered,
  isScanning,
  onAnswer,
  form,
  resultAfterFirstScan,
  onConfirmFinish,
  onBackToScanner,
}: ConfirmChecklistCardProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.25fr_minmax(0,0.9fr)]">
      <div className="flex flex-col gap-5">
        <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#1f2937]">
                Bộ câu hỏi kiểm tra bổ sung
              </h2>
              <p className="mt-1 text-xs text-[#6b7280]">
                Trả lời hết {questions.length} câu hỏi để hệ thống có đủ cơ sở tham chiếu trước khi
                trả kết quả cuối.
              </p>
            </div>
            <StatusBadge
              status="info"
              label={`${countAnswered} / ${questions.length} đã trả lời`}
              size="sm"
            />
          </div>

          {isScanning ? (
            <div className="py-4">
              <SkeletonLoader count={5} variant="text" />
            </div>
          ) : (
            <ul className="space-y-4">
              {questions.map((q, idx) => {
                const answer = answers[q.key]
                return (
                  <li
                    key={q.key}
                    className="rounded-[12px] border border-[#e5e7eb] bg-slate-50/70 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#2e7d32] ring-1 ring-[#c8e6c9]">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-[#1f2937]">
                          {q.question}
                        </div>
                        <div className="mt-0.5 text-xs text-[#6b7280]">{q.hint}</div>
                        <div className="mt-3 inline-flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={answer === true ? 'danger' : 'outline'}
                            onClick={() => onAnswer(q.key, true)}
                          >
                            Có / Rất có thể
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={answer === false ? 'primary' : 'outline'}
                            onClick={() => onAnswer(q.key, false)}
                          >
                            Không / Theo nhãn là không
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={answer === null ? 'secondary' : 'ghost'}
                            onClick={() => onAnswer(q.key, null)}
                          >
                            {answer === null ? 'Tôi chưa chắc / bỏ qua' : 'Đã bỏ qua'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <aside className="flex flex-col gap-5">
        <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
          <h3 className="mb-3 text-sm font-bold text-[#1f2937]">Tóm tắt thông tin đã nhập</h3>
          {isScanning ? (
            <SkeletonLoader count={4} variant="text" />
          ) : (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-bold text-[#6b7280]">Tên sản phẩm</dt>
                <dd className="text-[#1f2937]">
                  {form.productName || <span className="text-[#6b7280]">(chưa nhập)</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-[#6b7280]">Thương hiệu</dt>
                <dd className="text-[#1f2937]">
                  {form.productBrand || <span className="text-[#6b7280]">(chưa nhập)</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-[#6b7280]">Ảnh nhãn</dt>
                <dd className="text-[#1f2937]">
                  {form.imagePreview ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-[#2e7d32]">
                      <CheckCircle2 size={12} /> Đã cung cấp
                    </span>
                  ) : (
                    <span className="text-[#6b7280]">Chưa cung cấp ảnh</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-[#6b7280]">Thành phần</dt>
                <dd className="line-clamp-4 text-xs leading-5 text-[#1f2937]">
                  {form.ingredientText || (
                    <span className="text-[#6b7280]">(chưa nhập)</span>
                  )}
                </dd>
              </div>
              {resultAfterFirstScan && (
                <div className="mt-2 border-t border-[#e5e7eb] pt-3">
                  <dt className="mb-1.5 text-xs font-bold text-[#6b7280]">
                    Trạng thái bước 1 (sau khi quét lần đầu)
                  </dt>
                  <StatusBadge status={resultAfterFirstScan.status} />
                </div>
              )}
            </dl>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isScanning}
            leftIcon={<CheckSquare size={15} />}
            onClick={onConfirmFinish}
          >
            Xác nhận & Xem kết quả
          </Button>
          <Button
            type="button"
            variant="outline"
            size="md"
            fullWidth
            leftIcon={<ArrowLeft size={14} />}
            onClick={onBackToScanner}
          >
            Quay lại chỉnh sửa ảnh / thành phần
          </Button>
        </div>
      </aside>
    </section>
  )
}
