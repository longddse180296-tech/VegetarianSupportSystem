import { apiClient, ApiError, getStoredToken } from '../../../shared/api/apiClient'
import type { PlanDiet, PlanPage, PlanShoppingItem, ReplacementRecipe, SavedPlan, SavedPlanMeal, SavedPlanSummary } from '../types/mealPlanBackend.types'

export const PLAN_DIET_LABELS: Record<PlanDiet, string> = {
  Vegan: 'Thuần chay (Vegan)', Lacto: 'Chay có sữa (Lacto)',
  Ovo: 'Chay có trứng (Ovo)', LactoOvo: 'Chay có trứng và sữa (Lacto-ovo)',
}

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function addPlanDays(date: string, count: number): string {
  const result = new Date(`${date}T12:00:00`)
  result.setDate(result.getDate() + count)
  return localDate(result)
}

export function nextMonday(): string {
  const today = new Date()
  today.setDate(today.getDate() + ((8 - today.getDay()) % 7 || 7))
  return localDate(today)
}

export function formatPlanDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('vi-VN')
}

export function mealNutrition(value: number | null, servings: number): string {
  return value === null ? 'Chưa có dữ liệu' : new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value * servings)
}

export const mealPlanApi = {
  list: (page = 1, signal?: AbortSignal) => apiClient.get<PlanPage>(`/api/meal-plans?page=${page}&pageSize=100`, { signal }),
  async listAll(signal?: AbortSignal): Promise<SavedPlanSummary[]> {
    const items: SavedPlanSummary[] = []
    for (let page = 1; ; page += 1) {
      const result = await mealPlanApi.list(page, signal)
      items.push(...result.items)
      if (items.length >= result.totalCount || result.items.length === 0) return items
    }
  },
  get: (id: string, signal?: AbortSignal) => apiClient.get<SavedPlan>(`/api/meal-plans/${encodeURIComponent(id)}`, { signal }),
  remove: (id: string) => apiClient.delete<void>(`/api/meal-plans/${encodeURIComponent(id)}`),
  generate: (name: string, weekStartDate: string) => apiClient.post<SavedPlan>('/api/meal-plans/generate', { name, weekStartDate }),
  regenerate: (id: string) => apiClient.post<SavedPlan>(`/api/meal-plans/${id}/regenerate`),
  applyToWeek: (id: string, weekStartDate: string) => apiClient.post<SavedPlan>(`/api/meal-plans/${id}/apply-to-week`, { weekStartDate }),
  replace: (planId: string, meal: SavedPlanMeal, recipeId: string, servings: number) =>
    apiClient.put<SavedPlan>(`/api/meal-plans/${planId}/meals/${meal.dayNumber}/${meal.slot}`, { recipeId, servings }),
  shoppingList: (planId: string, day?: number, signal?: AbortSignal) => apiClient.get<PlanShoppingItem[]>(`/api/meal-plans/${planId}/shopping-list${day ? `?day=${day}` : ''}`, { signal }),
  purchase: (planId: string, itemId: string, isPurchased: boolean) =>
    apiClient.put<PlanShoppingItem[]>(`/api/meal-plans/${planId}/shopping-list/${itemId}/purchase`, { isPurchased }),
  // The saved allergy/avoidance constraints are validated by the backend on replacement.
  recipes: (diet: PlanDiet, search = '', page = 1, signal?: AbortSignal) => {
    const dietaryType = { Vegan: 1, Lacto: 2, Ovo: 3, LactoOvo: 4 }[diet]
    const query = new URLSearchParams({ dietaryType: String(dietaryType), search, pageNumber: String(page), pageSize: '12' })
    return apiClient.get<{ items: ReplacementRecipe[]; totalCount: number }>(`/api/recipes?${query}`, { requiresAuth: false, signal })
  },
  async pdf(id: string): Promise<void> {
    const token = getStoredToken()
    let response: Response
    try {
      response = await fetch(`/api/meal-plans/${id}/pdf`, { headers: { Accept: 'application/pdf', ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
    } catch { throw new Error('Không thể kết nối để tải PDF. Vui lòng thử lại.') }
    if (!response.ok) {
      const problem = await response.json().catch(() => null)
      throw new ApiError(problem?.detail || problem?.title || 'Không thể tải PDF thực đơn.', response.status)
    }
    if (!response.headers.get('Content-Type')?.includes('application/pdf')) throw new Error('Máy chủ chưa trả về tệp PDF hợp lệ.')
    const url = URL.createObjectURL(await response.blob())
    const link = document.createElement('a')
    link.href = url
    link.download = `thuc-don-${id}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  },
}
