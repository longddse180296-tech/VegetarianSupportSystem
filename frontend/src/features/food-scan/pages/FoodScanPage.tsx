import { useRef, useState } from 'react'
import {
  Upload,
  ScanLine,
  CheckSquare,
  BarChart3,
  FileText,
  Package2,
  Factory,
  Scale,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Trash2,
  RefreshCw,
  History as HistoryIcon,
} from 'lucide-react'

import {
  Button,
  Input,
  SkeletonLoader,
  StatusBadge,
  Textarea,
} from '../../../shared/components'
import { confirmScan, getScanHistory, startScan } from '../api/foodScanApi'
import type {
  ConfirmChecklistAnswers,
  FoodScanResult,
  ScanHistoryItem,
  ScanInputForm,
  ScanStatus,
} from '../types/foodScan.types'

import './FoodScanPage.css'

type ScanTab = 'scanner' | 'confirm' | 'result'
type HistoryStatus = 'idle' | 'loading' | 'done'

interface ConfirmQuestion {
  key: keyof ConfirmChecklistAnswers
  question: string
  hint: string
}

const CONFIRM_QUESTIONS: ConfirmQuestion[] = [
  {
    key: 'hasBoneBroth',
    question: 'Sản phẩm có nước dùng xương, nước dùng thịt, hoặc chiết xuất từ xương động vật không?',
    hint: 'Các yếu tố này thường không phù hợp với chế độ thuần thực vật.',
  },
  {
    key: 'hasFishSauce',
    question: 'Sản phẩm có nước mắm, nước tương cá, mắm tôm, hay gia vị từ nguồn cá không?',
    hint: 'Các gia vị này thường chứa thành phần nguồn gốc động vật.',
  },
  {
    key: 'hasAnimalFat',
    question: 'Sản phẩm có dùng mỡ heo, mỡ gà, mỡ bò, hay dầu mỡ động vật khác không?',
    hint: 'Nếu không chắc, hãy kiểm tra bảng thành phần hoặc hỏi nhà sản xuất.',
  },
  {
    key: 'hasHoneyOrEgg',
    question: 'Sản phẩm có mật ong, trứng, hoặc sản phẩm từ trứng (albumin, bột trứng) không?',
    hint: 'Các yếu tố này thường không phù hợp với chế độ thuần thực vật.',
  },
  {
    key: 'hasHiddenDairy',
    question: 'Sản phẩm có sữa, bơ, casein, whey, hay các chất từ sữa ẩn khác không?',
    hint: 'Đôi khi ghi dưới dạng "hương liệu tự nhiên" hoặc phụ gia sữa.',
  },
  {
    key: 'sourceLabelImageProvided',
    question: 'Bạn đã tải ảnh chụp nhãn nguồn gốc, phần in thành phần (ngoài bao bì) chưa?',
    hint: 'Ảnh nhãn giúp hệ thống tham chiếu đáng tin cậy hơn khi đối chiếu.',
  },
]

const TAB_LIST: { key: ScanTab; label: string; icon: typeof ScanLine }[] = [
  { key: 'scanner', label: 'Quét & Nhập', icon: ScanLine },
  { key: 'confirm', label: 'Xác nhận & Bổ sung', icon: CheckSquare },
  { key: 'result', label: 'Kết quả', icon: BarChart3 },
]

const INITIAL_INPUT: ScanInputForm = {
  imageFile: null,
  imagePreview: '',
  ingredientText: '',
  productName: '',
  productBrand: '',
  quantityGram: '',
}

const INITIAL_CONFIRM: ConfirmChecklistAnswers = {
  hasBoneBroth: null,
  hasFishSauce: null,
  hasAnimalFat: null,
  hasHoneyOrEgg: null,
  hasHiddenDairy: null,
  sourceLabelImageProvided: null,
}

interface FoodScanPageProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

export default function FoodScanPage({ onNavigate, isLoggedIn: _isLoggedIn }: FoodScanPageProps) {
  const [tab, setTab] = useState<ScanTab>('scanner')
  const [form, setForm] = useState<ScanInputForm>(INITIAL_INPUT)
  const [confirm, setConfirm] = useState<ConfirmChecklistAnswers>(INITIAL_CONFIRM)
  const [isScanning, setIsScanning] = useState(false)
  const [result, setResult] = useState<FoodScanResult | null>(null)
  const [history, setHistory] = useState<ScanHistoryItem[]>([])
  const [historyState, setHistoryState] = useState<HistoryStatus>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateField = <K extends keyof ScanInputForm>(key: K, value: ScanInputForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const answerConfirm = (key: keyof ConfirmChecklistAnswers, value: boolean) => {
    setConfirm((prev) => ({ ...prev, [key]: value }))
  }

  const countAnswered = CONFIRM_QUESTIONS.filter((q) => confirm[q.key] !== null).length

  const handlePickFile = () => fileInputRef.current?.click()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!/\.(jpe?g|png|webp)$/i.test(file.name)) {
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      updateField('imageFile', file)
      updateField('imagePreview', url)
    }
    reader.readAsDataURL(file)
    // reset input để cùng 1 file được chọn lại lần 2 vẫn fire change
    event.target.value = ''
  }

  const clearImage = () => {
    updateField('imageFile', null)
    updateField('imagePreview', '')
  }

  const fillSampleIngredientText = () => {
    updateField(
      'ingredientText',
      'Đậu hũ non, cà chua, dầu nành, gia vị (i+g, đường, muối, E441 Gelatin), nước dùng xương (Pork Bone Broth), hương liệu tự nhiên, rau thơm, tiêu.',
    )
    updateField('productName', 'Tố đậu hũ sốt cà chua (nhãn mẫu để kiểm tra)')
    updateField('productBrand', 'DauHuSotCa_01')
    updateField('quantityGram', '350')
  }

  const resetAll = () => {
    setForm(INITIAL_INPUT)
    setConfirm(INITIAL_CONFIRM)
    setResult(null)
    setTab('scanner')
  }

  const handleStartScan = async () => {
    setIsScanning(true)
    setResult(null)
    try {
      const r = await startScan(form)
      setResult(r)
      setTab('confirm')
    } finally {
      setIsScanning(false)
    }
  }

  const handleConfirmAndFinish = async () => {
    setIsScanning(true)
    try {
      const r = await confirmScan(form, confirm)
      setResult(r)
      setTab('result')
    } finally {
      setIsScanning(false)
    }
  }

  const handleLoadHistory = async () => {
    setHistoryState('loading')
    try {
      const data = await getScanHistory()
      setHistory(data)
      setHistoryState('done')
    } finally {
      if (historyState === 'loading') setHistoryState('done')
    }
  }

  const statusTitle = (s: ScanStatus): string => {
    if (s === 'suitable') return 'Phù hợp theo thông tin đã cung cấp'
    if (s === 'unsuitable') return 'Không phù hợp theo thông tin đã cung cấp'
    return 'Chưa đủ thông tin để kết luận'
  }

  return (
    <form
      className="min-h-screen bg-[#f6faf7] text-[#1f2937]"
      onSubmit={(e) => {
        e.preventDefault()
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2e7d32]">
            <ScanLine size={12} />
            Quét & Phân tích Thực phẩm
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1f2937] sm:text-3xl">
            Kiểm tra thành phần thuần thực vật
          </h1>
          <p className="mt-1 text-sm text-[#6b7280]">
            Tải ảnh nhãn hoặc nhập danh sách thành phần, trả lời vài câu hỏi bổ sung để hệ thống tham
            chiếu theo cơ sở dữ liệu phụ gia & nguồn gốc phổ biến.
          </p>
        </div>

        {/* 3 Tabs */}
        <div className="mb-5 inline-flex flex-wrap items-center gap-1 rounded-[12px] border border-[#e5e7eb] bg-white p-1 shadow-xs">
          {TAB_LIST.map((t) => (
            <Button
              key={t.key}
              type="button"
              variant={tab === t.key ? 'primary' : 'ghost'}
              size="md"
              leftIcon={<t.icon size={14} />}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </Button>
          ))}
        </div>

        {/* ======= TAB 1: Quét & Nhập ======= */}
        {tab === 'scanner' && (
          <section className="grid gap-6 lg:grid-cols-[1.25fr_minmax(0,0.9fr)]">
            <div className="flex flex-col gap-5">
              {/* Ảnh + OCR */}
              <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-[#1f2937]">
                      1. Tải ảnh nhãn hoặc món ăn
                    </h2>
                    <p className="mt-1 text-xs text-[#6b7280]">
                      Hỗ trợ JPG, PNG, WEBP. Nên chụp rõ phần in thành phần và nhãn nguồn gốc.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={<FileText size={13} />}
                    onClick={fillSampleIngredientText}
                  >
                    Điền mẫu thử
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {!form.imagePreview ? (
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Tải ảnh nhãn sản phẩm"
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-[#c8e6c9] bg-[#e8f5e9]/50 px-4 py-10 text-center transition hover:border-[#2e7d32] hover:bg-[#e8f5e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2e7d32]"
                    onClick={handlePickFile}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handlePickFile()
                      }
                    }}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#e5e7eb]">
                      <Upload size={18} className="text-[#2e7d32]" />
                    </div>
                    <div className="text-sm font-semibold text-[#1f2937]">
                      Kéo ảnh vào đây hoặc click để chọn ảnh từ máy
                    </div>
                    <div className="text-xs text-[#6b7280]">
                      JPG / PNG / WEBP · Dưới 10MB · Chụp rõ danh sách thành phần
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="mt-2"
                      leftIcon={<Upload size={13} />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePickFile()
                      }}
                    >
                      Tải ảnh lên
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                    <div className="overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-slate-50">
                      <img
                        src={form.imagePreview}
                        alt="Ảnh nhãn sản phẩm xem trước"
                        className="h-60 w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col items-start gap-2 self-start">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e9] px-2 py-1 text-[11px] font-bold text-[#2e7d32]">
                        <CheckCircle2 size={12} /> Đã tải ảnh
                      </span>
                      <span className="text-xs text-[#6b7280]">
                        {form.imageFile?.name ?? 'Ảnh xem trước'}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        leftIcon={<RefreshCw size={13} />}
                        onClick={handlePickFile}
                      >
                        Thay ảnh khác
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        leftIcon={<Trash2 size={13} className="text-red-600" />}
                        onClick={clearImage}
                      >
                        <span className="text-red-700">Xóa ảnh</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Thông tin sản phẩm */}
              <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
                <h2 className="mb-3 text-base font-bold text-[#1f2937]">
                  2. Thông tin sản phẩm & Thành phần
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Tên sản phẩm"
                    placeholder="Ví dụ: Nước tương hữu cơ 500ml"
                    leftIcon={<Package2 size={14} />}
                    value={form.productName}
                    onChange={(e) => updateField('productName', e.target.value)}
                    required
                  />
                  <Input
                    label="Thương hiệu / Nhà sản xuất"
                    placeholder="Ví dụ: Organic Plus"
                    leftIcon={<Factory size={14} />}
                    value={form.productBrand}
                    onChange={(e) => updateField('productBrand', e.target.value)}
                  />
                  <Input
                    label="Khối lượng tịnh (gam)"
                    type="number"
                    placeholder="Ví dụ: 350"
                    leftIcon={<Scale size={14} />}
                    helperText="Nếu không chắc, bạn có thể bỏ trống."
                    value={form.quantityGram}
                    onChange={(e) => updateField('quantityGram', e.target.value)}
                  />
                </div>
                <div className="mt-4">
                  <Textarea
                    label="Danh sách thành phần in trên nhãn (nếu có)"
                    required
                    rows={5}
                    placeholder="Dán hoặc nhập từng thành phần, cách nhau bởi dấu phẩy. Ví dụ: nước, đường, muối, dầu nành, hạt tiêu, phụ gia E441."
                    helperText={`Hệ thống sẽ đối chiếu các yếu tố phổ biến. Hiện tại: ${form.ingredientText.length} ký tự.`}
                    value={form.ingredientText}
                    onChange={(e) => updateField('ingredientText', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Cột bên phải: isLoading Skeleton / hướng dẫn / submit */}
            <aside className="flex flex-col gap-5">
              {isScanning ? (
                <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-3 w-3 animate-pulse rounded-full bg-[#2e7d32]" />
                    <span className="text-sm font-bold text-[#1f2937]">
                      Đang phân tích thành phần & nhãn...
                    </span>
                  </div>
                  <SkeletonLoader count={2} variant="card" />
                  <div className="mt-4">
                    <SkeletonLoader count={4} variant="text" />
                  </div>
                </div>
              ) : (
                <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f5e9]">
                      <Info size={15} className="text-[#2e7d32]" />
                    </div>
                    <h3 className="text-sm font-bold text-[#1f2937]">Quy trình 3 bước</h3>
                  </div>
                  <ol className="space-y-3 text-sm text-[#1f2937]">
                    <li className="flex gap-2">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2e7d32] text-[11px] font-bold text-white">
                        1
                      </span>
                      <span>
                        Tải ảnh nhãn (ảnh chụp rõ phần in thành phần) hoặc nhập danh sách thành phần
                        từ bao bì.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2e7d32] text-[11px] font-bold text-white">
                        2
                      </span>
                      <span>
                        Bấm <strong>Bắt đầu quét</strong>, sau đó trả lời bộ câu hỏi bổ sung về nước
                        dùng xương, nước mắm, mỡ động vật…
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2e7d32] text-[11px] font-bold text-white">
                        3
                      </span>
                      <span>
                        Nhận kết quả tham chiếu theo 3 nhóm: phù hợp, không phù hợp, hoặc chưa đủ
                        thông tin.
                      </span>
                    </li>
                  </ol>
                  <div className="mt-4 rounded-[12px] border border-[#fde68a] bg-amber-50 p-3 text-xs text-amber-800">
                    <div className="mb-1 flex items-center gap-1 font-bold">
                      <AlertTriangle size={13} /> Lưu ý quan trọng
                    </div>
                    Kết quả này là tham chiếu theo thông tin bạn cung cấp, không thay cho việc đọc kỹ
                    nhãn sản phẩm hay tư vấn từ nhà sản xuất / chuyên gia dinh dưỡng.
                  </div>
                </div>
              )}

              <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
                <h3 className="mb-3 text-sm font-bold text-[#1f2937]">Hành động</h3>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={isScanning}
                    leftIcon={<ScanLine size={15} />}
                    onClick={handleStartScan}
                  >
                    Bắt đầu quét
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    fullWidth
                    leftIcon={<RefreshCw size={14} />}
                    onClick={resetAll}
                  >
                    Đặt lại form
                  </Button>
                  {_isLoggedIn && onNavigate && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      fullWidth
                      leftIcon={<HistoryIcon size={14} />}
                      onClick={handleLoadHistory}
                    >
                      Xem lịch sử quét của bạn
                    </Button>
                  )}
                </div>

                {historyState !== 'idle' && (
                  <div className="mt-4">
                    <div className="mb-2 text-xs font-bold text-[#1f2937]">Lịch sử gần đây</div>
                    {historyState === 'loading' ? (
                      <SkeletonLoader count={3} variant="text" />
                    ) : history.length === 0 ? (
                      <div className="text-xs text-[#6b7280]">Chưa có lịch sử.</div>
                    ) : (
                      <ul className="space-y-2">
                        {history.map((h) => (
                          <li
                            key={h.id}
                            className="flex items-start justify-between gap-3 rounded-[10px] border border-[#e5e7eb] bg-slate-50 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-[#1f2937]">
                                {h.productName}
                              </div>
                              <div className="text-[11px] text-[#6b7280]">{h.noteShort}</div>
                            </div>
                            <StatusBadge status={h.status} size="sm" />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </aside>
          </section>
        )}

        {/* ======= TAB 2: Xác nhận & Bổ sung ======= */}
        {tab === 'confirm' && (
          <section className="grid gap-6 lg:grid-cols-[1.25fr_minmax(0,0.9fr)]">
            <div className="flex flex-col gap-5">
              <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-[#1f2937]">
                      Bộ câu hỏi kiểm tra bổ sung
                    </h2>
                    <p className="mt-1 text-xs text-[#6b7280]">
                      Trả lời hết 6 câu hỏi để hệ thống có đủ cơ sở tham chiếu trước khi trả kết quả
                      cuối.
                    </p>
                  </div>
                  <StatusBadge
                    status="info"
                    label={`${countAnswered} / ${CONFIRM_QUESTIONS.length} đã trả lời`}
                    size="sm"
                  />
                </div>

                {isScanning ? (
                  <div className="py-4">
                    <SkeletonLoader count={5} variant="text" />
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {CONFIRM_QUESTIONS.map((q, idx) => (
                      <li
                        key={q.key}
                        className="rounded-[12px] border border-[#e5e7eb] bg-slate-50/70 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#2e7d32] ring-1 ring-[#c8e6c9]">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-[#1f2937]">
                              {q.question}
                            </div>
                            <div className="mt-0.5 text-xs text-[#6b7280]">{q.hint}</div>
                            <div className="mt-3 inline-flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant={confirm[q.key] === true ? 'danger' : 'outline'}
                                onClick={() => answerConfirm(q.key, true)}
                              >
                                Có / Rất có thể
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={confirm[q.key] === false ? 'primary' : 'outline'}
                                onClick={() => answerConfirm(q.key, false)}
                              >
                                Không / Theo nhãn là không
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={confirm[q.key] === null ? 'secondary' : 'ghost'}
                                onClick={() => answerConfirm(q.key, false)}
                                disabled={false}
                              >
                                {confirm[q.key] === null ? 'Tôi chưa chắc / bỏ qua' : 'Đã bỏ qua'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <aside className="flex flex-col gap-5">
              <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
                <h3 className="mb-3 text-sm font-bold text-[#1f2937]">Tóm tắt thông tin đã nhập</h3>
                {isScanning ? (
                  <SkeletonLoader count={4} variant="text" />
                ) : (
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-xs font-bold text-[#6b7280]">Tên sản phẩm</dt>
                      <dd className="text-[#1f2937]">
                        {form.productName || <span className="text-[#6b7280]">(chưa nhập)</span>}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold text-[#6b7280]">Thương hiệu</dt>
                      <dd className="text-[#1f2937]">
                        {form.productBrand || <span className="text-[#6b7280]">(chưa nhập)</span>}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold text-[#6b7280]">Ảnh nhãn</dt>
                      <dd className="text-[#1f2937]">
                        {form.imagePreview ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-[#2e7d32]">
                            <CheckCircle2 size={12} /> Đã cung cấp
                          </span>
                        ) : (
                          <span className="text-[#6b7280]">Chưa cung cấp ảnh</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold text-[#6b7280]">Thành phần</dt>
                      <dd className="line-clamp-4 text-xs leading-5 text-[#1f2937]">
                        {form.ingredientText || (
                          <span className="text-[#6b7280]">(chưa nhập)</span>
                        )}
                      </dd>
                    </div>
                    {result && (
                      <div className="mt-2 border-t border-[#e5e7eb] pt-3">
                        <dt className="mb-1.5 text-xs font-bold text-[#6b7280]">
                          Trạng thái bước 1 (sau khi quét lần đầu)
                        </dt>
                        <StatusBadge status={result.status} />
                      </div>
                    )}
                  </dl>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isScanning}
                  leftIcon={<CheckSquare size={15} />}
                  onClick={handleConfirmAndFinish}
                >
                  Xác nhận & Xem kết quả
                  <ChevronRight size={15} />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  fullWidth
                  leftIcon={<ScanLine size={14} />}
                  onClick={() => setTab('scanner')}
                >
                  Quay lại chỉnh sửa ảnh / thành phần
                </Button>
              </div>
            </aside>
          </section>
        )}

        {/* ======= TAB 3: Kết quả ======= */}
        {tab === 'result' && (
          <section className="flex flex-col gap-6">
            {isScanning ? (
              <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-6 shadow-xs">
                <div className="mb-4 flex items-center gap-2 text-sm font-bold text-[#1f2937]">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-[#2e7d32]" />
                  Đang tổng hợp kết quả tham chiếu...
                </div>
                <SkeletonLoader count={2} variant="card" />
              </div>
            ) : !result ? (
              <div className="rounded-[16px] border border-dashed border-[#c8e6c9] bg-white p-8 text-center shadow-xs">
                <BarChart3 size={30} className="mx-auto mb-2 text-[#2e7d32]" />
                <div className="text-lg font-bold text-[#1f2937]">Chưa có kết quả</div>
                <p className="mx-auto mt-1 max-w-lg text-sm text-[#6b7280]">
                  Quay về tab 1 để tải ảnh hoặc nhập thành phần, sau đó bấm <strong>Bắt đầu quét</strong> và
                  hoàn thành tab 2 để có kết quả tham chiếu.
                </p>
                <div className="mt-5 flex items-center justify-center gap-2">
                  <Button type="button" variant="primary" leftIcon={<ScanLine size={14} />} onClick={() => setTab('scanner')}>
                    Vào tab Quét & Nhập
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-6 shadow-xs">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <StatusBadge status={result.status} size="md" />
                        <span className="text-xs text-[#6b7280]">
                          Thời gian quét: {new Date(result.scannedAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <h2 className="text-xl font-extrabold tracking-tight text-[#1f2937]">
                        {statusTitle(result.status)}
                      </h2>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#1f2937]">{result.note}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#6b7280]">Sản phẩm</div>
                      <div className="mt-0.5 text-base font-bold text-[#1f2937]">
                        {result.productName}
                      </div>
                      <div className="mt-2 inline-flex flex-wrap items-center gap-1 text-[11px]">
                        {result.basedOn.includes('image') && (
                          <span className="rounded-full bg-[#e8f5e9] px-2 py-0.5 font-bold text-[#2e7d32]">
                            ảnh nhãn
                          </span>
                        )}
                        {result.basedOn.includes('ingredient-text') && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                            thành phần
                          </span>
                        )}
                        {result.basedOn.includes('confirm-checklist') && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 font-bold text-amber-800">
                            đã xác nhận
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[12px] border border-[#e5e7eb] bg-slate-50 p-4">
                      <div className="text-xs font-bold text-[#6b7280]">Tổng thành phần tham chiếu</div>
                      <div className="mt-1 text-2xl font-extrabold text-[#1f2937]">
                        {result.totalIngredientsCount}
                      </div>
                    </div>
                    <div className="rounded-[12px] border border-[#c8e6c9] bg-[#e8f5e9]/60 p-4">
                      <div className="mb-1 flex items-center gap-1 text-xs font-bold text-[#2e7d32]">
                        <CheckCircle2 size={12} /> Không phát hiện dấu hiệu đặc biệt
                      </div>
                      <div className="text-2xl font-extrabold text-[#2e7d32]">
                        {result.safeIngredientsCount}
                      </div>
                    </div>
                    <div
                      className={`rounded-[12px] border p-4 ${
                        result.status === 'unsuitable'
                          ? 'border-red-200 bg-red-50'
                          : 'border-amber-200 bg-amber-50'
                      }`}
                    >
                      <div
                        className={`mb-1 flex items-center gap-1 text-xs font-bold ${
                          result.status === 'unsuitable' ? 'text-red-700' : 'text-amber-800'
                        }`}
                      >
                        {result.status === 'unsuitable' ? (
                          <XCircle size={12} />
                        ) : (
                          <AlertTriangle size={12} />
                        )}
                        Điểm cần đối chiếu thêm
                      </div>
                      <div
                        className={`text-2xl font-extrabold ${
                          result.status === 'unsuitable' ? 'text-red-700' : 'text-amber-800'
                        }`}
                      >
                        {result.flaggedIngredients.length}
                      </div>
                    </div>
                  </div>
                </div>

                {result.flaggedIngredients.length > 0 && (
                  <div className="rounded-[16px] border border-red-200 bg-red-50/60 p-5 shadow-xs">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="flex items-center gap-2 text-base font-bold text-red-800">
                          <XCircle size={16} /> Các yếu tố thường không phù hợp đã phát hiện
                        </h3>
                        <p className="mt-1 text-xs text-red-700/80">
                          Dựa trên thông tin bạn cung cấp, các yếu tố sau thường không phù hợp với chế độ
                          thuần thực vật. Vui lòng kiểm tra kỹ nhãn hoặc liên hệ nhà sản xuất.
                        </p>
                      </div>
                    </div>
                    <ul className="grid gap-3 md:grid-cols-2">
                      {result.flaggedIngredients.map((f) => (
                        <li
                          key={f.id}
                          className="rounded-[12px] border border-red-200 bg-white p-4 shadow-xs"
                        >
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <div className="text-sm font-bold text-[#1f2937]">{f.name}</div>
                            {f.enumber && (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
                                {f.enumber}
                              </span>
                            )}
                            <span className="ml-auto text-[11px] font-bold text-red-700">
                              {(f.confidence * 100).toFixed(0)}% độ tương đồng mô tả
                            </span>
                          </div>
                          {f.source && (
                            <div className="mb-1 text-xs font-semibold text-[#6b7280]">{f.source}</div>
                          )}
                          <p className="text-xs leading-5 text-[#1f2937]">{f.detail}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.status === 'insufficient' && (
                  <div className="rounded-[16px] border border-amber-200 bg-amber-50/60 p-5 shadow-xs">
                    <div className="mb-2 flex items-center gap-2 text-base font-bold text-amber-800">
                      <AlertTriangle size={16} /> Đề xuất bổ sung để có đánh giá đáng tin cậy hơn
                    </div>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">
                      {!form.imagePreview && <li>Tải ảnh nhãn sản phẩm (phần in thành phần).</li>}
                      {form.ingredientText.trim().length < 20 && (
                        <li>Nhập đủ tối thiểu 20 ký tự danh sách thành phần in trên nhãn.</li>
                      )}
                      {countAnswered < CONFIRM_QUESTIONS.length && (
                        <li>
                          Hoàn thành {CONFIRM_QUESTIONS.length - countAnswered} câu hỏi bổ sung còn lại ở
                          tab 2.
                        </li>
                      )}
                    </ul>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button type="button" variant="primary" size="sm" leftIcon={<CheckSquare size={13} />} onClick={() => setTab('confirm')}>
                        Vào tab 2 để trả lời tiếp
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        leftIcon={<ScanLine size={13} />}
                        onClick={() => setTab('scanner')}
                      >
                        Quay lại tab 1
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
                  <div className="text-sm text-[#1f2937]">
                    <strong>Xong 1 lượt kiểm tra?</strong> Bạn có thể bắt đầu lại với sản phẩm khác, hoặc
                    nếu đã đăng nhập, xem lịch sử các lần quét trước.
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      leftIcon={<RefreshCw size={14} />}
                      onClick={resetAll}
                    >
                      Quét sản phẩm khác
                    </Button>
                    {_isLoggedIn && onNavigate && (
                      <Button
                        type="button"
                        variant="outline"
                        size="md"
                        leftIcon={<HistoryIcon size={14} />}
                        onClick={handleLoadHistory}
                      >
                        Xem lịch sử
                      </Button>
                    )}
                    {onNavigate && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="md"
                        leftIcon={<ChevronRight size={14} />}
                        onClick={() => onNavigate('/recipes')}
                      >
                        Khám phá công thức thay thế
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </form>
  )
}
