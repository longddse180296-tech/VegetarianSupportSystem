export type DangerLevel = 'safe' | 'warning' | 'danger'

export interface AdminIngredientItem {
  id: string
  name: string
  category: string
  eNumber: string
  vegan: boolean
  lactoVegan: boolean
  dangerLevel: DangerLevel
  description?: string
}

export interface AdminIngredientStats {
  total: number
  safe: number
  warning: number
  danger: number
}

export interface AdminIngredientFilter {
  keyword?: string
  dangerLevel?: DangerLevel | 'all'
  category?: string
}
