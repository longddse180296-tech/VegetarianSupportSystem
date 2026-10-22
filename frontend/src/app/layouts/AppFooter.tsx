import Logo from './Logo';
import './AppFooter.css';

export default function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="footer-col footer-col-brand">
          <div className="footer-logo-wrap">
            <Logo iconSize="sm" showText />
          </div>
          <p className="footer-desc">
            Nền tảng hỗ trợ định dưỡng thực vật khoa học hàng đầu, đồng hành cùng bạn trên
            lộ trình xây dựng lối sống thuần thực vật lành mạnh, tối ưu chỉ số BMI và cân
            bằng tinh chất.
          </p>
        </div>

        <div className="footer-col footer-col-links">
          <h4 className="footer-col-title">Liên kết hữu ích</h4>
          <ul className="footer-link-list">
            <li><a href="#/about">Giới thiệu</a></li>
            <li><a href="#/contact">Liên hệ</a></li>
            <li><a href="#/privacy">Chính sách bảo mật</a></li>
            <li><a href="#/terms">Điều khoản sử dụng</a></li>
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
