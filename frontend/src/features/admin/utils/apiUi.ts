// Chức năng: giao diện và thành phần dùng chung. Cấu hình hoặc hỗ trợ luồng xử lý của các thành phần trong ứng dụng.
export const fieldClass =
  'admin-field mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm disabled:bg-slate-50'
export const primaryClass =
  'fe1-btn fe1-btn-primary rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white enabled:hover:bg-primary-hover disabled:opacity-50'
export const secondaryClass =
  'fe1-btn fe1-btn-outline rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold enabled:hover:border-primary enabled:hover:text-primary disabled:opacity-50'
// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (errorMessage); thuộc giao diện và thành phần dùng chung.
export const errorMessage = (error: unknown) => {
  if (!(error instanceof Error)) return 'Không thể hoàn tất yêu cầu.'
  // Lỗi kết nối/SignalR thường phát sinh ở trình duyệt trước HTTP, không đưa nguyên văn chi tiết kỹ thuật lên form.
  if (/Failed to fetch|NetworkError|Load failed|Failed to complete negotiation|Failed to start the connection|Server timeout|WebSocket.*(?:closed|failed)|connection.*(?:closed|stopped)/i.test(error.message))
    return 'Kết nối đến dịch vụ bị gián đoạn. Vui lòng kiểm tra mạng rồi thử lại.'
  return error.message
}
// Chuẩn hóa hoặc chuyển đổi dữ liệu giữa các bước xử lý (formatDate); thuộc giao diện và thành phần dùng chung.
export const formatDate = (date?: string | null) =>
  date ? new Date(date).toLocaleString('vi-VN') : '—'
