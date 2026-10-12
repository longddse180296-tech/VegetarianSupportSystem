export type ScanStatus = 'suitable' | 'unsuitable' | 'insufficient'
export type ScanSourceType = 'Dish' | 'Label'
export type IngredientKind = 'Plant' | 'Egg' | 'Dairy' | 'Honey' | 'Animal' | 'Unknown'
export type IngredientSource = 'AiSuggested' | 'LabelOcr' | 'UserConfirmed' | 'UserEdited'

export interface DraftIngredient {
  id: string
  name: string
  kind: IngredientKind
  source: IngredientSource
}

export interface ScanHistoryItem {
  id: string
  productName: string
  status: ScanStatus
  scannedAt: string
  dietLabel: string
  resultVersion: number
  noteShort: string
}

export interface ScanHistoryPage {
  items: ScanHistoryItem[]
  totalCount: number
  page: number
  pageSize: number
}
