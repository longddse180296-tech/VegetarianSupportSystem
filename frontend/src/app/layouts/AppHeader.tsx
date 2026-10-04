import './AppHeader.css';

const NAV_ITEMS = [
  { key: 'home', label: 'Trang chủ', badge: null as string | null },
  { key: 'recipes', label: 'Công thức', badge: null as string | null, active: true },
  { key: 'articles', label: 'Bài viết', badge: null as string | null },
  { key: 'videos', label: 'Video', badge: null as string | null },
  { key: 'restaurants', label: 'Nhà hàng chay', badge: null as string | null },
  { key: 'mealplans', label: 'Thực đơn', badge: null as string | null },
  { key: 'aichat', label: 'Trợ lý AI', badge: 'Mới' as string | null },
  { key: 'foodscan', label: 'Quét thực phẩm', badge: 'HOT' as string | null },
];

export default function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <a href="#" className="app-logo" aria-label="Vegetarian Support trang chủ">
          <span className="app-logo-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <path
                d="M20 6c3.314 0 6 2.686 6 6s-2.686 6-6 6c-1.385 0-2.656-.468-3.684-1.262.446 1.888 1.782 3.49 3.614 4.247C15.96 23.227 10.67 24.9 6 26c-.3 0-.3-.47-.037-.34 4.18 2.06 9.51 1.31 12.63-1.22-4.55-.71-8.52-4.09-9.74-8.53 2.76.06 5.55.85 8 2.38-.22-2.04.73-4.1 2.44-5.4A5.98 5.98 0 0 1 20 6zm-5 5h1v1h-1v-1zm3 0h1v1h-1v-1zm-6 1h1v1h-1v-1zm9 0h1v1h-1v-1zm-7 2h1v1h-1v-1zm5 0h1v1h-1v-1zm-3 1h1v1h-1v-1z"
                fill="#3f7a4f"
              />
            </svg>
          </span>
          <span className="app-logo-text">Vegetarian Support</span>
        </a>

        <nav className="app-nav" aria-label="Điều hướng chính">
          <ul className="app-nav-list">
            {NAV_ITEMS.map((item) => (
              <li key={item.key} className="app-nav-item">
                <a
                  href={`#${item.key}`}
                  className={
                    item.active ? 'app-nav-link app-nav-link-active' : 'app-nav-link'
                  }
                  aria-current={item.active ? 'page' : undefined}
                >
                  <span className="app-nav-label">{item.label}</span>
                  {item.badge && (
                    <span
                      className={
                        item.badge === 'HOT' ? 'app-nav-badge app-nav-badge-hot' : 'app-nav-badge'
                      }
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.active && <span className="app-nav-underline" aria-hidden="true" />}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="app-header-actions">
          <button type="button" className="btn btn-outline">
            Đăng nhập
          </button>
          <button type="button" className="btn btn-primary">
            Đăng ký
          </button>
        </div>
      </div>
    </header>
  );
}
