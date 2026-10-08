import { useState, useRef } from 'react';
import './FoodScanPage.css';

type ScanStep = 'upload' | 'scanning' | 'result';

interface ScanResult {
  suitable: string[];
  unsuitable: string[];
  unclear: string[];
}

interface FoodScanPageProps {
  onNavigate?: (path: string) => void;
  isLoggedIn?: boolean;
}

export default function FoodScanPage({ onNavigate, isLoggedIn = false }: FoodScanPageProps) {
  const [step, setStep] = useState<ScanStep>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = () => {
    if (!imagePreview) return;
    setStep('scanning');
    // Simulate AI scanning
    setTimeout(() => {
      setResult({
        suitable: ['Đậu hũ', 'Nấm', 'Cà rốt', 'Tỏi'],
        unsuitable: ['Nước mắm', 'Hành phi'],
        unclear: ['Gia vị (không rõ loại)'],
      });
      setStep('result');
    }, 2500);
  };

  const handleReset = () => {
    setStep('upload');
    setImagePreview(null);
    setResult(null);
  };

  if (!isLoggedIn) {
    return (
      <div className="food-scan-page">
        <header className="food-scan-hero">
          <div className="hero-inner">
            <span className="hero-eyebrow">Kiểm tra thực phẩm</span>
            <h1 className="hero-title">Kiểm tra món ăn và thành phần</h1>
            <p className="hero-subtitle">
              Đăng nhập để bắt đầu kiểm tra. Kết quả hỗ trợ đánh giá theo thông tin được cung
              cấp, không xác nhận thành phần ẩn hoặc bảo đảm an toàn dị ứng.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onNavigate?.('/auth/login')}
            >
              Đăng nhập để tiếp tục
            </button>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="food-scan-page">
      <header className="food-scan-hero">
        <div className="hero-inner">
          <span className="hero-eyebrow">📸 Quét thực phẩm</span>
          <h1 className="hero-title">Quét & Phân tích Nguyên liệu</h1>
          <p className="hero-subtitle">
            Tải lên hình ảnh món ăn hoặc nhãn thành phần để AI phân tích và đưa ra gợi ý phù hợp với chế độ ăn chay của bạn.
          </p>
        </div>
      </header>

      <main className="food-scan-main">
        {step === 'upload' && (
          <div className="scan-upload-section">
            <div
              className={`scan-dropzone ${isDragging ? 'drag-over' : ''} ${imagePreview ? 'has-preview' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') fileInputRef.current?.click(); }}
              aria-label="Tải lên hình ảnh"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="preview-image" />
              ) : (
                <div className="dropzone-content">
                  <div className="dropzone-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#2f7a45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="17 8 12 3 7 8" stroke="#2f7a45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="3" x2="12" y2="15" stroke="#2f7a45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="dropzone-text">Kéo & thả hình ảnh vào đây</p>
                  <p className="dropzone-subtext">hoặc click để chọn file</p>
                  <p className="dropzone-formats">Hỗ trợ: JPG, PNG (tối đa 10MB)</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="file-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>

            {imagePreview && (
              <div className="upload-actions">
                <button type="button" className="btn btn-outline" onClick={handleReset}>
                  Xóa ảnh
                </button>
                <button type="button" className="btn btn-primary" onClick={handleUpload}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Bắt đầu quét
                </button>
              </div>
            )}

            <div className="scan-tips">
              <h3>Mẹo để kết quả chính xác hơn:</h3>
              <ul>
                <li>Chụp rõ nhãn thành phần hoặc món ăn</li>
                <li>Đảm bảo đủ ánh sáng, không bị chói</li>
                <li>Đưa toàn bộ nhãn vào khung hình</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'scanning' && (
          <div className="scan-scanning">
            <div className="scanning-animation">
              <div className="scanning-ring" />
              <div className="scanning-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#2f7a45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="17 8 12 3 7 8" stroke="#2f7a45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="3" x2="12" y2="15" stroke="#2f7a45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <h2 className="scanning-title">Đang phân tích hình ảnh...</h2>
            <p className="scanning-subtitle">AI đang quét và phân tích thành phần</p>
          </div>
        )}

        {step === 'result' && result && (
          <div className="scan-result">
            <div className="result-header">
              <h2 className="result-title">Kết quả phân tích</h2>
              <button type="button" className="btn btn-outline" onClick={handleReset}>
                Quét lại
              </button>
            </div>

            {imagePreview && (
              <div className="result-image-wrap">
                <img src={imagePreview} alt="Ảnh đã quét" className="result-image" />
              </div>
            )}

            <div className="result-sections">
              {result.suitable.length > 0 && (
                <div className="result-section result-section--green">
                  <h3 className="result-section-title">
                    <span className="result-dot result-dot--green" />
                    Phù hợp với chế độ ăn chay
                  </h3>
                  <ul className="result-list">
                    {result.suitable.map(item => (
                      <li key={item} className="result-item result-item--green">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.unsuitable.length > 0 && (
                <div className="result-section result-section--red">
                  <h3 className="result-section-title">
                    <span className="result-dot result-dot--red" />
                    Không phù hợp
                  </h3>
                  <ul className="result-list">
                    {result.unsuitable.map(item => (
                      <li key={item} className="result-item result-item--red">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.unclear.length > 0 && (
                <div className="result-section result-section--yellow">
                  <h3 className="result-section-title">
                    <span className="result-dot result-dot--yellow" />
                    Chưa đủ thông tin
                  </h3>
                  <ul className="result-list">
                    {result.unclear.map(item => (
                      <li key={item} className="result-item result-item--yellow">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="result-disclaimer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#6b8471" strokeWidth="2"/>
                <path d="M12 8v4M12 16h.01" stroke="#6b8471" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p>Kết quả chỉ mang tính tham khảo dựa trên hình ảnh được cung cấp. Hệ thống không thể đảm bảo 100% chính xác. Luôn kiểm tra nhãn sản phẩm trực tiếp.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}