import type { DietaryType } from '../api/recipeContract'
import type { RecipeIngredientOption } from '../api/recipeNutrition'

// Giải thích bằng chứng gây cảnh báo theo cùng điều kiện với DietaryRules của backend.
export function ingredientDietWarnings(ingredient: RecipeIngredientOption, diet: DietaryType | null): string[] {
  const reasons: string[] = []
  if (ingredient.isActive === false) reasons.push('Nguyên liệu đã ngừng sử dụng.')
  if (!diet) return reasons

  if (ingredient.containsEgg && (diet === 'Vegan' || diet === 'LactoVegetarian'))
    reasons.push('Có trứng, không phù hợp với chế độ ăn đã chọn.')
  if (ingredient.containsMilk && (diet === 'Vegan' || diet === 'OvoVegetarian'))
    reasons.push('Có sữa, không phù hợp với chế độ ăn đã chọn.')
  if (ingredient.containsHoney && diet === 'Vegan')
    reasons.push('Có mật ong, không phù hợp với chế độ thuần chay (Vegan).')

  return reasons
}
