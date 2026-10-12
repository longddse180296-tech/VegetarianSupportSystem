import { apiClient } from '../../../shared/api/apiClient'

export type FavoriteTargetType = 'Recipe' | 'Restaurant' | 'Video'

export interface FavoriteItem {
  id: string
  targetType: FavoriteTargetType
  targetId: string
  targetName: string
  imageUrl: string | null
  createdAt: string
}

export interface FavoritePage {
  items: FavoriteItem[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

export async function listFavorites(
  targetType?: FavoriteTargetType,
  pageNumber = 1,
  pageSize = 50,
): Promise<FavoritePage> {
  const params = new URLSearchParams()
  if (targetType) params.set('targetType', targetType)
  params.set('pageNumber', String(pageNumber))
  params.set('pageSize', String(pageSize))

  try {
    return await apiClient.get<FavoritePage>(`/api/favorites?${params.toString()}`)
  } catch {
    return {
      items: [],
      totalCount: 0,
      pageNumber,
      pageSize,
    }
  }
}

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

export async function removeFavorite(id: string): Promise<boolean> {
  try {
    await apiClient.delete(`/api/favorites/${id}`)
    return true
  } catch {
    return false
  }
}
