// Chức năng: giao diện và thành phần dùng chung. Hiển thị một phần giao diện và phát sự kiện cho màn hình cha xử lý.
import { useApiData } from '../hooks/useApiData'
import { fieldClass, secondaryClass } from '../utils/apiUi'
import { useState, type ReactNode } from 'react'
import { AdminLayout } from '../../../app/layouts/AdminLayout'
import { Select } from '../../../shared/components/Select'
import { useAuth } from '../../auth'

// Thành phần Feedback nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc giao diện và thành phần dùng chung.
export function Feedback({
  error,
  notice,
}: {
  error?: string | null
  notice?: string | null
}) {
  // Hiển thị thành phần giao diện dùng chung từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}
    </>
  )
}

// Thành phần AdminFrame nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc giao diện và thành phần dùng chung.
export function AdminFrame({
  menu,
  title,
  subtitle,
  onNavigate,
  children,
}: {
  menu: string
  title: string
  subtitle: string
  onNavigate?: (path: string) => void
  children: ReactNode
}) {
  const { isAdmin, isLoading } = useAuth()
  if (isLoading) return <p className="p-8">Đang kiểm tra phiên quản trị...</p>
  if (!isAdmin)
    return (
      <p role="alert" className="p-8 text-rose-800">
        Bạn cần đăng nhập bằng tài khoản Quản trị viên.
      </p>
    )
  // Hiển thị thành phần giao diện dùng chung từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <AdminLayout
      activeMenu={menu}
      pageTitle={title}
      pageSubtitle={subtitle}
      onNavigate={onNavigate}
    >
      <div className="space-y-5">{children}</div>
    </AdminLayout>
  )
}

// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (Pager); thuộc giao diện và thành phần dùng chung.
export function Pager({
  page,
  total,
  pageSize = 10,
  onChange,
}: {
  page: number
  total: number
  pageSize?: number
  onChange: (page: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  // Hiển thị thành phần giao diện dùng chung từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <span>
        {total} kết quả · Trang {page}/{pages}
      </span>
      <div className="flex gap-2">
        <button
          className={secondaryClass}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Trước
        </button>
        <button
          className={secondaryClass}
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          Sau
        </button>
      </div>
    </div>
  )
}

// Cấu trúc LookupItem quy định dữ liệu trao đổi trong giao diện và thành phần dùng chung.
export type LookupItem = {
  id: string
  name: string
  isActive?: boolean
  defaultUnit?: string | null
}
// Thành phần RecordPicker nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc giao diện và thành phần dùng chung.
export function RecordPicker({
  resource,
  label,
  value,
  selectedName,
  hideSearch,
  required = false,
  onChange,
}: {
  resource: 'categories' | 'ingredients' | 'recipes'
  label: string
  value: string
  selectedName?: string
  hideSearch?: boolean
  required?: boolean
  onChange: (item: LookupItem) => void
}) {
  // Lưu dữ liệu và trạng thái thao tác của giao diện và thành phần dùng chung trong vòng đời màn hình.
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = hideSearch ? 100 : 10
  const result = useApiData<{ items: LookupItem[]; totalCount: number }>(
    `/api/admin/${resource}?pageNumber=${page}&pageSize=${pageSize}&search=${encodeURIComponent(hideSearch ? '' : search)}`,
  )
  // Hiển thị thành phần giao diện dùng chung từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <div className="admin-record-picker space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-700">{label}{required && <span className="text-rose-500" aria-hidden="true"> *</span>}</span>
        {result.loading && <span role="status" className="text-xs text-slate-400">Đang tìm...</span>}
      </div>
      <div className={hideSearch ? 'w-full' : 'grid gap-2.5 sm:grid-cols-2'}>
        {!hideSearch && (
          <input
            aria-label={`Tìm ${label.toLowerCase()}`}
            className={`${fieldClass} mt-0`}
            value={search}
            maxLength={120}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Tìm theo tên..."
          />
        )}
        <Select
          aria-label={label}
          required={required}
          className="!h-[46px]"
          value={value}
          onChange={(event) => {
            const item = result.data?.items.find(
              (item) => item.id === event.target.value,
            )
            if (item) onChange(item)
          }}
          options={[
            { value: '', label: `Chọn ${label.toLowerCase()}` },
            ...(value && !result.data?.items.some((item) => item.id === value)
              ? [{ value, label: selectedName || value }]
              : []),
            ...(result.data?.items || [])
              .filter((item) => item.isActive || item.id === value)
              .map((item) => ({
                value: item.id,
                label: `${item.name}${item.isActive === false ? ' (đã ngừng)' : ''}`,
              })),
          ]}
        />
      </div>
      <Feedback error={result.error} />
      {!hideSearch && (result.data?.totalCount ?? 0) > 10 && <Pager
        page={page}
        total={result.data?.totalCount || 0}
        onChange={setPage}
      />}
    </div>
  )
}
