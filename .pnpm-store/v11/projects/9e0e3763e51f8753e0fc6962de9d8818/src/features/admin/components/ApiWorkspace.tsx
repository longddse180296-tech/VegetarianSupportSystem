import { useApiData } from '../hooks/useApiData'
import { fieldClass, secondaryClass } from '../utils/apiUi'
import { useState, type ReactNode } from 'react'
import { AdminLayout } from '../../../app/layouts/AdminLayout'
import { useAuth } from '../../auth'

export function Feedback({
  error,
  notice,
}: {
  error?: string | null
  notice?: string | null
}) {
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
        Bạn cần đăng nhập bằng tài khoản Admin.
      </p>
    )
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

export type LookupItem = { id: string; name: string; isActive?: boolean }
export function RecordPicker({
  resource,
  label,
  value,
  selectedName,
  onChange,
}: {
  resource: 'categories' | 'ingredients' | 'recipes'
  label: string
  value: string
  selectedName?: string
  onChange: (item: LookupItem) => void
}) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const result = useApiData<{ items: LookupItem[]; totalCount: number }>(
    `/api/admin/${resource}?pageNumber=${page}&pageSize=10&search=${encodeURIComponent(search)}`,
  )
  return (
    <div className="rounded-xl border border-slate-200 p-3 space-y-2">
      <label className="text-sm font-semibold">
        {label}
        <input
          aria-label={`Tìm ${label.toLowerCase()}`}
          className={fieldClass}
          value={search}
          maxLength={120}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          placeholder="Tìm theo tên..."
        />
      </label>
      <select
        aria-label={label}
        className={fieldClass}
        value={value}
        onChange={(event) => {
          const item = result.data?.items.find(
            (item) => item.id === event.target.value,
          )
          if (item) onChange(item)
        }}
      >
        <option value="">Chọn {label.toLowerCase()}</option>
        {value && !result.data?.items.some((item) => item.id === value) && (
          <option value={value}>{selectedName || value}</option>
        )}
        {result.data?.items
          .filter((item) => item.isActive || item.id === value)
          .map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
              {item.isActive === false ? ' (đã ngừng)' : ''}
            </option>
          ))}
      </select>
      {result.loading && <p className="text-xs text-slate-500">Đang tải...</p>}
      <Feedback error={result.error} />
      <Pager
        page={page}
        total={result.data?.totalCount || 0}
        onChange={setPage}
      />
    </div>
  )
}
