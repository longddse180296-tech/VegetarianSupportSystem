import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SkeletonLoader from '../../shared/components/SkeletonLoader';
import AlertError from '../../shared/components/AlertError';
import EmptyState from '../../shared/components/EmptyState';
import { fetchRestaurantList, formatVND } from './restaurants.api';
import {
  CUISINE_LABELS,
  FACILITY_TAGS,
} from './restaurants.types';
import type { Restaurant, RestaurantListResult, SearchFilters } from './restaurants.types';
import './RestaurantListPage.css';

type RequestState =
  | { status: 'loading' }
  | { status: 'success'; data: RestaurantListResult }
  | { status: 'error'; message: string };

const INITIAL_FILTERS: SearchFilters = {
  keyword: '',
  distance: 'all',
  sortBy: 'nearest',
  rating: 'all',
  tags: [],
  priceLevel: 'all',
  cuisineFilter: 'all',
};

const DISTANCE_OPTIONS: Array<{ key: SearchFilters['distance']; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'lt1', label: '< 1 km' },
  { key: '1to3', label: '1 - 3 km' },
  { key: '3to5', label: '3 - 5 km' },
  { key: '5to10', label: '5 - 10 km' },
  { key: 'gt10', label: '> 10 km' },
];

const FACILITY_CHIPS: Array<{ key: (typeof FACILITY_TAGS)[number]; label: string }> = [
  { key: 'has_parking', label: 'An toàn có chỗ đỗ xe' },
  { key: 'takeaway_available', label: 'Ăn mang/đặt mang về' },
  { key: 'vegan_only', label: 'Thực đơn thuần Vegan (Vegan-only)' },
  { key: 'region_specialty', label: 'Món đặc sản vùng miền' },
  { key: 'no_cheese_option', label: 'Chay không phô mai' },
  { key: 'event_catering', label: 'Có phục vụ bữa tiệc' },
  { key: 'free_wifi', label: 'Có Wi-Fi' },
];

interface RestaurantListPageProps {
  onNavigate?: (path: string) => void;
}

function StarRating({ score }: { score: number }) {
  const full = Math.floor(score);
  const hasHalf = score - full >= 0.5;
  return (
    <span className="star-rating" aria-label={`Đánh giá ${score} trên 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full || (i === full && hasHalf);
        return (
          <span key={i} className={filled ? 'star star-filled' : 'star star-empty'}>
            {filled ? '★' : '☆'}
          </span>
        );
      })}
      <span className="star-score">{score.toFixed(1)}</span>
    </span>
  );
}

function OpenBadge({ status, text }: { status: Restaurant['openNow']; text: string }) {
  const map = {
    open_now: { className: 'open-badge open-badge-open', label: 'Mở cửa' },
    closes_soon: { className: 'open-badge open-badge-warn', label: 'Sắp đóng' },
    closed: { className: 'open-badge open-badge-closed', label: 'Đã đóng' },
    '24h': { className: 'open-badge open-badge-open', label: '24/24' },
  } as const;
  const info = map[status];
  return (
    <span className={info.className} title={text}>
      <span className="open-dot" aria-hidden="true" />
      {info.label} · {text}
    </span>
  );
}

function BadgeChip({ variant, label }: { variant: Restaurant['badges'][number]['variant']; label: string }) {
  const v = {
    success: 'badge-chip badge-success',
    warning: 'badge-chip badge-warning',
    info: 'badge-chip badge-info',
    primary: 'badge-chip badge-primary',
  }[variant];
  return <span className={v}>{label}</span>;
}

const FEEDBACK_OPTIONS = [
  { key: 'accurate', emoji: '🏠', label: 'Bữa ăn chay 👍' },
  { key: 'food_quality', emoji: '🍜', label: 'Món ngon & bền vị 👍' },
  { key: 'space', emoji: '🪴', label: 'Không gian mát mẻ, thoải mái 👍' },
  { key: 'value', emoji: '💰', label: 'Giá cả hợp lý 👍' },
  { key: 'staff', emoji: '🙏', label: 'Nhân viên tận tâm 👍' },
  { key: 'location', emoji: '📍', label: 'Vị trí dễ tìm 👍' },
];

export default function RestaurantListPage({ onNavigate }: RestaurantListPageProps) {
  const [state, setState] = useState<RequestState>({ status: 'loading' });
  const [filters, setFilters] = useState<SearchFilters>(INITIAL_FILTERS);
  const [keywordInput, setKeywordInput] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [feedback, setFeedback] = useState<Record<string, boolean>>({});
  const reqRef = useRef(0);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  const load = useCallback(async (f: SearchFilters) => {
    const id = ++reqRef.current;
    setState({ status: 'loading' });
    try {
      const data = await fetchRestaurantList(f);
      if (id !== reqRef.current) return;
      setState({ status: 'success', data });
      if (!selectedId && data.items.length > 0) {
        setSelectedId(data.items[0].id);
      }
    } catch (err) {
      if (id !== reqRef.current) return;
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Không xác định',
      });
    }
  }, [selectedId]);

  useEffect(() => {
    let cancelled = false;
    window.scrollTo(0, 0);
    Promise.resolve().then(() => {
      if (!cancelled) void load(INITIAL_FILTERS);
    });
    return () => {
      cancelled = true;
      reqRef.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nf: SearchFilters = { ...filters, keyword: keywordInput };
    setFilters(nf);
    void load(nf);
  };

  const toggleDistance = (k: SearchFilters['distance']) => {
    const nf = { ...filters, distance: k };
    setFilters(nf);
    void load(nf);
  };

  const toggleTag = (t: (typeof FACILITY_TAGS)[number]) => {
    const has = filters.tags.includes(t);
    const tags = has ? filters.tags.filter((x) => x !== t) : [...filters.tags, t];
    const nf = { ...filters, tags };
    setFilters(nf);
    void load(nf);
  };

  const handleShareLocation = () => {
    setLocationStatus('granted');
  };

  const items = useMemo(() => (state.status === 'success' ? state.data.items : []), [state]);
  const totalCount = useMemo(() => (state.status === 'success' ? state.data.total : 0), [state]);
  const selectedRestaurant = useMemo(
    () => (state.status === 'success' ? items.find((r) => r.id === selectedId) ?? items[0] ?? null : null),
    [state, items, selectedId]
  );

  return (
    <div className="restaurant-list-page">
      <div className="restaurant-list-container">
        <div className="rl-topbar">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <ol className="breadcrumbs-list">
              <li className="breadcrumbs-item">
                <a href="#/" onClick={(e) => handleNavClick(e, '/')}>
                  Trang chủ
                </a>
              </li>
              <li className="breadcrumbs-separator" aria-hidden="true">/</li>
              <li className="breadcrumbs-item breadcrumbs-current" aria-current="page">
                Nhà hàng chay
              </li>
            </ol>
          </nav>
          <div className="rl-user-stats">
            <button type="button" className="btn btn-ghost">
              🍽 Sẵn sàng vị trí 41 nhà hàng
            </button>
          </div>
        </div>

        <header className="rl-hero">
          <h1 className="rl-title">Nhà hàng chay gần bạn</h1>
          <p className="rl-subtitle">
            Khám phá các nhà hàng ưu ái ăn chay thanh tịnh, dinh dưỡng phù hợp với vị trí hiện tại của bạn.
          </p>
        </header>

        <div className="rl-location-banner">
          <div className="rl-location-info">
            <span className="rl-location-icon" aria-hidden="true">📍</span>
            <span className="rl-location-text">
              {locationStatus === 'granted'
                ? 'Cho phép truy cập vị trí để tìm nhà hàng chay gần bạn chính xác nhất.'
                : 'Vị trí chưa được chia sẻ. Nhấn "Chia sẻ vị trí" để tìm quán chay gần nhất chính xác hơn.'}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleShareLocation}
            disabled={locationStatus === 'granted'}
          >
            {locationStatus === 'granted' ? '✅ Đã chia sẻ vị trí' : 'Chia sẻ vị trí'}
          </button>
        </div>

        <form className="rl-search-bar" onSubmit={handleSearch}>
          <div className="rl-search-input-wrap">
            <span className="rl-search-icon" aria-hidden="true">🔎</span>
            <input
              className="rl-search-input"
              placeholder="Tìm kiếm nhà hàng theo địa điểm (quận, phố, tên quán)..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              aria-label="Tìm kiếm nhà hàng"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg">
            ⌕ Tìm kiếm
          </button>
        </form>

        <div className="rl-filters">
          <div className="rl-filter-row">
            <span className="rl-filter-label">Khoảng cách:</span>
            <div className="rl-chip-group">
              {DISTANCE_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.key}
                  className={`rl-chip ${filters.distance === opt.key ? 'rl-chip-active' : ''}`}
                  onClick={() => toggleDistance(opt.key)}
                >
                  {opt.label}
                </button>
              ))}
              <span className="rl-chip-divider">|</span>
              <button
                type="button"
                className={`rl-chip rl-chip-pill ${filters.sortBy === 'highest_rated' ? 'rl-chip-active' : ''}`}
                onClick={() => {
                  const nf: SearchFilters = { ...filters, sortBy: 'highest_rated' };
                  setFilters(nf);
                  void load(nf);
                }}
              >
                ⭐ Yêu thích bây chay
              </button>
              <button
                type="button"
                className={`rl-chip rl-chip-pill ${filters.tags.includes('has_parking') ? 'rl-chip-active' : ''}`}
                onClick={() => toggleTag('has_parking')}
              >
                An toàn có chỗ đỗ xe
              </button>
            </div>
          </div>
          <div className="rl-filter-row">
            <div className="rl-chip-group rl-chip-group-wrap">
              {FACILITY_CHIPS.slice(1).map((c) => (
                <button
                  type="button"
                  key={c.key}
                  className={`rl-chip ${filters.tags.includes(c.key) ? 'rl-chip-active' : ''}`}
                  onClick={() => toggleTag(c.key)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="rl-filter-more">
            <button type="button" className="btn btn-ghost btn-sm">
              ⚙️ Bộ lọc nâng cao
            </button>
          </div>
        </div>

        {state.status === 'loading' && (
          <div className="rl-grid">
            <div className="rl-col-list">
              <div className="rl-card">
                <SkeletonLoader count={10} />
              </div>
            </div>
            <div className="rl-col-map">
              <div className="rl-map-skeleton">
                <SkeletonLoader count={8} />
              </div>
            </div>
          </div>
        )}

        {state.status === 'error' && (
          <AlertError
            title="Không thể tải danh sách nhà hàng"
            message={state.message + '. Vui lòng thử lại sau.'}
            onRetry={() => load(filters)}
          />
        )}

        {state.status === 'success' && totalCount === 0 && (
          <EmptyState
            title="Không tìm thấy nhà hàng chay phù hợp"
            description="Thử thay đổi khoảng cách, bỏ một vài bộ lọc hoặc tìm kiếm theo tên quán / quận khác."
          />
        )}

        {state.status === 'success' && totalCount > 0 && (
          <>
            <div className="rl-grid">
              {/* Left: Restaurant cards list */}
              <div className="rl-col-list" aria-label="Danh sách nhà hàng chay">
                <div className="rl-list-meta">
                  <strong className="rl-list-count">{totalCount}</strong> nhà hàng chay được tìm thấy
                  · sắp xếp theo{' '}
                  <span className="muted">
                    {filters.sortBy === 'nearest'
                      ? 'gần nhất'
                      : filters.sortBy === 'highest_rated'
                      ? 'đánh giá cao nhất'
                      : filters.sortBy === 'lowest_price'
                      ? 'giá thấp đến cao'
                      : 'mới nhất'}
                  </span>
                </div>

                <div className="rl-list-stack">
                  {items.map((r) => {
                    const isActive = selectedId === r.id;
                    return (
                      <article
                        key={r.id}
                        className={`rl-card restaurant-card ${isActive ? 'restaurant-card-active' : ''}`}
                        onClick={() => setSelectedId(r.id)}
                      >
                        <div className="restaurant-card-head">
                          <div className="restaurant-card-badges">
                            {r.badges.map((b) => (
                              <BadgeChip key={b.key} variant={b.variant} label={b.label} />
                            ))}
                          </div>
                          <label className="restaurant-card-pin" title="Mở bản đồ">
                            <input
                              type="checkbox"
                              defaultChecked={isActive}
                              onChange={() => setSelectedId(r.id)}
                              aria-label={`Hiển thị ${r.name} trên bản đồ`}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="pin-check" />
                            <span className="pin-label">Ghim vị trí của bạn</span>
                          </label>
                        </div>

                        <div className="restaurant-card-body">
                          <div className="restaurant-card-image-wrap">
                            <img
                              src={r.coverImageUrl}
                              alt={r.name}
                              className="restaurant-card-image"
                              loading="lazy"
                            />
                            <span className="restaurant-card-distance">{r.distanceKm.toFixed(1)} km</span>
                          </div>
                          <div className="restaurant-card-info">
                            <div className="restaurant-card-title-row">
                              <h3 className="restaurant-card-title">{r.name}</h3>
                              <OpenBadge status={r.openNow} text={r.openTextSummary} />
                            </div>
                            <p className="restaurant-card-cuisine">
                              {r.cuisine.map((c) => CUISINE_LABELS[c]).join(' · ')}
                            </p>
                            <p className="restaurant-card-address">
                              📍 {r.address.line1}, {r.address.ward}, {r.address.district},{' '}
                              {r.address.city}
                            </p>
                            <div className="restaurant-card-meta">
                              <div className="meta-cell">
                                <StarRating score={r.rating.score} />
                                <span className="meta-count muted">({r.rating.reviewCount} đánh giá)</span>
                              </div>
                              <div className="meta-cell meta-price">
                                <span className="meta-label">Khoảng giá:</span>{' '}
                                <strong>
                                  {formatVND(r.priceRangeVND.min)} - {formatVND(r.priceRangeVND.max)}
                                </strong>
                                <span className="price-level-badge">
                                  {r.priceLevel === 'budget'
                                    ? '🍽 Thrift'
                                    : r.priceLevel === 'premium'
                                    ? '💎 Premium'
                                    : '🌿 Popular'}
                                </span>
                              </div>
                            </div>

                            {r.warnings && r.warnings.length > 0 && (
                              <ul className="restaurant-card-warnings">
                                {r.warnings.slice(0, 2).map((w, i) => (
                                  <li key={i}>⚠️ {w}</li>
                                ))}
                              </ul>
                            )}

                            <div className="restaurant-card-footer">
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                Xem chi tiết
                              </button>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                📞 Xem chi tiết
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Feedback block */}
                <section className="rl-feedback">
                  <div className="rl-feedback-head">
                    <h3 className="rl-feedback-title">Đánh giá tìm kiếm này?</h3>
                    <p className="rl-feedback-sub">
                      Chọn 1 hoặc nhiều thứ mà bạn cảm thấy hữu ích với kết quả tìm kiếm:
                    </p>
                  </div>
                  <div className="rl-feedback-grid">
                    {FEEDBACK_OPTIONS.map((o) => {
                      const on = Boolean(feedback[o.key]);
                      return (
                        <button
                          key={o.key}
                          type="button"
                          className={`rl-feedback-chip ${on ? 'rl-feedback-chip-on' : ''}`}
                          onClick={() => setFeedback((p) => ({ ...p, [o.key]: !p[o.key] }))}
                        >
                          <span className="rl-feedback-emoji" aria-hidden="true">
                            {o.emoji}
                          </span>
                          <span>{o.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>

              {/* Right: Map */}
              <aside className="rl-col-map" aria-label="Bản đồ nhà hàng">
                <div className="rl-map-wrap">
                  <div className="rl-map-top-actions">
                    <button type="button" className="btn btn-ghost btn-sm">
                      Bàn giao
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm">
                      Danh sách
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm">
                      ⋮
                    </button>
                  </div>
                  <div className="rl-map-canvas" aria-label="Bản đồ - xem vị trí các nhà hàng">
                    <div className="map-streets">
                      <div className="map-street s-main-1" />
                      <div className="map-street s-main-2" />
                      <div className="map-street s-diag-1" />
                      <div className="map-street s-diag-2" />
                    </div>

                    <div className="map-zone map-zone-1" />
                    <div className="map-zone map-zone-2" />
                    <div className="map-zone map-zone-3" />

                    {/* Restaurant pins */}
                    {items.map((r, i) => {
                      const positions = [
                        { top: '20%', left: '28%' },
                        { top: '52%', left: '72%' },
                        { top: '74%', left: '42%' },
                        { top: '38%', left: '62%' },
                      ];
                      const pos = positions[i % positions.length];
                      const active = r.id === selectedId;
                      return (
                        <button
                          type="button"
                          key={r.id}
                          className={`map-pin ${active ? 'map-pin-active' : ''}`}
                          style={pos}
                          onClick={() => setSelectedId(r.id)}
                          aria-label={`Chọn ${r.name}`}
                        >
                          <span className="map-pin-dot" />
                          <span className="map-pin-label">
                            {r.name.split(' ').slice(0, 2).join(' ')}
                          </span>
                        </button>
                      );
                    })}

                    {/* Center pin "vị trí của bạn" */}
                    <div className="map-user-pin" title="Vị trí của bạn">
                      <div className="map-user-pulse" />
                      <div className="map-user-dot" />
                    </div>

                    {/* Floating selected card */}
                    {selectedRestaurant && (
                      <div className="map-popup-card">
                        <div className="map-popup-thumb-wrap">
                          <img
                            src={selectedRestaurant.coverImageUrl}
                            alt={selectedRestaurant.name}
                            className="map-popup-thumb"
                            loading="lazy"
                          />
                        </div>
                        <div className="map-popup-body">
                          <div className="map-popup-head">
                            <h4 className="map-popup-title">{selectedRestaurant.name}</h4>
                            <button
                              type="button"
                              className="map-popup-actions"
                              aria-label="Tùy chọn thêm"
                            >
                              ⋮
                            </button>
                          </div>
                          <div className="map-popup-meta-row">
                            <span className="pill pill-primary">
                              An Nhiên Vegetarian
                            </span>
                            <span className="pill pill-outline">
                              <StarRating score={selectedRestaurant.rating.score} />
                            </span>
                          </div>
                          <div className="map-popup-sub-row">
                            <span>📍 Cách {selectedRestaurant.distanceKm.toFixed(1)} km</span>
                            <span>Địa điểm: Hà Nội</span>
                          </div>
                          <div className="map-popup-footer">
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() =>
                                navigator.clipboard?.writeText(
                                  `${selectedRestaurant.name} - ${selectedRestaurant.address.line1}, ${selectedRestaurant.address.city}`
                                )
                              }
                            >
                              Sao chép địa chỉ & chỉ đường
                            </button>
                            <button type="button" className="btn btn-primary btn-sm">
                              Mở chỉ dẫn & Đi đường →
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Map controls */}
                    <div className="map-controls">
                      <button type="button" className="map-control-btn" aria-label="Chuyển lớp bản đồ">
                        🧭
                      </button>
                      <button type="button" className="map-control-btn" aria-label="Phóng to">
                        ＋
                      </button>
                      <button type="button" className="map-control-btn" aria-label="Thu nhỏ">
                        －
                      </button>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
