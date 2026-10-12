export type PantryCategory =
  | 'rau-cu-qua'
  | 'hat-ngu-coc'
  | 'dau-mem-san-xuat'
  | 'gia-vi'
  | 'nam'
  | 'trai-cay'
  | 'sua-hat'
  | 'thuc-pham-che-bien'
  | 'khac'

export const PANTRY_CATEGORY_LABELS: Record<PantryCategory, string> = {
  'rau-cu-qua': 'Rau củ quả',
  'hat-ngu-coc': 'Hạt & ngũ cốc',
  'dau-mem-san-xuat': 'Đậu & đậu phụ',
  'gia-vi': 'Gia vị',
  nam: 'Nấm',
  'trai-cay': 'Trái cây',
  'sua-hat': 'Sữa hạt & thay thế',
  'thuc-pham-che-bien': 'Thực phẩm chế biến',
  khac: 'Khác',
}

export type PantrySuitability = 'suitable' | 'warning' | 'unsuitable' | 'unchecked'

export interface PantryItem {
  id: string
  name: string
  quantity: number
  unit: string
  category: PantryCategory
  isSuitable: PantrySuitability
  suitableNote: string
  addedAt: string
}

export interface RecipeMatch {
  id: string
  title: string
  cover: string
  subtitle: string
  matchPercent: number
  matchedIngredients: string[]
  totalIngredients: number
  missingList: string[]
  timeMin: number
  kcal: number
  tag: string
}

export interface AddIngredientFormState {
  name: string
  quantity: string
  unit: string
  category: PantryCategory | ''
}

export const DEFAULT_UNITS: string[] = [
  'g',
  'kg',
  'ml',
  'lít',
  'quả',
  'củ',
  'bó',
  'gói',
  'muỗng canh',
  'muỗng cà phê',
]
