import React from 'react'

export interface ColumnDef<T> {
  key: string
  header: string
  render?: (item: T, index: number) => React.ReactNode
  align?: 'left' | 'center' | 'right'
  className?: string
}

export interface SharedDataTableProps<T> {
  title?: string
  totalCountBadge?: number | string
  updatedAtText?: string
  columns: ColumnDef<T>[]
  data: T[]
  keyExtractor: (item: T, index: number) => string
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  emptyMessage?: string
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  actionsHeader?: React.ReactNode
}

export function SharedDataTable<T>({
  title,
  totalCountBadge,
  updatedAtText,
  columns,
  data,
  keyExtractor,
  isLoading = false,
  error = null,
  onRetry,
  emptyMessage = 'Không có dữ liệu hiển thị.',
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  actionsHeader,
}: SharedDataTableProps<T>) {
  // Generate pagination page list with ellipses
  const pages: (number | string)[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  const startIdx = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const endIdx = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      {/* Table Header Bar */}
      {(title || updatedAtText || actionsHeader) && (
        <div className="p-6 pb-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {title && <h3 className="text-base font-bold text-gray-900">{title}</h3>}
            {totalCountBadge !== undefined && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                {typeof totalCountBadge === 'number' ? `${totalCountBadge} mục` : totalCountBadge}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {updatedAtText && (
              <span className="text-xs text-gray-400">
                🕒 {updatedAtText}
              </span>
            )}
            {actionsHeader}
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-3.5 px-6 text-[11px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap ${
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                  } ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
            {isLoading && (
              <>
                {Array.from({ length: pageSize || 5 }).map((_, rIdx) => (
                  <tr key={`skel-${rIdx}`} className="animate-pulse">
                    {columns.map((_, cIdx) => (
                      <td key={`skel-c-${cIdx}`} className="py-4 px-6">
                        <div className="h-4 bg-gray-200 rounded-md w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            )}

            {!isLoading && error && (
              <tr>
                <td colSpan={columns.length} className="py-12 px-6 text-center text-red-600">
                  <p className="font-semibold mb-2">Đã xảy ra lỗi khi tải dữ liệu</p>
                  <p className="text-xs text-red-500 mb-4">{error}</p>
                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition-colors"
                    >
                      Thử lại
                    </button>
                  )}
                </td>
              </tr>
            )}

            {!isLoading && !error && data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-16 px-6 text-center text-gray-400">
                  <div className="text-3xl mb-2">📋</div>
                  <p className="text-xs font-medium text-gray-600">{emptyMessage}</p>
                </td>
              </tr>
            )}

            {!isLoading &&
              !error &&
              data.map((item, rowIdx) => (
                <tr
                  key={keyExtractor(item, rowIdx)}
                  className="hover:bg-slate-50/60 transition-colors group"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-4 px-6 ${
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                          ? 'text-right'
                          : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {col.render
                        ? col.render(item, rowIdx)
                        : (item as Record<string, unknown>)[col.key] !== undefined
                        ? String((item as Record<string, unknown>)[col.key])
                        : null}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && !error && totalItems > 0 && (
        <div className="p-5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500">
          <div>
            Hiển thị <strong>{startIdx}</strong> - <strong>{endIdx}</strong> trong số{' '}
            <strong>{totalItems}</strong> mục
          </div>

          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              &lt; Trước
            </button>

            {pages.map((p, idx) => {
              if (typeof p === 'string') {
                return (
                  <span key={`dots-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400">
                    ...
                  </span>
                )
              }
              const isActive = p === currentPage
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`w-8 h-8 rounded-xl font-bold text-xs transition-all ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              )
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Sau &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
