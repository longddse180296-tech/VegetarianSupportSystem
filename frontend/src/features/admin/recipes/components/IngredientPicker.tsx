// Chức năng: công thức và định lượng nguyên liệu. Hiển thị một phần giao diện và phát sự kiện cho màn hình cha xử lý.
import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { apiClient } from '../../../../shared/api/apiClient'
import type { RecipeIngredientOption } from '../api/recipeNutrition'
import { errorMessage, fieldClass } from '../../utils/apiUi'

// Cấu trúc IngredientPage quy định dữ liệu trao đổi trong công thức và định lượng nguyên liệu.
type IngredientPage = { items: RecipeIngredientOption[]; totalCount: number }

// Thành phần IngredientPicker nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc công thức và định lượng nguyên liệu.
export function IngredientPicker({ label, value, selectedName, onChange }: {
  label: string
  value: string
  selectedName?: string
  onChange: (item: RecipeIngredientOption) => void
}) {
  const id = useId()
  // Giữ tham chiếu giữa các lần render để quản lý yêu cầu hoặc phần tử giao diện.
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const searchInput = useRef<HTMLInputElement>(null)
  // Lưu dữ liệu và trạng thái thao tác của công thức và định lượng nguyên liệu trong vòng đời màn hình.
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<RecipeIngredientOption[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)

  // Đăng ký sự kiện phục vụ màn hình và dọn bộ lắng nghe khi không còn sử dụng.
  useEffect(() => {
    if (!open) return
    searchInput.current?.focus()
    // Khôi phục hoặc kết thúc trạng thái thao tác hiện tại (closeOutside); thuộc công thức và định lượng nguyên liệu.
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [open])

  // Đồng bộ dữ liệu theo thay đổi đầu vào; hủy hoặc bỏ qua kết quả cũ khi màn hình thay đổi.
  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      apiClient.get<IngredientPage>(
        `/api/ingredients?pageNumber=${page}&pageSize=10&search=${encodeURIComponent(search.trim())}`,
        { signal: controller.signal },
      ).then(result => {
        if (controller.signal.aborted) return
        setItems(current => page === 1 ? result.items : [
          ...current, ...result.items.filter(item => !current.some(existing => existing.id === item.id)),
        ])
        setTotal(result.totalCount)
      }).catch(reason => {
        if (!controller.signal.aborted) setError(errorMessage(reason))
      }).finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    }, 200)
    return () => { clearTimeout(timer); controller.abort() }
  }, [open, search, page, revision])

  // Thử lại việc lấy dữ liệu và đồng bộ trạng thái hiển thị (refresh); thuộc công thức và định lượng nguyên liệu.
  function refresh() {
    setItems([])
    setTotal(0)
    setPage(1)
    setLoading(true)
    setError(null)
    setRevision(current => current + 1)
  }

  // Hiển thị giao diện công thức và định lượng nguyên liệu từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <div ref={root} className="min-w-0 space-y-2" onKeyDown={event => {
      if (event.key === 'Escape' && open) {
        event.stopPropagation()
        setOpen(false)
        trigger.current?.focus()
      }
      if (open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        const options = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [])
        if (!options.length) return
        event.preventDefault()
        const current = options.indexOf(document.activeElement as HTMLButtonElement)
        options[(current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length]?.focus()
      }
    }}>
      <label id={`${id}-label`} className="block text-sm font-semibold text-slate-700">{label}</label>
      <button ref={trigger} type="button" aria-labelledby={`${id}-label ${id}-value`}
        aria-expanded={open} aria-controls={`${id}-panel`} aria-haspopup="dialog"
        className={`${fieldClass} !mt-0 flex min-h-11 items-center justify-between gap-2 text-left`}
        onClick={() => { if (!open) refresh(); setOpen(current => !current) }}>
        <span id={`${id}-value`} className="min-w-0 break-words">{selectedName || `Chọn ${label.toLowerCase()}`}</span>
        <ChevronDown size={16} className="shrink-0" aria-hidden="true" />
      </button>
      {open && (
        <div id={`${id}-panel`} role="dialog" aria-labelledby={`${id}-label`}
          className="rounded-xl border border-emerald-200 bg-white p-2 shadow-sm">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-3.5 text-slate-400" aria-hidden="true" />
            <input ref={searchInput} aria-label={`Tìm ${label.toLowerCase()}`} placeholder="Tìm tên nguyên liệu..."
              className={`${fieldClass} !mt-0 !pl-9`} maxLength={120} value={search}
              onChange={event => { setSearch(event.target.value); refresh() }} />
          </div>
          <div role="listbox" aria-label={label} aria-busy={loading}
            className="mt-2 max-h-[min(18rem,40dvh)] overflow-y-auto overscroll-contain">
            {items.map(item => (
              <button key={item.id} type="button" role="option" aria-selected={value === item.id}
                className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-emerald-600 ${value === item.id ? 'bg-emerald-50 font-semibold text-emerald-800' : 'text-slate-700'}`}
                onClick={() => { onChange(item); setOpen(false); trigger.current?.focus() }}>
                <span className="min-w-0 break-words">{item.name}</span>
                {value === item.id && <Check size={16} className="shrink-0" aria-hidden="true" />}
              </button>
            ))}
          </div>
          {loading && <p role="status" className="p-2 text-sm text-slate-500">Đang tải nguyên liệu...</p>}
          {error && <div role="alert" className="p-2 text-sm text-rose-700">{error} <button type="button" className="underline" onClick={() => { setError(null); setLoading(true); setRevision(current => current + 1) }}>Thử lại</button></div>}
          {!loading && !error && items.length === 0 && (
            <p role="status" className="p-2 text-sm text-slate-600">Không tìm thấy nguyên liệu đang hoạt động. Hãy thêm nguyên liệu trong trang quản lý, rồi quay lại và bấm Làm mới.</p>
          )}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs">
            <span aria-live="polite">Đã hiển thị {items.length}/{total} nguyên liệu</span>
            {items.length < total && !error && <button type="button" disabled={loading}
              className="min-h-11 rounded-lg px-3 font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
              onClick={() => { setLoading(true); setPage(current => current + 1) }}>Xem thêm</button>}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-sm">
            <a href={`/admin/ingredients?create=1&name=${encodeURIComponent(search.trim())}`}
              className="inline-flex min-h-11 items-center font-semibold text-emerald-800 underline">Thêm nguyên liệu mới</a>
            <button type="button" disabled={loading} className="min-h-11 px-3 text-emerald-800 underline disabled:opacity-50" onClick={refresh}>Làm mới</button>
          </div>
        </div>
      )}
    </div>
  )
}
