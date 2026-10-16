import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { History as HistoryIcon, ScanLine } from 'lucide-react'
import { PageHeading, Badge, Button, SkeletonLoader } from '../../../shared/components'
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

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size === 0 || file.size > 10 * 1024 * 1024) {
      setScanError('Chọn ảnh JPG, PNG hoặc WEBP tối đa 10 MB.')
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
        setIngredients(response.data.visibleIngredients.map((name) => ({
          id: crypto.randomUUID(),
          name: name.slice(0, 200),
          kind: 'Unknown',
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
      setScanError(error instanceof Error ? error.message : 'Không phân tích được ảnh.')
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
      setScanError(error instanceof Error ? error.message : 'Không lưu được kết quả quét.')
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
    <div className="min-h-screen bg-[#f6faf7] py-6 text-[#1f2937]">
      <div className="ui-page-container space-y-5">
        <PageHeading
          title="Kiểm tra món ăn & thành phần"
          description="Tải ảnh món ăn hoặc nhãn thành phần và xác nhận thông tin trước khi đánh giá."
          breadcrumbs={[{label:'Trang chủ', onClick: () => onNavigate?.('/')}, {label:'Quét thực phẩm'}]}
          eyebrow={<Badge icon={<ScanLine />}>Quét &amp; phân tích thực phẩm</Badge>}
        />

        {!isLoggedIn ? (
          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-lg font-bold">Đăng nhập để quét ảnh</h2>
            <p className="mt-2 text-sm text-slate-600">Kết quả gắn với chế độ ăn và lịch sử của bạn nên cần tài khoản.</p>
            {onNavigate && <Button type="button" className="mt-4" onClick={() => onNavigate('/auth/login')}>Đăng nhập</Button>}
          </section>
        ) : (
          <>
            <nav aria-label="Các bước quét" className="flex flex-wrap gap-2 rounded-xl border bg-white p-2">
              <Button type="button" variant={tab === 'scanner' ? 'primary' : 'ghost'} onClick={() => setTab('scanner')}>1. Chọn ảnh</Button>
              <Button type="button" variant={tab === 'confirm' ? 'primary' : 'ghost'} disabled={!analysis} onClick={() => setTab('confirm')}>2. Xác nhận</Button>
              <Button type="button" variant={tab === 'result' ? 'primary' : 'ghost'} disabled={!result} onClick={() => setTab('result')}>3. Kết quả</Button>
            </nav>

            {scanError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{scanError}</div>}

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
                  onClearImage={clearImage}
                />
                <aside className="space-y-5">
                  <section className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
                    <h2 className="text-sm font-bold">Luồng xử lý của BE</h2>
                    <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
                      <li>{sourceType === 'Dish' ? 'AI gợi ý món và nguyên liệu nhìn thấy.' : 'OCR chép phần chữ đọc được trên nhãn.'}</li>
                      <li>Bạn sửa và xác nhận nguyên liệu, bổ sung điều còn chưa rõ.</li>
                      <li>BE đánh giá bốn chế độ ăn và lưu bản ghi vào lịch sử.</li>
                    </ol>
                    <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                      Ảnh không chứng minh được thành phần ẩn. Kết quả không thay thế việc đọc nhãn hay kiểm tra dị ứng.
                    </p>
                  </section>
                  <section className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
                    <h2 className="text-sm font-bold">Hành động</h2>
                    <div className="mt-3 space-y-2">
                      <Button type="button" fullWidth onClick={() => void handleAnalyze()} isLoading={isScanning} disabled={!imageFile || isScanning}>
                        Bắt đầu phân tích ảnh
                      </Button>
                      <Button type="button" fullWidth variant="outline" onClick={resetScan} disabled={isScanning}>Đặt lại</Button>
                      <Button type="button" fullWidth variant="ghost" onClick={() => void handleLoadHistory(1)} disabled={historyState === 'loading'} leftIcon={<HistoryIcon size={14} />}>
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
    </div>
  )
}
