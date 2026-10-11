export type VegetarianDietType = 'vegan' | 'lacto' | 'ovo' | 'lacto-ovo' | 'non-veg'

export type DangerLevel = 'safe' | 'warning' | 'danger'

export interface AdminIngredientItem {
  id: string
  name: string
  category: string
  eNumber: string
  dietType: VegetarianDietType
  vegan: boolean
  lactoVegan: boolean
  dangerLevel: DangerLevel
  description?: string
}

export interface AdminIngredientStats {
  total: number
  vegan: number
  lacto: number
  ovo: number
  lactoOvo: number
  nonVeg: number
  safe: number
  warning: number
  danger: number
}

export interface AdminIngredientFilter {
  keyword?: string
  dietType?: VegetarianDietType | 'all'
  dangerLevel?: DangerLevel | 'all'
  category?: string
}
