import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Upload,
  PlayCircle,
  Clock3,
  Eye,
  ChefHat,
  Calendar,
  Hash,
  Flame,
  UserCircle2,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  MoreHorizontal,
  ChevronDown,
  Send,
  Play,
  Pencil,
} from 'lucide-react';
import type {
  CookingVideo,
  SortKey,
  VideoChef,
  VideoCategory,
  VideoFilterValues,
  VideoListResult,
} from '../videos.types';
import { CATEGORY_LABELS, DEFAULT_FILTER_VALUES, SORT_LABELS } from '../videos.types';
import { fetchVideos, generateAiPlaylist } from '../videos.api';
import './VideoList.css';

interface VideoListPageProps {
  onNavigate?: (path: string) => void;
}

type RequestStatus = 'loading' | 'success' | 'error';

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M lượt xem`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K lượt xem`;
  return `${n} lượt xem`;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return iso;
  }
}

function CategoryPill({
  cat,
  active,
  onClick,
}: {
  cat: VideoCategory;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`vl-cat-pill ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {CATEGORY_LABELS[cat]}
    </button>
  );
}

function VideoCard({
  video,
  onPlay,
}: {
  video: CookingVideo;
  onPlay?: (id: string) => void;
}) {
  return (
    <article className="vl-video-card">
      <div className="vl-video-thumb">
        <img src={video.thumbnailUrl} alt={video.title} loading="lazy" />
        <span className="vl-video-duration">{formatDuration(video.durationSec)}</span>
      </div>
      <div className="vl-video-body">
        <div className="vl-video-cat-tag">{CATEGORY_LABELS[video.category]}</div>
        <h3 className="vl-video-title">{video.title}</h3>
        <div className="vl-video-meta">
          <span>
            <ChefHat className="w-3 h-3" />
            {video.chef.name}
          </span>
          <span>
            <Eye className="w-3 h-3" />
            {formatViews(video.viewsCount)}
          </span>
        </div>
        <button
          type="button"
          className="vl-btn vl-btn-outline-light vl-btn-sm"
          onClick={() => onPlay?.(video.id)}
        >
          <PlayCircle className="w-3.5 h-3.5" />
          Xem video
        </button>
      </div>
    </article>
  );
}

function FeaturedVideo({
  video,
  onPlay,
}: {
  video: CookingVideo;
  onPlay?: (id: string) => void;
}) {
  return (
    <section className="vl-featured-card">
      <div className="vl-featured-thumb">
        <img src={video.thumbnailUrl} alt={video.title} />
        <span className="vl-featured-badge-top">
          <Flame className="w-3 h-3" />
          Nổi bật
        </span>
        <button
          type="button"
          className="vl-featured-play"
          onClick={() => onPlay?.(video.id)}
          aria-label="Phát video"
        >
          <Play className="w-7 h-7" />
        </button>
        <span className="vl-featured-duration">{formatDuration(video.durationSec)}</span>
      </div>
      <div className="vl-featured-body">
        <div className="vl-featured-pills">
          <span className="vl-pill vl-pill-primary">{CATEGORY_LABELS[video.category]}</span>
          <span className="vl-pill vl-pill-secondary">Công thức nhanh</span>
        </div>
        <h2 className="vl-featured-title">{video.title}</h2>
        <p className="vl-featured-desc">{video.description}</p>
        <div className="vl-featured-meta">
          <span>
            <ChefHat className="w-3.5 h-3.5" />
            {video.chef.name}
          </span>
          <span>
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(video.publishedAtISO)}
          </span>
          <span>
            <Eye className="w-3.5 h-3.5" />
            {formatViews(video.viewsCount)}
          </span>
        </div>
        <button
          type="button"
          className="vl-btn vl-btn-primary"
          onClick={() => onPlay?.(video.id)}
        >
          <Play className="w-4 h-4" />
          Xem video
        </button>
      </div>
    </section>
  );
}

function ChefCard({ chef }: { chef: VideoChef }) {
  return (
    <div className="vl-chef-card">
      {chef.avatarUrl ? (
        <img src={chef.avatarUrl} alt={chef.name} className="vl-chef-avatar" />
      ) : (
        <div className="vl-chef-avatar vl-chef-avatar-ph">
          <UserCircle2 className="w-9 h-9" />
        </div>
      )}
      <div className="vl-chef-info">
        <div className="vl-chef-name">{chef.name}</div>
        <div className="vl-chef-title">{chef.title}</div>
      </div>
      <div className="vl-chef-count">{chef.videosCount} Video</div>
    </div>
  );
}

const ALL_CATEGORIES: VideoCategory[] = [
  'all',
  'main',
  'salad',
  'soup',
  'drink',
  'dessert',
  'noodle',
];

export default function VideoList({ onNavigate }: VideoListPageProps) {
  const [filters, setFilters] = useState<VideoFilterValues>(DEFAULT_FILTER_VALUES);
  const [searchInput, setSearchInput] = useState('');
  const [data, setData] = useState<VideoListResult | null>(null);
  const [status, setStatus] = useState<RequestStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const reqIdRef = useRef(0);

  const breadcrumbs = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Video' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  const loadVideos = useCallback(async (values: VideoFilterValues) => {
    const reqId = ++reqIdRef.current;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('loading');
    setError(null);
    try {
      const res = await fetchVideos(values, controller.signal);
      if (reqId !== reqIdRef.current) return;
      setData(res);
      setStatus('success');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (reqId !== reqIdRef.current) return;
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Không xác định');
    }
  }, []);

  useEffect(() => {
    void loadVideos(filters);
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.category, filters.sort]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setFilters((p: VideoFilterValues) => ({ ...p, search: searchInput.trim(), page: 1 }));
    void loadVideos({ ...filters, search: searchInput.trim(), page: 1 });
  };

  const handleCategoryChange = (cat: VideoCategory) => {
    setFilters((p: VideoFilterValues) => ({ ...p, category: cat, page: 1 }));
  };

  const handleSortChange = (s: SortKey) => {
    setFilters((p: VideoFilterValues) => ({ ...p, sort: s }));
  };

  const handlePageChange = (page: number) => {
    if (!data) return;
    if (page < 1 || page > data.pagination.totalPages) return;
    setFilters((p: VideoFilterValues) => ({ ...p, page }));
  };

  const handleAiSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const prompt = aiInput.trim();
    if (!prompt) return;
    setAiLoading(true);
    setAiMessage(null);
    try {
      const r = await generateAiPlaylist(prompt);
      setAiMessage(r.message);
    } catch (err) {
      setAiMessage(err instanceof Error ? err.message : 'Không thể gợi ý, thử lại sau.');
    } finally {
      setAiLoading(false);
    }
  };

  const paginationItems = useMemo(() => {
    if (!data) return [];
    const { totalPages, page } = data.pagination;
    const items: Array<{ type: 'page' | 'dots'; value?: number }> = [];
    const push = (x: { type: 'page' | 'dots'; value?: number }) => items.push(x);
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) push({ type: 'page', value: i });
      return items;
    }
    push({ type: 'page', value: 1 });
    if (page > 3) push({ type: 'dots' });
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) push({ type: 'page', value: i });
    if (page < totalPages - 2) push({ type: 'dots' });
    push({ type: 'page', value: totalPages });
    return items;
  }, [data]);

  const onPlay = (id: string) => {
    // place holder for future detail route
    if (onNavigate) onNavigate(`/videos/${encodeURIComponent(id)}`);
  };

  return (
    <div className="vl-page">
      <div className="vl-container">
        {/* Breadcrumbs */}
        <nav className="vl-breadcrumbs" aria-label="Breadcrumb">
          {breadcrumbs.map((b, i) => {
            const last = i === breadcrumbs.length - 1;
            return (
              <span key={b.label} className="vl-breadcrumb-item">
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

        {/* Header */}
        <header className="vl-hero">
          <div className="vl-hero-left">
            <span className="vl-hero-pill">
              <Pencil className="w-3 h-3" />
              KHO VIDEO HƯỚNG DẪN ẨM THỰC CHAY
            </span>
            <h1 className="vl-hero-title">Video nấu ăn chay</h1>
            <p className="vl-hero-sub">
              Khám phá các video hướng dẫn món chay đơn giản, ngon miệng và dễ thực hiện tại nhà
              cùng chuyên gia dinh dưỡng thực vật.
            </p>
          </div>
          <div className="vl-hero-actions">
            <button type="button" className="vl-btn vl-btn-primary">
              <Upload className="w-4 h-4" />
              Tải Video lên
            </button>
            <div className="vl-stat-card">
              <Clock3 className="w-4 h-4 vl-stat-icon-green" />
              <div>
                <div className="vl-stat-num">{data?.totalVideos ?? 85}+ Video</div>
                <div className="vl-stat-label">Công thức chi tiết</div>
              </div>
            </div>
          </div>
        </header>

        {/* Search bar */}
        <form className="vl-search-bar" onSubmit={handleSearch}>
          <div className="vl-search-input-wrap">
            <Search className="w-4 h-4 vl-search-icon" />
            <input
              className="vl-search-input"
              placeholder="Tìm kiếm video theo tên món hoặc chủ đề..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="vl-btn vl-btn-primary">
            <Search className="w-4 h-4" />
            Tìm kiếm
          </button>
        </form>

        {/* Category filter + time sort */}
        <div className="vl-filter-row">
          <div className="vl-cat-pills" role="tablist">
            {ALL_CATEGORIES.map((c) => (
              <CategoryPill
                key={c}
                cat={c}
                active={filters.category === c}
                onClick={() => handleCategoryChange(c)}
              />
            ))}
          </div>
          <div className="vl-time-filter">
            <Clock3 className="w-3.5 h-3.5" />
            <span>Thời lượng:</span>
            <div className="vl-select-wrap">
              <select
                className="vl-select"
                value="all"
                onChange={() => { /* future: add duration filter */ }}
              >
                <option value="all">Tất cả thời lượng</option>
                <option value="short">Dưới 10 phút</option>
                <option value="medium">10 - 20 phút</option>
                <option value="long">Trên 20 phút</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 vl-select-arrow" />
            </div>
          </div>
        </div>

        {/* Featured video */}
        {data?.featured && (
          <section className="vl-section">
            <h2 className="vl-section-title">
              <Flame className="w-4 h-4" />
              Video nổi bật
            </h2>
            <FeaturedVideo video={data.featured} onPlay={onPlay} />
          </section>
        )}

        {/* Main grid: Video list + Sidebar */}
        <section className="vl-main-grid">
          {/* Left: Newest videos + Pagination */}
          <div className="vl-left-col">
            <div className="vl-section-head">
              <h2 className="vl-section-title no-margin">
                <PlayCircle className="w-4 h-4" />
                Video mới nhất
              </h2>
              <div className="vl-sort">
                <span>Sắp xếp:</span>
                <div className="vl-select-wrap">
                  <select
                    className="vl-select"
                    value={filters.sort}
                    onChange={(e) => handleSortChange(e.target.value as SortKey)}
                  >
                    {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                      <option key={k} value={k}>
                        {SORT_LABELS[k]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 vl-select-arrow" />
                </div>
              </div>
            </div>

            {status === 'loading' && (
              <div className="vl-card vl-info">
                <p style={{ margin: 0 }}>Đang tải danh sách video...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="vl-card vl-info vl-info-error">
                <p style={{ margin: 0 }}>Lỗi: {error ?? 'Không thể tải danh sách'}</p>
                <button
                  type="button"
                  className="vl-btn vl-btn-primary vl-btn-sm"
                  onClick={() => void loadVideos(filters)}
                >
                  Thử lại
                </button>
              </div>
            )}

            {status === 'success' && data && (
              <>
                <div className="vl-video-grid">
                  {data.items.map((v: CookingVideo) => (
                    <VideoCard key={v.id} video={v} onPlay={onPlay} />
                  ))}
                </div>

                {data.items.length === 0 && (
                  <div className="vl-card vl-info">
                    Không tìm thấy video phù hợp với từ khóa này.
                  </div>
                )}

                {data.pagination.totalPages > 1 && (
                  <nav className="vl-pagination" aria-label="Phân trang">
                    <button
                      type="button"
                      className="vl-page-btn"
                      onClick={() => handlePageChange(filters.page - 1)}
                      disabled={filters.page <= 1}
                      aria-label="Trang trước"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    {paginationItems.map((it, idx) =>
                      it.type === 'dots' ? (
                        <span key={`dots-${idx}`} className="vl-page-dots">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <button
                          key={`page-${it.value}`}
                          type="button"
                          className={`vl-page-btn ${it.value === filters.page ? 'active' : ''}`}
                          onClick={() => handlePageChange(it.value!)}
                        >
                          {it.value}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      className="vl-page-btn"
                      onClick={() => handlePageChange(filters.page + 1)}
                      disabled={filters.page >= data.pagination.totalPages}
                      aria-label="Trang sau"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>

          {/* Right: Sidebar */}
          <aside className="vl-right-col">
            {/* Popular Tags */}
            <div className="vl-card vl-sidebar-card">
              <h3 className="vl-sidebar-title">
                <Hash className="w-4 h-4" />
                Chủ đề phổ biến
              </h3>
              <div className="vl-tag-list">
                {(data?.popularTags ?? []).map((t: string) => (
                  <button
                    key={t}
                    type="button"
                    className="vl-tag-pill"
                    onClick={() => {
                      setSearchInput(t.replace('#', '').replace(/_/g, ' '));
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Trending Chefs */}
            <div className="vl-card vl-sidebar-card">
              <div className="vl-sidebar-title-row">
                <h3 className="vl-sidebar-title">
                  <ChefHat className="w-4 h-4" />
                  Đầu bếp nổi bật
                </h3>
                <button type="button" className="vl-link-sm">
                  Xem tất cả
                </button>
              </div>
              <div className="vl-chef-list">
                {(data?.trendingChefs ?? []).map((c: VideoChef) => (
                  <ChefCard key={c.id} chef={c} />
                ))}
              </div>
            </div>

            {/* AI Assistant */}
            <div className="vl-card vl-sidebar-card vl-ai-card">
              <div className="vl-ai-label">
                <Sparkles className="w-3 h-3" />
                TRỢ LÝ DINH DƯỠNG AI
              </div>
              <h3 className="vl-ai-title">Học nấu ăn cùng AI</h3>
              <p className="vl-ai-desc">
                Nhập các nguyên liệu bạn đang có sẵn trong tủ lạnh (rau củ, nấm, đậu hũ...), AI
                sẽ tự tìm ngay video công thức nấu phù hợp nhất!
              </p>
              <form className="vl-ai-form" onSubmit={handleAiSubmit}>
                <input
                  className="vl-ai-input"
                  placeholder="VD: Đậu hũ, nấm rơm, cà chua..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="vl-btn vl-btn-primary vl-ai-submit"
                  disabled={aiLoading || !aiInput.trim()}
                >
                  <Send className="w-3.5 h-3.5" />
                  Gợi ý video công thức ngay
                </button>
              </form>
              {aiMessage && <div className="vl-ai-message">{aiMessage}</div>}
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
