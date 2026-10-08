import { useState } from 'react'
import {
  Search,
  Sparkles,
  Clock,
  Flame,
  ChevronLeft,
  ChevronRight,
  Leaf,
  FilterX,
} from 'lucide-react'
import type { RecipeListPageProps } from '../types/recipes.types'
import './RecipeList.css'

const DIET_TABS = [
  { id: 'vegan', label: 'Thuần chay (Vegan)', tone: 'vegan' },
  { id: 'lacto', label: 'Chay có sữa (Lacto)', tone: 'soft' },
  { id: 'ovo', label: 'Chay có trứng (Ovo)', tone: 'soft' },
  { id: 'lactoovo', label: 'Trứng & Sữa (Lacto-ovo)', tone: 'soft' },
] as const

const CATEGORY_TABS = [
  'Tất cả', 'Món chính', 'Salad', 'Món nước', 'Đồ uống', 'Tráng miệng',
]

const RECIPES = [
  { id: 'r1', name: 'Đậu hũ sốt nấm', tag: 'MÓN CHÍNH', time: 25, kcal: 320, vegan: true, plantRatio: 100, desc: 'Đậu hũ chiên non áp chảo sốt cùng nấm đông cô tươi thanh...', img: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vietnamese%20braised%20tofu%20with%20shiitake%20mushroom%20green%20onion%20ceramic%20bowl&image_size=square_hd' },
  { id: 'r2', name: 'Cơm gạo lứt rau củ', tag: 'MÓN CHÍNH', time: 30, kcal: 380, vegan: true, plantRatio: 100, desc: 'Gạo lứt dẻo kết hợp rau củ 5 màu giàu chất xơ, hỗ trợ kiể...', img: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Brown%20rice%20bowl%20roasted%20vegetables%20purple%20sweet%20potato%20broccoli%20carrot&image_size=square_hd' },
  { id: 'r3', name: 'Salad bơ và đậu gà', tag: 'SALAD', time: 15, kcal: 290, vegan: true, plantRatio: 100, desc: 'Chất béo tốt từ bơ sáp hạt quyện cùng đậu gà luộc giòn ng...', img: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Avocado%20chickpea%20salad%20fresh%20greens%20lemon%20dressing%20top%20view&image_size=square_hd' },
  { id: 'r4', name: 'Bún chay thanh đạm', tag: 'MÓN NƯỚC', time: 35, kcal: 340, vegan: true, plantRatio: 100, desc: 'Nước dùng hầm từ củ cải và bắp ngọt thanh tao, kết hợp nấm bả...', img: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vietnamese%20vegan%20rice%20vermicelli%20soup%20bun%20chay%20tofu%20mushrooms%20herbs&image_size=square_hd' },
  { id: 'r5', name: 'Mì xào giòn rau củ thập...', tag: 'MÓN CHÍNH', time: 20, kcal: 350, vegan: true, plantRatio: 100, desc: 'Sợi mì vàng uốn giòn quyện đều sốt rau củ thanh ngọt vị t...', img: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Crispy%20fried%20noodles%20with%20mixed%20vegetables%20chinese%20style&image_size=square_hd' },
  { id: 'r6', name: 'Canh nấm hạt sen táo đỏ', tag: 'MÓN NƯỚC', time: 40, kcal: 210, vegan: true, plantRatio: 95, desc: 'Món canh dưỡng sinh an thần, nấm cao, hạt sen tươi, táo đỏ n...', img: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vietnamese%20lotus%20seed%20mushroom%20jujube%20soup%20herbal%20broth&image_size=square_hd' },
  { id: 'r7', name: 'Cháo yến mạch rau củ...', tag: 'MÓN CHÍNH', time: 15, kcal: 260, vegan: true, plantRatio: 95, desc: 'Bữa sáng dinh dưỡng từ yến mạch hữu cơ, rau củ thái hạt lựu...', img: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Oatmeal%20porridge%20with%20vegetables%20spinach%20mushroom%20topped%20sesame&image_size=square_hd' },
  { id: 'r8', name: 'Cà ri rau củ nước cốt dừa', tag: 'MÓN CHÍNH', time: 45, kcal: 420, vegan: true, plantRatio: 100, desc: 'Hương thơm sả ớt đặc trưng, đậu hũ vàng mềm quyện cùng đậ...', img: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vietnamese%20vegetable%20coconut%20curry%20ca%20ri%20tofu%20eggplant%20chili&image_size=square_hd' },
] as const

const TIME_OPTIONS = ['Tất cả thời gian', '< 15 phút', '15 - 30 phút', '30 - 45 phút', '> 45 phút']
const KCAL_OPTIONS = ['Tất cả mức calo', '< 200 kcal', '200 - 350 kcal', '350 - 500 kcal', '> 500 kcal']

export default function RecipeList({ onNavigate }: RecipeListPageProps) {
  const [activeDiet, setActiveDiet] = useState<string>('vegan')
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả')
  const [timeRange, setTimeRange] = useState(TIME_OPTIONS[0])
  const [kcalRange, setKcalRange] = useState(KCAL_OPTIONS[0])
  const [autoFilter, setAutoFilter] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('Phù hợp nhất')

  return (
    <div className="rl-page">
      {/* Hero */}
      <header className="rl-hero">
        <div className="rl-diet-badge">
          <Leaf size={14} className="rl-diet-badge-icon" />
          Hồ sơ đang chọn: Thuần chay (Vegan)
        </div>
        <h1 className="rl-title">Công thức món chay</h1>
        <p className="rl-sub">
          Khám phá những công thức chay ngon, lành mạnh và dễ thực hiện mỗi ngày
          <br />được tinh chỉnh khoa học theo nhu cầu dinh dưỡng.
        </p>
        <div className="rl-stats">
          <div className="rl-stat">
            <div className="rl-stat-num">500<span className="rl-stat-plus">+</span></div>
            <div className="rl-stat-lbl">Món chay chọn lọc</div>
          </div>
          <div className="rl-stat">
            <div className="rl-stat-num">{'< '}30<span className="rl-stat-unit">p</span></div>
            <div className="rl-stat-lbl">Chuẩn bị nhanh gọn</div>
          </div>
          <div className="rl-stat">
            <div className="rl-stat-num">100<span className="rl-stat-unit">%</span></div>
            <div className="rl-stat-lbl">Chuẩn khoa học BMI</div>
          </div>
        </div>
      </header>

      {/* Search bar + actions */}
      <section className="rl-searchbar">
        <div className="rl-search-input">
          <Search size={18} className="rl-search-icon" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm công thức theo tên món hoặc nguyên liệu (đậu hũ, nấm, hạt sen...)"
          />
        </div>
        <button type="button" className="rl-btn rl-btn-green">
          <Search size={16} />
          Tìm kiếm
        </button>
        <button
          type="button"
          className="rl-btn rl-btn-soft-green"
          onClick={() => onNavigate?.('/pantry')}
        >
          <Sparkles size={16} />
          Khám phá theo Tủ bếp AI
        </button>
      </section>

      {/* Filter block */}
      <section className="rl-filter">
        <div className="rl-filter-row rl-filter-row-diet">
          <div className="rl-filter-label">
            <strong>DANH MỤC MÓN ĂN</strong>
            <span>CHẾ ĐỘ ĂN CỦA BẠN:</span>
          </div>
          <div className="rl-diet-tabs">
            {DIET_TABS.map((t) => (
              <button
                key={t.id}
                className={`rl-diet-tab rl-diet-tab-${t.tone} ${activeDiet === t.id ? 'is-active' : ''}`}
                onClick={() => setActiveDiet(t.id)}
                type="button"
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="rl-toggle-wrap">
            <span className="rl-toggle-label">Tự động lọc theo hồ sơ của tôi</span>
            <button
              type="button"
              className={`rl-toggle ${autoFilter ? 'is-on' : 'is-off'}`}
              onClick={() => setAutoFilter((v) => !v)}
              aria-label="toggle auto filter"
            >
              <span className="rl-toggle-knob" />
            </button>
          </div>
        </div>

        <div className="rl-filter-row rl-filter-row-cat">
          <div className="rl-filter-label"><strong>DANH MỤC MÓN ĂN</strong></div>
          <div className="rl-cat-tabs">
            {CATEGORY_TABS.map((c) => (
              <button
                key={c}
                className={`rl-cat-tab ${activeCategory === c ? 'is-active' : ''}`}
                onClick={() => setActiveCategory(c)}
                type="button"
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="rl-filter-row rl-filter-row-advanced">
          <div className="rl-field">
            <label>Thời gian nấu</label>
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              {TIME_OPTIONS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="rl-field">
            <label>Mức Calo (Kcal / Khẩu phần)</label>
            <select value={kcalRange} onChange={(e) => setKcalRange(e.target.value)}>
              {KCAL_OPTIONS.map((k) => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div className="rl-reset">
            <button type="button" className="rl-reset-btn" onClick={() => { setActiveDiet('vegan'); setActiveCategory('Tất cả'); setTimeRange(TIME_OPTIONS[0]); setKcalRange(KCAL_OPTIONS[0]); setSearch('') }}>
              <FilterX size={14} /> Xóa bộ lọc
            </button>
          </div>
        </div>
      </section>

      {/* Dark green CTA banner */}
      <section className="rl-cta">
        <div className="rl-cta-tag">
          <Sparkles size={12} /> Tính năng thông minh mới
        </div>
        <div className="rl-cta-body">
          <div className="rl-cta-text">
            <h3>Bạn có sẵn nguyên liệu trong bếp?</h3>
            <p>
              Thử ngay tính năng Tủ bếp AI để được gợi ý các món chay thơm ngon, chuẩn dinh dưỡng từ chính những gì bạn đang có!
            </p>
          </div>
          <button
            type="button"
            className="rl-cta-btn"
            onClick={() => onNavigate?.('/pantry')}
          >
            <Sparkles size={16} />
            Khám phá Tủ bếp AI <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* Results section */}
      <section className="rl-results">
        <div className="rl-results-head">
          <div className="rl-results-title">
            <h2>Công thức dành cho bạn</h2>
            <span className="rl-count-badge">24 công thức</span>
          </div>
          <div className="rl-sort">
            <label>Sắp xếp theo:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option>Phù hợp nhất</option>
              <option>Mới nhất</option>
              <option>Thời gian: ngắn nhất</option>
              <option>Calo: thấp nhất</option>
            </select>
          </div>
        </div>

        <div className="rl-grid">
          {RECIPES.map((r) => (
            <article key={r.id} className="rl-card" onClick={() => onNavigate?.(`/recipes/${encodeURIComponent(r.id)}`)}>
              <div className="rl-card-img">
                <img src={r.img} alt={r.name} loading="lazy" />
                <span className="rl-time">
                  <Clock size={12} /> {r.time} phút
                </span>
                <span className="rl-kcal">
                  <Flame size={12} /> {r.kcal} kcal
                </span>
              </div>
              <div className="rl-card-body">
                <div className="rl-card-head">
                  <span className="rl-tag">{r.tag}</span>
                  <span className={`rl-vegan ${r.vegan ? 'is-yes' : 'is-no'}`}>
                    <Leaf size={11} /> {r.vegan ? '100% Vegan' : 'Chay'}
                  </span>
                </div>
                <h3 className="rl-card-name">{r.name}</h3>
                <p className="rl-card-desc">{r.desc}</p>
                <div className="rl-progress">
                  <span className="rl-progress-lbl">Tỷ lệ thực vật</span>
                  <div className="rl-progress-track">
                    <div className="rl-progress-fill" style={{ width: `${r.plantRatio}%` }} />
                  </div>
                  <span className="rl-progress-pct">{r.plantRatio}%</span>
                </div>
                <button type="button" className="rl-view-btn">
                  Xem công thức
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="rl-pagination">
          <div className="rl-pg-info">Đang hiển thị 1 - 8 trong tổng số 24 công thức</div>
          <div className="rl-pg-controls">
            <button type="button" className="rl-pg-btn" disabled>
              <ChevronLeft size={16} /> Trước
            </button>
            {[1, 2, 3, null, 8].map((p, idx) => p === null ? (
              <span key={`dot-${idx}`} className="rl-pg-dots">…</span>
            ) : (
              <button
                key={p}
                type="button"
                className={`rl-pg-btn ${page === p ? 'is-active' : ''}`}
                onClick={() => setPage(p as number)}
              >
                {p}
              </button>
            ))}
            <button type="button" className="rl-pg-btn">
              Sau <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
