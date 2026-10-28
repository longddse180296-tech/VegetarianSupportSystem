// Chức năng: danh mục nội dung. Hiển thị một phần giao diện và phát sự kiện cho màn hình cha xử lý.
import { useId, useState } from 'react'
import { Check, LoaderCircle } from 'lucide-react'
import { Modal } from '../../../../shared/components/Modal'
import { fieldClass, primaryClass, secondaryClass } from '../../utils/apiUi'
import type { AdminCategoryItem, CategoryFormData } from '../types/adminCategories.types'

// Cấu trúc CategoryModalProps quy định dữ liệu trao đổi trong danh mục nội dung.
interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  categoryToEdit?: AdminCategoryItem | null
  onSubmit: (data: CategoryFormData) => Promise<void>
}

// Thành phần CategoryModal nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc danh mục nội dung.
export const CategoryModal = ({
  isOpen,
  onClose,
  categoryToEdit,
  onSubmit,
}: CategoryModalProps) => {
  const formId = useId()
  // Lưu dữ liệu và trạng thái thao tác của danh mục nội dung trong vòng đời màn hình.
  const [name, setName] = useState(categoryToEdit?.name || '')
  const [description, setDescription] = useState(categoryToEdit?.description || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Hiển thị giao diện danh mục nội dung từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { if (!busy) onClose() }}
      title={categoryToEdit ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}
      description="Phân nhóm công thức để dễ tìm kiếm và quản lý."
      footer={
        <>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className={secondaryClass}
          >
            Hủy
          </button>
          <button
            type="submit"
            form={formId}
            disabled={busy || !name.trim()}
            className={`${primaryClass} inline-flex items-center justify-center gap-2`}
          >
            {busy ? (
              <LoaderCircle size={16} className="motion-safe:animate-spin" aria-hidden="true" />
            ) : (
              <Check size={16} aria-hidden="true" />
            )}
            {busy ? 'Đang lưu...' : 'Lưu danh mục'}
          </button>
        </>
      }
    >
      <form
        id={formId}
        className="admin-content-form space-y-5"
        aria-busy={busy}
        onSubmit={async event => {
          event.preventDefault()
          if (busy || !name.trim()) return
          setBusy(true)
          setError(null)
          try {
            await onSubmit({ name, description })
            onClose()
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể lưu danh mục.')
          } finally {
            setBusy(false)
          }
        }}
      >
        <label className="block text-sm font-semibold text-slate-700">
          Tên danh mục <span className="text-rose-500" aria-hidden="true">*</span>
          <input
            aria-label="Tên danh mục"
            required
            maxLength={120}
            value={name}
            onChange={event => setName(event.target.value)}
            disabled={busy}
            placeholder="Ví dụ: Món chính, món canh..."
            className={fieldClass}
          />
        </label>
        <div>
          <label className="block text-sm font-semibold text-slate-700">
            <span className="flex items-center justify-between gap-3">
              Mô tả
              <span className="text-xs font-normal text-slate-400">Không bắt buộc</span>
            </span>
            <textarea
              aria-label="Mô tả danh mục"
              maxLength={500}
              rows={3}
              value={description}
              onChange={event => setDescription(event.target.value)}
              disabled={busy}
              placeholder="Mô tả ngắn về nhóm công thức này..."
              className={`${fieldClass} resize-y font-normal`}
            />
          </label>
          <p className="mt-1.5 text-right text-xs text-slate-400">
            {description.length}/500 ký tự
          </p>
        </div>
        {error && (
          <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}
export default CategoryModal
