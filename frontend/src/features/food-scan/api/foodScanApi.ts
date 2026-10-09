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

const SAMPLE_FLAGGED: FlaggedIngredient[] = [
  {
    id: 'f1',
    name: 'Gelatin (E441)',
    enumber: 'E441',
    source: 'Phụ gia làm đông từ da, xương động vật',
    detail: 'Chiết xuất từ mô liên kết động vật (heo/bò), không phù hợp với chế độ thuần thực vật theo thông tin đã cung cấp.',
    confidence: 0.96,
  },
  {
    id: 'f2',
    name: 'Nước dùng xương (Pork Bone Broth)',
    enumber: null,
    source: 'Thực phẩm chế biến từ xương heo',
    detail: 'Sản phẩm chứa chiết xuất ninh từ xương, không phù hợp với chế độ thuần thực vật theo thông tin đã cung cấp.',
    confidence: 0.92,
  },
]

function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms))
}

function detectStatusFromInput(
  form: ScanInputForm,
  confirm?: ConfirmChecklistAnswers | null,
): { status: ScanStatus; note: string; flagged: FlaggedIngredient[] } {
  const text = `${form.productName} ${form.productBrand} ${form.ingredientText}`.toLowerCase()

  const foundDanger = DANGER_KEYWORDS.filter((k) => text.includes(k.toLowerCase()))
  const confirmUnsuitable = confirm
    ? Boolean(
        confirm.hasBoneBroth === true ||
          confirm.hasFishSauce === true ||
          confirm.hasAnimalFat === true ||
          confirm.hasHoneyOrEgg === true ||
          confirm.hasHiddenDairy === true,
      )
    : false

  if (foundDanger.length > 0 || confirmUnsuitable) {
    return {
      status: 'unsuitable',
      note:
        'Dựa trên thông tin thành phần và câu trả lời bạn cung cấp, có phát hiện các yếu tố thường không phù hợp với chế độ thuần thực vật. Vui lòng kiểm tra kỹ nhãn sản phẩm hoặc liên hệ nhà sản xuất để xác nhận nguồn gốc.',
      flagged:
        foundDanger.length > 0
          ? SAMPLE_FLAGGED
          : [
              {
                id: 'cfm-1',
                name: 'Nguy cơ nguồn gốc động vật (xác nhận từ câu hỏi bổ sung)',
                enumber: null,
                source: 'Trả lời trong mục Xác nhận & Bổ sung',
                detail: 'Một hoặc nhiều câu trả lời cho thấy sản phẩm có thể chứa thành phần nguồn gốc động vật. Bạn nên kiểm tra nhãn hoặc nhà sản xuất trước khi sử dụng.',
                confidence: 0.85,
              },
            ],
    }
  }

  const hasImage = Boolean(form.imagePreview)
  const hasText = form.ingredientText.trim().length >= 20
  const hasConfirm = Boolean(
    confirm &&
      confirm.hasBoneBroth !== null &&
      confirm.hasFishSauce !== null &&
      confirm.hasAnimalFat !== null,
  )

  if (!hasImage && !hasText) {
    return {
      status: 'insufficient',
      note: 'Bạn chưa cung cấp đủ hình ảnh nhãn hoặc danh sách thành phần để phân tích. Vui lòng tải ảnh hoặc nhập tối thiểu 20 ký tự nội dung nhãn.',
      flagged: [],
    }
  }

  if (!hasConfirm) {
    return {
      status: 'insufficient',
      note: 'Thông tin cơ bản đã nhận. Để có kết quả đáng tin cậy hơn, vui lòng hoàn thành bộ câu hỏi Xác nhận & Bổ sung (nước dùng xương, nước mắm, mỡ động vật…).',
      flagged: [],
    }
  }

  return {
    status: 'suitable',
    note: 'Theo thông tin bạn đã cung cấp (hình ảnh, thành phần và trả lời câu hỏi bổ sung), hiện tại KHÔNG phát hiện các yếu tố thường không phù hợp với chế độ thuần thực vật. Hệ thống không thay cho việc đọc kỹ nhãn thực tế của nhà sản xuất.',
    flagged: [],
  }
}

function randomScanId(): string {
  return `scan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export async function startScan(form: ScanInputForm): Promise<FoodScanResult> {
  await delay(500)
  const analysis = detectStatusFromInput(form, null)
  const total = Math.max(4, form.ingredientText.split(/[,.;]/).filter((p) => p.trim()).length)
  return {
    scanId: randomScanId(),
    status: analysis.status,
    productName: form.productName || 'Sản phẩm chưa đặt tên',
    scannedAt: new Date().toISOString(),
    flaggedIngredients: analysis.flagged,
    safeIngredientsCount: Math.max(0, total - analysis.flagged.length),
    totalIngredientsCount: total,
    note: analysis.note,
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
  await delay(500)
  const analysis = detectStatusFromInput(form, confirm)
  const total = Math.max(5, form.ingredientText.split(/[,.;]/).filter((p) => p.trim()).length)
  return {
    scanId: randomScanId(),
    status: analysis.status,
    productName: form.productName || 'Sản phẩm chưa đặt tên',
    scannedAt: new Date().toISOString(),
    flaggedIngredients: analysis.flagged,
    safeIngredientsCount: Math.max(0, total - analysis.flagged.length),
    totalIngredientsCount: total,
    note: analysis.note,
    basedOn: [
      ...(form.imagePreview ? (['image'] as const) : []),
      ...(form.ingredientText.trim().length >= 20 ? (['ingredient-text'] as const) : []),
      'confirm-checklist',
    ],
  }
}

export async function getScanHistory(): Promise<ScanHistoryItem[]> {
  await delay(500)
  const SAMPLE_HISTORY: ScanHistoryItem[] = [
    {
      id: 'h1',
      productName: 'Tố đậu hũ sốt cà chua (nhãn mẫu)',
      status: 'unsuitable',
      scannedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      scannedBy: 'Thuần chay nghiêm ngặt',
      noteShort: 'Phát hiện E441 Gelatin & nước dùng xương trong danh sách thành phần.',
    },
    {
      id: 'h2',
      productName: 'Yến mạch organic sữa hạt điều',
      status: 'suitable',
      scannedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      scannedBy: 'Thuần chay nghiêm ngặt',
      noteShort: 'Không phát hiện yếu tố nguồn gốc động vật theo thông tin bạn cung cấp.',
    },
    {
      id: 'h3',
      productName: 'Bánh gạo vị phô mai (nhập thiếu ảnh nhãn)',
      status: 'insufficient',
      scannedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      scannedBy: 'Thuần chay nghiêm ngặt',
      noteShort: 'Chưa có đủ ảnh nhãn/câu trả lời bổ sung để đánh giá đáng tin cậy.',
    },
  ]
  return SAMPLE_HISTORY
}
