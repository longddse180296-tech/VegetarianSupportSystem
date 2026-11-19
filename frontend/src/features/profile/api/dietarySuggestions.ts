import { apiClient } from '../../../shared/api/apiClient'

interface IngredientSuggestion {
  name: string
  allergens?: string | null
}

// Dùng đúng tên dị nguyên và nguyên liệu đang sử dụng để backend đối chiếu được.
export async function getDietarySuggestions(signal?: AbortSignal) {
  const ingredients: IngredientSuggestion[] = []
  for (let page = 1; ; page++) {
    const response = await apiClient.get<{ items: IngredientSuggestion[]; totalCount: number }>(
      `/api/ingredients?pageNumber=${page}&pageSize=100`, { requiresAuth: false, signal },
    )
    ingredients.push(...response.items)
    if (!response.items.length || ingredients.length >= response.totalCount) break
  }
  const unique = (values: string[]) => Array.from(new Map(values.map(value => [value.toLocaleLowerCase('vi'), value])).values())
    .sort((a, b) => a.localeCompare(b, 'vi')).slice(0, 8)
  return {
    allergies: unique(ingredients.flatMap(item => (item.allergens || '').split(/[,;|]/).map(value => value.trim()).filter(Boolean))),
    avoided: unique(ingredients.map(item => item.name.trim()).filter(Boolean)),
  }
}
