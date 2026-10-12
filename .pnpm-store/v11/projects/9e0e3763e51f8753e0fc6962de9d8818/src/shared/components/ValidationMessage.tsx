import './ValidationMessage.css';

interface ValidationMessageProps {
  message?: string;
}

export default function ValidationMessage({ message }: ValidationMessageProps) {
  if (!message) return null;

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
