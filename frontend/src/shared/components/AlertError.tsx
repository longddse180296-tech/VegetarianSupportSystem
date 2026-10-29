// Chức năng: giao diện và thành phần dùng chung. Hiển thị một phần giao diện và phát sự kiện cho màn hình cha xử lý.
import './AlertError.css';

// Cấu trúc AlertErrorProps quy định dữ liệu trao đổi trong giao diện và thành phần dùng chung.
interface AlertErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

// Thành phần AlertError nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc giao diện và thành phần dùng chung.
export default function AlertError({
  title = 'Đã có lỗi xảy ra',
  message = 'Không thể tải dữ liệu vào lúc này. Vui lòng thử lại.',
  onRetry,
}: AlertErrorProps) {
  // Hiển thị thành phần giao diện dùng chung từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <div className="alert-error" role="alert" aria-live="assertive">
      <div className="alert-icon" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="11" fill="#fff0f0" stroke="#e05a5a" strokeWidth="2" />
          <path
            d="M12 7v6M12 16.5v.5"
            stroke="#c43c3c"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="alert-content">
        <strong className="alert-title">{title}</strong>
        <p className="alert-message">{message}</p>
      </div>
      {onRetry && (
        <button type="button" className="alert-retry-btn" onClick={onRetry}>
          Thử lại
        </button>
      )}
    </div>
  );
}
