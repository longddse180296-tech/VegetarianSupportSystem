import { ApiError, apiClient } from '../../../shared/api/apiClient'

export type FavoriteTargetType = 'Recipe' | 'Restaurant' | 'Video' | 'Article'

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

  return apiClient.get<FavoritePage>(`/api/favorites?${params.toString()}`)
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

export async function toggleFavorite(
  targetType: FavoriteTargetType,
  targetId: string,
  nextSaved: boolean,
): Promise<boolean> {
  if (nextSaved) {
    try {
      await apiClient.post<FavoriteItem>('/api/favorites', { targetType, targetId })
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
