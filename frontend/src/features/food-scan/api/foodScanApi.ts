// Chức năng: phân tích ảnh món ăn và nhãn thành phần. Giao tiếp máy chủ và chuyển dữ liệu về kiểu dùng trong tính năng.
import { apiClient, getStoredToken, ApiError } from '../../../shared/api/apiClient'
import type {
  IngredientKind,
  IngredientSource,
  ScanHistoryItem,
  ScanHistoryPage,
  ScanSourceType,
  ScanStatus,
} from '../types/foodScan.types'

// Cấu trúc DishImageScanResult quy định dữ liệu trao đổi trong phân tích ảnh món ăn và nhãn thành phần.
export interface DishImageScanResult {
  processingStatus: 'NeedsConfirmation' | 'AnalysisFailed'
  suggestedDishName: string | null
  visibleIngredients: string[]
  suggestedIngredientKinds?: IngredientKind[]
  unknownFactors: string[]
  followUpQuestions: string[]
  errorCode: string | null
  note: string
}

// Cấu trúc LabelImageScanResult quy định dữ liệu trao đổi trong phân tích ảnh món ăn và nhãn thành phần.
export interface LabelImageScanResult {
  processingStatus: 'NeedsConfirmation' | 'AnalysisFailed'
  extractedText: string | null
  isIncomplete: boolean
  errorCode: string | null
  note: string
  suggestedIngredients?: Array<{ name: string; kind: IngredientKind }>
}

// Cấu trúc ScanAnalysis quy định dữ liệu trao đổi trong phân tích ảnh món ăn và nhãn thành phần.
export type ScanAnalysis =
  | { sourceType: 'Dish'; data: DishImageScanResult }
  | { sourceType: 'Label'; data: LabelImageScanResult }

// Cấu trúc ConfirmedIngredient quy định dữ liệu trao đổi trong phân tích ảnh món ăn và nhãn thành phần.
export interface ConfirmedIngredient {
  name: string
  kind: IngredientKind
  source: IngredientSource
}

// Cấu trúc EvaluateScanRequest quy định dữ liệu trao đổi trong phân tích ảnh món ăn và nhãn thành phần.
export interface EvaluateScanRequest {
  ingredients: ConfirmedIngredient[]
  ingredientsComplete: boolean
  sourceType: ScanSourceType
  correctedLabelText: string | null
  labelIncomplete: boolean
  unknownAnswers: string[]
  previousScanId?: string | null
}

// Cấu trúc SavedFoodScan quy định dữ liệu trao đổi trong phân tích ảnh món ăn và nhãn thành phần.
export interface SavedFoodScan {
  id: string
  createdAtUtc: string
  resultVersion: number
  previousScanId: string | null
  sourceType: ScanSourceType
  assessments: Array<{ diet: string; status: string }>
  note: string
  profileSnapshot: {
    diet: string | null
    allergies: string[]
    profileUpdatedAtUtc: string | null
  }
  allergyWarnings: string[]
  allergyNote: string
  ingredients: ConfirmedIngredient[]
  correctedLabelText: string | null
  labelIncomplete: boolean
  unknownAnswers: string[]
  ingredientsComplete: boolean
  catalogEvidence: Array<{
    ingredientId: string
    name: string
    kind: IngredientKind
    source: string | null
    allergens: string | null
  }>
}

// Cấu trúc BackendScanPage quy định dữ liệu trao đổi trong phân tích ảnh món ăn và nhãn thành phần.
interface BackendScanPage {
  items: SavedFoodScan[]
  totalCount: number
  page: number
  pageSize: number
}

export const DIET_LABELS: Record<string, string> = {
  Vegan: 'Thuần chay (Vegan)',
  Lacto: 'Ăn chay có sữa (Lacto)',
  Ovo: 'Chay có trứng (Ovo)',
  LactoOvo: 'Trứng & Sữa (Lacto-ovo)',
}

export const INGREDIENT_KIND_LABELS: Record<IngredientKind, string> = {
  Plant: 'Thực vật',
  Egg: 'Trứng',
  Dairy: 'Sữa',
  Honey: 'Mật ong',
  Animal: 'Động vật',
  Unknown: 'Chưa rõ',
}

export const INGREDIENT_SOURCE_LABELS: Record<IngredientSource, string> = {
  AiSuggested: 'AI gợi ý, chưa xác nhận',
  LabelOcr: 'OCR đọc từ nhãn, chưa xác nhận',
  UserConfirmed: 'Bạn đã xác nhận',
  UserEdited: 'Bạn đã sửa',
}

// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (assessmentStatus); thuộc phân tích ảnh món ăn và nhãn thành phần.
export function assessmentStatus(status: string | undefined): ScanStatus {
  if (status === 'Incompatible') return 'unsuitable'
  if (status === 'SuitableBasedOnProvidedInformation') return 'suitable'
  return 'insufficient'
}

// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (toScanHistoryItem); thuộc phân tích ảnh món ăn và nhãn thành phần.
export function toScanHistoryItem(scan: SavedFoodScan): ScanHistoryItem {
  const diet = scan.profileSnapshot?.diet
  const assessment = scan.assessments?.find((item) => item.diet === diet)
  const scanType = scan.sourceType === 'Label' ? 'Quét nhãn thành phần' : 'Quét ảnh món ăn'
  const firstIngredient = scan.ingredients?.[0]?.name?.trim()

  return {
    id: scan.id,
    productName: firstIngredient ? `${scanType} · ${firstIngredient}` : scanType,
    status: assessmentStatus(assessment?.status),
    scannedAt: scan.createdAtUtc,
    dietLabel: diet ? DIET_LABELS[diet] || diet : 'Chưa rõ chế độ ăn',
    resultVersion: scan.resultVersion,
    noteShort: scan.note || 'Không có ghi chú cho lần quét này.',
  }
}

// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (analyzeScanImage); thuộc phân tích ảnh món ăn và nhãn thành phần.
export async function analyzeScanImage(
  sourceType: ScanSourceType,
  image: File,
): Promise<ScanAnalysis> {
  if (!getStoredToken()) throw new Error('Hãy đăng nhập trước khi quét ảnh.')
  if (image.size === 0 || image.size > 5 * 1024 * 1024) {
    throw new Error('Chỉ hỗ trợ file ảnh định dạng JPG hoặc PNG với kích thước tối đa 5MB.')
  }

  const form = new FormData()
  form.append('image', image)
  const endpoint = sourceType === 'Dish' ? 'dish-image' : 'label-image'
  try {
    if (sourceType === 'Dish') {
      const data = await apiClient.request<DishImageScanResult>(`/api/food-scans/${endpoint}`, {
        method: 'POST',
        body: form,
      })
      if (!data || data.processingStatus !== 'NeedsConfirmation') {
        throw new Error(data?.note || 'Chưa nhận diện được món ăn trong ảnh. Vui lòng chọn ảnh rõ hơn và thử lại.')
      }
      return { sourceType, data }
    }
    const data = await apiClient.request<LabelImageScanResult>(`/api/food-scans/${endpoint}`, {
      method: 'POST',
      body: form,
    })
    if (!data || data.processingStatus !== 'NeedsConfirmation') {
      throw new Error(data?.note || 'Chưa đọc được thành phần trên nhãn. Vui lòng chụp rõ phần chữ và thử lại.')
    }
    return { sourceType, data }
  } catch (error) {
    console.error(`[foodScanApi.analyzeScanImage] Lỗi khi gọi /api/food-scans/${endpoint}`, error);
    if (error instanceof ApiError && error.status === 422) {
      throw new Error('Không nhận diện được ảnh. Hãy chọn ảnh rõ hơn và thử lại.')
    }
    if (error instanceof ApiError && error.status === 503) {
      throw new Error('Dịch vụ phân tích ảnh đang tạm không sẵn sàng. Hãy thử lại sau.')
    }
    throw error
  }
}

// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (evaluateScan); thuộc phân tích ảnh món ăn và nhãn thành phần.
export async function evaluateScan(request: EvaluateScanRequest): Promise<SavedFoodScan> {
  const url = '/api/food-scans/evaluate'
  let saved: SavedFoodScan
  try {
    saved = await apiClient.post<SavedFoodScan>(url, request)
  } catch (err) {
    console.error('[foodScanApi.evaluateScan] Lỗi khi gọi ' + url, err)
    throw err
  }
  if (!saved?.id || !Array.isArray(saved.assessments)) {
    throw new Error('Chưa thể mở kết quả phân tích này. Vui lòng tải lại lịch sử và thử lại.')
  }
  return saved
}

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getScanHistory); thuộc phân tích ảnh món ăn và nhãn thành phần.
export async function getScanHistory(page = 1, pageSize = 10): Promise<ScanHistoryPage> {
  const url = `/api/food-scans/history?page=${page}&pageSize=${pageSize}`
  let response: BackendScanPage
  try {
    response = await apiClient.get<BackendScanPage>(url)
  } catch (err) {
    console.error('[foodScanApi.getScanHistory] Lỗi khi gọi ' + url, err)
    throw err
  }
  if (!response || !Array.isArray(response.items)) {
    throw new Error('Dữ liệu lịch sử quét không hợp lệ.')
  }
  return {
    items: response.items.map(toScanHistoryItem),
    totalCount: response.totalCount,
    page: response.page,
    pageSize: response.pageSize,
  }
}

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getScanDetail); thuộc phân tích ảnh món ăn và nhãn thành phần.
export async function getScanDetail(id: string): Promise<SavedFoodScan> {
  const url = `/api/food-scans/${encodeURIComponent(id)}`
  try {
    return await apiClient.get<SavedFoodScan>(url)
  } catch (err) {
    console.error('[foodScanApi.getScanDetail] Lỗi khi gọi ' + url, err)
    throw err
  }
}
