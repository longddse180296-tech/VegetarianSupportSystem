import './HomePage.css';

interface HomePageProps {
  onNavigate?: (path: string) => void;
  isLoggedIn?: boolean;
}

const PUBLIC_DESTINATIONS = [
  { label: 'Công thức', path: '/recipes' },
  { label: 'Bài viết', path: '/articles' },
  { label: 'Video', path: '/videos' },
  { label: 'Nhà hàng', path: '/restaurants' },
];

export default function HomePage({ onNavigate, isLoggedIn = false }: HomePageProps) {
  return (
    <div className="home-page" aria-label="Trang chủ Vegetarian Support">
      <section className="home-recipes-section" aria-labelledby="home-title">
        <header className="home-section-header">
          <div>
            <h1 id="home-title" className="home-section-title">
              Vegetarian Support
            </h1>
            <p className="home-section-subtitle">
              Khám phá thông tin và công cụ hỗ trợ chế độ ăn chay.
            </p>
          </div>
        </header>

        <nav className="home-recipes-grid" aria-label="Khám phá nội dung">
          {PUBLIC_DESTINATIONS.map(({ label, path }) => (
            <button
              key={path}
              type="button"
              className="home-section-link"
              onClick={() => onNavigate?.(path)}
            >
              {label}
            </button>
          ))}
        </nav>
      </section>

      <section className="home-assistant-section" aria-label="Công cụ hỗ trợ">
        <div className="home-assistant-section-grid">
          <div className="home-assistant-section-intro">
            <span className="home-assistant-section-eyebrow">Trợ lý AI</span>
            <h2 className="home-section-title">Trao đổi về chế độ ăn chay</h2>
            <p className="home-section-subtitle">
              Khách có thể dùng thử trợ lý để hỏi thông tin chung. Câu trả lời không thay thế
              tư vấn y tế.
            </p>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => onNavigate?.('/ai-chat')}
            >
              {isLoggedIn ? 'Mở trợ lý AI' : 'Dùng thử trợ lý AI'}
            </button>
          </div>

          <div className="home-assistant-section-intro">
            <span className="home-assistant-section-eyebrow">Kiểm tra thực phẩm</span>
            <h2 className="home-section-title">Kiểm tra món ăn và thành phần</h2>
            <p className="home-section-subtitle">
              Kết quả chỉ được đánh giá theo thông tin đã cung cấp và có thể cần xác minh thêm.
            </p>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => onNavigate?.(isLoggedIn ? '/food-scan' : '/auth/login')}
            >
              {isLoggedIn ? 'Mở kiểm tra thực phẩm' : 'Đăng nhập để sử dụng'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
