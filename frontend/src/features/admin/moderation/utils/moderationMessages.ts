// Chuẩn hóa cách gọi trong thông báo kiểm duyệt, kể cả kết quả cũ; không đổi mã trạng thái hoặc dữ liệu lưu trữ.
export function formatSystemReviewMessage(message: string | null | undefined): string {
  return (message || '')
    .replace(/\b(?:AI|Gemini)\b/g, 'Hệ thống')
    .replace(/\bAdmin\b/g, 'Quản trị viên')
    .replace(/hệ thống\s+hệ thống/giu, 'Hệ thống')
}
