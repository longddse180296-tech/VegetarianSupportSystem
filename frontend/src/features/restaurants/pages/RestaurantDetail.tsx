import {
  MapPin,
  Phone,
  Clock,
  BadgeCheck,
  Banknote,
  Leaf,
  UtensilsCrossed,
  Wifi,
  ParkingCircle,
  TreePine,
  Navigation,
  Map,
  ChevronRight,
} from 'lucide-react'
import './RestaurantDetail.css'

interface Props {
  restaurantId: string;
  onNavigate?: (path: string) => void;
}

const HOURS = [
  { day: 'Thứ Hai', time: '08:00 - 22:00', highlight: false, today: false },
  { day: 'Thứ Ba', time: '08:00 - 22:00', highlight: false, today: false },
  { day: 'Thứ Tư', time: '08:00 - 22:00', highlight: false, today: false },
  { day: 'Thứ Năm', time: '08:00 - 22:00', highlight: false, today: true },
  { day: 'Thứ Sáu', time: '08:00 - 22:00', highlight: false, today: false },
  { day: 'Thứ Bảy', time: '08:00 - 23:00', highlight: false, today: false },
  { day: 'Chủ Nhật', time: '08:00 - 23:00', highlight: false, today: false },
] as const

const SIGNATURE_DISHES = [
  { id: 'd1', name: 'Đậu hũ sốt nấm', desc: 'Đậu hũ chiên vàng sốt nấm hương và nấm đông cô đậm đà thanh vị.', tag: 'MÓN ĐƯỢC GỢI Ý', img: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Braised%20tofu%20with%20mushroom%20shiitake%20oyster%20sauce%20ceramic%20plate&image_size=square_hd' },
  { id: 'd2', name: 'Đậu hũ áp chảo sốt tiêu đen', desc: 'Đậu hũ mềm ướp tiêu đen áp chảo tếu đen và dứa chưng Đà Lạt.', tag: 'THỰC DƯỠNG', img: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Pan%20seared%20tofu%20black%20pepper%20pineapple%20Vietnamese&image_size=square_hd' },
  { id: 'd3', name: 'Cuốn đậu hũ nấm tươi', desc: 'Cuốn rấm mềm, nấm tươi và đậu hũ chiên lương mề rang.', tag: 'MÓN CUẨN THANH MẠT', img: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Fresh%20vegetable%20rice%20paper%20rolls%20tofu%20mushroom%20herbs&image_size=square_hd' },
]

const RELATED_CONTENT = [
  { id: 'r1', type: 'Công thức nấu', title: 'Công thức: Đậu hũ sốt nấm', desc: 'Từ nấm đông cô thơm ngon, tron vị thanh đạm ngay tại tại bếp bạn.', meta: '👩🍳 25 phút   •   🔥 320 kcal', img: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Tofu%20mushroom%20recipe%20cooking%20bowl%20fresh%20herbs&image_size=square_hd' },
  { id: 'r2', type: 'Bài viết dinh dưỡng', title: 'Cẩm nang: 7 lợi ích của chế độ ăn chay đối với sức khỏe', desc: 'Phân tích khoa học về tác động của dinh dưỡng thực vật đối với cơ thể người.', meta: '👨⚕ BS. Hoàng Nam    •   ⏳ 8 phút đọc', img: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vegan%20nutrition%20infographic%20doctor%20consultation%20greens&image_size=square_hd' },
  { id: 'r3', type: 'Video hướng dẫn', title: 'Video: Bí quyết làm lẩu nấm chay thanh ngọt tại nhà', desc: 'Hướng dẫn chi tiết cách nấu nước dùng ngọt thanh từ củ cải, đậu ngọt và nấm hương tươi.', meta: '⏱ 12:20   •   🎯 HD 1080p', img: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vegan%20mushroom%20hot%20pot%20cooking%20video%20tutorial%20fresh%20vegetables&image_size=square_hd' },
]

const NEARBY = [
  { id: 'n1', name: 'Bếp Chay An Lạc - Ẩm Thực Thực Dưỡng', address: '109 Phố Mai Hắc Đế, Đống Đa', distance: '1.8 km', img: '' },
  { id: 'n2', name: 'The Fernery Garden & Cafe Chay', address: '24 Đường Quảng Khánh, Tây Hồ', distance: '2.4 km', img: '' },
  { id: 'n3', name: 'Nhà Hàng Chay Sen Vàng', address: '52 Nguyễn Du, Hoàn Kiếm', distance: '3.8 km', img: '' },
]

export default function RestaurantDetailPage({ restaurantId: _restaurantId, onNavigate }: Props) {
  return (
    <div className="rd-page">
      {/* Breadcrumbs */}
      <nav className="rd-breadcrumbs">
        <span onClick={() => onNavigate?.('/')} className="rd-link">Trang chủ</span>
        <span className="rd-sep">›</span>
        <span onClick={() => onNavigate?.('/restaurants')} className="rd-link">Nhà hàng chay</span>
        <span className="rd-sep">›</span>
        <span className="rd-current">An Nhiên Vegetarian</span>
      </nav>

      {/* Hero 2-col: gallery + info */}
      <section className="rd-hero">
        <div className="rd-gallery">
          <div className="rd-verified-chip">
            <BadgeCheck size={14} /> Không gian được kiểm duyệt
          </div>
          <div className="rd-main-img">
            <div className="rd-img-placeholder" />
          </div>
          <div className="rd-gallery-row">
            <div className="rd-img-placeholder rd-thumb" />
            <div className="rd-img-placeholder rd-thumb" />
          </div>
        </div>

        <div className="rd-info">
          <div className="rd-tags-row">
            <span className="rd-tag rd-tag-strong">NHÀ HÀNG CHAY • THUẦN CHAY 100%</span>
            <span className="rd-tag-soft"><Clock size={12} /> Đang mở cửa • 08:00 - 22:00</span>
          </div>
          <h1 className="rd-name">An Nhiên Vegetarian</h1>
          <div className="rd-distance">
            <MapPin size={14} /> Cách bạn 1.2 km (Quận 1)
          </div>

          <div className="rd-contact-block">
            <div className="rd-contact-line">
              <MapPin size={16} className="rd-icon-green" />
              <span>123 Nguyễn Văn A, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh</span>
            </div>
            <div className="rd-contact-line">
              <Phone size={16} className="rd-icon-green" />
              <span>Số điện thoại: 028 3822 6789</span>
            </div>
            <div className="rd-contact-line">
              <Banknote size={16} className="rd-icon-green" />
              <span>Khoảng giá tham khảo: 100.000đ - 250.000đ / người</span>
            </div>
          </div>

          <div className="rd-chips-row">
            <span className="rd-chip"><Leaf size={12} /> Thuần chay 100%</span>
            <span className="rd-chip"><BadgeCheck size={12} /> Món Việt thanh vị</span>
            <span className="rd-chip"><TreePine size={12} /> Không gian xanh yên tĩnh</span>
            <span className="rd-chip"><ParkingCircle size={12} /> Có chỗ để ô tô</span>
          </div>

          <div className="rd-actions">
            <button className="rd-btn rd-btn-primary">
              <Navigation size={16} /> Chỉ đường
            </button>
            <button className="rd-btn rd-btn-secondary">
              <Map size={16} /> Xem trên bản đồ
            </button>
          </div>
        </div>
      </section>

      {/* 6 stat cards */}
      <section className="rd-stats">
        <div className="rd-stat-card">
          <div className="rd-stat-icon"><MapPin size={20} /></div>
          <div className="rd-stat-content">
            <div className="rd-stat-lbl">Địa chỉ chính thức</div>
            <div className="rd-stat-val">123 Nguyễn Văn A, Quận 1, TP.HCM</div>
            <div className="rd-stat-sub">Khu vực trung tâm</div>
          </div>
        </div>
        <div className="rd-stat-card">
          <div className="rd-stat-icon"><Phone size={20} /></div>
          <div className="rd-stat-content">
            <div className="rd-stat-lbl">Số điện thoại</div>
            <div className="rd-stat-val">028 3822 6789</div>
            <div className="rd-stat-sub">Hỗ trợ đặt bàn & giữ chỗ</div>
          </div>
        </div>
        <div className="rd-stat-card">
          <div className="rd-stat-icon"><Clock size={20} /></div>
          <div className="rd-stat-content">
            <div className="rd-stat-lbl">Giờ mở cửa</div>
            <div className="rd-stat-val">08:00 - 22:00</div>
            <div className="rd-stat-sub">Hằng ngày (Phụ vụ)</div>
          </div>
        </div>
        <div className="rd-stat-card">
          <div className="rd-stat-icon"><Banknote size={20} /></div>
          <div className="rd-stat-content">
            <div className="rd-stat-lbl">Mức giá tham khảo</div>
            <div className="rd-stat-val">100.000đ - 250.000đ / người</div>
            <div className="rd-stat-sub">Phù hợp ăn cá nhân & nhóm</div>
          </div>
        </div>
        <div className="rd-stat-card">
          <div className="rd-stat-icon"><UtensilsCrossed size={20} /></div>
          <div className="rd-stat-content">
            <div className="rd-stat-lbl">Phong cách ẩm thực</div>
            <div className="rd-stat-val">Thuần chay Việt Nam đương đại</div>
            <div className="rd-stat-sub">Dương sinh, thanh nhiệt</div>
          </div>
        </div>
        <div className="rd-stat-card">
          <div className="rd-stat-icon"><Wifi size={20} /></div>
          <div className="rd-stat-content">
            <div className="rd-stat-lbl">Tiện ích không gian</div>
            <div className="rd-stat-val">Điều hòa, Wifi, Đỗ ô tô</div>
            <div className="rd-stat-sub">Có phòng riêng thanh lịch</div>
          </div>
        </div>
      </section>

      {/* Giới thiệu */}
      <section className="rd-intro">
        <h2 className="rd-section-title">Giới thiệu</h2>
        <p className="rd-intro-text">
          An Nhiên Vegetarian phục vụ các món chay Việt Nam theo phong cách hiện đại, sử dụng nguồn nguyên liệu rau củ tươi ngon mỗi ngày và giá cách thuần tự nhiên.
          Không gian được bài trí mộc mạc với gỗ ấm và nhiều cây xanh, mang đến trải nghiệm ẩm thực an lành, cân bằng chất xơ và tận tăng cường thượng nhật.
        </p>
        <div className="rd-intro-badges">
          <div className="rd-intro-badge">
            <div className="rd-badge-num">100%</div>
            <div className="rd-badge-lbl">Người cũ hài cốt</div>
          </div>
          <div className="rd-intro-badge">
            <div className="rd-badge-num">0%</div>
            <div className="rd-badge-lbl">Phẩm mã hóa học</div>
          </div>
        </div>
      </section>

      {/* Map + Hours */}
      <section className="rd-map-hours">
        <div className="rd-map-col">
          <h2 className="rd-section-title">Vị trí & Đường đi</h2>
          <div className="rd-map-wrap">
            <div className="rd-map-header">
              <span className="rd-map-pin-active"><MapPin size={12} /> An Nhiên Vegetarian</span>
              <span className="rd-map-dist">| 1.2 km từ vị trí của bạn</span>
              <button className="rd-map-maps-btn"><Map size={12} /> Mở Google Maps chỉ đường</button>
            </div>
            <div className="rd-map-body">
              <div className="rd-map-placeholder" />
              <div className="rd-map-bottom">
                <span className="rd-map-chip">🚇 Tuyến đường thuận tiện nhất qua đường Hai Bà Trưng & Lê Duẩn</span>
                <span className="rd-map-chip rd-map-chip-soft">🚗 Giao thông thông thoáng</span>
              </div>
            </div>
          </div>
          <div className="rd-map-foot">
            <span className="rd-foot-chip">🛵 5 phút xe máy</span>
            <span className="rd-foot-chip">🚌 12 phút đi bộ</span>
            <span className="rd-foot-chip rd-foot-chip-soft">⏳ 12 phút đi bộ</span>
          </div>
        </div>

        <div className="rd-hours-col">
          <h2 className="rd-section-title">Giờ mở cửa chi tiết</h2>
          <div className="rd-hours-list">
            {HOURS.map((h) => (
              <div
                key={h.day}
                className={`rd-hours-row ${h.today ? 'is-today' : ''} ${h.highlight ? 'is-highlight' : ''}`}
              >
                <div className="rd-hours-day">
                  {h.day}
                  {h.today && <span className="rd-hours-today-badge">Hôm nay</span>}
                </div>
                <div className="rd-hours-time">{h.time}</div>
              </div>
            ))}
            <div className="rd-hours-note">
              <Clock size={12} /> Đẹp nhận gọi món cuối lúc 21:30 hàng ngày.
            </div>
          </div>
        </div>
      </section>

      {/* Signature dishes */}
      <section className="rd-dishes">
        <div className="rd-section-head">
          <h2 className="rd-section-title">Món liên quan tận nhà hàng</h2>
          <span className="rd-section-hint">
            💡 Gợi ý dựa trên từ khóa tìm kiếm: <strong>"Đậu hũ"</strong>
          </span>
        </div>
        <div className="rd-dishes-grid">
          {SIGNATURE_DISHES.map((d) => (
            <article key={d.id} className="rd-dish-card">
              <div className="rd-dish-tag">{d.tag}</div>
              <div className="rd-dish-img rd-img-placeholder-sm" />
              <h3 className="rd-dish-name">{d.name}</h3>
              <p className="rd-dish-desc">{d.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Related content */}
      <section className="rd-related">
        <h2 className="rd-section-title">Nội dung bạn có thể quan tâm</h2>
        <div className="rd-related-grid">
          {RELATED_CONTENT.map((r) => (
            <article key={r.id} className="rd-related-card">
              <div className="rd-related-tag">{r.type}</div>
              <div className="rd-related-img rd-img-placeholder-sm" />
              <h3 className="rd-related-name">{r.title}</h3>
              <p className="rd-related-desc">{r.desc}</p>
              <div className="rd-related-meta">{r.meta}</div>
            </article>
          ))}
        </div>
      </section>

      {/* Nearby */}
      <section className="rd-nearby">
        <div className="rd-section-head">
          <h2 className="rd-section-title">Nhà hàng chay gần đây</h2>
          <span className="rd-link" onClick={() => onNavigate?.('/restaurants')}>
            Xem tất cả <ChevronRight size={14} />
          </span>
        </div>
        <div className="rd-nearby-grid">
          {NEARBY.map((n) => (
            <article key={n.id} className="rd-nearby-card">
              <div className="rd-nearby-img rd-img-placeholder-sm" />
              <h3 className="rd-nearby-name">{n.name}</h3>
              <div className="rd-nearby-address">
                <MapPin size={12} /> {n.address}
              </div>
              <div className="rd-nearby-foot">
                <span>
                  <MapPin size={12} /> Cách {n.distance}
                </span>
                <button className="rd-nearby-btn">Xem chi tiết</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
