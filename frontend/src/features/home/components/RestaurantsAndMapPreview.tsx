import type { HomeRestaurantSummary } from '../types/home.types';
import RestaurantCard from './RestaurantCard';
import './RestaurantsAndMapPreview.css';

interface RestaurantsAndMapPreviewProps {
  restaurants: HomeRestaurantSummary[];
  onSelect?: (id: string) => void;
  onViewAll?: () => void;
}

// Inline placeholder "map" — we deliberately avoid pulling in a map library
// until the backend exposes a real geo endpoint. The CSS-driven outline is
// enough for a static preview that still reads as map UI.
export default function RestaurantsAndMapPreview({
  restaurants,
  onSelect,
  onViewAll,
}: RestaurantsAndMapPreviewProps) {
  return (
    <section className="home-restaurants-section" aria-label="Nhà hàng chay gần bạn">
      <header className="home-section-header">
        <div>
          <h2 className="home-section-title">Nhà hàng chay gần bạn</h2>
          <p className="home-section-subtitle">Tìm những quán chay uy tín gần vị trí của bạn.</p>
        </div>
        <button type="button" className="home-section-link" onClick={onViewAll}>
          Xem tất cả →
        </button>
      </header>

      <div className="home-restaurants-grid">
        <div className="home-restaurants-list">
          {restaurants.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} onSelect={onSelect} />
          ))}
        </div>

        <div className="home-restaurants-map" aria-hidden="true">
          <div className="home-map-canvas">
            <div className="home-map-grid" />
            <div className="home-map-road home-map-road--h" style={{ top: '38%' }} />
            <div className="home-map-road home-map-road--h" style={{ top: '70%' }} />
            <div className="home-map-road home-map-road--v" style={{ left: '32%' }} />
            <div className="home-map-road home-map-road--v" style={{ left: '68%' }} />

            <span className="home-map-pin home-map-pin--a" style={{ top: '28%', left: '28%' }}>
              A
            </span>
            <span className="home-map-pin home-map-pin--b" style={{ top: '54%', left: '60%' }}>
              B
            </span>
            <span className="home-map-pin home-map-pin--self" style={{ top: '42%', left: '44%' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7zm0 9.5a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 12 11.5z" />
              </svg>
            </span>

            <div className="home-map-chip home-map-chip--top">
              <strong>Trung tâm Q.1</strong>
              <span>Có 28 nhà hàng chay</span>
            </div>
            <div className="home-map-chip home-map-chip--bottom">Bản đồ minh hoạ — cập nhật khi có API.</div>
          </div>
        </div>
      </div>
    </section>
  );
}