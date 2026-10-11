import { apiClient, getStoredToken } from '../../../shared/api/apiClient'
import type {
  ConfirmChecklistAnswers,
  FoodScanResult,
  FlaggedIngredient,
  ScanHistoryItem,
  ScanInputForm,
  ScanStatus,
} from '../types/foodScan.types'

const DANGER_KEYWORDS = [
  'nước dùng xương',
  'nước mắm',
  'mỡ heo',
  'mỡ gà',
  'mỡ bò',
  'collagen',
  'gelatin',
  'e441',
  'trứng',
  'sữa',
  'mật ong',
  'honey',
  'casein',
  'whey',
  'lactose',
]

function randomScanId(): string {
  return `scan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

interface DishImageScanResult {
  processingStatus: string
  suggestedDishName: string
  visibleIngredients: string[]
  unknownFactors: string[]
  followUpQuestions: string[]
  errorCode: string | null
  note: string | null
}

interface BackendEvaluation {
  assessments: Array<{
    diet: string
    status: 'SuitableBasedOnProvidedInformation' | 'Incompatible' | 'InsufficientInformation'
  }>
  allergenWarnings?: string[]
  avoidedFoodWarnings?: string[]
}

export interface LabelScanResult {
  processingStatus: string
  extractedText: string | null
  isIncomplete: boolean
  errorCode: string | null
  note: string | null
}

export async function scanLabelImage(file: File): Promise<LabelScanResult | null> {
  if (getStoredToken()) {
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await apiClient.request<LabelScanResult>('/api/food-scans/label-image', {
        method: 'POST',
        body: formData,
        requiresAuth: true,
      })
      if (res && res.processingStatus) {
        return res
      }
    } catch {
      // Error
    }
  }
  return null
}

export async function startScan(form: ScanInputForm): Promise<FoodScanResult> {
  // If image provided and user is authenticated, call real backend vision scan
  if (form.imageFile && getStoredToken()) {
    const formData = new FormData()
    formData.append('image', form.imageFile)
    const res = await apiClient.request<DishImageScanResult>('/api/food-scans/dish-image', {
      method: 'POST',
      body: formData,
      requiresAuth: true,
    })

    if (res && res.processingStatus) {
      const dishName = res.suggestedDishName || form.productName || 'Món ăn nhận diện từ ảnh'
      const total = (res.visibleIngredients?.length || 0) + (res.unknownFactors?.length || 0)
      return {
        scanId: randomScanId(),
        status: 'insufficient',
        productName: dishName,
        scannedAt: new Date().toISOString(),
        flaggedIngredients: [],
        safeIngredientsCount: res.visibleIngredients?.length || 0,
        totalIngredientsCount: Math.max(1, total),
        note:
          res.note ||
          'Hệ thống đã nhận diện các nguyên liệu nhìn thấy. Vui lòng hoàn thành xác nhận thêm về nước dùng, gia vị và mỡ nấu.',
        basedOn: ['image'],
      }
    }
  }

  const hasImage = Boolean(form.imagePreview)
  const hasText = form.ingredientText.trim().length >= 20

  return {
    scanId: randomScanId(),
    status: hasImage || hasText ? 'insufficient' : 'insufficient',
    productName: form.productName || 'Sản phẩm cần kiểm tra',
    scannedAt: new Date().toISOString(),
    flaggedIngredients: [],
    safeIngredientsCount: 0,
    totalIngredientsCount: 1,
    note:
      hasImage || hasText
        ? 'Thông tin cơ bản đã ghi nhận. Vui lòng hoàn thành câu hỏi xác nhận bổ sung để AI kiểm tra độ phù hợp.'
        : 'Vui lòng tải ảnh món ăn hoặc nhập nhãn thành phần để phân tích.',
    basedOn: [
      ...(form.imagePreview ? (['image'] as const) : []),
      ...(form.ingredientText.trim().length >= 20 ? (['ingredient-text'] as const) : []),
    ],
  }
}

export async function confirmScan(
  form: ScanInputForm,
  confirm: ConfirmChecklistAnswers,
): Promise<FoodScanResult> {
  if (!getStoredToken()) {
    throw new Error('Vui lòng đăng nhập để đánh giá độ phù hợp của món ăn.')
  }

  // Backend uses JsonStringEnumConverter: Plant, Egg, Dairy, Honey, Animal, Unknown
  const ingredients: Array<{ name: string; kind: string; source: string }> = []
  if (confirm.hasBoneBroth === true) ingredients.push({ name: 'Nước dùng xương', kind: 'Animal', source: 'UserConfirmed' })
  if (confirm.hasFishSauce === true) ingredients.push({ name: 'Nước mắm', kind: 'Animal', source: 'UserConfirmed' })
  if (confirm.hasAnimalFat === true) ingredients.push({ name: 'Mỡ động vật', kind: 'Animal', source: 'UserConfirmed' })
  if (confirm.hasHoneyOrEgg === true) ingredients.push({ name: 'Trứng hoặc mật ong', kind: 'Egg', source: 'UserConfirmed' })
  if (confirm.hasHiddenDairy === true) ingredients.push({ name: 'Chất từ sữa', kind: 'Dairy', source: 'UserConfirmed' })

  const textParts = form.ingredientText
    .split(/[,.;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  for (const p of textParts) {
    const isDanger = DANGER_KEYWORDS.some((k) => p.toLowerCase().includes(k))
    ingredients.push({ name: p, kind: isDanger ? 'Animal' : 'Plant', source: 'UserConfirmed' })
  }
  if (ingredients.length === 0) {
    ingredients.push({ name: form.productName || 'Nguyên liệu thông thường', kind: 'Plant', source: 'UserConfirmed' })
  }

  const evalRes = await apiClient.post<BackendEvaluation>('/api/food-scans/evaluate', {
    ingredients,
    ingredientsComplete: confirm.sourceLabelImageProvided === true,
    sourceType: 'Dish',
  })

  if (evalRes && Array.isArray(evalRes.assessments)) {
    const vegan = evalRes.assessments.find((a) => a.diet === 'Vegan')
    let status: ScanStatus = 'insufficient'
    if (vegan?.status === 'SuitableBasedOnProvidedInformation') {
      status = 'suitable'
    } else if (vegan?.status === 'Incompatible') {
      status = 'unsuitable'
    }

    const flagged: FlaggedIngredient[] = ingredients
      .filter((i) => i.kind === 'Animal' || i.kind === 'Egg' || i.kind === 'Dairy')
      .map((i, idx) => ({
        id: `f_${idx}`,
        name: i.name,
        enumber: null,
        source: 'Thành phần từ động vật hoặc sản phẩm động vật',
        detail: 'Không phù hợp với chế độ thuần thực vật theo thông tin bạn đã xác nhận.',
        confidence: 0.95,
      }))

    return {
      scanId: randomScanId(),
      status,
      productName: form.productName || 'Món ăn đã kiểm tra',
      scannedAt: new Date().toISOString(),
      flaggedIngredients: flagged,
      safeIngredientsCount: Math.max(0, ingredients.length - flagged.length),
      totalIngredientsCount: ingredients.length,
      note:
        status === 'suitable'
          ? 'Theo thông tin bạn đã xác nhận, không phát hiện thành phần động vật.'
          : status === 'unsuitable'
            ? 'Đã phát hiện thành phần không phù hợp với chế độ thuần thực vật theo thông tin đã cung cấp.'
            : 'Chưa đủ thông tin để kết luận chắc chắn. Vui lòng kiểm tra kỹ nhãn hoặc hỏi rõ nhà sản xuất.',
      basedOn: [
        ...(form.imagePreview ? (['image'] as const) : []),
        ...(form.ingredientText.trim().length >= 20 ? (['ingredient-text'] as const) : []),
        'confirm-checklist',
      ],
    }
  }

  throw new Error('Không thể đánh giá món ăn lúc này. Vui lòng thử lại.')
}

export async function getScanHistory(): Promise<ScanHistoryItem[]> {
  if (getStoredToken()) {
    try {
      const res = await apiClient.get<{
        items: Array<{
          id: string
          createdAtUtc: string
          note: string
          assessments: Array<{ diet: string; status: string }>
          ingredients: Array<{ name: string; kind: string }>
        }>
      }>('/api/food-scans/history?page=1&pageSize=20')

      if (res?.items && Array.isArray(res.items)) {
        return res.items.map((it) => {
          const vegan = it.assessments?.find((a) => a.diet === 'Vegan')
          let status: ScanStatus = 'insufficient'
          if (vegan?.status === 'SuitableBasedOnProvidedInformation') status = 'suitable'
          else if (vegan?.status === 'Incompatible') status = 'unsuitable'

          const firstIng = it.ingredients?.[0]?.name || 'Món ăn đã kiểm tra'
          return {
            id: it.id,
            productName: firstIng,
            status,
            scannedAt: it.createdAtUtc,
            scannedBy: 'Người dùng',
            noteShort: it.note || '',
          }
        })
      }
    } catch {
      // API error
    }
  }

  return []
}
