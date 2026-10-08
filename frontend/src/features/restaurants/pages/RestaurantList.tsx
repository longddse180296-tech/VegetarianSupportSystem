import { useState } from 'react';
import {
  MapPin,
  Search,
  Navigation,
  Plus,
  Minus,
  LocateFixed,
  Filter,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  Leaf,
  ChevronRight,
} from 'lucide-react';
import './RestaurantList.css';

interface RestaurantCardModel {
  id: string;
  img: string;
  dietTag: 'Thuần chay (Vegan)' | 'Ăn chay có trứng sữa (Lacto-ovo)' | 'Ăn chay có trứng (Ovo)' | 'Ăn chay có sữa (Lacto-ovo)' | 'Ăn chay có sữa (Lacto)' | 'Chay dưỡng sinh' | 'Cà phê chay';
  status: 'Đang mở cửa' | 'Mở cửa lúc 11:00' | 'Mở cửa lúc 10:00';
  name: string;
  address: string;
  distanceKm: number;
  priceFrom: number;
  priceTo: number;
  tagline: string[];
  featured?: boolean;
  isVeganOnly?: boolean;
}

const RESTAURANTS: RestaurantCardModel[] = [
  {
    id: 'r1',
    img: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Cozy%20Vietnamese%20vegetarian%20restaurant%20interior%20with%20wooden%20furniture%2C%20green%20plants%2C%20customers%20eating%2C%20lens%20flare&image_size=landscape_4_3',
    dietTag: 'Ăn chay có trứng sữa (Lacto-ovo)',
    status: 'Đang mở cửa',
    name: 'An Nhiên Vegetarian Restaurant',
    address: 'Số 18 Ngõ 71 Lĩnh Lang, Công Vị, Ba Đình, Hà Nội',
    distanceKm: 1.2,
    priceFrom: 45000,
    priceTo: 150000,
    tagline: ['Không gian xanh vui nhộn', 'Thực đơn thu dưỡng', 'Chỗ đỗ ô tô'],
    featured: true,
  },
  {
    id: 'r2',
    img: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Elegant%20vegetarian%20cafe%20garden%20style%20with%20ferns%20and%20big%20windows%2C%20lush%20greenery%2C%20asian%20food&image_size=landscape_4_3',
    dietTag: 'Ăn chay có trứng sữa (Lacto-ovo)',
    status: 'Đang mở cửa',
    name: 'The Fernery Garden & Cafe Chay',
    address: '24 Đường Quảng Khánh, Quảng An, Tây Hồ, Hà Nội',
    distanceKm: 2.4,
    priceFrom: 45000,
    priceTo: 150000,
    tagline: ['Không gian ngoài trời', 'Bánh ngọt thuần chay', 'View Hồ Tây'],
  },
  {
    id: 'r3',
    img: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Minimalist%20Vietnamese%20vegan%20rice%20lunch%20set%20meal%20with%20tofu%20and%20greens%2C%20clean%20ceramic%20bowl&image_size=landscape_4_3',
    dietTag: 'Thuần chay (Vegan)',
    status: 'Đang mở cửa',
    name: 'Bếp Chay An Lạc - Ẩm Thực Thực Dưỡng',
    address: '109 Phố Mai Hắc Đế, Bùi Thị Xuân, Hai Bà Trưng, Hà Nội',
    distanceKm: 3.1,
    priceFrom: 50000,
    priceTo: 120000,
    tagline: ['Cơm văn phòng chay', 'Không bột ngọt', 'Đạm thực vật sạch'],
    isVeganOnly: true,
  },
  {
    id: 'r4',
    img: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Traditional%20Vietnamese%20Buddhist%20vegetarian%20family%20restaurant%20interior%20with%20wooden%20altar%20and%20lotus%20decor&image_size=landscape_4_3',
    dietTag: 'Ăn chay có sữa (Lacto)',
    status: 'Mở cửa lúc 11:00',
    name: 'Nhà Hàng Chay Sen Vàng',
    address: '52 Nguyễn Du, Phường Hàng Bài, Hoàn Kiếm, Hà Nội',
    distanceKm: 3.8,
    priceFrom: 80000,
    priceTo: 250000,
    tagline: ['Không gian thiện tĩnh', 'Tiệc chay gia đình', 'Trà thảo mộc'],
  },
];

const DISH_CHIPS = [
  { name: 'Phở chay', count: 8 },
  { name: 'Bún riêu chay', count: 12 },
  { name: 'Cơm tấm sườn chay', count: 15 },
  { name: 'Lẩu nấm chay', count: 9 },
  { name: 'Salad bò đậu gà', count: 14 },
  { name: 'Há cảo chay', count: 6 },
];

const DIET_FILTERS = ['Thuần chay (Vegan)', 'Ăn chay có sữa (Lacto)', 'Ăn chay có trứng (Ovo)', 'Ăn chay có trứng sữa (Lacto-ovo)', 'Chay dưỡng sinh', 'Cà phê chay'];
const DISTANCES = ['Tất cả', '< 1 km', '< 3 km', '< 5 km', '< 10 km'];

interface RestaurantListPageProps {
  onNavigate?: (path: string) => void;
}

export default function RestaurantListPage({ onNavigate }: RestaurantListPageProps) {
  const [search, setSearch] = useState('');
  const [activeDist, setActiveDist] = useState('< 3 km');
  const [activeDiet, setActiveDiet] = useState('Thuần chay (Vegan)');
  const [matchOnly, setMatchOnly] = useState(true);

  const formatVND = (n: number) =>
    new Intl.NumberFormat('vi-VN').format(n / 1000) + '.000đ';

  return (
    <div className="rl-root">
      {/* Breadcrumb */}
      <div className="rl-topbar">
        <div className="rl-breadcrumb">
          <button type="button" className="crumb-link" onClick={() => onNavigate?.('/')}>
            Trang chủ
          </button>
          <ChevronRight size={12} className="crumb-sep" />
          <span className="crumb-active">Nhà hàng chay</span>
        </div>
        <button type="button" className="rl-geo-toggle">
          <Navigation size={12} />
          Sử dụng vị trí hiện tại
        </button>
      </div>

      {/* Page title */}
      <header className="rl-header">
        <h1>Nhà hàng chay gần bạn</h1>
        <p>
          Khám phá các hàng và quán ăn chay thanh tịnh, dinh dưỡng phù hợp với vị trí hiện tại của bạn.
        </p>
      </header>

      {/* Location banner */}
      <section className="rl-location-banner">
        <div className="rl-location-banner-left">
          <MapPin size={18} />
          <span>Cho phép truy cập vị trí để tìm nhà hàng chay gần bạn chính xác nhất.</span>
        </div>
        <button type="button" className="btn btn-primary-green">
          Cho phép vị trí
        </button>
      </section>

      {/* Search bar */}
      <section className="rl-search-wrap">
        <div className="rl-search">
          <Search size={18} className="search-ic" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm nhà hàng hoặc khu vực (quận, phố, tên quán)..."
            className="rl-search-input"
          />
          <button type="button" className="btn btn-search-primary">
            <Search size={14} /> Tìm kiếm
          </button>
        </div>

        <div className="rl-filters">
          <div className="rl-filter-row">
            <span className="filter-label">Khoảng cách:</span>
            <div className="chip-row">
              {DISTANCES.map(d => (
                <button
                  key={d}
                  type="button"
                  className={`filter-chip ${activeDist === d ? 'active' : ''}`}
                  onClick={() => setActiveDist(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="rl-filter-row mt">
            <span className="filter-label">Tiện ích:</span>
            <div className="chip-row">
              {DIET_FILTERS.slice(0, 2).map(d => (
                <button
                  key={d}
                  type="button"
                  className={`filter-chip pill-purple ${activeDiet === d ? 'active' : ''}`}
                  onClick={() => setActiveDiet(d)}
                >
                  {d}
                </button>
              ))}
              <span className="filter-sep">|</span>
              {DIET_FILTERS.slice(2).map(d => (
                <button
                  key={d}
                  type="button"
                  className="filter-chip"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="rl-filter-row mt between">
            <span />
            <button type="button" className="clear-filter">
              <Filter size={12} /> Xóa bộ lọc
            </button>
          </div>
        </div>
      </section>

      {/* Profile match banner */}
      <div className="rl-profile-banner">
        <div className="rl-profile-banner-left">
          <div className="avatar-leaf">
            <Leaf size={18} />
          </div>
          <div>
            <div className="strong-row">
              <strong>Chỉ hiện thị nhà hàng phù hợp với hồ sơ của tôi</strong>
              <span className="recommend-chip">
                <SparkleMini />
                Thông minh
              </span>
            </div>
            <p className="banner-desc">
              Hồ sơ của bạn: Thuần Chay (Vegan) • Tự động lọc các địa điểm đạt chuẩn
            </p>
          </div>
        </div>
        <button
          type="button"
          className="toggle-wrap"
          onClick={() => setMatchOnly(v => !v)}
          aria-label="toggle match"
        >
          {matchOnly ? <ToggleRight size={42} className="toggle-on" /> : <ToggleLeft size={42} />}
        </button>
      </div>

      {/* Main content */}
      <section className="rl-main">
        {/* LIST COLUMN */}
        <div className="rl-list-col">
          <div className="rl-list-head-row">
            <div>
              <h3>Gần vị trí của bạn <span className="count-badge">18 địa điểm</span></h3>
            </div>
            <div className="sort-select">
              <span>Sắp xếp:</span>
              <button type="button" className="sort-btn">
                Gần nhất
                <ChevronDown size={14} />
              </button>
            </div>
          </div>

          <div className="rl-restaurant-list">
            {RESTAURANTS.map(r => (
              <article key={r.id} className={`rl-restaurant-card ${r.featured ? 'featured' : ''}`}>
                {r.featured && (
                  <span className="featured-chip">Gợi ý số 1 🏆</span>
                )}
                <div className="rl-restaurant-img-wrap">
                  <img src={r.img} alt={r.name} className="rl-restaurant-img" />
                </div>
                <div className="rl-restaurant-body">
                  <div className="rl-card-head">
                    <span className={`diet-tag ${r.dietTag.includes('Thuần') ? 'vegan' : 'lacto'}`}>
                      {r.dietTag}
                    </span>
                    <span className={`status-tag ${r.status === 'Đang mở cửa' ? 'open' : 'late'}`}>
                      <span className="dot" />
                      {r.status}
                    </span>
                  </div>

                  <h4 className="rl-restaurant-name">{r.name}</h4>
                  <p className="rl-restaurant-addr">
                    <MapPin size={12} />
                    {r.address}
                  </p>

                  <div className="rl-restaurant-meta">
                    <span className="distance-chip">
                      <Navigation size={12} /> {r.distanceKm} km
                    </span>
                    <span className="price-chip">
                      Khoảng giá: {formatVND(r.priceFrom)} - {formatVND(r.priceTo)}
                    </span>
                  </div>

                  <div className="rl-tagline-row">
                    {r.tagline.map(t => (
                      <span key={t} className="tagline-pill">🌿 {t}</span>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn btn-card-detail"
                    onClick={() => onNavigate?.(`/restaurants/${encodeURIComponent(r.id)}`)}
                  >
                    Xem chi tiết
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Dish chips */}
          <div className="rl-dish-box">
            <h4>Đang tìm món nào?</h4>
            <p>Chọn món ăn để tìm các nhà hàng có phục vụ món bạn thích:</p>
            <div className="rl-dish-chips">
              {DISH_CHIPS.map(d => (
                <button key={d.name} type="button" className="dish-chip">
                  🍲 {d.name} ({d.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MAP COLUMN */}
        <div className="rl-map-col">
          <div className="rl-map-wrap">
            <img
              src="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Minimal%20flat%20street%20map%20with%20main%20roads%20in%20black%2C%20light%20green%20parks%2C%20blue%20river%2C%20Hanoi%20Westlake%20area%2C%20simple%20green%20location%20markers&image_size=portrait_4_3"
              alt="Bản đồ nhà hàng chay Hà Nội"
              className="rl-map-bg"
            />

            {/* Floating controls */}
            <div className="map-controls top-right">
              <button className="map-ctrl-btn" aria-label="Bản đồ">Bản đồ</button>
              <button className="map-ctrl-btn alt" aria-label="Vệ tinh">Vệ tinh</button>
              <button className="map-ctrl-btn" aria-label="fullscreen">
                <LocateFixed size={14} />
              </button>
            </div>
            <div className="map-controls right-middle">
              <button className="map-ctrl-btn-stack" aria-label="zoom-in"><Plus size={14} /></button>
              <button className="map-ctrl-btn-stack" aria-label="zoom-out"><Minus size={14} /></button>
              <button className="map-ctrl-btn-stack" aria-label="my-location"><MapPin size={14} /></button>
            </div>

            {/* Pins */}
            <button className="pin pin-1" aria-label="An Nhiên">
              <Leaf size={14} />
              <span className="pin-label">An Nhiên</span>
            </button>
            <button className="pin pin-2" aria-label="The Fernery">
              <Leaf size={14} />
              <span className="pin-label">The Fernery</span>
            </button>
            <button className="pin pin-3" aria-label="An Lac">
              <Leaf size={14} />
              <span className="pin-label">An Lạc</span>
            </button>
            <button className="pin pin-4" aria-label="Sen Vang">
              <Leaf size={14} />
              <span className="pin-label">Sen Vàng</span>
            </button>
            <button className="pin pin-me" aria-label="Vị trí của tôi">
              <span className="pulse-me" />
            </button>

            {/* Popup */}
            <div className="rl-map-popup">
              <div className="popup-tag">
                <Navigation size={12} />
                Tìm khi di chuyển bản đồ (3/5)
              </div>
              <div className="popup-header">
                <img
                  src={RESTAURANTS[0].img}
                  alt={RESTAURANTS[0].name}
                  className="popup-img"
                />
                <div className="popup-text">
                  <h5>An Nhiên Vegetarian</h5>
                  <div className="popup-sub">
                    <MapPin size={12} /> Cách 1.2 km • Ba Đình, Hà Nội
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-popup-cta"
                onClick={() => onNavigate?.(`/restaurants/${encodeURIComponent(RESTAURANTS[0].id)}`)}
              >
                Xem chi tiết & Chỉ đường →
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SparkleMini() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.5 5L19 8.5 13.5 10 12 15l-1.5-5L5 8.5 10.5 7z" />
    </svg>
  );
}
