import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, ScanSearch, Save, ChevronRight, Sparkles, Leaf, AlertTriangle, X } from 'lucide-react';
import type {
  AddIngredientRequest,
  CheckedIngredient,
  IngredientCategory,
  PantryAiSuggestionResult,
  SwapSuggestion,
} from './pantry.types';
import {
  addIngredientToPantry,
  applySwap,
  autoReplaceAllSwaps,
  fetchPantryAiSuggestions,
} from './pantry.api';
import './PantryPage.css';

interface PantryPageProps {
  onNavigate?: (path: string) => void;
}

const DEFAULT_SELECTED_CATS: IngredientCategory[] = [];

const DEFAULT_CATEGORY_FILTERS: Array<{ key: IngredientCategory | 'all_dairy' | 'all_meat' | 'all_nut'; label: string; plus?: boolean }> = [
  { key: 'protein', label: '+ Đạm', plus: true },
  { key: 'grain', label: '+ Ngũ cốc', plus: true },
  { key: 'vegetable', label: '+ Rau củ', plus: true },
  { key: 'fruit', label: '+ Trái cây', plus: true },
  { key: 'fat_oil', label: '+ Dầu / Mỡ', plus: true },
  { key: 'spice', label: '+ Hạt sen', plus: true },
  { key: 'sweetener', label: '+ Đường / Ngọt', plus: true },
];

function PercentBar({ value, max = 1, colorFrom = '#0f766e', colorTo = '#16a34a' }: { value: number; max?: number; colorFrom?: string; colorTo?: string }) {
  const percent = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div className="pantry-progress-wrap" aria-label={`${percent}%`}>
      <div className="pantry-progress">
        <div
          className="pantry-progress-fill"
          style={{ width: `${percent}%`, background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})` }}
        />
      </div>
    </div>
  );
}

function VeganAssessBadge({ item }: { item: CheckedIngredient }) {
  const map: Record<CheckedIngredient['assessment'], { cls: string; text: string }> = {
    vegan_safe: { cls: 'safe', text: '100% An toàn Vegan' },
    not_vegan: { cls: 'danger', text: 'Món gốc lộc động vật' },
    ovo_lacto_only: { cls: 'warn', text: 'Không hợp với Vegan' },
    unknown: { cls: 'warn', text: 'Cần kiểm tra lại' },
  };
  const conf = map[item.assessment];
  return <span className={`pantry-ing-badge ${conf.cls}`}>{conf.text}</span>;
}

export default function PantryPage({ onNavigate }: PantryPageProps) {
  const [data, setData] = useState<PantryAiSuggestionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addName, setAddName] = useState('');
  const [selectedCats, setSelectedCats] = useState<IngredientCategory[]>(DEFAULT_SELECTED_CATS);
  const [_addedIngredients, setAddedIngredients] = useState<string[]>([]);
  const [appliedSwaps, setAppliedSwaps] = useState<Record<string, boolean>>({});
  const [autoReplace, setAutoReplace] = useState(true);
  const [sortBy, setSortBy] = useState<'match' | 'quickest' | 'nutri_score' | 'cheapest'>('match');

  const abortRef = useRef<AbortController | null>(null);
  const reqIdRef = useRef(0);

  const loadSuggestions = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPantryAiSuggestions(undefined, controller.signal);
      if (reqId !== reqIdRef.current) return;
      setData(res);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Không xác định';
      if (reqId !== reqIdRef.current) return;
      setError(msg);
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSuggestions();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  const handleAddIngredient = async () => {
    const name = addName.trim();
    if (!name || !data) return;
    const payload: AddIngredientRequest = {
      name,
      quantityGram: 100,
      category: selectedCats[0] ?? 'other',
    };
    try {
      const { item } = await addIngredientToPantry(payload);
      setAddedIngredients((prev) => [...prev, item.id]);
      setData({
        ...data,
        availableIngredients: [...data.availableIngredients, item],
      });
      setAddName('');
    } catch {
      // ignore
    }
  };

  const handleRemoveIngredient = (id: string) => {
    if (!data) return;
    setData({
      ...data,
      availableIngredients: data.availableIngredients.filter((i) => i.id !== id),
      checkedIngredients: data.checkedIngredients.filter((i) => i.id !== id),
    });
  };

  const handleApplySwap = async (swap: SwapSuggestion) => {
    if (appliedSwaps[swap.id] || !data) return;
    try {
      const r = await applySwap(swap.id);
      if (r.ok) {
        setAppliedSwaps((p) => ({ ...p, [swap.id]: true }));
      }
    } catch {
      // ignore
    }
  };

  const handleAutoReplaceAll = async () => {
    if (!data) return;
    try {
      const r = await autoReplaceAllSwaps();
      if (r.ok) {
        setAppliedSwaps((prev) => {
          const next = { ...prev };
          r.appliedIds.forEach((id) => (next[id] = true));
          return next;
        });
      }
    } catch {
      // ignore
    }
  };

  const sortedRecipes = useMemo(() => {
    if (!data) return [];
    const list = [...data.recipeSuggestions];
    switch (sortBy) {
      case 'quickest':
        list.sort((a, b) => a.cookTimeMin - b.cookTimeMin);
        break;
      case 'nutri_score':
        list.sort((a, b) => b.nutrition.proteinG - a.nutrition.proteinG);
        break;
      case 'cheapest':
        list.sort((a, b) => a.nutrition.calories - b.nutrition.calories);
        break;
      case 'match':
      default:
        list.sort((a, b) => b.matchedIngredientIds.length - a.matchedIngredientIds.length);
    }
    return list;
  }, [data, sortBy]);

  const breadcrumbs = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Công thức', path: '/recipes' },
    { label: 'Gợi ý món từ Tủ Bếp AI' },
  ];

  return (
    <div className="pantry-ai-page">
      <div className="pantry-container">
        {/* ===== Topbar ===== */}
        <div className="pantry-topbar">
          <nav className="pantry-breadcrumbs" aria-label="Breadcrumb">
            {breadcrumbs.map((b, i) => {
              const last = i === breadcrumbs.length - 1;
              return (
                <span key={b.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {i > 0 && <span className="sep">/</span>}
                  {last ? (
                    <span className="current">{b.label}</span>
                  ) : (
                    <a
                      href={`#${b.path}`}
                      onClick={(e) => handleNavClick(e, b.path!)}
                    >
                      {b.label}
                    </a>
                  )}
                </span>
              );
            })}
          </nav>
          <div className="pantry-top-actions">
            <button type="button" className="pantry-btn pantry-btn-ghost pantry-btn-sm">
              <Eye className="w-3.5 h-3.5" />
              696 sốc khỏe thần
            </button>
          </div>
        </div>

        {/* ===== Header ===== */}
        <header className="pantry-hero">
          <div className="pantry-hero-text">
            <div className="pantry-title-row">
              <h1 className="pantry-title">Gợi ý Món Chay Từ Tủ Bếp AI</h1>
              <span className="pantry-pill pantry-pill-accent" style={{ margin: 0 }}>
                <Sparkles className="w-3 h-3" />
                Smart Pantry v2.4
              </span>
            </div>
            <p className="pantry-subtitle">
              Khám phá các món ăn thơm ngon, chuẩn dinh dưỡng từ nguyên liệu sẵn có trong gian bếp của bạn cùng Trợ lý AI thông minh.
            </p>
          </div>

          <aside className="pantry-user-card" aria-label="Thông tin người dùng">
            <div className="pantry-user-row">
              <div className="pantry-avatar">MN</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="pantry-user-name">Nguyễn Minh Anh</div>
                <div className="pantry-user-email">minhanh@example.com</div>
              </div>
            </div>
            <div className="pantry-user-diet">
              🌱 Hồ sơ ăn chay - Vegan
            </div>
            <div className="pantry-user-links">
              <button type="button" onClick={() => onNavigate?.('/profile')}>
                ⚙️ Tài khoản & Hồ sơ ăn chay
              </button>
              <button type="button" onClick={() => onNavigate?.('/food-scan')}>
                🧪 Lịch sử quét & Thực đơn đã lưu
              </button>
              <button type="button" onClick={() => onNavigate?.('/meal-plans')}>
                📝 Thực đơn tuần
              </button>
            </div>
            <div className="pantry-user-actions">
              <button type="button" className="pantry-btn pantry-btn-danger pantry-btn-sm" style={{ justifyContent: 'center' }}>
                🔒 Đăng xuất
              </button>
              <button type="button" className="pantry-btn pantry-btn-outline pantry-btn-sm" style={{ justifyContent: 'center' }}>
                🥦 Đổi chế độ ăn
              </button>
            </div>
          </aside>
        </header>

        {error && (
          <div className="pantry-card" role="alert">
            <h3 className="pantry-card-title" style={{ color: '#991b1b' }}>⚠️ Lỗi trong quá trình phân tích</h3>
            <p className="pantry-card-subtitle">{error}</p>
            <button type="button" className="pantry-btn pantry-btn-primary pantry-btn-sm" style={{ alignSelf: 'flex-start' }} onClick={loadSuggestions}>
              Thử lại
            </button>
          </div>
        )}

        {loading && !data && (
          <div className="pantry-card">
            <h3 className="pantry-card-title">⚙️ AI đang phân tích tủ bếp của bạn...</h3>
            <p className="pantry-card-subtitle">Đang quét nguyên liệu, đối chiếu chuẩn thuần chay & gợi ý công thức.</p>
          </div>
        )}

        {data && !loading && (
          <>
            {/* ===== Main 2-col grid ===== */}
            <div className="pantry-main-grid">
              {/* ========= Left column ========= */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* 1. Diet mode card */}
                <div className="pantry-card">
                  <div className="pantry-pill pantry-pill-success" style={{ margin: 0 }}>
                    <Sparkles className="w-3 h-3" />
                    Đã đồng bộ hồ sơ
                  </div>
                  <div className="pantry-diet-row">
                    <div className="pantry-diet-icon">
                      <Leaf className="w-4 h-4" />
                    </div>
                    <div className="pantry-diet-body">
                      <div className="pantry-diet-name">Chế độ hiện tại: {data.dietModeLabel}</div>
                      <div className="pantry-diet-desc">{data.dietModeDescription}</div>
                    </div>
                  </div>
                </div>

                {/* 2. Pantry management */}
                <div className="pantry-card">
                  <div className="pantry-pantry-head">
                    <h2 className="pantry-card-title">
                      <span className="pantry-icon-pill">🧺</span>
                      Tủ bếp của bạn
                    </h2>
                    <span className="pantry-count-pill">
                      {data.availableIngredients.length} nguyên liệu đã chọn / {data.maxIngredientsInPantry}
                    </span>
                  </div>
                  <p className="pantry-card-subtitle" style={{ marginTop: -6 }}>Thêm nguyên liệu tủ bếp có sẵn</p>

                  <div className="pantry-add-row">
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span className="pantry-add-search-icon">
                        <ScanSearch className="w-4 h-4" />
                      </span>
                      <input
                        className="pantry-add-input"
                        placeholder="Nhập nguyên liệu bạn đang có (VD: Đậu nành, Nấm rơm...)"
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') void handleAddIngredient(); }}
                      />
                    </div>
                    <button
                      type="button"
                      className="pantry-btn pantry-btn-primary pantry-btn-sm"
                      onClick={() => void handleAddIngredient()}
                    >
                      + Thêm
                    </button>
                  </div>

                  <div className="pantry-chips" aria-label="Loại nguyên liệu">
                    {DEFAULT_CATEGORY_FILTERS.map((c) => {
                      if (c.plus) {
                        const isActive = selectedCats.includes(c.key as IngredientCategory);
                        return (
                          <button
                            key={c.label}
                            type="button"
                            className={`pantry-chip ${isActive ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedCats((prev) => {
                                const k = c.key as IngredientCategory;
                                return prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k];
                              });
                            }}
                          >
                            {c.label}
                          </button>
                        );
                      }
                      return (
                        <span key={c.label} className="pantry-chip">{c.label}</span>
                      );
                    })}
                  </div>

                  <div className="pantry-pantry-list" aria-label="Nguyên liệu tủ bếp">
                    {data.availableIngredients.map((ing) => (
                      <div key={ing.id} className="pantry-pantry-chip">
                        <span className="pantry-pantry-chip-text">{ing.name}</span>
                        <button
                          type="button"
                          className="pantry-pantry-chip-remove"
                          onClick={() => handleRemoveIngredient(ing.id)}
                          aria-label="Xoá nguyên liệu"
                          title="Xoá nguyên liệu"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pantry-check-summary">
                    <span>
                      <ScanSearch className="w-3.5 h-3.5" />
                      Kiểm tra vì phạm ngũ Vegan:
                    </span>
                    <span>
                      <span className="pantry-check-pill pantry-check-pill-ok">
                        {data.veganAssessmentSummary.safeCount} Hoạt hợp
                      </span>
                      <span className="pantry-check-pill pantry-check-pill-warn">
                        {data.veganAssessmentSummary.warnCount + data.veganAssessmentSummary.flaggedCount} Cảnh báo
                      </span>
                    </span>
                  </div>
                </div>

                {/* 3. Checked ingredients */}
                <div className="pantry-card">
                  <h3 className="pantry-section-title">
                    <ScanSearch className="w-4 h-4" />
                    Kết quả kiểm tra theo hồ sơ Vegan
                  </h3>
                  <p className="pantry-card-subtitle">
                    Hệ thống AI tự động phân tích từng nguồn liệu đối chiếu với chế độ ăn Vegan của bạn (trích xuất công thức + OCR nhãn nếu có).
                  </p>

                  <div className="pantry-ing-group-header pantry-ing-group-header-safe">
                    <span>☑️ Nguyên liệu hợp lệ ({data.checkedIngredients.filter((c) => c.assessment === 'vegan_safe').length} nguồn liệu)</span>
                    <span>{data.veganAssessmentSummary.safePercent.toFixed(0)}% An toàn</span>
                  </div>

                  {data.checkedIngredients.filter((c) => c.assessment === 'vegan_safe').map((item) => (
                    <div key={item.id} className="pantry-ing-item safe">
                      <div className="pantry-ing-icon">
                        <Leaf className="w-3.5 h-3.5" />
                      </div>
                      <div className="pantry-ing-body">
                        <div className="pantry-ing-head">
                          <div className="pantry-ing-name">{item.name}</div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <VeganAssessBadge item={item} />
                            <button
                              type="button"
                              className="pantry-ing-remove"
                              aria-label="Xoá nguyên liệu"
                              onClick={() => handleRemoveIngredient(item.id)}
                              title="Xoá nguyên liệu"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {item.evidence && <div className="pantry-ing-evidence">{item.evidence}</div>}
                      </div>
                    </div>
                  ))}

                  <div className="pantry-ing-group-header pantry-ing-group-header-warn">
                    <span>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Cảnh báo vì phạm chế độ ăn ({data.checkedIngredients.filter((c) => c.assessment !== 'vegan_safe').length} nguyên liệu)
                    </span>
                    <button type="button" className="pantry-link-btn">Cần kiểm tra lại</button>
                  </div>

                  {data.checkedIngredients.filter((c) => c.assessment !== 'vegan_safe').map((item) => {
                    const cls =
                      item.assessment === 'not_vegan' ? 'danger' : 'warn';
                    return (
                      <div key={item.id} className={`pantry-ing-item ${cls}`}>
                        <div className="pantry-ing-icon">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                        <div className="pantry-ing-body">
                          <div className="pantry-ing-head">
                            <div className="pantry-ing-name">{item.name}</div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                              <VeganAssessBadge item={item} />
                              <button
                                type="button"
                                className="pantry-ing-remove"
                                onClick={() => handleRemoveIngredient(item.id)}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          {item.evidence && <div className="pantry-ing-evidence">{item.evidence}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 4. AI Swap suggestions */}
                <div className="pantry-swap-card">
                  <div className="pantry-swap-title">
                    <ChevronRight className="w-4 h-4 pantry-swap-title-arrow" />
                    <span className="pantry-icon-pill">
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                    Gợi ý thay thế thuần thực vật từ AI
                    <span className="pantry-pill pantry-pill-success" style={{ marginLeft: 'auto' }}>
                      100% Thuần Chay (Only)
                    </span>
                  </div>

                  {data.swaps.map((swap) => (
                    <div key={swap.id} className="pantry-swap-item">
                      <div className="pantry-swap-row">
                        <div className="pantry-swap-orig">⭕ {swap.originalName}</div>
                      </div>
                      <div className="pantry-swap-row">
                        <div className="pantry-swap-result">✔️ {swap.substituteName}</div>
                        <button
                          type="button"
                          className={`pantry-btn pantry-btn-sm ${appliedSwaps[swap.id] ? 'pantry-btn-success' : 'pantry-btn-primary'}`}
                          disabled={Boolean(appliedSwaps[swap.id])}
                          onClick={() => void handleApplySwap(swap)}
                        >
                          {appliedSwaps[swap.id] ? '✔️ Đã áp dụng thay thế' : 'Áp dụng thay thế'}
                        </button>
                      </div>
                      <div className="pantry-swap-ratio">
                        {swap.swapRatio}
                      </div>
                      <div className="pantry-progress-wrap">
                        <label>Khớp vị (Flavor)</label>
                        <PercentBar value={swap.flavorMatch} />
                      </div>
                      <div className="pantry-progress-wrap">
                        <label>Nutri-Score</label>
                        <PercentBar value={swap.nutritionMatch} />
                      </div>
                    </div>
                  ))}

                  <label
                    className="pantry-auto"
                    style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      checked={autoReplace}
                      onChange={(e) => {
                        setAutoReplace(e.target.checked);
                        if (e.target.checked) void handleAutoReplaceAll();
                      }}
                      style={{ marginTop: 2 }}
                    />
                    <span>
                      <strong>Tự động thay thế tất cả nguyên liệu vi phạm phiên bản thực vật an toàn với kho gợi ý công thức.</strong>
                      <br />
                      (Thiết lập theo chuẩn Vườn rau hữu cơ &amp; ẩm thực chay truyền thống Việt Nam.)
                    </span>
                  </label>
                </div>
              </div>

              {/* ========= Right column: Recipes ========= */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <div className="pantry-recipes-head">
                    <div className="pantry-recipes-title-block">
                      <h2 className="pantry-recipes-title">
                        <span className="pantry-icon-pill">🍲</span>
                        Món ngon có thể nấu ngay từ tủ bếp
                        <span className="pantry-recipes-count">
                          {data.recipeSuggestions.length} công thức
                        </span>
                      </h2>
                      <p className="pantry-recipes-subtitle">
                        Tìm thấy {data.recipeSuggestions.length} công thức tối ưu chuẩn dinh dưỡng trên nguyên liệu đủ kiểm duyệt và toàn.
                      </p>
                    </div>
                    <div className="pantry-sort">
                      <span>Sắp xếp:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      >
                        <option value="match">Khớp nguyên liệu cao nhất (90%)</option>
                        <option value="quickest">Thời gian nấu nhanh nhất</option>
                        <option value="nutri_score">Điểm dinh dưỡng cao nhất</option>
                        <option value="cheapest">Tiết kiệm chi phí nhất</option>
                      </select>
                    </div>
                  </div>

                  <div className="pantry-recipes-grid" aria-label="Danh sách gợi ý công thức">
                    {sortedRecipes.map((r) => (
                      <article key={r.id} className="pantry-recipe-card">
                        <div className="pantry-recipe-cover">
                          <img src={r.coverImageUrl} alt={r.title} loading="lazy" />
                          <div className="pantry-recipe-badges">
                            {r.badges.map((b, idx) => (
                              <span key={idx} className={`pantry-badge-tag ${b.variant}`}>
                                {b.label}
                              </span>
                            ))}
                          </div>
                          <span className="pantry-time-chip">
                            ⏱ {r.cookTimeMin} phút
                          </span>
                        </div>

                        <div className="pantry-recipe-body">
                          <h3 className="pantry-recipe-title">{r.title}</h3>
                          <p className="pantry-recipe-subtitle">{r.subtitle}</p>
                          <div className="pantry-ingredients-summary">
                            {r.ingredientSummary}
                          </div>

                          <div className="pantry-nutri-table" aria-label="Thành phần dinh dưỡng">
                            <div className="pantry-nutri-cell">
                              <span className="k">Calo</span>
                              <span className="v">{r.nutrition.calories}</span>
                            </div>
                            <div className="pantry-nutri-cell">
                              <span className="k">Đạm</span>
                              <span className="v">{r.nutrition.proteinG}g</span>
                            </div>
                            <div className="pantry-nutri-cell">
                              <span className="k">Carb</span>
                              <span className="v">{r.nutrition.carbsG}g</span>
                            </div>
                            <div className="pantry-nutri-cell">
                              <span className="k">Béo tốt</span>
                              <span className="v">{r.nutrition.goodFatG}g</span>
                            </div>
                          </div>

                          <div className="pantry-recipe-verify-row">
                            <span className="pantry-verify">
                              ✅ Tỷ lệ thực vật
                            </span>
                            <span style={{ fontWeight: 700, color: '#065f46' }}>
                              100% Chuẩn thuần thực vật
                            </span>
                          </div>

                          <div className="pantry-recipe-actions">
                            <button
                              type="button"
                              className="pantry-btn pantry-btn-primary pantry-btn-sm"
                              onClick={() => onNavigate?.(`/recipes/${encodeURIComponent(r.id)}`)}
                            >
                              Xem công thức chi tiết
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" className="pantry-btn-save" title="Lưu vào yêu thích">
                              <Save className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                {/* ===== Expert Insight ===== */}
                <section className="pantry-expert" aria-label="Góc chuyên gia AI">
                  <div className="pantry-expert-head">
                    <div className="pantry-expert-title-block">
                      <div className="pantry-expert-icon">💡</div>
                      <div>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 6,
                        }}>
                          <h3 className="pantry-expert-title">
                            Góc chuyên gia dinh dưỡng thực vật AI
                          </h3>
                          {data.expertInsight.badge && (
                            <span className="pantry-pill pantry-pill-info">
                              {data.expertInsight.badge}
                            </span>
                          )}
                        </div>
                        <p className="pantry-expert-body">
                          {data.expertInsight.title}
                          <br />
                          {data.expertInsight.body}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="pantry-expert-foot">
                    {data.expertInsight.pros?.length ? (
                      <span className="check">
                        ✓ {data.expertInsight.pros.join('  ·  ')}
                      </span>
                    ) : (
                      <span>
                        ✓ Phù hợp cho chế độ ăn giảm cân & kiểm soát BMI · Chỉ số đường huyết (GI) thấp
                      </span>
                    )}
                    <span>
                      ✓ Chỉ số dinh dưỡng IQI thấp
                    </span>
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
