import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
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
    <section className="space-y-5">
      <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
        <h2 className="text-lg font-bold text-[#1f2937]">Xác nhận thông tin từ BE</h2>
        <p className="mt-1 text-sm text-[#6b7280]">
          AI/OCR chỉ gợi ý. Hãy sửa thông tin sai, chọn loại nguyên liệu và bổ sung phần ảnh không chứng minh được.
        </p>
        {analysis.sourceType === 'Dish' ? (
          <div className="mt-4 rounded-xl bg-[#e8f5e9] p-4">
            <p className="text-xs font-bold text-[#2e7d32]">Tên món AI gợi ý</p>
            <p className="mt-1 font-semibold">{analysis.data.suggestedDishName || 'Chưa nhận diện được tên món'}</p>
            <p className="mt-2 text-xs text-[#6b7280]">{analysis.data.note}</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-semibold" htmlFor="corrected-label-text">
              Chữ OCR trên nhãn — sửa lại trước khi đánh giá
            </label>
            <textarea
              id="corrected-label-text"
              rows={6}
              maxLength={10000}
              className="w-full rounded-xl border border-[#e5e7eb] p-3 text-sm"
              value={correctedLabelText}
              onChange={(event) => onCorrectedLabelTextChange(event.target.value)}
              placeholder="Nhập lại phần thành phần đọc được trên nhãn"
            />
            <Button type="button" variant="outline" size="sm" onClick={onParseLabel}>
              Cập nhật danh sách nguyên liệu từ chữ đã sửa
            </Button>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={labelIncomplete}
                onChange={(event) => onLabelIncompleteChange(event.target.checked)}
                className="mt-1"
              />
              <span>Nhãn vẫn bị cắt, mờ hoặc thiếu phần thành phần</span>
            </label>
            {analysis.data.isIncomplete && (
              <p className="text-xs text-amber-800">BE đánh dấu ảnh nhãn ban đầu chưa đọc đủ. Chỉ bỏ dấu thiếu khi bạn đã kiểm tra và bổ sung được phần còn lại.</p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold">Nguyên liệu để BE đánh giá</h3>
            <p className="mt-1 text-xs text-[#6b7280]">AI/OCR chỉ gợi ý. Bạn có thể sửa tên, đổi loại, xóa hoặc thêm nguyên liệu trước khi BE đánh giá.</p>
          </div>
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
          >
            Thêm
          </Button>
        </div>

        {ingredients.length === 0 && (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            Chưa có nguyên liệu. Bạn có thể thêm thủ công; BE sẽ trả “chưa đủ thông tin” nếu không có dữ kiện xác nhận.
          </p>
        )}
        <div className="mt-4 space-y-3">
          {ingredients.map((item) => (
            <div key={item.id} className="rounded-xl border border-[#e5e7eb] p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_10rem_auto]">
                <input
                  aria-label="Tên nguyên liệu"
                  maxLength={200}
                  value={item.name}
                  onChange={(event) => updateIngredient(item.id, { name: event.target.value })}
                  className="min-w-0 rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm"
                  placeholder="Tên nguyên liệu"
                />
                <select
                  aria-label={`Loại của ${item.name || 'nguyên liệu'}`}
                  value={item.kind}
                  onChange={(event) => updateIngredient(item.id, { kind: event.target.value as IngredientKind })}
                  className="rounded-lg border border-[#e5e7eb] px-2 py-2 text-sm"
                >
                  {Object.entries(INGREDIENT_KIND_LABELS).map(([kind, label]) => (
                    <option key={kind} value={kind}>{label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  aria-label={`Xóa ${item.name || 'nguyên liệu'}`}
                  onClick={() => onIngredientsChange(ingredients.filter((entry) => entry.id !== item.id))}
                  className="rounded-lg px-2 text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>{INGREDIENT_SOURCE_LABELS[item.source]}</span>
                {(item.source === 'AiSuggested' || item.source === 'LabelOcr') && (
                  <button
                    type="button"
                    className="font-bold text-[#2e7d32] underline"
                    onClick={() => onIngredientsChange(ingredients.map((entry) =>
                      entry.id === item.id ? { ...entry, source: 'UserConfirmed' } : entry,
                    ))}
                  >
                    Đúng, xác nhận nguyên liệu này
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {questions.length > 0 && (
        <div className="rounded-[16px] border border-amber-200 bg-amber-50 p-5 shadow-xs">
          <h3 className="font-bold text-amber-900">Yếu tố BE chưa xác định từ ảnh</h3>
          <p className="mt-1 text-xs text-amber-900">Đánh dấu đã làm rõ sau khi xác nhận thông tin và thêm nguyên liệu liên quan ở trên. Mục chưa rõ sẽ được lưu vào kết quả.</p>
          <ul className="mt-3 space-y-3">
            {questions.map((question) => (
              <li key={question}>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={resolvedQuestions.includes(question)}
                    onChange={() => onToggleQuestion(question)}
                    className="mt-1"
                  />
                  <span>{question}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
        <label className="flex items-start gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={ingredientsComplete && canMarkComplete}
            disabled={!canMarkComplete}
            onChange={(event) => onIngredientsCompleteChange(event.target.checked)}
            className="mt-1"
          />
          <span>Tôi đã xác nhận đầy đủ nguyên liệu liên quan, kể cả gia vị, nước dùng và thành phần ẩn.</span>
        </label>
        {!canMarkComplete && (
          <p className="mt-2 text-xs text-amber-800">
            Còn gợi ý chưa xác nhận, nguyên liệu chưa rõ, câu hỏi chưa giải đáp hoặc nhãn còn thiếu. Bạn vẫn có thể lưu kết quả “chưa đủ thông tin”.
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="button" onClick={onEvaluate} isLoading={isSaving} disabled={isSaving || ingredients.some((item) => !item.name.trim())}>
            Đánh giá và lưu kết quả
          </Button>
          <Button type="button" variant="outline" onClick={onBack} leftIcon={<ArrowLeft size={14} />} disabled={isSaving}>
            Quay lại ảnh
          </Button>
        </div>
      </div>
    </section>
  )
}
