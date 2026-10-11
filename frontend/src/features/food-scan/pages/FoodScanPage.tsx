import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  AlertTriangle,
  ChevronRight,
  CheckSquare,
  History as HistoryIcon,
  Info,
  RefreshCw,
  ScanLine,
} from 'lucide-react'
import {
  Button,
  SkeletonLoader,
} from '../../../shared/components'
import { confirmScan, getScanHistory, startScan } from '../api/foodScanApi'
import type {
  ConfirmChecklistAnswers,
  FoodScanResult,
  ScanInputForm,
} from '../types/foodScan.types'

import './FoodScanPage.css'
import ScanUploadPanel from '../components/ScanUploadPanel'
import ConfirmChecklistCard, {
  type ConfirmQuestion,
} from '../components/ConfirmChecklistCard'
import ScanResultCard from '../components/ScanResultCard'
import ScanHistoryList from '../components/ScanHistoryList'

type ScanTab = 'scanner' | 'confirm' | 'result'
type HistoryStatus = 'idle' | 'loading' | 'done'

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
  { key: 'result', label: 'Kết quả', icon: ChevronRight },
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
  const [history, setHistory] = useState(
    (): ReturnType<typeof getScanHistory> extends Promise<infer T> ? T : never[] => [],
  )
  const [historyState, setHistoryState] = useState<HistoryStatus>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateField = <K extends keyof ScanInputForm>(key: K, value: ScanInputForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const answerConfirm = (
    key: keyof ConfirmChecklistAnswers,
    value: boolean | null,
  ) => {
    setConfirm((prev) => ({ ...prev, [key]: value }))
  }

  const countAnswered = CONFIRM_QUESTIONS.filter((q) => confirm[q.key] !== null).length

  const handlePickFile = () => fileInputRef.current?.click()

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!/\.(jpe?g|png|webp)$/i.test(file.name)) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      updateField('imageFile', file)
      updateField('imagePreview', url)
    }
    reader.readAsDataURL(file)
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
      setHistoryState((prev) => (prev === 'loading' ? 'done' : prev))
    }
  }

  return (
    <div className="min-h-screen bg-[#f6faf7] text-[#1f2937]">
      <form
        className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8"
        onSubmit={(e) => e.preventDefault()}
      >
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
              disabled={isScanning}
            >
              {t.label}
            </Button>
          ))}
        </div>

        {tab === 'scanner' && (
          <section className="grid gap-6 lg:grid-cols-[1.25fr_minmax(0,0.9fr)]">
            <ScanUploadPanel
              form={form}
              fileInputRef={fileInputRef}
              onUpdate={updateField}
              onPickFile={handlePickFile}
              onClearImage={clearImage}
              onFillSample={fillSampleIngredientText}
              onFileChange={handleFileChange}
              isScanning={isScanning}
            />

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
                    disabled={isScanning}
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
                      disabled={isScanning}
                    >
                      Xem lịch sử quét của bạn
                    </Button>
                  )}
                </div>
                <ScanHistoryList historyState={historyState} history={history} />
              </div>
            </aside>
          </section>
        )}

        {tab === 'confirm' && (
          <ConfirmChecklistCard
            questions={CONFIRM_QUESTIONS}
            answers={confirm}
            countAnswered={countAnswered}
            isScanning={isScanning}
            onAnswer={answerConfirm}
            form={form}
            resultAfterFirstScan={result}
            onConfirmFinish={handleConfirmAndFinish}
            onBackToScanner={() => setTab('scanner')}
          />
        )}

        {tab === 'result' && (
          <ScanResultCard
            isScanning={isScanning}
            result={result}
            form={form}
            countAnswered={countAnswered}
            totalConfirmQuestions={CONFIRM_QUESTIONS.length}
            confirmQuestionsLength={CONFIRM_QUESTIONS.length}
            flaggedIngredients={result?.flaggedIngredients ?? []}
            resultBasedOn={result?.basedOn ?? []}
            resultProductName={result?.productName ?? ''}
            resultScannedAt={result?.scannedAt ?? new Date(0).toISOString()}
            resultTotalCount={result?.totalIngredientsCount ?? 0}
            resultSafeCount={result?.safeIngredientsCount ?? 0}
            onGoScanner={() => setTab('scanner')}
            onGoConfirm={() => setTab('confirm')}
            onResetAll={resetAll}
            onLoadHistory={handleLoadHistory}
            isLoggedIn={Boolean(_isLoggedIn)}
            onNavigateRecipes={onNavigate ? () => onNavigate('/recipes') : undefined}
            onNavigateHistory={
              _isLoggedIn && onNavigate ? () => {} : undefined
            }
          />
        )}
      </form>
    </div>
  )
}
