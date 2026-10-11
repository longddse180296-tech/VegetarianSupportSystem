import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  Button,
  Input,
  Modal,
  Select,
  type SelectOption,
} from '../../../shared/components'
import type { AddIngredientFormState, PantryCategory } from '../types/pantry.types'
import { DEFAULT_UNITS } from '../types/pantry.types'

interface AddIngredientModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (form: AddIngredientFormState) => Promise<void> | void
  submitting?: boolean
}

const INITIAL_FORM: AddIngredientFormState = {
  name: '',
  quantity: '',
  unit: 'g',
  category: '',
}

const UNIT_OPTIONS: SelectOption[] = DEFAULT_UNITS.map((u) => ({ value: u, label: u }))

export const AddIngredientModal: React.FC<AddIngredientModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  submitting = false,
}) => {
  const [form, setForm] = useState<AddIngredientFormState>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof AddIngredientFormState, string>>>({})

  const updateField = <K extends keyof AddIngredientFormState>(
    key: K,
    value: AddIngredientFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = (): boolean => {
    const next: Partial<Record<keyof AddIngredientFormState, string>> = {}
    if (!form.name.trim()) next.name = 'Vui lòng nhập tên nguyên liệu'
    else if (form.name.trim().length < 2) next.name = 'Tên tối thiểu 2 ký tự'
    if (form.quantity !== '' && Number.isNaN(Number(form.quantity)))
      next.quantity = 'Số lượng phải là số'
    if (!form.category) next.category = 'Vui lòng chọn danh mục'
    if (!form.unit.trim()) next.unit = 'Vui lòng chọn đơn vị'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
      })
      setForm(INITIAL_FORM)
      setErrors({})
      onClose()
    } catch {
      // Keep open on unexpected error
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (submitting) return
        onClose()
      }}
      maxWidth="md"
      title={
        <span className="flex items-center gap-2">
          <Plus size={18} className="text-[#2e7d32]" />
          Thêm nguyên liệu vào Tủ bếp AI
        </span>
      }
      description="Nhập đầy đủ tên, số lượng và danh mục nguyên liệu. Hệ thống sẽ tự phân tích mức độ phù hợp với chế độ thuần thực vật dựa trên tên gọi."
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="primary"
            isLoading={submitting}
            onClick={handleSubmit}
            leftIcon={<Plus size={14} />}
          >
            Lưu
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            label="Tên nguyên liệu"
            name="tên nguyên liệu"
            required
            placeholder="VD: Đậu phụ non"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            error={errors.name}
            helperText="Hãy nhập tiếng Việt có dấu để hệ thống phân tích tốt hơn."
            autoFocus
          />
        </div>
        <div>
          <Input
            label="Số lượng (gam)"
            name="số lượng gam"
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="VD: 300"
            value={form.quantity}
            onChange={(e) => updateField('quantity', e.target.value)}
            error={errors.quantity}
            helperText="Bỏ trống để nhập sau."
          />
        </div>
        <div>
          <Select
            label="Đơn vị"
            required
            value={form.unit}
            onChange={(e) => updateField('unit', e.target.value)}
            error={errors.unit}
            options={UNIT_OPTIONS}
          />
        </div>
        <div className="sm:col-span-2">
          <Select
            label="Danh mục"
            required
            value={form.category}
            onChange={(e) =>
              updateField('category', e.target.value as PantryCategory | '')
            }
            error={errors.category}
            options={[
              { value: 'rau', label: 'Rau củ' },
              { value: 'trai-cay', label: 'Trái cây' },
              { value: 'ngu-coc', label: 'Ngũ cốc' },
              { value: 'dau-pham', label: 'Đậu phụ & sản phẩm từ đậu nành' },
              { value: 'gia-vi', label: 'Gia vị' },
              { value: 'khac', label: 'Khác' },
            ]}
          />
        </div>
      </div>

      <div className="mt-5 rounded-[12px] border border-[#c8e6c9] bg-[#e8f5e9]/60 p-3 text-xs leading-5 text-[#1f2937]">
        <strong>Lưu ý:</strong> Độ phù hợp dựa trên tên gọi thông thường, không thay cho đọc nhãn
        thành phần thực tế. Nếu sản phẩm có phụ gia E-number, hãy kiểm tra thêm trước khi sử dụng.
      </div>
    </Modal>
  )
}

export default AddIngredientModal
