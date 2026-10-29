// Chức năng: danh sách nội dung yêu thích. Giao tiếp máy chủ và chuyển dữ liệu về kiểu dùng trong tính năng.
import { ApiError, apiClient } from '../../../shared/api/apiClient'

// Cấu trúc FavoriteTargetType quy định dữ liệu trao đổi trong danh sách nội dung yêu thích.
export type FavoriteTargetType = 'Recipe' | 'Restaurant' | 'Video' | 'Article'
export type FavoriteSaveSource = 'Recipe' | 'Pantry'

// Cấu trúc FavoriteItem quy định dữ liệu trao đổi trong danh sách nội dung yêu thích.
export interface FavoriteItem {
  id: string
  targetType: FavoriteTargetType
  targetId: string
  targetName: string
  imageUrl: string | null
  durationSeconds?: number | null
  createdAt: string
  savedFrom?: FavoriteSaveSource | null
}

// Cấu trúc FavoritePage quy định dữ liệu trao đổi trong danh sách nội dung yêu thích.
export interface FavoritePage {
  items: FavoriteItem[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (listFavorites); thuộc danh sách nội dung yêu thích.
export async function listFavorites(
  targetType?: FavoriteTargetType,
  pageNumber = 1,
  pageSize = 50,
  signal?: AbortSignal,
): Promise<FavoritePage> {
  const params = new URLSearchParams()
  if (targetType) params.set('targetType', targetType)
  params.set('pageNumber', String(pageNumber))
  params.set('pageSize', String(pageSize))

  return apiClient.get<FavoritePage>(`/api/favorites?${params.toString()}`, { signal })
}

// Đọc đầy đủ mục đã lưu theo từng trang, tránh bỏ sót trạng thái khi tài khoản lưu hơn 100 công thức.
export async function listAllFavorites(targetType: FavoriteTargetType, signal?: AbortSignal): Promise<FavoriteItem[]> {
  const items: FavoriteItem[] = []
  for (let pageNumber = 1; ; pageNumber++) {
    const page = await listFavorites(targetType, pageNumber, 100, signal)
    items.push(...page.items)
    if (!page.items.length || items.length >= page.totalCount) return items
  }
}

// Ghi nhận thay đổi dữ liệu và cập nhật kết quả cho bên gọi (addFavorite); thuộc danh sách nội dung yêu thích.
export async function addFavorite(
  targetType: FavoriteTargetType,
  targetId: string,
): Promise<FavoriteItem | null> {
  try {
    return await apiClient.post<FavoriteItem>('/api/favorites', {
      targetType,
      targetId,
    })
  } catch {
    return null
  }
}

// Xóa mục được chọn theo phạm vi và điều kiện của tính năng (removeFavorite); thuộc danh sách nội dung yêu thích.
export async function removeFavorite(id: string): Promise<boolean> {
  try {
    await apiClient.delete(`/api/favorites/${id}`)
    return true
  } catch {
    return false
  }
}

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (findFavorite); thuộc danh sách nội dung yêu thích.
export async function findFavorite(
  targetType: FavoriteTargetType,
  targetId: string,
): Promise<FavoriteItem | null> {
  for (let pageNumber = 1; ; pageNumber += 1) {
    const page = await listFavorites(targetType, pageNumber, 100)
    const favorite = page.items.find(
      (item) => item.targetId.toLowerCase() === targetId.toLowerCase(),
    )
    if (favorite) return favorite
    if (page.items.length === 0 || pageNumber * page.pageSize >= page.totalCount) return null
  }
}

// Xử lý lựa chọn hoặc chuyển trạng thái giao diện theo thao tác người dùng (toggleFavorite); thuộc danh sách nội dung yêu thích.
export async function toggleFavorite(
  targetType: FavoriteTargetType,
  targetId: string,
  nextSaved: boolean,
  savedFrom?: FavoriteSaveSource,
): Promise<boolean> {
  if (nextSaved) {
    try {
      await apiClient.post<FavoriteItem>('/api/favorites', { targetType, targetId, savedFrom })
    } catch (reason) {
      if (!(reason instanceof ApiError && reason.status === 409 && await findFavorite(targetType, targetId))) {
        throw reason
      }
    }
    return true
  }

  const existing = await findFavorite(targetType, targetId)
  if (existing) await apiClient.delete(`/api/favorites/${encodeURIComponent(existing.id)}`)
  return false
}
