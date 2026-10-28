// Chức năng: phân tích ảnh món ăn và nhãn thành phần. Khai báo cấu trúc dữ liệu để các màn hình và hàm xử lý dùng thống nhất.
// Cấu trúc ScanStatus quy định dữ liệu trao đổi trong phân tích ảnh món ăn và nhãn thành phần.
export type ScanStatus = 'suitable' | 'unsuitable' | 'insufficient'
// Cấu trúc ScanSourceType quy định dữ liệu trao đổi trong phân tích ảnh món ăn và nhãn thành phần.
export type ScanSourceType = 'Dish' | 'Label'
// Cấu trúc IngredientKind quy định dữ liệu trao đổi trong phân tích ảnh món ăn và nhãn thành phần.
export type IngredientKind = 'Plant' | 'Egg' | 'Dairy' | 'Honey' | 'Animal' | 'Unknown'
// Cấu trúc IngredientSource quy định dữ liệu trao đổi trong phân tích ảnh món ăn và nhãn thành phần.
export type IngredientSource = 'AiSuggested' | 'LabelOcr' | 'UserConfirmed' | 'UserEdited'

// Cấu trúc DraftIngredient quy định dữ liệu trao đổi trong phân tích ảnh món ăn và nhãn thành phần.
export interface DraftIngredient {
  id: string
  name: string
  kind: IngredientKind
  source: IngredientSource
}

// Cấu trúc ScanHistoryItem quy định dữ liệu trao đổi trong phân tích ảnh món ăn và nhãn thành phần.
export interface ScanHistoryItem {
  id: string
  productName: string
  status: ScanStatus
  scannedAt: string
  dietLabel: string
  resultVersion: number
  noteShort: string
}

// Cấu trúc ScanHistoryPage quy định dữ liệu trao đổi trong phân tích ảnh món ăn và nhãn thành phần.
export interface ScanHistoryPage {
  items: ScanHistoryItem[]
  totalCount: number
  page: number
  pageSize: number
}
