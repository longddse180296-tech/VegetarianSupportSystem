export type ScanStatus = 'suitable' | 'unsuitable' | 'insufficient'

export interface ScanInputForm {
  imageFile: File | null
  imagePreview: string | null
  ingredientText: string
  productName: string
  productBrand: string
  quantityGram: string
}

export interface ConfirmChecklistAnswers {
  hasBoneBroth: boolean | null
  hasFishSauce: boolean | null
  hasAnimalFat: boolean | null
  hasHoneyOrEgg: boolean | null
  hasHiddenDairy: boolean | null
  sourceLabelImageProvided: boolean | null
}

export interface FlaggedIngredient {
  id: string
  name: string
  enumber: string | null
  source: string | null
  detail: string
  confidence: number // 0.0 - 1.0
}

export interface FoodScanResult {
  scanId: string
  status: ScanStatus
  productName: string
  scannedAt: string
  flaggedIngredients: FlaggedIngredient[]
  safeIngredientsCount: number
  totalIngredientsCount: number
  note: string
  basedOn: ('image' | 'ingredient-text' | 'confirm-checklist')[]
}

export interface ScanHistoryItem {
  id: string
  productName: string
  status: ScanStatus
  scannedAt: string
  scannedBy: string
  noteShort: string
}
