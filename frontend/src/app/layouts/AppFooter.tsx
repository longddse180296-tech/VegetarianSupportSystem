import './AppFooter.css';

export default function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="footer-col footer-col-brand">
          <div className="footer-logo-wrap">
            <span className="app-logo-icon footer-logo-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <path
                  d="M20 6c3.314 0 6 2.686 6 6s-2.686 6-6 6c-1.385 0-2.656-.468-3.684-1.262.446 1.888 1.782 3.49 3.614 4.247C15.96 23.227 10.67 24.9 6 26c-.3 0-.3-.47-.037-.34 4.18 2.06 9.51 1.31 12.63-1.22-4.55-.71-8.52-4.09-9.74-8.53 2.76.06 5.55.85 8 2.38-.22-2.04.73-4.1 2.44-5.4A5.98 5.98 0 0 1 20 6z"
                  fill="#3f7a4f"
                />
              </svg>
            </span>
            <span className="footer-logo-text">Vegetarian Support</span>
          </div>
          <p className="footer-desc">
            Nền tảng hỗ trợ định dưỡng thực vật khoa học hàng đầu, đồng hành cùng bạn trên
            lộ trình xây dựng lối sống thuần thực vật lành mạnh, tối ưu chỉ số BMI và cân
            bằng tinh chất.
          </p>
          <div className="footer-socials" aria-label="Mạng xã hội">
            <a className="social-btn" href="#" aria-label="Facebook" title="Facebook">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.776-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                  fill="#2f7a45"
                />
              </svg>
            </a>
            <a className="social-btn" href="#" aria-label="YouTube" title="YouTube">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M23.5 6.5a4 4 0 0 0-2.8-2.8C18.7 3.2 12 3.2 12 3.2s-6.7 0-8.7.5A4 4 0 0 0 .5 6.5C0 8.5 0 12 0 12s0 3.5.5 5.5a4 4 0 0 0 2.8 2.8c2 .5 8.7.5 8.7.5s6.7 0 8.7-.5a4 4 0 0 0 2.8-2.8c.5-2 .5-5.5.5-5.5s0-3.5-.5-5.5zM9.75 15.5v-7l6.5 3.5-6.5 3.5z"
                  fill="#c13e60"
                />
              </svg>
            </a>
            <a className="social-btn" href="#" aria-label="Email" title="Liên hệ email">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="14"
                  rx="2.5"
                  stroke="#2f7a45"
                  strokeWidth="1.8"
                />
                <path
                  d="M4 6.5l8 6 8-6"
                  stroke="#2f7a45"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>

        <div className="footer-col footer-col-links">
          <h4 className="footer-col-title">Liên kết hữu ích</h4>
          <ul className="footer-link-list">
            <li><a href="#about">Giới thiệu</a></li>
            <li><a href="#contact">Liên hệ</a></li>
            <li><a href="#privacy">Chính sách bảo mật</a></li>
            <li><a href="#terms">Điều khoản sử dụng</a></li>
          </ul>
        </div>

        <div className="footer-col footer-col-consult">
          <h4 className="footer-col-title">Tư vấn dinh dưỡng</h4>
          <p className="footer-col-text">
            Nhận tư vấn thực đơn thuần chay theo chỉ số BMI cá nhân hóa từ chuyên gia
            & Trợ lý AI.
          </p>
          <div className="footer-support-badge" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-2h2zm0-4h-2V7h2z"
                fill="#2f7a45"
              />
            </svg>
            <span>Hỗ trợ 24/7</span>
          </div>
        </div>
      </div>

      <div className="app-footer-bottom">
        <div className="app-footer-bottom-inner">
          <p className="footer-copy">
            © 2025 Vegetarian Support. Nền tảng dinh dưỡng chay thông minh.
          </p>
          <div className="footer-bottom-links">
            <a href="#explore-vegan">Khám phá chế độ thiên</a>
            <span className="footer-divider">•</span>
            <a href="#understand-nutrition">Thấu hiểu dinh dưỡng</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
