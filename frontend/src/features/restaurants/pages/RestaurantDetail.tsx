interface RestaurantDetailPageProps {
  restaurantId: string;
  onNavigate?: (path: string) => void;
}

export default function RestaurantDetailPage({ restaurantId, onNavigate }: RestaurantDetailPageProps) {
  return (
    <div className="restaurant-detail-page">
      <div className="restaurant-detail-container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <ol className="breadcrumbs-list">
            <li className="breadcrumbs-item">
              <a href="#/" onClick={(e) => { e.preventDefault(); onNavigate?.('/'); }}>Trang chủ</a>
            </li>
            <li className="breadcrumbs-separator">/</li>
            <li className="breadcrumbs-item">
              <a href="#/restaurants" onClick={(e) => { e.preventDefault(); onNavigate?.('/restaurants'); }}>Nhà hàng</a>
            </li>
            <li className="breadcrumbs-separator">/</li>
            <li className="breadcrumbs-item breadcrumbs-current">Chi tiết nhà hàng</li>
          </ol>
        </nav>

        <div className="restaurant-detail-hero">
          <div className="restaurant-detail-image-placeholder">
            <p>Hình ảnh nhà hàng đang cập nhật...</p>
          </div>
        </div>

        <div className="restaurant-detail-info">
          <h1 className="restaurant-detail-name">Nhà hàng {restaurantId}</h1>
          <p className="restaurant-detail-address">Địa chỉ: Đang cập nhật</p>
          <p className="restaurant-detail-rating">Đánh giá: ★ Đang cập nhật</p>
        </div>
      </div>
    </div>
  );
}