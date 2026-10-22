import { apiClient } from './apiClient'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

interface PublicImageUploadResponse {
  key: string
  url: string
}

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
