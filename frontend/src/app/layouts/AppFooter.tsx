// Chức năng: giao diện và thành phần dùng chung. Bố trí phần điều hướng và vùng nội dung chung giữa các màn hình.
import Logo from './Logo';
import './AppFooter.css';
const currentYear = new Date().getFullYear();

// Thành phần AppFooter nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc giao diện và thành phần dùng chung.
export default function AppFooter() {
  // Hiển thị thành phần giao diện dùng chung từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="footer-col footer-col-brand">
          <div className="footer-logo-wrap">
            <Logo iconSize="sm" showText />
          </div>
          <p className="footer-desc">
            Khám phá công thức chay, quản lý nguyên liệu và lập thực đơn theo thông tin
            bạn đã khai báo. Nội dung dinh dưỡng trên nền tảng mang tính tham khảo.
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
          <h4 className="footer-col-title">Hỗ trợ tìm hiểu dinh dưỡng</h4>
          <p className="footer-col-text">
            Trao đổi với Trợ lý AI để tìm hiểu món chay và nguyên liệu.
            Bạn có thể kiểm tra lại thông tin trước khi áp dụng.
          </p>
          <div className="footer-support-badge" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-2h2zm0-4h-2V7h2z"
                fill="#2f7a45"
              />
            </svg>
            <span>Gửi góp ý qua trang Liên hệ</span>
          </div>
        </div>
      </div>

      <div className="app-footer-bottom">
        <div className="app-footer-bottom-inner">
          <p className="footer-copy">
            © {currentYear} Vegetarian Support. Nền tảng hỗ trợ ăn chay.
          </p>
          <div className="footer-bottom-links">
            <a href="#/recipes">Khám phá công thức chay</a>
            <span className="footer-divider">•</span>
            <a href="#/articles">Tìm hiểu dinh dưỡng</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
