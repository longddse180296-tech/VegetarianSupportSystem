// Chức năng: giao diện và thành phần dùng chung. Giao tiếp máy chủ và chuyển dữ liệu về kiểu dùng trong tính năng.
import { apiClient } from './apiClient'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

// Cấu trúc PublicImageUploadResponse quy định dữ liệu trao đổi trong giao diện và thành phần dùng chung.
interface PublicImageUploadResponse {
  key: string
  url: string
}

// Kiểm tra và tải tệp phục vụ nội dung đang chỉnh sửa (uploadPublicImage); thuộc giao diện và thành phần dùng chung.
export async function uploadPublicImage(file: File): Promise<string> {
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    throw new Error('Ảnh phải có dung lượng từ 1 byte đến 10 MB.')
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Chỉ nhận ảnh JPG, PNG hoặc WEBP.')
  }

  const body = new FormData()
  body.set('image', file)
  const response = await apiClient.request<PublicImageUploadResponse>('/api/me/images', {
    method: 'POST',
    body,
  })
  return response.url
}
