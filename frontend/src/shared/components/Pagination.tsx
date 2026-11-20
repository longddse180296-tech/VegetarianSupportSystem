// Chức năng: giao diện và thành phần dùng chung. Hiển thị một phần giao diện và phát sự kiện cho màn hình cha xử lý.
import React from 'react'

// Cấu trúc PaginationProps quy định dữ liệu trao đổi trong giao diện và thành phần dùng chung.
export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

// Thành phần Pagination nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc giao diện và thành phần dùng chung.
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null

  const safePage = Math.max(1, Math.min(currentPage, totalPages))
  const pages: (number | string)[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= safePage - 1 && i <= safePage + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  // Hiển thị thành phần giao diện dùng chung từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <div className={`flex items-center justify-center gap-2 pt-6 ${className}`}>
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, safePage - 1))}
        disabled={safePage === 1}
        className="flex h-9 items-center gap-1 rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition disabled:opacity-40 hover:bg-slate-50 disabled:hover:bg-white cursor-pointer disabled:cursor-not-allowed"
      >
        &lt; Trước
      </button>

      {pages.map((p, idx) => {
        if (typeof p === 'string') {
          return (
            <span
              key={`dots-${idx}`}
              className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm"
            >
              ...
            </span>
          )
        }
        const active = p === safePage
        return (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`w-9 h-9 flex items-center justify-center rounded-[10px] text-[13px] transition cursor-pointer ${
              active
                ? 'bg-[#2E7D32] text-white font-bold shadow-xs'
                : 'border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50'
            }`}
          >
            {p}
          </button>
        )
      })}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
        disabled={safePage === totalPages}
        className="flex h-9 items-center gap-1 rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition disabled:opacity-40 hover:bg-slate-50 disabled:hover:bg-white cursor-pointer disabled:cursor-not-allowed"
      >
        Sau &gt;
      </button>
    </div>
  )
}

export default Pagination

