import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  HelpCircle,
  Plus,
  Sparkles,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react'
import { Button } from '../../../shared/components'
import {
  INGREDIENT_KIND_LABELS,
  INGREDIENT_SOURCE_LABELS,
  type ScanAnalysis,
} from '../api/foodScanApi'
import type { DraftIngredient, IngredientKind } from '../types/foodScan.types'

export interface ConfirmChecklistCardProps {
  analysis: ScanAnalysis
  ingredients: DraftIngredient[]
  correctedLabelText: string
  labelIncomplete: boolean
  resolvedQuestions: string[]
  ingredientsComplete: boolean
  isSaving: boolean
  onIngredientsChange: (value: DraftIngredient[]) => void
  onCorrectedLabelTextChange: (value: string) => void
  onLabelIncompleteChange: (value: boolean) => void
  onToggleQuestion: (question: string) => void
  onIngredientsCompleteChange: (value: boolean) => void
  onParseLabel: () => void
  onEvaluate: () => void
  onBack: () => void
}

export default function ConfirmChecklistCard({
  analysis,
  ingredients,
  correctedLabelText,
  labelIncomplete,
  resolvedQuestions,
  ingredientsComplete,
  isSaving,
  onIngredientsChange,
  onCorrectedLabelTextChange,
  onLabelIncompleteChange,
  onToggleQuestion,
  onIngredientsCompleteChange,
  onParseLabel,
  onEvaluate,
  onBack,
}: ConfirmChecklistCardProps) {
  const questions = analysis.sourceType === 'Dish'
    ? [...new Set([...analysis.data.unknownFactors, ...analysis.data.followUpQuestions])]
    : []
  const allConfirmed = ingredients.length > 0 && ingredients.every((item) =>
    item.name.trim() && item.kind !== 'Unknown' &&
    (item.source === 'UserConfirmed' || item.source === 'UserEdited'),
  )
  const canMarkComplete = allConfirmed &&
    questions.every((question) => resolvedQuestions.includes(question)) &&
    !labelIncomplete

  const updateIngredient = (id: string, changes: Partial<DraftIngredient>) => {
    onIngredientsChange(ingredients.map((item) =>
      item.id === id ? { ...item, ...changes, source: 'UserEdited' } : item,
    ))
  }

  return (
    <section className="space-y-6">
      {/* Thông tin ban đầu từ AI/OCR */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[#2E7D32] text-xs font-bold">
            i
          </span>
          <h2 className="text-base font-bold text-slate-800">
            {analysis.sourceType === 'Dish' ? 'Kết quả AI nhận diện món' : 'Kết quả OCR đọc chữ nhãn'}
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-4 ml-8">
          AI và OCR chỉ mang tính chất gợi ý ban đầu. Hãy kiểm tra, chỉnh sửa hoặc bổ sung nguyên liệu trước khi đánh giá.
        </p>

        {analysis.sourceType === 'Dish' ? (
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/70 to-white p-4.5 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2E7D32] px-2.5 py-0.5 text-xs font-bold text-white shadow-2xs">
                <Sparkles size={12} /> Tên món AI gợi ý
              </span>
            </div>
            <p className="mt-2 text-lg font-extrabold text-slate-900">
              {analysis.data.suggestedDishName || 'Chưa nhận diện rõ tên món'}
            </p>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">{analysis.data.note}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-800" htmlFor="corrected-label-text">
              Văn bản OCR đọc được trên nhãn bao bì (bạn có thể sửa trực tiếp):
            </label>
            <textarea
              id="corrected-label-text"
              rows={6}
              maxLength={10000}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-slate-800 focus:bg-white focus:border-[#2E7D32] focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono"
              value={correctedLabelText}
              onChange={(event) => onCorrectedLabelTextChange(event.target.value)}
              placeholder="Nhập lại phần thành phần đọc được trên bao bì..."
            />
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={onParseLabel} className="border-slate-300 hover:border-emerald-300 hover:bg-emerald-50/50">
                Tách lại danh sách nguyên liệu từ văn bản đã sửa
              </Button>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={labelIncomplete}
                  onChange={(event) => onLabelIncompleteChange(event.target.checked)}
                  className="rounded text-[#2E7D32] focus:ring-emerald-500"
                />
                <span>Nhãn bị mờ / cắt góc / thiếu một phần thành phần</span>
              </label>
            </div>
            {analysis.data.isIncomplete && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                ⚠️ Hệ thống phát hiện ảnh nhãn ban đầu chưa đọc đủ. Nếu bạn đã tự kiểm tra và điền đủ ở trên, hãy bỏ chọn dấu thiếu.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Danh sách nguyên liệu */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[#2E7D32]">
                <UtensilsCrossed size={15} />
              </div>
              <h3 className="font-bold text-slate-800">Danh sách nguyên liệu để phân tích</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                {ingredients.length} mục
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Loại nguyên liệu đã được gợi ý sẵn. Hãy sửa mục chưa đúng rồi xác nhận trước khi đánh giá.
            </p>
          </div>
          {ingredients.some((item) => item.name.trim() && item.kind !== 'Unknown'
            && (item.source === 'AiSuggested' || item.source === 'LabelOcr')) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<CheckCircle2 size={13} />}
              onClick={() => onIngredientsChange(ingredients.map((item) =>
                item.name.trim() && item.kind !== 'Unknown'
                  && (item.source === 'AiSuggested' || item.source === 'LabelOcr')
                  ? { ...item, source: 'UserConfirmed' }
                  : item,
              ))}
              className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
            >
              Xác nhận các loại đã chọn
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Plus size={13} />}
            disabled={ingredients.length >= 100}
            onClick={() => onIngredientsChange([
              ...ingredients,
              { id: crypto.randomUUID(), name: '', kind: 'Unknown', source: 'UserEdited' },
            ])}
            className="border-slate-300 hover:border-emerald-300 hover:bg-emerald-50/50"
          >
            Thêm nguyên liệu
          </Button>
        </div>

        {ingredients.length === 0 && (
          <p className="mt-4 rounded-xl bg-amber-50/80 p-3.5 text-xs text-amber-900 border border-amber-200/70">
            Chưa có nguyên liệu nào. Bạn có thể nhấn nút "Thêm nguyên liệu" để nhập thủ công.
          </p>
        )}

        <div className="mt-4 space-y-3">
          {ingredients.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-3 transition-all ${
                item.source === 'UserConfirmed'
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
              }`}
            >
              <div className="grid gap-2 sm:grid-cols-[1fr_11rem_auto] items-center">
                <input
                  aria-label="Tên nguyên liệu"
                  maxLength={200}
                  value={item.name}
                  onChange={(event) => updateIngredient(item.id, { name: event.target.value })}
                  className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2E7D32] focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                  placeholder="Nhập tên nguyên liệu..."
                />
                <select
                  aria-label={`Loại của ${item.name || 'nguyên liệu'}`}
                  value={item.kind}
                  onChange={(event) => updateIngredient(item.id, { kind: event.target.value as IngredientKind })}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 focus:border-[#2E7D32] transition-all"
                >
                  {Object.entries(INGREDIENT_KIND_LABELS).map(([kind, label]) => (
                    <option key={kind} value={kind}>
                      {label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  aria-label={`Xóa ${item.name || 'nguyên liệu'}`}
                  onClick={() => onIngredientsChange(ingredients.filter((entry) => entry.id !== item.id))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="Xóa nguyên liệu này"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {INGREDIENT_SOURCE_LABELS[item.source]}
                  </span>
                  {item.kind === 'Plant' ? (
                    <span className="text-emerald-700 font-semibold text-[11px]">✓ Gốc thực vật</span>
                  ) : item.kind === 'Animal' ? (
                    <span className="text-rose-700 font-semibold text-[11px]">✗ Nguồn gốc động vật</span>
                  ) : item.kind === 'Dairy' || item.kind === 'Egg' ? (
                    <span className="text-amber-700 font-semibold text-[11px]">Trứng / Sữa</span>
                  ) : item.kind === 'Honey' ? (
                    <span className="text-amber-700 font-semibold text-[11px]">Mật ong</span>
                  ) : null}
                </div>

                {(item.source === 'AiSuggested' || item.source === 'LabelOcr') && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-bold text-[#2E7D32] hover:text-[#1B5E20] hover:underline cursor-pointer"
                    onClick={() => onIngredientsChange(ingredients.map((entry) =>
                      entry.id === item.id ? { ...entry, source: 'UserConfirmed' } : entry,
                    ))}
                  >
                    <CheckCircle2 size={12} />
                    <span>Xác nhận nguyên liệu này đúng</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Yếu tố chưa xác định */}
      {questions.length > 0 && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 shadow-2xs">
                <HelpCircle size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">
                    Yếu tố AI chưa thể xác định từ ảnh
                  </h3>
                  <span className="rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                    Đã làm rõ {resolvedQuestions.length}/{questions.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ảnh chụp chưa chứng minh được gia vị nền hoặc nước hầm. Vui lòng xác nhận xem món ăn có chứa các yếu tố sau không:
                </p>
              </div>
            </div>

            {/* Nút hành động nhanh: Chọn tất cả / Bỏ chọn tất cả */}
            <button
              type="button"
              onClick={() => {
                const allSelected = questions.every((q) => resolvedQuestions.includes(q))
                if (allSelected) {
                  questions.forEach((q) => {
                    if (resolvedQuestions.includes(q)) onToggleQuestion(q)
                  })
                } else {
                  questions.forEach((q) => {
                    if (!resolvedQuestions.includes(q)) onToggleQuestion(q)
                  })
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-emerald-50 hover:border-emerald-300 hover:text-[#2E7D32] px-3 py-1.5 text-xs font-semibold text-slate-700 transition active:scale-95 cursor-pointer shadow-2xs"
            >
              <CheckCircle2 size={13} className="text-[#2E7D32]" />
              <span>
                {questions.every((q) => resolvedQuestions.includes(q)) ? 'Bỏ chọn tất cả' : 'Xác nhận tất cả'}
              </span>
            </button>
          </div>

          <ul className="space-y-2.5">
            {questions.map((question) => {
              const isChecked = resolvedQuestions.includes(question)
              return (
                <li
                  key={question}
                  onClick={() => onToggleQuestion(question)}
                  className={`group relative flex items-center justify-between gap-3.5 rounded-xl border p-3.5 transition-all cursor-pointer ${
                    isChecked
                      ? 'border-emerald-300 bg-emerald-50/50 shadow-2xs'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all mt-0.5 ${
                        isChecked
                          ? 'border-[#2E7D32] bg-[#2E7D32] text-white shadow-2xs'
                          : 'border-slate-300 bg-white group-hover:border-slate-400'
                      }`}
                    >
                      {isChecked && <Check size={13} strokeWidth={3} />}
                    </div>
                    <span
                      className={`text-sm leading-relaxed ${
                        isChecked ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
                      }`}
                    >
                      {question}
                    </span>
                  </div>

                  <span
                    className={`shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${
                      isChecked
                        ? 'bg-emerald-100/80 border-emerald-200 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-500 group-hover:border-slate-300'
                    }`}
                  >
                    {isChecked ? 'Đã làm rõ' : 'Chưa làm rõ'}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Xác nhận cuối & hành động */}
      <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-emerald-50/40 via-white to-white p-5 sm:p-6 shadow-xs space-y-4">
        <div
          onClick={() => {
            if (canMarkComplete) {
              onIngredientsCompleteChange(!ingredientsComplete)
            }
          }}
          className={`flex items-start gap-3.5 rounded-xl border p-4 transition-all ${
            ingredientsComplete && canMarkComplete
              ? 'border-emerald-300 bg-emerald-50/60 shadow-2xs cursor-pointer'
              : canMarkComplete
              ? 'border-slate-200 bg-white hover:border-emerald-200 cursor-pointer'
              : 'border-slate-200 bg-slate-50/60 opacity-80 cursor-not-allowed'
          }`}
        >
          <div
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all mt-0.5 ${
              ingredientsComplete && canMarkComplete
                ? 'border-[#2E7D32] bg-[#2E7D32] text-white shadow-2xs'
                : 'border-slate-300 bg-white'
            }`}
          >
            {ingredientsComplete && canMarkComplete && <Check size={13} strokeWidth={3} />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900 leading-snug">
              Tôi đã xác nhận đầy đủ tất cả nguyên liệu liên quan, kể cả gia vị nêm nếm, nước dùng và thành phần ẩn.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Đánh dấu cam kết để hệ thống tính toán kết quả chính xác nhất theo từng chế độ ăn chay.
            </p>
          </div>
        </div>

        {!canMarkComplete && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 leading-relaxed">
            <AlertCircle size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span>
                Còn nguyên liệu chưa xác nhận hoặc yếu tố chưa làm rõ. Bạn vẫn có thể nhấn <strong>"Đánh giá & Lưu kết quả"</strong> ngay, hệ thống sẽ tự động xếp vào nhóm <strong>"Chưa đủ thông tin"</strong> để đảm bảo an toàn cao nhất.
              </span>
            </div>
          </div>
        )}

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={onEvaluate}
            isLoading={isSaving}
            disabled={isSaving || ingredients.some((item) => !item.name.trim())}
            leftIcon={<Sparkles size={16} />}
            className="!bg-[#2E7D32] hover:!bg-[#1B5E20] !text-white font-bold py-2.5 px-6 shadow-xs active:scale-95 transition-all text-sm"
          >
            Đánh giá & Lưu kết quả
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            leftIcon={<ArrowLeft size={14} />}
            disabled={isSaving}
            className="border-slate-300 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700 font-semibold text-sm"
          >
            Quay lại bước chọn ảnh
          </Button>
        </div>
      </div>
    </section>
  )
}
