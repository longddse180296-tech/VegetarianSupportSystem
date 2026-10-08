import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react'
import {
  Upload,
  FileText,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Camera,
  BookOpen,
  Download,
  Leaf,
  AlertCircle,
  Lightbulb,
  Search,
  Bookmark,
  Calculator,
  Store,
  Eye,
  Sliders,
  RefreshCw,
  History,
  ScanLine,
  X,
} from 'lucide-react'
import './FoodScanPage.css'

type ScanTab = 'scanner' | 'result' | 'history'
type ScanStep = 'upload' | 'scanning' | 'result'

interface IngredientRow {
  id: string
  name: string
  enumber?: string
  verdict: 'safe' | 'warning' | 'danger'
  verdictLabel: string
  source: string
  veganCompatibility: 'Vegan-Sai' | 'Ovo-Veg-Sai' | 'Lacto-Veg-Sai' | 'Món-món'
  veganText: string
  detailNote: string
  certaintyPct: number
  substituteText?: string
}

interface AltOption {
  id: string
  replaceFor: string
  matchPct: number
  title: string
  subtitle: string
  description: string
  ratio: string
  time: string
  storeAction?: string
  primaryCta: string
  primaryAction?: 'bookmark-recipe' | 'view-guide' | 'view-store'
}

const TAB_LIST: { key: ScanTab; label: string; icon: typeof ScanLine }[] = [
  { key: 'scanner', label: 'Quét & Nhập', icon: ScanLine },
  { key: 'result', label: 'Kết quả phân tích', icon: Search },
  { key: 'history', label: 'Lịch sử quét', icon: History },
]

const INGREDIENT_ROWS: IngredientRow[] = [
  {
    id: 'i1',
    name: 'Nước dùng xương heo (Pork Bone Broth)',
    verdict: 'danger',
    verdictLabel: 'Cấm & Nguy hiểm nghiêm trọng',
    source:
      'Nguồn gốc: Chế xuất xương heo, nước sôi ninh kỹ qua quá trình ninh lấy vị ngọt (Umami cộng nhiệt).',
    veganCompatibility: 'Vegan-Sai',
    veganText: '❌ Không dùng được cho tất cả các loại chế độ ăn chay vì có chất từ động vật.',
    detailNote: 'Độ chính xác: 99.2%',
    certaintyPct: 99.2,
    substituteText: 'Tìm chất thay thế ↓',
  },
  {
    id: 'i2',
    name: 'Gelatin (Chất làm đặc & ổn định E441)',
    enumber: 'E441',
    verdict: 'danger',
    verdictLabel: 'Phụ gia E441 - Collagen động vật',
    source:
      'Nguồn gốc: Protein dạng keo được tạo ra bằng cách đun sôi da, gân, dây chằng da xương heo/sừ được dùng phổ biến làm siro thuốc ho & Gelato để tạo độ sệt cho các chế độ ăn khác.',
    veganCompatibility: 'Ovo-Veg-Sai',
    veganText: '⚠️ Không dùng các chế độ thực thuần thuần chỉ và chỉ có thể chấp nhận có sử dụng sữa bò/pho mát với chi phối dạng gel.',
    detailNote: 'Độ chính xác: 98.8%',
    certaintyPct: 98.8,
    substituteText: 'Thay bằng: Agar / Pectin ↓',
  },
  { id: 'i3', name: 'Đậu phụ non', verdict: 'safe', verdictLabel: 'Đạt chuẩn 100% Thuần Chay', source: 'Nguồn gốc: Đậu tương', veganCompatibility: 'Món-món', veganText: '✅ 100% Thuần Chay', detailNote: 'Độ chuẩn xác', certaintyPct: 100 },
  { id: 'i4', name: 'Cà chua tươi', verdict: 'safe', verdictLabel: 'Hàm Lycopene', source: 'Nguồn gốc: cây cà chua', veganCompatibility: 'Món-món', veganText: '✅ 100% Thuần Chay', detailNote: '', certaintyPct: 100 },
  { id: 'i5', name: 'Nấm đông cô', verdict: 'safe', verdictLabel: 'Umami tự nhiên', source: 'Nguồn gốc: cây nấm', veganCompatibility: 'Món-món', veganText: '✅ 100% Thuần Chay', detailNote: '', certaintyPct: 100 },
  { id: 'i6', name: 'Hành hoa & Ngò', verdict: 'safe', verdictLabel: 'Thảo mộc thơm', source: 'Nguồn gốc: Thảo mộc tự nhiên', veganCompatibility: 'Món-món', veganText: '✅ 100% Thuần Chay', detailNote: '', certaintyPct: 100 },
  { id: 'i7', name: 'Tiêu đen xay', verdict: 'safe', verdictLabel: 'Hạt tiêu xanh', source: 'Nguồn gốc: thực vật', veganCompatibility: 'Món-món', veganText: '✅ 100% Thuần Chay', detailNote: '', certaintyPct: 100 },
  { id: 'i8', name: 'Muối khoáng biển', verdict: 'safe', verdictLabel: 'Khoáng tự nhiên', source: 'Nguồn gốc: Nước biển bay hơi', veganCompatibility: 'Món-món', veganText: '✅ 100% Thuần Chay', detailNote: '', certaintyPct: 100 },
  { id: 'i9', name: 'Dầu đậu nành', verdict: 'safe', verdictLabel: 'Chất béo thực vật', source: 'Nguồn gốc: Đậu nành ép', veganCompatibility: 'Món-món', veganText: '✅ 100% Thuần Chay', detailNote: '', certaintyPct: 100 },
  { id: 'i10', name: 'Tỏi ta băm', verdict: 'safe', verdictLabel: 'Tỏi Ly Son', source: 'Nguồn gốc: Củ gia vị', veganCompatibility: 'Món-món', veganText: '✅ 100% Thuần Chay', detailNote: '', certaintyPct: 100 },
  { id: 'i11', name: 'Đường mía hữu cơ', verdict: 'safe', verdictLabel: 'Không than xương', source: 'Nguồn gốc: mía (sạch than xương)', veganCompatibility: 'Món-món', veganText: '✅ 100% Thuần Chay', detailNote: '', certaintyPct: 100 },
  { id: 'i12', name: 'Nước lọc tinh khiết', verdict: 'safe', verdictLabel: 'Bọt chuẩn RO', source: 'Nguồn gốc: Nước suối (khử khoáng)', veganCompatibility: 'Món-món', veganText: '✅ 100% Thuần Chay', detailNote: '', certaintyPct: 100 },
]

const ALTERNATIVES: AltOption[] = [
  {
    id: 'a1',
    replaceFor: 'Nước dùng xương',
    matchPct: 96,
    title: 'Nước dùng củ quả thanh mát',
    subtitle: 'Nguồn gốc Umami, 100% thực vật',
    description:
      'Tạo vị ngọt Umami từ rễ ngót, củ cải đường, thảo quả tỏi tây, nấm rơm với rễ cây rau chân vịt. Hòa tan hoàn hảo thay nước dùng xương, giữ được vị ngọt từ rau củ mà không cần bất cứ chất tạo ngọt nhân tạo nào, hoàn toàn không cholesterol xấu.',
    ratio: 'Tỷ lệ 1:1 trong mọi món nấu kho sọt',
    time: '30 - 45 phút Nấu',
    primaryCta: 'Lưu vào công thức của tôi',
    primaryAction: 'bookmark-recipe',
  },
  {
    id: 'a2',
    replaceFor: 'Gelatin (E441)',
    matchPct: 98,
    title: 'Bột Agar-Agar hoặc Pectin',
    subtitle: 'Chất tạo đặc hoàn toàn từ thực vật',
    description:
      'Tạo độ sánh như thạch, kết đông hoàn hảo hơn nước Gelatin khi sử dụng Lập phương (tỷ lệ khác). Dễ bảo quản hơn Gelatin, không bị nóng chảy do nhiệt độ môi trường, phù hợp với những người có bệnh dạ dày hoặc kiêng đạm động vật.',
    ratio: '1/3 muỗng cà phê bột agar cho 200ml sôi.',
    time: 'Đông đặc nhanh chóng ở nhiệt độ phòng',
    primaryCta: 'Xem hướng dẫn sử dụng',
    primaryAction: 'view-guide',
    storeAction: '🛒 Tìm mua bột Agar',
  },
  {
    id: 'a3',
    replaceFor: 'Gia vị nấm đậm',
    matchPct: 95,
    title: 'Dầu hạt nấm hướng dương hữu cơ',
    subtitle: 'Nguyên hương vị đặc trưng Shitake & Men vips',
    description:
      'Tạo mùi nấm hương gần nhất với mùi thơm nướng và chiếu sâu từ vị nấm. Dùng chiên, xào, trộn salad, chiếu khắp mọi loại món chay, giàu vitamin B và dưỡng chất khoáng thiết yếu mà không cần nấu nhiều.',
    ratio: 'Thay thế 1:1 mực vào Nước tương, Hạt nêm. Thêm vào 30% dầu thường, giảm bớt trong nấu ăn.',
    time: '30% dầu thường',
    primaryCta: 'Xem thương hiệu đáng tin',
    primaryAction: 'view-store',
  },
]

const HISTORY_ITEMS = [
  {
    id: 'h1',
    product: 'Đậu phụ sốt cà chua (Mẫu hôm nay)',
    time: 'Vừa xong • 12:45',
    result: '2 nguy cơ động vật',
    resultType: 'danger' as const,
    calories: 520,
  },
  {
    id: 'h2',
    product: 'Nhãn mác bánh Flan Cô Hạnh',
    time: 'Hôm qua • 20:02',
    result: 'Thành phần cảnh báo (Gelatin E441)',
    resultType: 'warning' as const,
    calories: 220,
  },
  {
    id: 'h3',
    product: 'Gói hạt nêm chay Ajinomoto',
    time: '2 ngày trước • 09:30',
    result: '100% Thuần thực vật ✅',
    resultType: 'safe' as const,
    calories: 18,
  },
  {
    id: 'h4',
    product: 'Sữa hạt điều hữu cơ L+',
    time: 'Tuần trước',
    result: 'Thực vật an toàn',
    resultType: 'safe' as const,
    calories: 130,
  },
  {
    id: 'h5',
    product: 'Đậu hũ ky đông lạnh Vissan',
    time: 'Tuần trước',
    result: 'Cảnh báo (phụ gia E250)',
    resultType: 'warning' as const,
    calories: 165,
  },
]

interface FoodScanPageProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

const DEFAULT_INGREDIENT_TEXT =
  'Đậu hũ non, cà chua, nấm đông cô, nước sốt nấm gia vị kết hợp cả nước dùng heo, nốt, hạt tiêu, 1 lát gelatin E441, nấm ngô, muối biển, dầu Đậu Lắc.'

const SAMPLE_PREVIEW_URL =
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vietnamese%20vegetarian%20tofu%20mushroom%20hotpot%20with%20vegetables%20in%20white%20ceramic%20bowl%2C%20top%20down%20food%20photography%2C%20warm%20lighting&image_size=square_hd'

export default function FoodScanPage({ onNavigate }: FoodScanPageProps) {
  const [tab, setTab] = useState<ScanTab>('scanner')
  const [step, setStep] = useState<ScanStep>('upload')
  const [textIngredients, setTextIngredients] = useState<string>(DEFAULT_INGREDIENT_TEXT)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showSubstituteForDanger, setShowSubstituteForDanger] = useState<Record<string, boolean>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dangerCount = INGREDIENT_ROWS.filter((i) => i.verdict === 'danger').length
  const safeCount = INGREDIENT_ROWS.filter((i) => i.verdict === 'safe').length

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) {
      void handleFile(f)
    }
  }

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview((ev.target?.result as string) ?? null)
    reader.readAsDataURL(f)
  }

  const runScan = () => {
    if (!imagePreview) {
      fileInputRef.current?.focus()
    }
    setTab('result')
    setStep('scanning')
    window.setTimeout(() => setStep('result'), 1500)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    runScan()
  }

  const handleDropzoneKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      fileInputRef.current?.click()
    }
  }

  const handlePrimaryAlt = (action?: AltOption['primaryAction']) => {
    if (action === 'bookmark-recipe') {
      onNavigate?.('/recipes')
    } else if (action === 'view-guide') {
      onNavigate?.('/articles')
    } else if (action === 'view-store') {
      onNavigate?.('/restaurants')
    }
  }

  return (
    <form className="fsp-root" onSubmit={handleSubmit}>
      <div className="fsp-topbar">
        <div className="fsp-breadcrumb">
          <button type="button" className="crumb-link" onClick={() => onNavigate?.('/')}>
            Trang chủ
          </button>
          <ChevronRight size={12} className="crumb-sep" />
          <span className="crumb-link-disabled">Công cụ</span>
          <ChevronRight size={12} className="crumb-sep" />
          <span className="crumb-active">Quét & Phân tích Thực phẩm</span>
        </div>
        <div className="fsp-diet-pill">
          <span className="pulse-dot" />
          Hồ sơ ăn uống: Thuần chay (Strict Vegan)
          <Sliders size={14} className="diet-icon" />
        </div>
      </div>

      <div className="fsp-header">
        <span className="fsp-eyebrow-warning">
          <XCircle size={12} />
          Kiểm tra thực phẩm theo tiêu chuẩn khoa học
        </span>
        <h1 className="fsp-title">Quét & Phân tích Thực phẩm</h1>
        <p className="fsp-subtitle">
          Chụp ảnh nhãn bao bì hoặc hình ảnh món ăn sẵn có để tự động giải mã thành phần hóa học,
          tra cứu mã phụ gia E-number ẩn giấu từ động vật và bảo đảm món ăn 100% phù hợp với tiêu
          chuẩn lối sống thuần thực vật.
        </p>
      </div>

      <div className="fsp-tabs" role="tablist" aria-label="Food scan workflow">
        {TAB_LIST.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={active}
              className={`fsp-tab${active ? ' fsp-tab-active' : ''}`}
              onClick={() => {
                setTab(t.key)
                if (t.key === 'result' && step === 'upload') setStep('result')
              }}
            >
              <t.icon size={15} />
              {t.label}
            </button>
          )
        })}
      </div>

      {(tab === 'scanner' || (tab === 'result' && step === 'upload')) && (
        <section className="fsp-grid-cols">
          <div className="fsp-card fsp-left">
            <div className="fsp-card-head-row">
              <div className="fsp-card-head-title">
                <Upload size={18} />
                Tải ảnh & Nhập thành phần phân tích
              </div>
              <span className="pill pill-ghost-pill">2 bước bắt buộc</span>
            </div>
            <p className="fsp-card-hint">
              Cung cấp đầy đủ hình ảnh và danh sách thành phần để hệ thống đối chiếu chính xác.
            </p>

            <div className="fsp-step">
              <div className="fsp-step-head">
                <span className="fsp-step-no">1.</span>
                <div>
                  <span className="fsp-step-title">
                    Tải ảnh món ăn hoặc bao bì nhãn mác <span className="req">(* Bắt buộc)</span>
                  </span>
                  <div className="fsp-step-format">JPG, PNG, WEBP ≤ 10MB</div>
                </div>
              </div>
              <div
                className={`fsp-dropzone${imagePreview ? ' has-preview' : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={handleDropzoneKey}
                role="button"
                tabIndex={0}
                aria-label="Upload ảnh món ăn hoặc nhãn bao bì"
              >
                {imagePreview ? (
                  <div className="dropzone-preview">
                    <img src={imagePreview} alt="Món ăn upload" />
                    <div className="dropzone-file-tag">
                      <Camera size={12} />
                      Đã tải mẫu: <strong>Dau_Hu_Sot_Ca_01.jpg</strong>
                      <button
                        type="button"
                        className="btn btn-outline-light btn-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          setImagePreview(null)
                        }}
                        aria-label="Xóa ảnh đã tải lên"
                      >
                        <X size={12} />
                        Xóa ảnh
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="dropzone-icon-wrap">
                      <Upload size={32} />
                    </div>
                    <p className="dropzone-text">Kéo thả hoặc tải ảnh từ máy</p>
                    <p className="dropzone-sub">
                      hoặc nhấp vào khung hình ảnh món ăn / nhãn bao bì để chọn từ máy
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden-input"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void handleFile(f)
                  }}
                  aria-label="Chọn file ảnh"
                />
              </div>
            </div>

            <div className="fsp-step">
              <div className="fsp-step-head">
                <span className="fsp-step-no">2.</span>
                <div>
                  <span className="fsp-step-title">
                    Nhập thành phần nguyên liệu <span className="req">(* Bắt buộc)</span>
                  </span>
                  <div className="fsp-step-format">
                    {textIngredients.trim().length} ký tự
                  </div>
                </div>
              </div>
              <textarea
                className="fsp-textarea"
                value={textIngredients}
                onChange={(e) => setTextIngredients(e.target.value)}
                rows={3}
                placeholder="Dán / Viết toàn bộ thành phần từ nhãn mác..."
                aria-label="Danh sách thành phần"
              />

              <div className="fsp-action-chips">
                <button
                  type="button"
                  className="btn-chip"
                  onClick={() =>
                    alert(
                      'Đã kích hoạt chế độ xác minh kép: hệ thống sẽ đồng thời phân tích cả hình ảnh và văn bản bạn nhập.',
                    )
                  }
                >
                  <CheckCircle2 size={12} />
                  Xác minh kép (ảnh + văn bản)
                </button>
                <div className="chip-group">
                  <button
                    type="button"
                    className="btn-chip btn-chip-primary"
                    onClick={() =>
                      alert(
                        'Đã trích xuất 168 ký tự tự động từ ảnh nhãn mẫu. Hình ảnh khớp 94% với văn bản bạn đã nhập.',
                      )
                    }
                  >
                    <Eye size={12} />
                    Đối chiếu ảnh ↘
                  </button>
                  <button
                    type="button"
                    className="btn-chip btn-chip-secondary"
                    onClick={() => setTextIngredients(DEFAULT_INGREDIENT_TEXT)}
                  >
                    <FileText size={12} />
                    Dùng mẫu văn bản ↘
                  </button>
                  <span className="chip-hint">
                    Nhấn “Phân tích” hoặc Enter (khi ở ô văn bản) để bắt đầu
                  </span>
                </div>
              </div>

              <button type="submit" className="btn-primary-big">
                <Sliders size={16} />
                Phân tích thành phần
              </button>
              <p className="fsp-scan-tip">
                Sinh kết quả dựa trên cơ sở dữ liệu hơn 25.000 chất phụ gia sinh học.
              </p>
            </div>
          </div>

          <div className="fsp-col-right">
            <div className="fsp-card-head-row fsp-mb">
              <div className="fsp-card-head-title">
                <Eye size={18} />
                Xem trước & Hướng dẫn
              </div>
              <span className="pill pill-success">✨ Sẵn sàng để chạy</span>
            </div>

            <div className="fsp-guide">
              <div className="fsp-guide-title">
                <BookOpen size={14} />
                Quy trình thẩm định 3 bước chuẩn hóa:
              </div>
              <ol className="fsp-guide-list">
                <li>
                  <span className="step-badge">1</span>
                  <div>
                    <strong>Bước 1:</strong> Tải lên hình ảnh rõ của món ăn hoặc nhãn thành phần và các phụ gia.
                  </div>
                </li>
                <li>
                  <span className="step-badge">2</span>
                  <div>
                    <strong>Bước 2:</strong> Nhập danh sách nguyên liệu món ăn{' '}
                    <span className="req">(* Bắt buộc).</span>
                  </div>
                </li>
                <li>
                  <span className="step-badge">3</span>
                  <div>
                    <strong>Bước 3:</strong> Nhấn nút “Phân tích thành phần” để AI bóc tách mã phụ gia E-number & nguồn gốc động vật.
                  </div>
                </li>
              </ol>
            </div>

            <div className="fsp-sample">
              <div className="fsp-sample-img">
                <img
                  src={SAMPLE_PREVIEW_URL}
                  alt="Mẫu nhãn sản phẩm"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                />
                <div className="fsp-sample-img-badge">🔴 NHÃN MẪU ĐỂ CHẾU</div>
              </div>
              <div className="fsp-sample-meta">
                <strong>Tố Đậu Hũ Sốt Cà Chua Xốt Đậm</strong>
                <span className="sample-id">
                  Tập: Dau_Hu_Sot_Ca_01.jpg • 12 thành phần • 2 chất động vật khác biệt
                </span>
              </div>
              <button type="button" className="btn-outline-sample" onClick={() => {
                setImagePreview(SAMPLE_PREVIEW_URL)
                setTextIngredients(DEFAULT_INGREDIENT_TEXT)
                runScan()
              }}>
                <RefreshCw size={14} />
                Dùng thử dữ liệu mẫu (Tố Đậu Hũ)
              </button>
              <p className="fsp-sample-hint">
                Nhấn nút này để trải nghiệm kiểm chứng kết quả phân tích động vật bản đuôi.
              </p>
            </div>
          </div>
        </section>
      )}

      {(tab === 'scanner' || tab === 'result') && step === 'scanning' && (
        <section className="fsp-scanning" aria-live="polite">
          <div className="scan-anim">
            <div className="scan-ring" />
            <Search size={32} />
          </div>
          <h3>Đang phân tích thành phần...</h3>
          <p>AI đang đọc hình ảnh, đối chiếu CSDL & đánh giá mức độ phù hợp.</p>
        </section>
      )}

      {(tab === 'result' || (tab === 'scanner' && step === 'result')) && step === 'result' && (
        <>
          <section className="fsp-result-head">
            <div>
              <h2 className="fsp-section-title">Kết quả thẩm định dinh dưỡng</h2>
              <p className="fsp-section-sub">
                Hệ thống đối chiếu hồ sơ ăn chay cá nhân với cơ sở dữ liệu nguồn gốc sinh học toàn cầu.
              </p>
            </div>
            <div className="fsp-result-head-actions">
              <button
                type="button"
                className="btn-outline-green-xs"
                onClick={() => setTab('scanner')}
              >
                <AlertTriangle size={12} />
                Xem lại bước nhập (chứa thành phần động vật)
              </button>
              <button
                type="button"
                className="btn-outline-green-xs"
                onClick={() => onNavigate?.('/pantry')}
              >
                <CheckCircle2 size={12} />
                So sánh với Tủ bếp AI
              </button>
            </div>
          </section>

          <section className="fsp-verdict-row">
            <div className="fsp-verdict-card">
              <div className="verdict-head danger">
                <div className="verdict-icon-wrap">
                  <XCircle size={28} />
                </div>
                <div className="verdict-titles">
                  <span className="verdict-badge-danger">MÓN CÓ CHẤT ĐỘNG VẬT / KHÔNG THUẦN CHAY</span>
                  <span className="verdict-pill">Phát hiện 2 chất từ động vật</span>
                  <h3>Món ăn này KHÔNG PHÙ HỢP với chế độ Thuần Chay (Vegan) của bạn!</h3>
                </div>
              </div>
              <p className="verdict-desc">
                Mặc dù sử dụng nguyên liệu chính là đậu phụ và cà chua, nước sốt đỗ được nêm nếm với chiết
                xuất nước dùng xương heo và sử dụng phụ gia làm dày Gelatin (E441) chiết xuất collagen từ
                mô động vật.
              </p>
            </div>

            <div className="fsp-compat-card">
              <h4>Phân loại tương thích</h4>
              <div className="compat-grid">
                <div className="compat-chip danger">
                  <XCircle size={14} />
                  Vegan - Sai
                </div>
                <div className="compat-chip danger">
                  <XCircle size={14} />
                  Ovo-Veg - Sai
                </div>
                <div className="compat-chip warn">
                  <AlertCircle size={14} />
                  Lacto-Veg - Cảnh báo
                </div>
                <div className="compat-chip safe">
                  <CheckCircle2 size={14} />
                  10 nguyên liệu OK
                </div>
              </div>
            </div>
          </section>

          <section className="fsp-ingredient-wrap">
            <div className="fsp-ingredient-head-row">
              <div>
                <h3>
                  Phân tích bảng thành phần chi tiết (12 thành phần được phát hiện)
                  <span className="inline-hint">
                    Nhấn vào từng thành phần để xem chứng xuất xình sinh học và mức độ cảnh báo
                  </span>
                </h3>
              </div>
              <div className="ingredient-total-chips">
                <span className="tot-chip tot-safe">
                  <CheckCircle2 size={12} />
                  Thực vật an toàn {safeCount}
                </span>
                <span className="tot-chip tot-danger">
                  <AlertTriangle size={12} />
                  Động vật / Phụ gia {dangerCount}
                </span>
                <span className="tot-chip tot-neutral">Thực vật khác 0</span>
              </div>
            </div>

            <div className="ingredient-section-label danger-label">
              <AlertTriangle size={14} />
              CẢNH BÁO: Thành phần có nguồn gốc từ động vật (Cần tránh tuyệt đối)
            </div>
            <div className="ingredient-grid">
              {INGREDIENT_ROWS.filter((i) => i.verdict === 'danger').map((row) => (
                <div
                  key={row.id}
                  className={`ingredient-card danger${
                    showSubstituteForDanger[row.id] ? ' expanded' : ''
                  }`}
                >
                  <div className="ingredient-card-header">
                    <div className="ingredient-name-wrap">
                      <div className="ingredient-tag danger-tag">{row.verdictLabel}</div>
                      <h4>{row.name}</h4>
                    </div>
                    <div className="ingredient-side">
                      <div className={`veg-tag veg-${row.veganCompatibility}`}>{row.veganText}</div>
                    </div>
                  </div>
                  <p className="ingredient-source">{row.source}</p>
                  <div className="ingredient-meta-row">
                    <span className="meta-label">{row.detailNote}</span>
                    <button
                      type="button"
                      className="link-substitute"
                      onClick={() =>
                        setShowSubstituteForDanger((prev) => ({
                          ...prev,
                          [row.id]: !prev[row.id],
                        }))
                      }
                      aria-expanded={Boolean(showSubstituteForDanger[row.id])}
                    >
                      {showSubstituteForDanger[row.id]
                        ? 'Thu gọn ^'
                        : row.substituteText || 'Tìm chất thay thế ↓'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="ingredient-section-label safe-label">
              <CheckCircle2 size={14} />
              10 Thành phần thực vật an toàn & lành mạnh
            </div>
            <div className="ingredient-grid-safe">
              {INGREDIENT_ROWS.filter((i) => i.verdict === 'safe').map((row) => (
                <div key={row.id} className="ingredient-chip-safe">
                  <CheckCircle2 size={14} className="safe-dot" />
                  <div>
                    <strong>{row.name}</strong>
                    <span className="chip-verify">{row.verdictLabel}</span>
                  </div>
                  <span className="vegan-inline">Đạt chuẩn 100% Thuần Chay</span>
                </div>
              ))}
            </div>
          </section>

          <section className="fsp-alt-wrap">
            <div className="fsp-alt-head">
              <div className="fsp-alt-head-title">
                <Lightbulb size={18} />
                Giải pháp dưỡng thuần thực vật
              </div>
              <div>
                <h2>Gợi ý nguyên liệu chay thay thế (Vegetarian Alternatives)</h2>
                <p>
                  Các chuyên gia dinh dưỡng của Vegetarian Support khuyến nghị các giải pháp thay thế tự
                  nhiên giúp giữ trọn vẹn hương vị và độ sánh định dạng mà không cần dùng đến phụ phẩm động vật.
                </p>
              </div>
              <button
                type="button"
                className="link-arrow-inline"
                onClick={() => onNavigate?.('/recipes')}
              >
                Khám phá 50+ mẹo nấu chay →
              </button>
            </div>

            <div className="alt-grid">
              {ALTERNATIVES.map((alt) => (
                <article key={alt.id} className="alt-card">
                  <div className="alt-card-head">
                    <span className="alt-replace">
                      Thay thế: <strong>{alt.replaceFor}</strong>
                    </span>
                    <span className="alt-match">
                      <Sparkles size={12} />
                      Tương thích {alt.matchPct}%
                    </span>
                  </div>
                  <div className="alt-icon-title">
                    <Leaf size={22} />
                    <div>
                      <h3>{alt.title}</h3>
                      <span className="alt-sub">{alt.subtitle}</span>
                    </div>
                  </div>
                  <p className="alt-desc">{alt.description}</p>
                  <div className="alt-spec-list">
                    <div className="alt-spec-item">
                      <strong>Tỷ lệ thay thế:</strong>
                      <span>{alt.ratio.replace('Tỷ lệ thay thế: ', '')}</span>
                    </div>
                    <div className="alt-spec-item">
                      <strong>Đặc tính / Thời gian:</strong>
                      <span>{alt.time.replace('Thời gian chuẩn bị: ', '')}</span>
                    </div>
                  </div>
                  <div className="alt-actions">
                    <button
                      type="button"
                      className="btn-outline-primary-alt"
                      onClick={() => handlePrimaryAlt(alt.primaryAction)}
                    >
                      {alt.primaryAction === 'bookmark-recipe' ? (
                        <Bookmark size={14} />
                      ) : alt.primaryAction === 'view-guide' ? (
                        <Eye size={14} />
                      ) : (
                        <Store size={14} />
                      )}
                      {alt.primaryCta}
                    </button>
                    {alt.storeAction && (
                      <button
                        type="button"
                        className="btn-outline-second-alt"
                        onClick={() => onNavigate?.('/restaurants')}
                      >
                        {alt.storeAction}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="fsp-cheatsheet">
            <div className="cheatsheet-inner">
              <div className="cheatsheet-left">
                <div className="cheat-head">
                  <Calculator size={16} />
                  <span>Cẩn trọng người an toàn phòng ngừa</span>
                </div>
                <h3>
                  Cách nhận biết chất phụ gia động vật trên nhãn thực phẩm
                  <br />
                  (E-Numbers Cheat Sheet)
                </h3>
                <p>
                  Nhiều nhà sản xuất giấu mã phụ gia thay vì nguồn gốc. Gợi ý việc: E120 (Màu đỏ côn trùng), E441
                  (Gelatin), E542 (Xương heo nướng), E601 (Sáp ong), E904 (Nhựa côn trùng).
                </p>
                <div className="cheat-actions">
                  <button
                    type="button"
                    className="btn btn-primary-filled"
                    onClick={() => onNavigate?.('/articles/tra-cuu-e-number')}
                  >
                    <Search size={14} />
                    Mở bảng tra cứu mã E-number
                  </button>
                  <button
                    type="button"
                    className="btn-download-outline"
                    onClick={() =>
                      alert(
                        'Đã tải về "E-Numbers Cheat Sheet.pdf". File được lưu trong thư mục Downloads của bạn (giả lập).',
                      )
                    }
                  >
                    <Download size={14} />
                    Tải PDF bỏ túi
                  </button>
                </div>
              </div>
              <div className="cheatsheet-right" aria-hidden="true">
                <div className="check-circle">
                  <CheckCircle2 size={56} />
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {tab === 'history' && (
        <section className="fsp-card fsp-history">
          <div className="fsp-card-head-row">
            <div className="fsp-card-head-title">
              <History size={18} />
              Lịch sử quét ({HISTORY_ITEMS.length})
            </div>
            <button
              type="button"
              className="btn btn-outline-light btn-xs"
              onClick={() => alert('Đã xóa toàn bộ lịch sử quét (giả lập).')}
            >
              <X size={12} />
              Xóa lịch sử
            </button>
          </div>
          <ul className="history-list">
            {HISTORY_ITEMS.map((it) => (
              <li key={it.id} className={`history-item history-${it.resultType}`}>
                <div className="history-info">
                  <strong className="history-name">{it.product}</strong>
                  <span className="history-time">
                    {it.time} • ~{it.calories} kcal
                  </span>
                </div>
                <span className="history-result">{it.result}</span>
                <div className="history-actions">
                  <button
                    type="button"
                    className="btn btn-outline-light btn-xs"
                    onClick={() => {
                      setTab('result')
                      setStep('result')
                    }}
                  >
                    <Eye size={12} />
                    Xem lại
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-light btn-xs"
                    onClick={() => setTextIngredients(DEFAULT_INGREDIENT_TEXT)}
                  >
                    <RefreshCw size={12} />
                    Quét lại
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </form>
  )
}
