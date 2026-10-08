import { useState, useRef } from 'react';
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
} from 'lucide-react';
import './FoodScanPage.css';

type ScanStep = 'upload' | 'scanning' | 'result';

interface IngredientRow {
  id: string;
  name: string;
  enumber?: string;
  verdict: 'safe' | 'warning' | 'danger';
  verdictLabel: string;
  source: string;
  veganCompatibility: 'Vegan-Sai' | 'Ovo-Veg-Sai' | 'Lacto-Veg-Sai' | 'Món-món';
  veganText: string;
  detailNote: string;
  certaintyPct: number;
  substituteText?: string;
}

interface AltOption {
  id: string;
  replaceFor: string;
  matchPct: number;
  title: string;
  subtitle: string;
  description: string;
  ratio: string;
  time: string;
  storeAction?: string;
  primaryCta: string;
  primaryIcon?: 'bookmark' | 'eye' | 'store';
}

const INGREDIENT_ROWS: IngredientRow[] = [
  {
    id: 'i1',
    name: 'Nước dùng xương heo (Pork Bone Broth)',
    verdict: 'danger',
    verdictLabel: 'Cấm đỡ & Nguy hiểm nghiêm trọng',
    source: 'Nguồn gốc: Chế xuất xương heo, nước sôi ninh kỹ qua quá trình ninh lấy vị ngọt (Umami cộng nhiệt).',
    veganCompatibility: 'Vegan-Sai',
    veganText: '❌ Không dùng được cho tất cả các loại chế độ ăn chay vì có chất từ động vật.',
    detailNote: 'Độ chính xác: 99.2%',
    certaintyPct: 99.2,
    substituteText: 'Tìm chất thay thế ↓',
  },
  {
    id: 'i2',
    name: 'Gelatin (Chất làm ổn & ổn định E441)',
    enumber: 'E441',
    verdict: 'danger',
    verdictLabel: 'Mì phảy gia (E441)',
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
];

const ALTERNATIVES: AltOption[] = [
  {
    id: 'a1',
    replaceFor: 'Nước dùng xương',
    matchPct: 96,
    title: 'Nước dùng củ quả nốt thanh',
    subtitle: 'Nguồn gốc Umami, 100% thực vật',
    description:
      'Tạo vị ngọt Umami từ rễ ngót, củ cải đường, thảo quả tỏi tây, nấm rơm với rễ cây rau chân vịt. Hòa tan hoàn hảo thay nước dùng xương, giữ được vị ngọt từ rau củ mà không cần bất cứ chất tạo ngọt nhân tạo nào, hoàn toàn không cholesterol xấu.',
    ratio: 'Tỷ lệ thay thế: Tỷ lệ 1:1 trong mọi món nấu kho sọt',
    time: 'Thời gian chuẩn bị: 30 - 45 phút Nấu',
    primaryCta: 'Lưu công thức làm nước dùng',
    primaryIcon: 'bookmark',
  },
  {
    id: 'a2',
    replaceFor: 'Gelatin (E441)',
    matchPct: 98,
    title: 'Bột Agar-Agar hoặc Pectin',
    subtitle: 'Chất tạo kiệt hoàn toàn từ thực vật',
    description:
      'Tạo độ sánh như thạch, kết đông hoàn hảo hơn nước Gelatin khi sử dụng Lập phương (tỷ lệ khác). Dễ bảo quản hơn Gelatin, không bị nóng chảy do nhiệt độ môi trường, phù hợp với những người có bệnh dạ dày hoặc kiêng đạm động vật.',
    ratio: 'Tỷ lệ thay thế: 1/3 muỗng cà phê bột agar cho 200ml sôi.',
    time: 'Đặc tính: Đặc tính đông đặc nhanh chóng ở nhiệt độ phòng',
    primaryCta: 'Xem cách dùng bột Agar',
    primaryIcon: 'eye',
    storeAction: '🛒 Mua ở đâu?',
  },
  {
    id: 'a3',
    replaceFor: 'Giá vị giá đậm',
    matchPct: 95,
    title: 'Dầu hạt nấm hướng hữu cơ',
    subtitle: 'Nguyên hương vị đặc trưng Shitake & Men vips',
    description:
      'Tạo mùi nấm hương gần nhất với mùi thơm nướng và chiếu sâu từ vị nấm. Dùng chiên, xào, trộn salad, chiếu khắp mọi loại món chay, giàu vitamin B và dưỡng chất khoáng thiết yếu mà không cần nấu nhiều.',
    ratio: 'Tỷ lệ thay thế: Thay thế 1:1 mực vào Nước tương, Hạt nêm Natori. Thêm vào 30% dầu thường, giảm bớt trong nấu ăn.',
    time: 'Tỷ lệ thay thế: 30% dầu thường',
    primaryCta: 'Xem thương hiệu chất lượng chính',
    primaryIcon: 'store',
  },
];

interface FoodScanPageProps {
  onNavigate?: (path: string) => void;
  isLoggedIn?: boolean;
}

export default function FoodScanPage({ onNavigate }: FoodScanPageProps) {
  const [step, setStep] = useState<ScanStep>('result'); // Bắt đầu ở result để thể hiện kết quả theo hình
  const [textIngredients, setTextIngredients] = useState(
    'Đậu hũ non, cà chua, nấm đông cô, nước sốt nấm gia vị kết hợp cả nước dùng heo, nốt, hạt tiêu, 1 lát gelatin E441, nấm ngô, muối biển, dầu Đậu Lắc.',
  );
  const [imagePreview, setImagePreview] = useState<string | null>(
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vietnamese%20vegetarian%20tofu%20mushroom%20hotpot%20with%20vegetables%20in%20white%20ceramic%20bowl%2C%20top%20down%20food%20photography%2C%20warm%20lighting&image_size=square_hd',
  );
  const [showSubstituteForDanger, setShowSubstituteForDanger] = useState<Record<string, boolean>>({ i1: false, i2: false });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dangerCount = INGREDIENT_ROWS.filter(i => i.verdict === 'danger').length;
  const safeCount = INGREDIENT_ROWS.filter(i => i.verdict === 'safe').length;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const runScan = () => {
    setStep('scanning');
    window.setTimeout(() => setStep('result'), 1500);
  };

  return (
    <div className="fsp-root">
      {/* Breadcrumb + diet pill */}
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

      {/* Eyebrow + title */}
      <div className="fsp-header">
        <span className="fsp-eyebrow-warning">
          <XCircle size={12} />
          Tự sửa bản tự tạo một định dạng
        </span>
        <h1 className="fsp-title">Quét & Phân tích Thực phẩm (Food & Ingredient Scanner)</h1>
        <p className="fsp-subtitle">
          Chụp ảnh nhãn bao bì hoặc hình ảnh món ăn sẵn có để tự động giải mã thành phần hóa học, tra cứu mã phụ gia E-number ẩn giấu từ động vật và bảo đảm món ăn 100% phù hợp với tiêu chuẩn lối sống thuần thực vật.
        </p>
      </div>

      {/* Upload + guide 2 cols */}
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

          {/* Step 1: Upload */}
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
              className={`fsp-dropzone ${imagePreview ? 'has-preview' : ''}`}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
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
                      onClick={e => {
                        e.stopPropagation();
                        setImagePreview(null);
                      }}
                    >
                      Đã xóa xong
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="dropzone-icon-wrap">
                    <Upload size={32} />
                  </div>
                  <p className="dropzone-text">Kéo thả hoặc tải ảnh từ máy</p>
                  <p className="dropzone-sub">hoặc nhấp vào khung hình ảnh món ăn / nhãn bao bì để chọn từ máy</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden-input"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>
          </div>

          {/* Step 2: Text */}
          <div className="fsp-step">
            <div className="fsp-step-head">
              <span className="fsp-step-no">2.</span>
              <div>
                <span className="fsp-step-title">
                  Nhập thành phần nguyên liệu <span className="req">(* Công thức)</span>
                </span>
                <div className="fsp-step-format">168 ký tự</div>
              </div>
            </div>
            <textarea
              className="fsp-textarea"
              value={textIngredients}
              onChange={e => setTextIngredients(e.target.value)}
              rows={3}
              placeholder="Dán / Viết toàn bộ thành phần từ nhãn mác..."
            />

            <div className="fsp-action-chips">
              <button type="button" className="btn-chip">
                <CheckCircle2 size={12} />
                Cũng cung cấp hình ảnh danh sách thành phần để hệ thống đối chiếu chính xác.
              </button>
              <div className="chip-group">
                <button type="button" className="btn-chip btn-chip-primary">
                  <Eye size={12} />
                  Đối tài ảnh ↘
                </button>
                <button type="button" className="btn-chip btn-chip-secondary">
                  <FileText size={12} />
                  Đã nhập văn bản ↘
                </button>
                <span className="chip-hint">
                  Quy tắc: Xác nhận khi mà cả 2 điều kiện
                </span>
              </div>
            </div>

            <button type="button" className="btn-primary-big" onClick={runScan}>
              <Sliders size={16} />
              Phân tích thành phần
            </button>
            <p className="fsp-scan-tip">
              Sản sinh phân tích với cơ sở dữ liệu hơn 25.000 chất phụ gia sinh học.
            </p>
          </div>
        </div>

        {/* Right column: guide + sample */}
        <div className="fsp-col-right">
          <div className="fsp-card-head-row fsp-mb">
            <div className="fsp-card-head-title">
              <Eye size={18} />
              Xem trước & Hướng dẫn
            </div>
            <span className="pill pill-success">✨ Sẵn sàng để chạy</span>
          </div>

          {/* 3-step guide */}
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
                  <strong>Bước 2:</strong> Nhập liệu không theo nguyên liệu hóa học chủ yếu món ăn <span className="req">(* Bắt buộc).</span>
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

          {/* Sample preview */}
          <div className="fsp-sample">
            <div className="fsp-sample-img">
              <img
                src="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Close%20up%20of%20food%20product%20ingredient%20label%20showing%20E-numbers%20%28E441%2C%20E631%2C%20E627%29%20and%20chili%20sauce%20bottle%20background&image_size=landscape_4_3"
                alt="Mẫu nhãn sản phẩm"
              />
              <div className="fsp-sample-img-badge">
                🔴 NHÃN MẪU ĐỂ CHẾU
              </div>
            </div>
            <div className="fsp-sample-meta">
              <strong>Tố Đậu Hũ Sốt Cà Chua Xốt Đậm</strong>
              <span className="sample-id">
                Tập: Dau_Hu_Sot_Ca_01.jpg • 12 thành phần • 2 chất động vật khác biệt
              </span>
            </div>
            <button type="button" className="btn-outline-sample" onClick={runScan}>
              <RefreshCw size={14} />
              Dùng thử dữ liệu mẫu (Tố Đậu Hũ)
            </button>
            <p className="fsp-sample-hint">
              Nhấn nút này để trải nghiệm kiểm chứng kết quả phân tích động vật bản đuôi.
            </p>
          </div>
        </div>
      </section>

      {/* Scanning state */}
      {step === 'scanning' && (
        <section className="fsp-scanning">
          <div className="scan-anim">
            <div className="scan-ring" />
            <Search size={32} />
          </div>
          <h3>Đang phân tích thành phần...</h3>
          <p>AI đang đọc hình ảnh, đối chiếu CSDL & đánh giá mức độ phù hợp.</p>
        </section>
      )}

      {/* RESULT */}
      {step === 'result' && (
        <>
          {/* Section title */}
          <section className="fsp-result-head">
            <div>
              <h2 className="fsp-section-title">Kết quả thẩm định dinh dưỡng</h2>
              <p className="fsp-section-sub">
                Hệ thống đối chiếu hồ sơ ăn chay cá nhân với cơ sở dữ liệu nguồn gốc sinh học toàn cầu.
              </p>
            </div>
            <div className="fsp-result-head-actions">
              <button type="button" className="btn-outline-green-xs">
                <AlertTriangle size={12} />
                Xem lại giải pháp phân tích (Chứa thành phần đọng)
              </button>
              <button type="button" className="btn-outline-green-xs">
                <CheckCircle2 size={12} />
                Món này 100% Thuần Chay
              </button>
            </div>
          </section>

          {/* Verdict + Classification */}
          <section className="fsp-verdict-row">
            <div className="fsp-verdict-card">
              <div className="verdict-head danger">
                <div className="verdict-icon-wrap">
                  <XCircle size={28} />
                </div>
                <div className="verdict-titles">
                  <span className="verdict-badge-danger">MÓN MẶN / KHÔNG THUẨN CHAY</span>
                  <span className="verdict-pill">Phân hiển 2 chất từ động vật</span>
                  <h3>Món ăn này KHÔNG PHÙ HỢP với chế độ Thuần Chay (Vegan) của bạn!</h3>
                </div>
              </div>
              <p className="verdict-desc">
                Mặc dù sử dụng nguyên liệu chính là đậu phụ và cà chua, nước sốt đỗ được nêm nếm với chiết xuất nước dùng xương heo và sử dụng phụ gia làm dày Gelatin (E441) chiết xuất collagen từ mô động vật.
              </p>
            </div>

            <div className="fsp-compat-card">
              <h4>Phân loại tương thích</h4>
              <div className="compat-grid">
                <div className="compat-chip danger">
                  <XCircle size={14} />
                  Vegan-Sai
                </div>
                <div className="compat-chip danger">
                  <XCircle size={14} />
                  Ovo-Veg-Sai
                </div>
                <div className="compat-chip warn">
                  <AlertCircle size={14} />
                  Lacto-Veg-Sai
                </div>
                <div className="compat-chip safe">
                  <CheckCircle2 size={14} />
                  Món-món
                </div>
              </div>
            </div>
          </section>

          {/* Ingredient detail grid */}
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
                  Tốt cả {safeCount}
                </span>
                <span className="tot-chip tot-danger">
                  <AlertTriangle size={12} />
                  Động vật làm {dangerCount}
                </span>
                <span className="tot-chip tot-neutral">
                  Thực vật an toàn (0)
                </span>
              </div>
            </div>

            {/* Danger rows */}
            <div className="ingredient-section-label danger-label">
              <AlertTriangle size={14} />
              CẢNH BÁO: Thành phần có nguồn gốc từ động vật (Cần tránh tuyệt đối)
            </div>
            <div className="ingredient-grid">
              {INGREDIENT_ROWS.filter(i => i.verdict === 'danger').map(row => (
                <div key={row.id} className={`ingredient-card danger ${showSubstituteForDanger[row.id] ? 'expanded' : ''}`}>
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
                        setShowSubstituteForDanger(prev => ({ ...prev, [row.id]: !prev[row.id] }))
                      }
                    >
                      {showSubstituteForDanger[row.id] ? 'Thu gọn ^' : row.substituteText || 'Tìm chất thay thế ↓'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Safe rows */}
            <div className="ingredient-section-label safe-label">
              <CheckCircle2 size={14} />
              10 Thành phần thực vật an toàn & lành mạnh
            </div>
            <div className="ingredient-grid-safe">
              {INGREDIENT_ROWS.filter(i => i.verdict === 'safe').map(row => (
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

          {/* Alternatives */}
          <section className="fsp-alt-wrap">
            <div className="fsp-alt-head">
              <div className="fsp-alt-head-title">
                <Lightbulb size={18} />
                Giải pháp dưỡng thuần thực vật
              </div>
              <div>
                <h2>Gợi ý nguyên liệu chay thay thế (Vegetarian Alternatives)</h2>
                <p>
                  Các chuyên gia dinh dưỡng của Vegetarian Support khuyến nghị các giải pháp thay thế tự nhiên giúp giữ trọn vẹn hương vị và độ sánh định dạng mà không cần dùng đến phụ phẩm động vật.
                </p>
              </div>
              <button type="button" className="link-arrow-inline">
                Khám phá 50+ mẹo nấu chay →
              </button>
            </div>

            <div className="alt-grid">
              {ALTERNATIVES.map(alt => (
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
                      <strong>Thời gian chuẩn bị:</strong>
                      <span>{alt.time.replace('Thời gian chuẩn bị: ', '')}</span>
                    </div>
                  </div>
                  <div className="alt-actions">
                    <button type="button" className="btn-outline-primary-alt">
                      {alt.primaryIcon === 'bookmark' ? <Bookmark size={14} /> : alt.primaryIcon === 'eye' ? <Eye size={14} /> : <Store size={14} />}
                      {alt.primaryCta}
                    </button>
                    {alt.storeAction && (
                      <button type="button" className="btn-outline-second-alt">
                        {alt.storeAction}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* E-number cheat sheet */}
          <section className="fsp-cheatsheet">
            <div className="cheatsheet-inner">
              <div className="cheatsheet-left">
                <div className="cheat-head">
                  <Calculator size={16} />
                  <span>Cẩn nặng người an toàn phòng ngừa</span>
                </div>
                <h3>
                  Cách nhận biết chất phụ gia động vật trên nhãn thực phẩm
                  <br />
                  (E-Numbers Cheat Sheet)
                </h3>
                <p>
                  Nhiều nhà sản xuất giấu mã phụ gia thay vì nguồn gốc. Gợi ý việc: E120 (Màu đỏ côn trùng), E441 (Gelatin), E542 (Xương heo nướng), E601 (Sáp ong), E904 (Nhựa côn trùng).
                </p>
                <div className="cheat-actions">
                  <button type="button" className="btn btn-primary-filled">
                    <Search size={14} />
                    Mở bảng tra cứu mã E-number
                  </button>
                  <button type="button" className="btn-download-outline">
                    <Download size={14} />
                    Tải PDF bỏ túi
                  </button>
                </div>
              </div>
              <div className="cheatsheet-right">
                <div className="check-circle">
                  <CheckCircle2 size={56} />
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
