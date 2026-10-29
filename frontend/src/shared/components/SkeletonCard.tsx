// Chức năng: giao diện và thành phần dùng chung. Hiển thị một phần giao diện và phát sự kiện cho màn hình cha xử lý.
import React from 'react'

// Cấu trúc SkeletonCardProps quy định dữ liệu trao đổi trong giao diện và thành phần dùng chung.
export interface SkeletonCardProps {
  className?: string
}

// Thành phần SkeletonCard nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc giao diện và thành phần dùng chung.
export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = '' }) => {
  // Hiển thị thành phần giao diện dùng chung từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs animate-pulse flex flex-col ${className}`}
      aria-hidden="true"
    >
      {/* Box ảnh màu xám nhấp nháy animate-pulse */}
      <div className="h-44 w-full rounded-xl bg-slate-200" />
      {/* 2 dòng text xám bên dưới */}
      <div className="mt-4 space-y-2.5">
        <div className="h-4 w-3/4 rounded bg-slate-200" />
        <div className="h-3.5 w-1/2 rounded bg-slate-200/70" />
      </div>
    </div>
  )
}

export default SkeletonCard
