export type IngredientOrigin = 'Unknown' | 'Plant' | 'Animal'

export interface IngredientInput {
  name: string
  aliases: string | null
  origin: IngredientOrigin
  containsEgg: boolean
  containsMilk: boolean
  containsHoney: boolean
  containsOtherAnimalProducts: boolean | null
  allergens: string | null
  defaultUnit: string | null
  caloriesPer100Gram: number | null
  proteinGramPer100Gram: number | null
  carbohydrateGramPer100Gram: number | null
  fatGramPer100Gram: number | null
  source: string | null
}

export interface AdminIngredientItem extends IngredientInput {
  id: string
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}
