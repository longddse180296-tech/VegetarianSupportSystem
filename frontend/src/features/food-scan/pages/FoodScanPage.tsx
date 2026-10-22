import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { History as HistoryIcon, LogIn, ScanLine } from 'lucide-react'
import { Badge, Button, PageHeading, SkeletonLoader } from '../../../shared/components'
import { Modal } from '../../../shared/components/Modal'
import {
  analyzeScanImage,
  evaluateScan,
  getScanDetail,
  getScanHistory,
  type SavedFoodScan,
  type ScanAnalysis,
} from '../api/foodScanApi'
import type {
  DraftIngredient,
  ScanHistoryItem,
  ScanSourceType,
} from '../types/foodScan.types'
import ScanUploadPanel from '../components/ScanUploadPanel'
import ConfirmChecklistCard from '../components/ConfirmChecklistCard'
import ScanResultCard from '../components/ScanResultCard'
import ScanHistoryList from '../components/ScanHistoryList'
import ScanHistoryDetail from '../components/ScanHistoryDetail'

import './FoodScanPage.css'

type ScanTab = 'scanner' | 'confirm' | 'result'
type HistoryStatus = 'idle' | 'loading' | 'done'

function labelIngredients(text: string): DraftIngredient[] {
  return text
    .replace(/^\s*thành phần\s*:/i, '')
    .split(/[,;\n]+/)
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 100)
    .map((name) => ({
      id: crypto.randomUUID(),
      name: name.slice(0, 200),
      kind: 'Unknown' as const,
      source: 'LabelOcr' as const,
    }))
}

function unresolvedQuestions(analysis: ScanAnalysis, resolved: string[]): string[] {
  if (analysis.sourceType !== 'Dish') return []
  return [...new Set([
    ...analysis.data.unknownFactors,
    ...analysis.data.followUpQuestions,
  ])].filter((question) => !resolved.includes(question))
}

interface FoodScanPageProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

export default function FoodScanPage({ onNavigate, isLoggedIn = false }: FoodScanPageProps) {
  const [tab, setTab] = useState<ScanTab>('scanner')
  const [sourceType, setSourceType] = useState<ScanSourceType>('Dish')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<ScanAnalysis | null>(null)
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([])
  const [correctedLabelText, setCorrectedLabelText] = useState('')
  const [labelIncomplete, setLabelIncomplete] = useState(false)
  const [resolvedQuestions, setResolvedQuestions] = useState<string[]>([])
  const [ingredientsComplete, setIngredientsComplete] = useState(false)
  const [result, setResult] = useState<SavedFoodScan | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [history, setHistory] = useState<ScanHistoryItem[]>([])
  const [historyState, setHistoryState] = useState<HistoryStatus>('idle')
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [historyPage, setHistoryPage] = useState(0)
  const [historyTotalCount, setHistoryTotalCount] = useState(0)
  const [historyRetryPage, setHistoryRetryPage] = useState(1)
  const historyLoadingRef = useRef(false)
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null)
  const [selectedScan, setSelectedScan] = useState<SavedFoodScan | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const detailRequestId = useRef(0)

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setAnalysis(null)
    setResult(null)
    setScanError(null)
    setTab('scanner')
  }

  const resetScan = () => {
    clearImage()
    setIngredients([])
    setCorrectedLabelText('')
    setLabelIncomplete(false)
    setResolvedQuestions([])
    setIngredientsComplete(false)
  }

  const changeSourceType = (next: ScanSourceType) => {
    if (next === sourceType) return
    resetScan()
    setSourceType(next)
  }

  const processFile = (file: File) => {
    const validExtensions = /\.(jpe?g|png|webp)$/i
    const validMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    const isValidType = validMimes.includes(file.type) || validExtensions.test(file.name)
    if (!isValidType || file.size === 0 || file.size > 5 * 1024 * 1024) {
      setScanError('Chỉ hỗ trợ file ảnh định dạng JPG, PNG hoặc WEBP với kích thước tối đa 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setImageFile(file)
      setImagePreview(typeof reader.result === 'string' ? reader.result : null)
      setAnalysis(null)
      setResult(null)
      setIngredients([])
      setIngredientsComplete(false)
      setScanError(null)
      setTab('scanner')
    }
    reader.onerror = () => setScanError('Không đọc được ảnh đã chọn.')
    reader.readAsDataURL(file)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    processFile(file)
  }

  const handleAnalyze = async () => {
    if (!imageFile || isScanning) {
      if (!imageFile) setScanError('Hãy chọn ảnh trước khi phân tích.')
      return
    }
    setIsScanning(true)
    setScanError(null)
    try {
      const response = await analyzeScanImage(sourceType, imageFile)
      setAnalysis(response)
      setResult(null)
      setResolvedQuestions([])
      setIngredientsComplete(false)
      if (response.sourceType === 'Dish') {
        setIngredients(response.data.visibleIngredients.map((name, index) => ({
          id: crypto.randomUUID(),
          name: name.slice(0, 200),
          kind: response.data.suggestedIngredientKinds?.[index] ?? 'Unknown',
          source: 'AiSuggested',
        })))
        setCorrectedLabelText('')
        setLabelIncomplete(false)
      } else {
        const text = response.data.extractedText || ''
        setCorrectedLabelText(text)
        setIngredients(labelIngredients(text))
        setLabelIncomplete(response.data.isIncomplete)
      }
      setTab('confirm')
    } catch (error) {
      setScanError(error instanceof Error ? error.message : 'Mất kết nối hoặc máy chủ phản hồi quá lâu, vui lòng thử lại.')
    } finally {
      setIsScanning(false)
    }
  }

  const handleEvaluate = async () => {
    if (!analysis || isScanning) return
    const unknownAnswers = unresolvedQuestions(analysis, resolvedQuestions).slice(0, 30)
    const confirmed = ingredients
      .filter((item) => item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        kind: item.kind,
        source: item.source,
      }))
    const canComplete = confirmed.length > 0 && confirmed.every((item) =>
      item.kind !== 'Unknown' && (item.source === 'UserConfirmed' || item.source === 'UserEdited'),
    ) && unknownAnswers.length === 0 && !(sourceType === 'Label' && labelIncomplete)

    setIsScanning(true)
    setScanError(null)
    try {
      const saved = await evaluateScan({
        ingredients: confirmed,
        ingredientsComplete: ingredientsComplete && canComplete,
        sourceType: analysis.sourceType,
        correctedLabelText: analysis.sourceType === 'Label' ? correctedLabelText.trim() || null : null,
        labelIncomplete: analysis.sourceType === 'Label' && labelIncomplete,
        unknownAnswers,
        previousScanId: result?.id ?? null,
      })
      setResult(saved)
      setTab('result')
    } catch (error) {
      setScanError(error instanceof Error ? error.message : 'Mất kết nối hoặc máy chủ phản hồi quá lâu, vui lòng thử lại.')
    } finally {
      setIsScanning(false)
    }
  }

  const handleLoadHistory = async (page = 1) => {
    if (historyLoadingRef.current) return
    historyLoadingRef.current = true
    setHistoryRetryPage(page)
    setHistoryState('loading')
    setHistoryError(null)
    try {
      const data = await getScanHistory(page)
      setHistory((current) => page === 1 ? data.items : [...current, ...data.items])
      setHistoryPage(data.page)
      setHistoryTotalCount(data.totalCount)
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : 'Không tải được lịch sử quét.')
    } finally {
      historyLoadingRef.current = false
      setHistoryState('done')
    }
  }

  const handleSelectHistory = async (id: string) => {
    const requestId = ++detailRequestId.current
    setSelectedScanId(id)
    setSelectedScan(null)
    setDetailError(null)
    setDetailLoading(true)
    try {
      const scan = await getScanDetail(id)
      if (requestId === detailRequestId.current) setSelectedScan(scan)
    } catch (error) {
      if (requestId === detailRequestId.current) {
        setDetailError(error instanceof Error ? error.message : 'Không tải được chi tiết lần quét.')
      }
    } finally {
      if (requestId === detailRequestId.current) setDetailLoading(false)
    }
  }

  return (
    <div className="ui-page-container py-8 space-y-6">
      <PageHeading
        title="Kiểm tra món ăn & thành phần"
        description="Tải lên ảnh món ăn hoặc nhãn thành phần để phân tích và đối chiếu mức độ phù hợp với chế độ ăn chay của bạn."
        breadcrumbs={[
          { label: 'Trang chủ', onClick: () => onNavigate?.('/') },
          { label: 'Quét thực phẩm' },
        ]}
        eyebrow={<Badge icon={<ScanLine size={14} />}>Quét &amp; phân tích thực phẩm</Badge>}
      />

        {!isLoggedIn ? (
          <section className="rounded-2xl border border-slate-200/90 bg-white p-8 sm:p-10 text-center shadow-xs max-w-xl mx-auto space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-[#2E7D32] border border-emerald-100 shadow-2xs">
              <ScanLine size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">Đăng nhập để quét & phân tích thực phẩm</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Hệ thống cần tài khoản của bạn để đối chiếu thành phần với <strong>chế độ ăn chay</strong>, <strong>dị ứng thực phẩm</strong> trong hồ sơ và lưu lịch sử quét.
              </p>
            </div>
            <div className="pt-2">
              {onNavigate && (
                <Button
                  type="button"
                  variant="primary"
                  leftIcon={<LogIn size={15} />}
                  onClick={() => onNavigate('/auth/login')}
                  className="!bg-[#2E7D32] hover:!bg-[#1B5E20] !text-white px-6 py-2.5 font-bold shadow-xs cursor-pointer"
                >
                  Đăng nhập / Đăng ký ngay
                </Button>
              )}
            </div>
          </section>
        ) : (
          <>
            {/* ============= STEPPER BAR ============= */}
            <nav aria-label="Các bước quét" className="rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-2xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                {/* Step 1 */}
                <button
                  type="button"
                  onClick={() => setTab('scanner')}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer text-left ${
                    tab === 'scanner'
                      ? 'bg-emerald-50/80 border border-emerald-200 text-emerald-950 font-bold shadow-2xs'
                      : 'hover:bg-slate-50 text-slate-600 font-medium'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                      tab === 'scanner'
                        ? 'bg-[#2E7D32] text-white shadow-xs'
                        : imageFile
                        ? 'bg-emerald-100 text-[#2E7D32]'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    1
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs text-slate-400 font-medium">Bước 1</div>
                    <div className="truncate text-sm font-bold text-slate-800">Chọn ảnh thực phẩm</div>
                  </div>
                </button>

                {/* Step 2 */}
                <button
                  type="button"
                  disabled={!analysis}
                  onClick={() => setTab('confirm')}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
                    !analysis
                      ? 'opacity-50 cursor-not-allowed text-slate-400'
                      : tab === 'confirm'
                      ? 'bg-emerald-50/80 border border-emerald-200 text-emerald-950 font-bold shadow-2xs cursor-pointer'
                      : 'hover:bg-slate-50 text-slate-600 font-medium cursor-pointer'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                      tab === 'confirm'
                        ? 'bg-[#2E7D32] text-white shadow-xs'
                        : result
                        ? 'bg-emerald-100 text-[#2E7D32]'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    2
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs text-slate-400 font-medium">Bước 2</div>
                    <div className="truncate text-sm font-bold text-slate-800">Xác nhận thành phần</div>
                  </div>
                </button>

                {/* Step 3 */}
                <button
                  type="button"
                  disabled={!result}
                  onClick={() => setTab('result')}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
                    !result
                      ? 'opacity-50 cursor-not-allowed text-slate-400'
                      : tab === 'result'
                      ? 'bg-emerald-50/80 border border-emerald-200 text-emerald-950 font-bold shadow-2xs cursor-pointer'
                      : 'hover:bg-slate-50 text-slate-600 font-medium cursor-pointer'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                      tab === 'result'
                        ? 'bg-[#2E7D32] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    3
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs text-slate-400 font-medium">Bước 3</div>
                    <div className="truncate text-sm font-bold text-slate-800">Kết quả đánh giá</div>
                  </div>
                </button>
              </div>
            </nav>

            {scanError && (
              <div role="alert" className="rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-800 flex items-start gap-3 shadow-2xs">
                <span className="text-red-600 text-base font-bold shrink-0">⚠️</span>
                <span>{scanError}</span>
              </div>
            )}

            {tab === 'scanner' && (
              <div className="grid gap-6 lg:grid-cols-[1.25fr_minmax(0,0.9fr)]">
                <ScanUploadPanel
                  sourceType={sourceType}
                  imageFile={imageFile}
                  imagePreview={imagePreview}
                  fileInputRef={fileInputRef}
                  isScanning={isScanning}
                  onSourceTypeChange={changeSourceType}
                  onPickFile={() => fileInputRef.current?.click()}
                  onFileChange={handleFileChange}
                  onFileDrop={processFile}
                  onClearImage={clearImage}
                />
                <aside className="space-y-5">
                  <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                    <div className="flex items-center gap-2 mb-3.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[#2E7D32]">
                        <ScanLine size={15} />
                      </div>
                      <h2 className="text-sm font-bold text-slate-800">Thao tác phân tích</h2>
                    </div>

                    <div className="space-y-2.5">
                      <Button
                        type="button"
                        fullWidth
                        onClick={() => void handleAnalyze()}
                        isLoading={isScanning}
                        disabled={!imageFile || isScanning}
                        className="!bg-[#2E7D32] hover:!bg-[#1B5E20] !text-white font-bold py-2.5 shadow-2xs"
                      >
                        {imageFile ? 'Bắt đầu phân tích ảnh' : 'Hãy chọn ảnh để phân tích'}
                      </Button>
                      <Button
                        type="button"
                        fullWidth
                        variant="ghost"
                        onClick={() => void handleLoadHistory(1)}
                        disabled={historyState === 'loading'}
                        leftIcon={<HistoryIcon size={14} />}
                        className="border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50"
                      >
                        Xem lịch sử quét của bạn
                      </Button>
                    </div>

                    <ScanHistoryList
                      historyState={historyState}
                      history={history}
                      totalCount={historyTotalCount}
                      error={historyError}
                      onRetry={() => void handleLoadHistory(historyRetryPage)}
                      onLoadMore={() => void handleLoadHistory(historyPage + 1)}
                      onSelect={(id) => void handleSelectHistory(id)}
                    />

                    {/* Hộp cảnh báo màu vàng chuẩn AGENTS.md */}
                    <div className="mt-4 rounded-xl bg-amber-50/80 p-3.5 text-xs text-amber-900 border border-amber-200/80 leading-relaxed flex items-start gap-2.5">
                      <span className="text-amber-700 font-bold shrink-0 mt-0.5">⚠️</span>
                      <p>
                        Ảnh không chứng minh được thành phần ẩn (nước dùng, nước mắm, phụ gia). Kết quả đối chiếu với hồ sơ dinh dưỡng của bạn và không thay thế việc kiểm tra thực tế.
                      </p>
                    </div>
                  </section>
                </aside>
              </div>
            )}

            {tab === 'confirm' && analysis && (
              <ConfirmChecklistCard
                analysis={analysis}
                ingredients={ingredients}
                correctedLabelText={correctedLabelText}
                labelIncomplete={labelIncomplete}
                resolvedQuestions={resolvedQuestions}
                ingredientsComplete={ingredientsComplete}
                isSaving={isScanning}
                onIngredientsChange={(value) => { setIngredients(value); setIngredientsComplete(false) }}
                onCorrectedLabelTextChange={(value) => { setCorrectedLabelText(value); setIngredientsComplete(false) }}
                onLabelIncompleteChange={(value) => { setLabelIncomplete(value); setIngredientsComplete(false) }}
                onToggleQuestion={(question) => {
                  setResolvedQuestions((current) => current.includes(question)
                    ? current.filter((item) => item !== question)
                    : [...current, question])
                  setIngredientsComplete(false)
                }}
                onIngredientsCompleteChange={setIngredientsComplete}
                onParseLabel={() => { setIngredients(labelIngredients(correctedLabelText)); setIngredientsComplete(false) }}
                onEvaluate={() => void handleEvaluate()}
                onBack={() => setTab('scanner')}
              />
            )}

            {tab === 'result' && (
              <ScanResultCard
                result={result}
                onResetAll={resetScan}
                onReevaluate={() => setTab('confirm')}
                onLoadHistory={() => { setTab('scanner'); void handleLoadHistory(1) }}
                isLoggedIn={isLoggedIn}
              />
            )}
          </>
        )}

        <Modal
          isOpen={selectedScanId !== null}
          onClose={() => { detailRequestId.current += 1; setSelectedScanId(null) }}
          title="Chi tiết lần quét"
          maxWidth="2xl"
        >
          {detailLoading && <SkeletonLoader count={3} variant="text" />}
          <ScanHistoryDetail
            scan={selectedScan}
            loading={false}
            error={detailError}
            onRetry={() => { if (selectedScanId) void handleSelectHistory(selectedScanId) }}
          />
        </Modal>
      </div>
  )
}
