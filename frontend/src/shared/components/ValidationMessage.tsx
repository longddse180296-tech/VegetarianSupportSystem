// Chức năng: giao diện và thành phần dùng chung. Hiển thị một phần giao diện và phát sự kiện cho màn hình cha xử lý.
import './ValidationMessage.css';

// Cấu trúc ValidationMessageProps quy định dữ liệu trao đổi trong giao diện và thành phần dùng chung.
interface ValidationMessageProps {
  message?: string;
}

// Thành phần ValidationMessage nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc giao diện và thành phần dùng chung.
export default function ValidationMessage({ message }: ValidationMessageProps) {
  if (!message) return null;

  // Hiển thị thành phần giao diện dùng chung từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <div className="validation-message" role="alert">
      <span className="validation-icon" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="11" fill="#fee2e2" />
          <path
            d="M12 8v5M12 15.5v.5"
            stroke="#dc2626"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span>{message}</span>
    </div>
  );
}
