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
    .sort((a, b) => a.localeCompare(b, 'vi'))
  const ingredientNames = unique(ingredients.map(item => item.name.trim()).filter(Boolean))
  return {
    ingredientNames,
    allergies: unique(ingredients.flatMap(item => (item.allergens || '').split(/[,;|]/).map(value => value.trim()).filter(Boolean))).slice(0, 8),
    avoided: ingredientNames.slice(0, 8),
  }
}

// Chỉ tìm chuỗi trong tên nguyên liệu; không suy luận hay tìm theo món/thuộc tính khác.
export function searchIngredientNames(names: string[], search: string, selected: string[] = []): string[] {
  const normalize = (value: string) => value.trim().toLocaleLowerCase('vi').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ')
  const query = normalize(search)
  if (!query) return []
  const excluded = new Set(selected.map(normalize))
  return names.filter(name => normalize(name).includes(query) && !excluded.has(normalize(name)))
}
