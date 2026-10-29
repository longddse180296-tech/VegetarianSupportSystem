// Chức năng: tủ bếp và nguyên liệu sẵn có. Khai báo cấu trúc dữ liệu để các màn hình và hàm xử lý dùng thống nhất.
// Cấu trúc PantryCategory quy định dữ liệu trao đổi trong tủ bếp và nguyên liệu sẵn có.
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

// Cấu trúc PantrySuitability quy định dữ liệu trao đổi trong tủ bếp và nguyên liệu sẵn có.
export type PantrySuitability = 'suitable' | 'warning' | 'unsuitable' | 'unchecked'

// Cấu trúc PantryItem quy định dữ liệu trao đổi trong tủ bếp và nguyên liệu sẵn có.
export interface PantryItem {
  id: string
  name: string
  quantity: number | null
  unit: string | null
  category: PantryCategory
  isSuitable: PantrySuitability
  suitableNote: string
  addedAt: string
}

// Cấu trúc RecipeMatch quy định dữ liệu trao đổi trong tủ bếp và nguyên liệu sẵn có.
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
  kcal: number | null
  tag: string
}

// Cấu trúc AddIngredientFormState quy định dữ liệu trao đổi trong tủ bếp và nguyên liệu sẵn có.
export interface AddIngredientFormState {
  name: string
  quantity: string
  unit: string
  category: PantryCategory | ''
  ingredientId?: string
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
