import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SkeletonLoader from '../../shared/components/SkeletonLoader';
import AlertError from '../../shared/components/AlertError';
import EmptyState from '../../shared/components/EmptyState';
import {
  addScanToMealplan,
  analyzeFoodImage,
} from './food-scan.api';
import type {
  FoodScanResult,
  MealplanOption,
  NutritionFact,
  AlternativeItem,
  ScanStatus,
} from './food-scan.types';
import './FoodScanPage.css';

type AnalyzeTab = 'dish-photo' | 'ingredient-label';

const INITIAL_STATUS: ScanStatus = { state: 'idle' };

interface FoodScanPageProps {
  onNavigate?: (path: string) => void;
}

function TrendBadge({ trend, badge }: { trend: NutritionFact['trend']; badge?: string }) {
  const map: Record<NutritionFact['trend'], string> = {
    low: 'trend-badge trend-low',
    medium: 'trend-badge trend-medium',
    high: 'trend-badge trend-high',
  };
  const label = trend === 'low' ? 'Thấp' : trend === 'medium' ? 'Trung bình' : 'Cao';
  return (
    <span className={map[trend]} title={badge}>
      {label}
    </span>
  );
}

function ConfidenceBar({ value, max = 1 }: { value: number; max?: number }) {
  const percent = Math.min(100, Math.round((value / max) * 100));
  const color =
    percent >= 85 ? '#2f7a45' : percent >= 65 ? '#b45309' : '#b91c1c';
  return (
    <div className="confidence-wrap" aria-label={`Độ tin cậy ${percent}%`}>
      <div className="confidence-track">
        <div className="confidence-fill" style={{ width: `${percent}%`, background: color }} />
      </div>
      <span className="confidence-label">{percent}%</span>
    </div>
  );
}

function StepBlock({ step, title, body, note }: { step: number; title: string; body: string; note?: string }) {
  return (
    <li className="upload-step">
      <div className="upload-step-number">{step}</div>
      <div className="upload-step-body">
        <div className="upload-step-title">{title}</div>
        <p className="upload-step-text">{body}</p>
        {note && <p className="upload-step-note">{note}</p>}
      </div>
    </li>
  );
}

export default function FoodScanPage({ onNavigate }: FoodScanPageProps) {
  const [status, setStatus] = useState<ScanStatus>(INITIAL_STATUS);
  const [result, setResult] = useState<FoodScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analyzeTab, setAnalyzeTab] = useState<AnalyzeTab>('dish-photo');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState<string>(
    'Món ăn gồm: cơm trắng + thịt bò kho với cải bó xôi, cà chua, hành tây. Gia vị chính: nước mắm, tiêu, đường phèn, mỡ hành.'
  );
  const [addedSlots, setAddedSlots] = useState<Record<string, boolean>>({});

  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  const handleFilePreview = (file: File | null) => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const handleRunAnalyze = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setErrorMessage(null);
    setStatus({ state: 'uploading', progress: 10, message: 'Tải ảnh lên bộ phân tích...' });

    try {
      await new Promise((resolve) => setTimeout(resolve, 220));
      if (requestId !== requestIdRef.current) return;

      setStatus({ state: 'analyzing', progress: 45, message: 'AI đang nhận diện thành phần & nhãn bao bì (OCR)...' });

      await new Promise((resolve) => setTimeout(resolve, 340));
      if (requestId !== requestIdRef.current) return;

      setStatus({ state: 'ocr', progress: 72, message: 'Đối chiếu danh mục Vegan / Thuần chay & tính toán dinh dưỡng...' });

      const data = await analyzeFoodImage(null, controller.signal);
      if (requestId !== requestIdRef.current) return;

      setStatus({ state: 'done', message: 'Đã xong. Xem kết quả phân tích bên dưới.' });
      setResult(data);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'Không xác định';
      setStatus({ state: 'error', message });
      setErrorMessage(message);
    }
  }, []);

  useEffect(() => {
    // Auto-run a demo result on first mount for showcase (as per design screenshot shows results).
    let cancelled = false;
    Promise.resolve().then(async () => {
      await new Promise((resolve) => setTimeout(resolve, 120));
      if (!cancelled) void handleRunAnalyze();
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleAddToMealplan = async (option: MealplanOption, slotKey: MealplanOption['slots'][number]['key']) => {
    const key = `${option.id}-${slotKey}`;
    if (addedSlots[key] || !result) return;
    try {
      const r = await addScanToMealplan(result.id, { dayIndex: option.dayIndex, key: slotKey });
      if (r.ok) {
        setAddedSlots((prev) => ({ ...prev, [key]: true }));
      }
    } catch {
      // ignore
    }
  };

  const isLoading = ['uploading', 'analyzing', 'ocr'].includes(status.state);
  const hasResult = result != null && status.state === 'done';

  const breadcrumbs = useMemo(
    () => [
      { label: 'Trang chủ', path: '/' },
      { label: 'Quét thực phẩm', path: '/food-scan' },
      { label: 'Quét & Phân tích món ăn' },
    ],
    []
  );

  return (
    <div className="food-scan-page">
      <div className="food-scan-container">
        {/* Breadcrumbs */}
        <div className="food-scan-topbar">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <ol className="breadcrumbs-list">
              {breadcrumbs.map((crumb, i) => {
                const isLast = i === breadcrumbs.length - 1;
                return (
                  <li key={crumb.label} className="breadcrumbs-item">
                    {i > 0 && <span className="breadcrumbs-separator" aria-hidden="true">/</span>}
                    {isLast ? (
                      <span className="breadcrumbs-current" aria-current="page">{crumb.label}</span>
                    ) : (
                      <a
                        href={`#${crumb.path}`}
                        onClick={(e) => handleNavClick(e, crumb.path!)}
                      >
                        {crumb.label}
                      </a>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
          <div className="food-scan-actions">
            <button type="button" className="btn btn-ghost">
              ⏱ Lịch sử quét (3 kết quả gần đây)
            </button>
            <button type="button" className="btn btn-ghost">
              ⚙️ Chọn mục tiêu dinh dưỡng (Vegan / Ovo-Lacto)
            </button>
          </div>
        </div>

        {/* Page Header */}
        <header className="food-scan-hero">
          <span className="pill pill-accent">
            🔬 Food AI – phân tích theo mô hình mới nhất
          </span>
          <h1 className="food-scan-title">Quét & Phân tích Thực phẩm (Food & Ingredient Scanner)</h1>
          <p className="food-scan-subtitle">
            Chụp ảnh bữa ăn hoặc bao bì nhãn hàng để AI xác định các thành phần, đánh giá mức độ phù hợp với chế độ ăn Thuần Chay của bạn, và cung cấp gợi ý thay thế cùng tiềm năng tích hợp vào kế hoạch thực đơn tuần.
          </p>
        </header>

        {/* Upload & Analyze Section */}
        <section className="fs-grid-2" aria-label="Tải ảnh & Phân tích">
          <div className="fs-card fs-upload-card">
            <div className="fs-card-head">
              <div>
                <div className="fs-card-title-row">
                  <span className="fs-icon" aria-hidden="true">📸</span>
                  <h2 className="fs-card-title">Tải ảnh & Phân tích thành phần tích</h2>
                </div>
                <p className="fs-card-subtitle">
                  Công cụ hỗ trợ AI nhận diện món ăn từ ảnh – xem danh sách thành phần dự đoán cùng độ tin cậy,
                  xác nhận hoặc sửa lại trước khi tính toán dinh dưỡng.
                </p>
              </div>
              <div className="fs-tabs">
                <button
                  type="button"
                  className={`fs-tab ${analyzeTab === 'dish-photo' ? 'fs-tab-active' : ''}`}
                  onClick={() => setAnalyzeTab('dish-photo')}
                >
                  Ảnh món ăn
                </button>
                <button
                  type="button"
                  className={`fs-tab ${analyzeTab === 'ingredient-label' ? 'fs-tab-active' : ''}`}
                  onClick={() => setAnalyzeTab('ingredient-label')}
                >
                  Ảnh nhãn / thành phần
                </button>
              </div>
            </div>

            <ol className="upload-steps-list" aria-label="Các bước quét">
              <StepBlock
                step={1}
                title="Tải ảnh bữa ăn (File ảnh rõ nét, JPG/PNG/HEIC, tối đa 12MB)"
                body="Góc chụp từ trên xuống, ánh sáng tự nhiên, bao phủ toàn bộ phần ăn."
                note="💡 Mẹo AI: nên tránh chụp ngược sáng và hạn chế thêm text/watermark lớn."
              />
              <StepBlock
                step={2}
                title="AI sẽ tóm tắt thành phần dự đoán (ingredients) + khối lượng ước chừng (portioning)"
                body="Kiểm tra lại, chỉnh sửa hoặc bổ sung text trong hộp xác nhận phía dưới để kết quả chính xác hơn."
              />
              <StepBlock
                step={3}
                title="Xác nhận & Tiến hành Quét (Nutrition + Vegan Check)"
                body="Kết quả trả về sau 3-5 giây: thẩm định dinh dưỡng, nhãn thuần chay và gợi ý thay thế tùy chỉnh."
              />
            </ol>

            <div className="fs-upload-dropzone">
              {previewUrl ? (
                <img src={previewUrl} alt="Ảnh xem trước" className="fs-preview" />
              ) : (
                <div className="fs-dropzone-placeholder">
                  <div className="fs-dropzone-icon">🖼️</div>
                  <p className="fs-dropzone-text">
                    Kéo & thả file ảnh vào đây hoặc{' '}
                    <label className="fs-dropzone-link">
                      chọn từ thiết bị
                      <input
                        type="file"
                        accept="image/*"
                        className="visually-hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          handleFilePreview(f);
                        }}
                      />
                    </label>
                  </p>
                  <p className="fs-dropzone-hint">
                    Chưa cần ảnh? Nhập text mô tả món ăn bên dưới & AI vẫn sẽ phân tích được.
                  </p>
                </div>
              )}
            </div>

            <div className="fs-confirm">
              <div className="fs-confirm-head">
                <span className="fs-confirm-label">
                  <span className="dot-success" aria-hidden="true" /> Xác nhận & bổ sung mô tả chi tiết món ăn /
                  thành phần trước khi quét (edit freely)
                </span>
                <button type="button" className="btn btn-ghost btn-sm">xóa nội dung</button>
              </div>
              <textarea
                className="fs-confirm-textarea"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                rows={3}
                aria-label="Mô tả chi tiết món ăn"
              />
            </div>

            <div className="fs-upload-footer">
              <div className="fs-upload-footer-left">
                <label className="inline-checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>
                    Gợi ý bổ sung protein thực vật & vitamin B12 nếu khẩu phần thiếu hụt
                  </span>
                </label>
                <label className="inline-checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>
                    So sánh nhu cầu thực tế với khuyến nghị dinh dưỡng của bộ Y Tế (WHO, 2018)
                  </span>
                </label>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-lg fs-run-btn"
                onClick={handleRunAnalyze}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-small" aria-hidden="true" />
                    Đang quét & phân tích...
                  </>
                ) : (
                  '🧪 Thực hiện Quét món ăn'
                )}
              </button>
            </div>
            <p className="fs-meta-note">
              * Hệ thống chỉ đưa ra ước tính dựa trên ảnh và mô tả người dùng. Kết quả tham khảo, không thay thế lời
              khuyên từ bác sĩ hay chuyên gia dinh dưỡng.
            </p>
          </div>

          <aside className="fs-card fs-preview-card" aria-label="Xem trước & Hướng dẫn">
            <div className="fs-card-head">
              <div>
                <div className="fs-card-title-row">
                  <span className="fs-icon" aria-hidden="true">✨</span>
                  <h2 className="fs-card-title">Xem trước & Hướng dẫn</h2>
                </div>
                <p className="fs-card-subtitle">Các mẹo giúp kết quả quét chính xác và chi tiết hơn.</p>
              </div>
              <span className="pill pill-success">👩‍🍳 Sáng tạo món chay 100% phù hợp</span>
            </div>

            <ol className="guide-list" type="1">
              <li>
                <strong>Bước 1 –</strong> Chuẩn bị ảnh chụp món ăn rõ nét, độ phân giải tối thiểu
                <br /> 1200x1200px, ánh sáng tự nhiên, giảm tối đa bóng đổ.
              </li>
              <li>
                <strong>Bước 2 –</strong> Nếu ảnh có nhãn bao bì, căn chỉnh chữ nằm ngang, không quá tối và đảm bảo
                <br /> font chữ dễ đọc.
              </li>
              <li>
                <strong>Bước 3 –</strong> Điền khối lượng ước chừng (số người ăn, đơn vị gam/ml) vào ô mô tả để AI
                ước lượng dinh dưỡng
                <br /> chính xác hơn.
              </li>
            </ol>

            <figure className="fs-preview-figure">
              <div className="fs-preview-badge">
                📌 ví dụ mẫu: hình ảnh món ăn chay mẫu được AI gợi ý thay thế sau khi quét
              </div>
              <img
                src="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=A%20high%20angle%20photo%20of%20a%20balanced%20vegan%20lunch%20bowl%20on%20wooden%20table%20with%20brown%20rice%2C%20roasted%20zucchini%2C%20cauliflower%2C%20tofu%2C%20spinach%20and%20tomato%2C%20natural%20light&image_size=landscape_16_9"
                alt="Mẫu món ăn chay được gợi ý thay thế"
                className="fs-preview-image"
                loading="lazy"
              />
              <figcaption className="fs-preview-caption">
                VD: Món Cơm bò kho “phiên bản chay” được gợi ý với đậu hũ ky + nấm hương thay thịt, dầu gạo thay mỡ
                động vật, nước mắm chay.
              </figcaption>
            </figure>

            <div className="fs-tip-callout">
              <div className="fs-tip-icon">💡</div>
              <div>
                <div className="fs-tip-title">Lưu ý quan trọng khi sử dụng kết quả</div>
                <p className="fs-tip-text">
                  <strong>AI KHÔNG thể nhìn “qua” bề mặt món ăn</strong> – nếu nghi ngờ có thành phần động vật ẩn
                  (nước dùng xương, gia vị chứa mỡ heo…)
                  <br /> hãy kiểm tra lại nhà hàng / người nấu, hoặc sử dụng chức năng Gợi ý thay thế để chọn phiên bản
                  100% thuần thực vật.
                </p>
              </div>
            </div>

            <button type="button" className="btn btn-outline btn-lg w-100">
              📘 Xem thêm Video hướng dẫn & Lưu ý chụp ảnh
            </button>
          </aside>
        </section>

        {/* Loading / Error / Result */}
        {isLoading && (
          <section className="fs-section fs-loading-section" aria-live="polite">
            <div className="fs-card">
              <div className="fs-card-head">
                <div>
                  <div className="fs-card-title-row">
                    <span className="fs-icon">⚙️</span>
                    <h2 className="fs-card-title">Đang phân tích ảnh & dữ liệu dinh dưỡng...</h2>
                  </div>
                  <p className="fs-card-subtitle">{status.message}</p>
                </div>
                <span className="pill pill-info">
                  {status.progress ? `${status.progress}%` : 'Đang xử lý'}
                </span>
              </div>
              <SkeletonLoader count={8} />
            </div>
          </section>
        )}

        {status.state === 'error' && (
          <section className="fs-section">
            <AlertError
              title="Lỗi trong quá trình phân tích"
              message={errorMessage ?? 'Vui lòng thử lại sau.'}
              onRetry={handleRunAnalyze}
            />
          </section>
        )}

        {!isLoading && status.state === 'idle' && !hasResult && (
          <section className="fs-section">
            <EmptyState
              title="Chưa có kết quả phân tích"
              description="Chọn ảnh và nhấn “Thực hiện Quét món ăn” để xem đánh giá thuần chay, phân tích dinh dưỡng và các gợi ý thay thế."
            />
          </section>
        )}

        {hasResult && result && (
          <>
            {/* Dietary Verdict */}
            <section className="fs-section" aria-label="Kết quả thẩm định dinh dưỡng">
              <div className="fs-section-head">
                <div>
                  <div className="fs-card-title-row">
                    <span className="fs-icon">🧪</span>
                    <h2 className="fs-section-title">Kết quả thẩm định dinh dưỡng</h2>
                  </div>
                  <p className="fs-card-subtitle">
                    Tổng hợp kết quả sau quá trình nhận diện ảnh, trích xuất OCR nhãn và đối chiếu với mục tiêu chế độ ăn
                    của bạn.
                  </p>
                </div>
                <div className="fs-section-actions">
                  <button type="button" className="btn btn-ghost">📝 Xem chi tiết giải thích thuật toán AI (Z-Algo)</button>
                  <button type="button" className="btn btn-outline">📄 Tải báo cáo dinh dưỡng (PDF)</button>
                </div>
              </div>

              <div className="verdict-card verdict-danger">
                <div className="verdict-icon-row">
                  <span className="verdict-icon-circle">❌</span>
                  <div className="verdict-pill-row">
                    <span className="verdict-pill">KHÔNG ĐẠT THUẦN CHAY (Red Meat)</span>
                    <span className="verdict-pill pill-outline">Đánh giá Z-Algo v0.6</span>
                  </div>
                </div>
                <div className="verdict-body">
                  <div>
                    <h3 className="verdict-title">{result.dietaryAssessment.verdictTitle}</h3>
                    <p className="verdict-subtitle">{result.dietaryAssessment.verdictSubtitle}</p>
                  </div>
                  <div className="verdict-stats">
                    <div className="verdict-stat">
                      <div className="verdict-stat-label">Trạng thái</div>
                      <div className="verdict-stat-value danger">Không đạt Vegan</div>
                    </div>
                    <div className="verdict-stat">
                      <div className="verdict-stat-label">Mức độ phù hợp</div>
                      <ConfidenceBar value={1 - result.dietaryAssessment.confidence} />
                    </div>
                    <div className="verdict-stat">
                      <div className="verdict-stat-label">Món ăn</div>
                      <div className="verdict-stat-value muted">{result.dietaryAssessment.dishName ?? '—'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Nutrition Details */}
            <section className="fs-section" aria-label="Phân tích thành phần dinh dưỡng chi tiết">
              <div className="fs-section-head">
                <div>
                  <div className="fs-card-title-row">
                    <span className="fs-icon">🥗</span>
                    <h2 className="fs-section-title">Phân tích thành phần dinh dưỡng chi tiết (Nutrients and a dietary phân tích)</h2>
                  </div>
                  <p className="fs-card-subtitle">
                    Tổng hợp các thành phần nghiêm trọng, điểm nhấn dinh dưỡng và mức tiêu thụ so với nhu cầu tham khảo.
                  </p>
                </div>
                <div className="fs-section-actions-inline">
                  <button type="button" className="btn btn-primary btn-sm">Chia sẻ kết quả</button>
                  <button type="button" className="btn btn-outline btn-sm">Xem phiên bản cũ</button>
                  <button type="button" className="btn btn-ghost btn-sm">Thêm vào so sánh thành phần</button>
                </div>
              </div>

              <div className="fs-grid-2">
                <div className="fs-card fs-highlight-card danger-highlight">
                  <div className="fs-highlight-head">
                    <span className="pill pill-danger">⚠️ CẢNH BÁO CAO – Thành phần KHÔNG phù hợp Vegan</span>
                    <span className="pill pill-outline">Độ tin cậy 0.92 / 1.00</span>
                  </div>
                  <div className="fs-highlight-title-row">
                    <h3 className="fs-highlight-title">
                      Nhóm thịt & protein Phân Khác Kiểu (Red Meat & Dairy)
                    </h3>
                    <button type="button" className="btn btn-danger btn-sm">Xem bằng chứng</button>
                  </div>
                  <p className="fs-highlight-text">
                    <strong>Thành phần phát hiện trong ảnh & OCR:</strong>{' '}
                    {result.dietaryAssessment.flags[0]?.detectedIn}
                  </p>
                  <ul className="fs-bullet-list">
                    <li>
                      <strong>Bằng chứng Z-Algo:</strong>{' '}
                      {result.dietaryAssessment.flags[0]?.evidence}
                    </li>
                  </ul>
                  <div className="fs-highlight-metrics">
                    <div className="fs-highlight-metric">
                      <div className="fs-highlight-metric-label">Độ tin cậy Z-Algo</div>
                      <ConfidenceBar value={result.dietaryAssessment.confidence} />
                    </div>
                    <div className="fs-highlight-metric">
                      <div className="fs-highlight-metric-label">Tỷ lệ phù hợp mục tiêu Vegan</div>
                      <ConfidenceBar value={0.36} />
                    </div>
                  </div>
                </div>

                <div className="fs-card fs-highlight-card warn-highlight">
                  <div className="fs-highlight-head">
                    <span className="pill pill-warning">⚠️ Đánh giá tổng quan chế độ ăn</span>
                    <span className="pill pill-outline">Mức độ nguy cơ: Trung bình</span>
                  </div>
                  <div className="fs-highlight-title-row">
                    <h3 className="fs-highlight-title">
                      Đánh giá Tổng hợp (Bữa ăn duy & Kiểm soát khẩu phần R-28)
                    </h3>
                    <button type="button" className="btn btn-warning btn-sm">Mở gợi ý chuyên sâu</button>
                  </div>
                  <p className="fs-highlight-text">
                    Khẩu phần hiện tại <strong>cần cải thiện về:</strong> chất xơ (30% NRV – thấp hơn mục tiêu 1 chén rau /
                    bữa), <strong>giảm thiểu muối natri</strong> (1480mg = 74% giới hạn ngày WHO) và thay thế nguồn gốc
                    động vật bằng protein thực vật để giảm cholesterol (130mg).
                  </p>
                  <div className="fs-highlight-metrics">
                    <div className="fs-highlight-metric">
                      <div className="fs-highlight-metric-label">Chất xơ (daily %)</div>
                      <ConfidenceBar value={0.3} />
                    </div>
                    <div className="fs-highlight-metric">
                      <div className="fs-highlight-metric-label">Sự phù hợp R-28 (Ngưỡng 75%)</div>
                      <ConfidenceBar value={0.64} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Nutrition Facts Grid */}
              <div className="nutrition-facts-grid" aria-label="Thống kê dinh dưỡng chi tiết">
                {result.nutritionFacts.map((n) => (
                  <article key={n.key} className="nf-card">
                    <header className="nf-card-head">
                      <h4 className="nf-card-label">{n.label}</h4>
                      <TrendBadge trend={n.trend} badge={n.badge} />
                    </header>
                    <div className="nf-card-value">{n.value}</div>
                    <div className="nf-card-daily">Mục tiêu tham khảo: {n.dailyPercent}</div>
                    {n.badge && <p className="nf-card-badge-text">{n.badge}</p>}
                  </article>
                ))}
              </div>
            </section>

            {/* Alternatives */}
            <section className="fs-section" aria-label="Gợi ý nguyên liệu chay thay thế">
              <div className="fs-section-head">
                <div>
                  <div className="fs-card-title-row">
                    <span className="fs-icon">🔀</span>
                    <h2 className="fs-section-title">
                      Gợi ý nguyên liệu chay thay thế (Vegetarian Alternatives)
                    </h2>
                  </div>
                  <p className="fs-card-subtitle">
                    Công cụ gợi ý thay thế công thức Vegetarian Support thông minh theo thuật toán Z-Algo, tìm kiếm giải pháp thay thế an toàn, dinh dưỡng cân bằng và hương vị gần nhất với món gốc.
                  </p>
                </div>
                <div className="fs-sort">
                  <span className="muted mr-2">Sắp xếp gợi ý theo độ ưu tiên:</span>
                  <select className="inline-select" defaultValue="match">
                    <option value="match">Độ khớp vị & dinh dưỡng (Z-Score)</option>
                    <option value="availability">Tính sẵn có tại chợ / siêu thị</option>
                    <option value="cost">Tiết kiệm chi phí nhất</option>
                  </select>
                </div>
              </div>

              <div className="alt-cards-grid">
                {result.alternatives.map((alt: AlternativeItem, idx) => (
                  <article key={alt.id} className="alt-card">
                    <div className="alt-card-head">
                      <span className={`pill ${idx === 0 ? 'pill-success' : idx === 1 ? 'pill-warning' : 'pill-info'}`}>
                        {idx === 0
                          ? '💯 Ưu tiên số 1 – Trùng khớp vị Umami'
                          : idx === 1
                          ? '🛡️ Thay thế Bộ 3 gia vị – Phù hợp OCR nhãn'
                          : '🌟 Nâng cấp Đế rau củ – Mục tiêu 1.400 kcal/ngày'}
                      </span>
                      <span className="pill pill-outline">
                        ⚖️ Tỷ lệ thay thế: {alt.swapRatio.split('–')[0].trim()}
                      </span>
                    </div>
                    <div className="alt-card-title-row">
                      <div className="alt-card-icon">🥬</div>
                      <div>
                        <h3 className="alt-card-subject">{alt.original}</h3>
                        <p className="alt-card-arrow">⤵️ thay bằng ⤵️</p>
                        <h3 className="alt-card-solution">{alt.substituteName}</h3>
                        <p className="alt-card-type">{alt.substituteType}</p>
                      </div>
                    </div>
                    <p className="alt-card-why">
                      Tại sao hoạt động: {alt.whyItWorks}
                    </p>
                    <dl className="alt-card-detail-list">
                      <div>
                        <dt>Tỷ lệ thay thế</dt>
                        <dd>{alt.swapRatio}</dd>
                      </div>
                      <div>
                        <dt>Vị trí swap tương ứng (Nguyên liệu, nấu, gia vị)</dt>
                        <dd>{alt.substituteType.split('–')[0].trim()}</dd>
                      </div>
                    </dl>
                    <div className="alt-card-metrics">
                      <div className="alt-metric">
                        <div className="alt-metric-label">Khớp vị (Flavor)</div>
                        <ConfidenceBar value={alt.flavorMatch} />
                      </div>
                      <div className="alt-metric">
                        <div className="alt-metric-label">Cân bằng dinh dưỡng (Nutri-Score)</div>
                        <ConfidenceBar value={alt.nutritionMatch} />
                      </div>
                    </div>
                    <p className="alt-card-meta">
                      💸 {alt.priceHint ?? 'Chi phí hợp lý'} &nbsp;|&nbsp; 🛒 {alt.availabilityTag ?? 'Có sẵn'}
                    </p>
                    <footer className="alt-card-actions">
                      <button
                        type="button"
                        className="btn btn-outline w-50"
                        onClick={() => onNavigate?.('/recipes')}
                      >
                        12 Công thức sử dụng {alt.substituteName.split(' + ')[0]}
                      </button>
                      <button type="button" className="btn btn-primary w-50">
                        ➕ Thêm SWAP-{idx + 1} vào kế hoạch thay thế cho tuần này
                      </button>
                    </footer>
                  </article>
                ))}
              </div>
            </section>

            {/* Mealplan section */}
            <section className="fs-section" aria-label="Chức năng tải món phù hợp vào kế hoạch bữa ăn">
              <div className="fs-section-head mealplan-section-head">
                <div>
                  <div className="fs-card-title-row">
                    <span className="fs-icon">📅</span>
                    <h2 className="fs-section-title">
                      Chức năng tải món phù hợp động với kế hoạch bữa ăn (Mealplans Chef Grid)
                    </h2>
                  </div>
                  <p className="fs-card-subtitle">
                    Xem trước kết quả quét có thể đóng góp vào kế hoạch thực đơn tuần theo ngày / buổi của bạn – hãy kiểm tra định mức calo,
                    protein và tỉ lệ chay phù hợp trước khi lưu.
                  </p>
                </div>
              </div>

              <div className="fs-card mealplan-grid-card">
                <div className="mealplan-grid">
                  {result.mealplanOptions.map((option: MealplanOption) => (
                    <article key={option.id} className="mealplan-day-card">
                      <header className="mealplan-day-head">
                        <span className="pill pill-success">💯 {option.day} – Vẫn còn trống</span>
                        <span className="pill pill-outline">📝 Tổng {option.totalItems} món / Combo: {option.calTargetMatch}</span>
                      </header>

                      <div className="mealplan-slots">
                        {option.slots.map((slot) => {
                          const key = `${option.id}-${slot.key}`;
                          const added = Boolean(addedSlots[key]);
                          return (
                            <button
                              key={slot.key}
                              type="button"
                              className={`mealplan-slot ${added ? 'mealplan-slot-added' : ''}`}
                              onClick={() => handleAddToMealplan(option, slot.key)}
                              disabled={added}
                            >
                              <span className="mealplan-slot-label">
                                {slot.label} ({slot.recipeCount} món có sẵn)
                              </span>
                              {added ? (
                                <span className="mealplan-slot-state added">✅ Đã thêm vào kế hoạch</span>
                              ) : (
                                <span className="mealplan-slot-state">Thêm bữa này</span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <footer className="mealplan-day-footer">
                        <div className="muted small">Độ đầy kế hoạch: {option.filledPercentage}%</div>
                      </footer>
                    </article>
                  ))}

                  <div className="mealplan-summary-card">
                    <div className="fs-card-title-row">
                      <span className="fs-icon">💾</span>
                      <h3 className="mealplan-summary-title">
                        Lưu kết quả & tích hợp vào kế hoạch bữa ăn của bạn
                      </h3>
                    </div>
                    <p className="mealplan-summary-text">
                      Hệ thống sẽ tự động điều chỉnh các buổi còn thiếu, tìm kiếm công thức chay phù hợp theo khẩu vị và
                      cân bằng tổng calo / protein / chất xơ trên toàn bộ tuần của bạn theo đúng mục tiêu cá nhân.
                    </p>
                    <div className="mealplan-summary-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-lg w-60"
                        onClick={() => onNavigate?.('/meal-plans')}
                      >
                        💾 Lưu sáng tạo vào kế hoạch tuần
                      </button>
                      <button type="button" className="btn btn-outline btn-lg w-40">
                        ↩️ Xem / Tùy chỉnh kế hoạch
                      </button>
                    </div>
                    <p className="mealplan-summary-check">
                      ✅ Đã được xem thử trước – không lưu hành vi xấu, không lưu ảnh gốc ra khỏi phiên làm việc.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
