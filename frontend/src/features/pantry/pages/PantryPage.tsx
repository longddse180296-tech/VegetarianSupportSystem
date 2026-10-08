import { useState } from 'react'
import {
  Search,
  Plus,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ChefHat,
  Leaf,
  Lightbulb,
  Clock,
  Flame,
  BookOpenCheck,
  BookmarkPlus,
  Heart,
  X,
  Activity,
} from 'lucide-react'
import './PantryPage.css'

interface Props {
  onNavigate?: (path: string) => void;
}

const SUGGESTED_QUICK = [
  '+ Đậu hũ', '+ Nấm rơm', '+ Cà chua', '+ Bí đỏ',
  '+ Đậu cô ve', '+ Hạt sen', '+ Đậu hào', '+ Trứng gà',
] as const

const PANTRY_INGREDIENTS = [
  { id: 'i1', name: 'Đậu hũ trắng (300g)', status: 'ok' as const },
  { id: 'i2', name: 'Nấm hương tươi (150g)', status: 'ok' as const },
  { id: 'i3', name: 'Cà chua chín mọng (2 quả)', status: 'ok' as const },
  { id: 'i4', name: 'Đậu hào (Hàu oyster)', status: 'danger' as const },
  { id: 'i5', name: 'Trứng gà tươi', status: 'warn' as const },
]

const SAFE_INGREDIENTS = [
  { name: 'Đậu hũ trắng (300g)', icon: '✅' },
  { name: 'Nấm hương tươi (150g)', icon: '✅' },
  { name: 'Cà chua chín mọng (2 quả)', icon: '✅' },
]

const VIOLATIONS = [
  {
    id: 'v1',
    level: 'danger' as const,
    title: 'Đậu hào (Hàu oyster)',
    tag: 'Món mặn / Gốc động vật',
    reason: 'Chứa chiết xuất hàu biển động vật. Không phù hợp với người ăn chay ở bất kỳ hình thức nào.',
    alt: 'Sốt đậu hào chay từ nấm hương hữu cơ',
  },
  {
    id: 'v2',
    level: 'warn' as const,
    title: 'Trứng gà tươi',
    tag: 'Không hợp với Vegan',
    reason: 'Không phù hợp với hồ sơ Thuần chay (Vegan). Chỉ phù hợp với chế độ Ovo hoặc Lacto-ovo vegetarian.',
    alt: 'Đậu hũ non tán (Tofu Scramble)',
  },
]

const AI_ALTERNATIVES = [
  {
    id: 'a1',
    before: 'Đậu hào →',
    after: 'Sốt đậu hào chay từ nấm hương hữu cơ',
    match: 'Tương thích 96%',
    usage: 'Tỷ lệ thay thế:\nThay 1: 1.3 muỗng canh sốt thay cho 1 muỗng',
    tip: 'Thời gian chế biến:\n30 - 45 phút Nấu',
  },
  {
    id: 'a2',
    before: 'Trứng gà →',
    after: 'Đậu hũ non tán (Tofu Scramble)',
    match: '100% Thuần Chay',
    usage: 'Tỷ lệ thay thế:\n1 quả trứng ~ 80g đậu hũ non tán',
    tip: 'Thời gian chế biến:\n30 - 45 phút Nấu',
  },
]

const MATCHED_RECIPES = [
  {
    id: 'mr1',
    matchText: '✓ Khớp 3/3 nguyên liệu sẵn có',
    badge: '100% Thuần Chay (Vegan)',
    name: 'Đậu hũ sốt cà chua nấm hương thanh vị',
    time: 20,
    kcal: 320,
    protein: 18.5,
    carb: 16.2,
    fat: 12.0,
    score: '100% Thuần chay',
    ingredients: [
      { text: 'Đậu hũ (Có ✓) • Nấm hương (Có ✓)', highlight: true },
      { text: '• Cà chua (Có ✓)', highlight: true },
      { text: '• Gia vị: Hành bắc-bồ, tiêu, đậu xay, mùi thơm (Gia vị có sẵn).', highlight: false },
    ],
  },
  {
    id: 'mr2',
    matchText: '✓ Khớp 3/3 nguyên liệu sẵn có',
    badge: '100% Thuần Chay (Vegan)',
    name: 'Canh nấm đậu hũ cà chua chua ngọt',
    time: 15,
    kcal: 180,
    protein: 12.0,
    carb: 14.0,
    fat: 4.5,
    score: '100% Thuần chay',
    ingredients: [
      { text: 'Tủ bếp: Đậu hũ, Nấm hương, Cà chua', highlight: true },
      { text: '(Bất Ngợi)', highlight: true },
      { text: 'Gia vị: Nồng độ gà, hành hoa bò-một, chút tiêu xay cối.', highlight: false },
    ],
  },
  {
    id: 'mr3',
    matchText: '✓ Khớp 2/3 nguyên liệu (Thiếu: Xanh)',
    badge: '100% Thuần Chay (Vegan)',
    name: 'Đậu hũ nấm kho tiêu sốt nấm đậm đà',
    time: 25,
    kcal: 260,
    protein: 16.2,
    carb: 18.0,
    fat: 9.0,
    score: '100% Thuần chay',
    ingredients: [
      { text: 'Tủ bếp: Đậu hũ (Có ✓) • Nấm hương (Có sẵn thay bằng tiêu xanh).', highlight: true },
      { text: '', highlight: false },
      { text: 'Can mua thêm: 1 thìa hạt tiêu xanh tươi (hoặc thay bằng tiêu xay).', highlight: false },
    ],
  },
  {
    id: 'mr4',
    matchText: '✓ Khớp 3/3 nguyên liệu sẵn có',
    badge: '100% Thuần Chay (Vegan)',
    name: 'Đậu hũ áp chảo sốt nấm hương ngũ vị',
    time: 15,
    kcal: 295,
    protein: 17.0,
    carb: 15.5,
    fat: 11.2,
    score: '100% Thuần chay',
    ingredients: [
      { text: 'Tủ bếp: Đậu hũ vàng, nấm hương, nước tương đậu nành thường (Tương đậu thay)', highlight: true },
      { text: '', highlight: false },
      { text: 'Gia vị thêm: Bột ngọt, bột năng, hành tây thái hạt lựu', highlight: false },
    ],
  },
]

export default function PantryPage({ onNavigate }: Props) {
  const [ingredientInput, setIngredientInput] = useState('')
  const [ingredients, setIngredients] = useState(PANTRY_INGREDIENTS)
  const [sortBy, setSortBy] = useState('Khớp nguyên liệu cao nhất (100%)')

  const removeIngredient = (id: string) => setIngredients((prev) => prev.filter((i) => i.id !== id))
  const addIngredient = (label: string) => {
    const name = label.replace(/^\+\s*/, '').trim()
    if (!name || ingredients.some((i) => i.name === name)) return
    setIngredients((prev) => [...prev, { id: `${Date.now()}`, name, status: 'ok' }])
    setIngredientInput('')
  }

  return (
    <div className="pp-page">
      {/* Breadcrumbs */}
      <nav className="pp-breadcrumbs">
        <span className="pp-link" onClick={() => onNavigate?.('/')}>🏠 Trang chủ</span>
        <span className="pp-sep">/</span>
        <span className="pp-link" onClick={() => onNavigate?.('/recipes')}>Công thức</span>
        <span className="pp-sep">/</span>
        <span className="pp-current">Gợi ý món từ Tủ Bếp AI</span>
      </nav>

      {/* Header */}
      <div className="pp-head">
        <div className="pp-head-left">
          <h1 className="pp-title">
            Gợi ý Món Chay Từ Tủ Bếp AI
            <span className="pp-title-badge"><Sparkles size={14} /> Smart Pantry 2-4</span>
          </h1>
          <p className="pp-sub">
            Khám phá các món ăn thông minh, chuẩn dinh dưỡng từ những nguyên liệu sẵn có trong gian bếp của bạn cùng Trợ lý AI thông minh.
          </p>
        </div>
        <div className="pp-head-right">
          <button className="pp-scan-btn">
            <Heart size={15} /> Đổi sơát khẩu phần
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div className="pp-diet-banner">
        <div className="pp-diet-icon"><Leaf size={20} /></div>
        <div>
          <div className="pp-diet-title">
            <strong>Đã đóng bộ hồ sơ</strong> — Chế độ hiện tại: Thuần chay (Vegan)
          </div>
          <div className="pp-diet-sub">
            Hệ thống tự động quét nhận diện 100% nguyên liệu gốc động vật (thịt, cá, sữa bò, trứng giả cam, gelatin, mỡ động vật) để đảm
            bảo món chay an tâm tuyệt đối.
          </div>
        </div>
      </div>

      {/* 2-col layout */}
      <div className="pp-layout">
        {/* Left column */}
        <div className="pp-left">
          {/* Pantry card */}
          <div className="pp-card pp-card-pantry">
            <div className="pp-card-head">
              <div className="pp-card-title">
                <span className="pp-icon-sq"><ChefHat size={18} /></span>
                Tủ bếp của bạn
                <span className="pp-count-badge">{ingredients.length} nguyên liệu đã chọn</span>
              </div>
            </div>
            <div className="pp-pantry-subtitle">Thêm nguyên liệu có sẵn</div>

            {/* Add input */}
            <div className="pp-add-row">
              <div className="pp-input">
                <Search size={16} />
                <input
                  placeholder="Nhập nguyên liệu bạn đang có (vd: đậu hũ, nấm, cà chua, đậu hà...)"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addIngredient(ingredientInput || '+ Đậu hũ') }}
                />
              </div>
              <button
                className="pp-btn-add"
                onClick={() => addIngredient(ingredientInput || '+ Đậu hũ')}
                type="button"
              >
                <Plus size={15} /> Thêm
              </button>
            </div>

            {/* Quick chips */}
            <div className="pp-quick-head">Gợi ý thêm nhanh:</div>
            <div className="pp-quick-chips">
              {SUGGESTED_QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  className={`pp-quick-chip ${q.includes('Đậu hào') || q.includes('Trứng') ? 'is-warn' : ''}`}
                  onClick={() => addIngredient(q)}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Pantry chips list */}
            <div className="pp-pantry-list">
              {ingredients.map((i) => (
                <span
                  key={i.id}
                  className={`pp-ingredient-chip pp-ingredient-${i.status}`}
                >
                  {i.status === 'ok' ? '✅' : i.status === 'warn' ? '⚠️' : '🚫'} {i.name}
                  <button
                    type="button"
                    className="pp-chip-remove"
                    onClick={() => removeIngredient(i.id)}
                    aria-label={`xóa ${i.name}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            {/* Vegan check */}
            <div className="pp-vegan-check">
              <button type="button" className="pp-btn-check">
                <ShieldCheck size={15} /> Kiểm tra vi phạm Vegan:
                <span className="pp-vegan-ok">3 Hợp lệ</span>
                <span className="pp-vegan-warn">2 Cảnh báo</span>
              </button>
            </div>
          </div>

          {/* Violation check */}
          <div className="pp-card">
            <div className="pp-card-title-no-icon">
              <span className="pp-icon-sq pp-icon-green"><Lightbulb size={18} /></span>
              Kết quả kiểm tra theo hồ sơ Vegan
              <span className="pp-meta-text">
                Hệ thống AI tự động phân tích từng nguồn gốc nguyên liệu đối chiếu với chế độ Thuần chay (Vegan).
              </span>
            </div>

            <div className="pp-check-row pp-check-ok">
              <div className="pp-check-icon-ok"><Leaf size={16} /></div>
              <div className="pp-check-text">
                <strong>Nguyên liệu hợp lệ (3 nguyên liệu)</strong>
                <span className="pp-safe-badge">100% An toàn</span>
              </div>
            </div>

            <ul className="pp-safe-list">
              {SAFE_INGREDIENTS.map((s) => (
                <li key={s.name}>
                  <span className="pp-check-icon-ok pp-check-icon-sm"><Leaf size={13} /></span>
                  {s.name}
                  <button className="pp-safe-remove" onClick={() => { const base = s.name.split(' (')[0]; const i = ingredients.find((x) => x.name.startsWith(base)); if (i) removeIngredient(i.id); }}>
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>

            <div className="pp-check-row pp-check-danger">
              <div className="pp-check-icon-danger"><AlertTriangle size={16} /></div>
              <div className="pp-check-text">
                <strong>Cảnh báo vi phạm chế độ ăn (2 nguyên liệu)</strong>
                <button className="pp-btn-danger-tag">Cần loại trừ</button>
              </div>
            </div>

            <div className="pp-violation-list">
              {VIOLATIONS.map((v) => (
                <div key={v.id} className={`pp-violation-item pp-violation-${v.level}`}>
                  <div className="pp-viol-head">
                    <span className={`pp-viol-level pp-viol-level-${v.level}`}>
                      {v.level === 'danger' ? '🚨' : '⚠️'} {v.title}
                    </span>
                    <span className="pp-viol-tag">{v.tag}</span>
                  </div>
                  <p className="pp-viol-reason">{v.reason}</p>
                  <p className="pp-viol-alt">
                    <span className="pp-viol-alt-label">💡 Gợi ý thay thế thuần thực vật</span>
                    <strong>{v.alt}</strong>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Alternatives */}
          <div className="pp-card">
            <div className="pp-alternative-head">
              <span className="pp-icon-sq pp-icon-soft"><Sparkles size={18} /></span>
              <div>
                <div className="pp-alt-title">Gợi ý thay thế thuần thực vật từ AI</div>
                <span className="pp-alt-100">100% Thuần Chay</span>
              </div>
            </div>

            <div className="pp-alt-list">
              {AI_ALTERNATIVES.map((a) => (
                <div key={a.id} className="pp-alt-item">
                  <div className="pp-alt-arrow">{a.before}</div>
                  <div className="pp-alt-main">
                    <div className="pp-alt-after">{a.after}</div>
                    <span className="pp-alt-match">{a.match}</span>
                  </div>
                  <div className="pp-alt-meta">
                    <div className="pp-alt-meta-line">{a.usage}</div>
                    <div className="pp-alt-meta-line">{a.tip}</div>
                  </div>
                  <button className="pp-alt-apply" type="button">
                    <Sparkles size={13} /> Áp dụng thay thế
                  </button>
                </div>
              ))}
            </div>

            <div className="pp-alt-auto-note">
              <span className="pp-alt-auto-bullet">✅</span>
              Tự động thay thế tất cả nguyên liệu vi phạm bằng phiên bản thực vật an toàn khi gợi ý công thức.
            </div>
          </div>
        </div>

        {/* Right column: matched recipes + expert corner */}
        <div className="pp-right">
          <div className="pp-head-rc">
            <div className="pp-rc-title-wrap">
              <h2 className="pp-rc-title">Món ngon có thể nấu ngay từ tủ bếp</h2>
              <span className="pp-rc-badge">4 công thức</span>
            </div>
            <div className="pp-rc-sort">
              <label>Sắp xếp:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option>Khớp nguyên liệu cao nhất (100%)</option>
                <option>Thời gian nấu: ngắn nhất</option>
                <option>Calo: thấp nhất</option>
              </select>
            </div>
          </div>

          <div className="pp-recipe-grid">
            {MATCHED_RECIPES.map((r) => (
              <article key={r.id} className="pp-recipe-card">
                <div className="pp-recipe-match">{r.matchText}</div>
                <div className="pp-recipe-img">
                  <div className="pp-recipe-placeholder" />
                  <span className="pp-recipe-time"><Clock size={12} /> {r.time} phút</span>
                  <span className="pp-recipe-badge">{r.badge}</span>
                </div>
                <h3 className="pp-recipe-name">{r.name}</h3>
                <div className="pp-recipe-ing">
                  {r.ingredients.map((ing, idx) => (
                    <div key={idx} className={`pp-recipe-ing-line ${ing.highlight ? 'is-highlight' : ''}`}>
                      {ing.text}
                    </div>
                  ))}
                </div>
                <div className="pp-recipe-nutri">
                  <div className="pp-nutri-item">
                    <span className="pp-nutri-lbl">Calo</span>
                    <span className="pp-nutri-val">{r.kcal}</span>
                  </div>
                  <div className="pp-nutri-item">
                    <span className="pp-nutri-lbl">Đạm</span>
                    <span className="pp-nutri-val">{r.protein.toFixed(1)}g</span>
                  </div>
                  <div className="pp-nutri-item">
                    <span className="pp-nutri-lbl">Carb</span>
                    <span className="pp-nutri-val">{r.carb.toFixed(1)}g</span>
                  </div>
                  <div className="pp-nutri-item">
                    <span className="pp-nutri-lbl">Béo tốt</span>
                    <span className="pp-nutri-val">{r.fat.toFixed(1)}g</span>
                  </div>
                </div>
                <div className="pp-recipe-score">
                  <span className="pp-leaf-ico"><Leaf size={12} /></span>
                  Tỷ lệ thực vật &nbsp;
                  <strong>{r.score}</strong>
                </div>
                <div className="pp-recipe-actions">
                  <button
                    className="pp-btn-recipe-main"
                    type="button"
                    onClick={() => onNavigate?.(`/recipes/${encodeURIComponent(r.id)}`)}
                  >
                    <BookOpenCheck size={14} /> Xem công thức chi tiết →
                  </button>
                  <button className="pp-btn-recipe-secondary" type="button" aria-label="Lưu">
                    <BookmarkPlus size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Expert corner */}
          <div className="pp-expert">
            <div className="pp-expert-head">
              <div className="pp-expert-icon">
                <Activity size={18} />
              </div>
              <div>
                <div className="pp-expert-title">
                  Góc chuyên gia dinh dưỡng thực vật AI
                  <span className="pp-expert-chip">Chỉ số hấp thụ tối ưu</span>
                </div>
                <p className="pp-expert-text">
                  Trợ lý AI đánh giá: Bộ 3 nguyên liệu <strong>Đậu hũ + Nấm hương + Cà chua</strong> là sự kết hợp hoàn hảo giữa <strong>Đạm thực vật hoàn chỉnh</strong>
                  (Đậu hũ chứa tất cả 9 axit amin thiết yếu) + <strong>Beta-glucan tăng cường miễn dịch</strong> (từ Nấm hương) và <strong>Lycopene chống oxy hóa được hoạt hóa tốt nhất khi nấu cùng dầu thực vật</strong>
                  (là chất béo trong đậu phụ chiên vàng). Bạn hoàn toàn có thể nấu một bữa ăn thuần chay cân bằng, ngon miệng mà không thiếu hụt vị chất.
                </p>
                <div className="pp-expert-checks">
                  <span className="pp-check-line"><Leaf size={12} /> Phù hợp cho chế độ giảm cân & kiểm soát BMI</span>
                  <span className="pp-check-line"><Flame size={12} /> • Chỉ số đường huyết (GI) thấp</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
