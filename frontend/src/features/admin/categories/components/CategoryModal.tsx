import { useState } from 'react'
import { Modal } from '../../../../shared/components/Modal'
import type { AdminCategoryItem, CategoryFormData } from '../types/adminCategories.types'

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  categoryToEdit?: AdminCategoryItem | null
  onSubmit: (data: CategoryFormData) => Promise<void>
}

export const CategoryModal = ({ isOpen, onClose, categoryToEdit, onSubmit }: CategoryModalProps) => {
  const [name, setName] = useState(categoryToEdit?.name || '')
  const [description, setDescription] = useState(categoryToEdit?.description || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return <Modal isOpen={isOpen} onClose={() => { if (!busy) onClose() }} title={categoryToEdit ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'} description="Danh mục dùng để phân nhóm công thức nấu ăn.">
    <form className="space-y-4" onSubmit={async event => {
      event.preventDefault()
      if (busy || !name.trim()) return
      setBusy(true); setError(null)
      try { await onSubmit({ name, description }); onClose() }
      catch (err) { setError(err instanceof Error ? err.message : 'Không thể lưu danh mục.') }
      finally { setBusy(false) }
    }}>
      <label className="block text-sm">Tên danh mục<input aria-label="Tên danh mục" required maxLength={120} value={name} onChange={event => setName(event.target.value)} disabled={busy} className="mt-2 w-full rounded-xl border border-slate-200 p-3" /></label>
      <label className="block text-sm">Mô tả<textarea aria-label="Mô tả danh mục" maxLength={500} value={description} onChange={event => setDescription(event.target.value)} disabled={busy} className="mt-2 w-full rounded-xl border border-slate-200 p-3" /></label>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className="rounded-xl border px-4 py-2 text-sm">Hủy</button><button type="submit" disabled={busy || !name.trim()} className="rounded-xl bg-[#184d28] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Đang lưu...' : 'Lưu danh mục'}</button></div>
    </form>
  </Modal>
}
export default CategoryModal
