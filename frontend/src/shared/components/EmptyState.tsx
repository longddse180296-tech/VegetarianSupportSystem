import './EmptyState.css';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
}

export default function EmptyState({
  title = 'Không tìm thấy công thức nào',
  description = 'Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc để xem thêm kết quả nhé.',
  onReset,
}: EmptyStateProps) {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <div className="empty-icon" aria-hidden="true">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#f0f6f1" stroke="#d8e8db" strokeWidth="2" />
          <path
            d="M22 28h20M22 34h20M22 40h12"
            stroke="#7fa589"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M44 42l-4-4m0 4l4-4"
            stroke="#b84949"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-desc">{description}</p>
      {onReset && (
        <button type="button" className="empty-reset-btn" onClick={onReset}>
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
}
