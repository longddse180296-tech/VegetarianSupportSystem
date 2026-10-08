import { useState } from 'react';
import {
  Play,
  Upload,
  Video,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  CircleUser,
  CalendarDays,
  Eye,
  ChefHat,
  Sparkles,
} from 'lucide-react';
import './VideoList.css';

interface VideoCardModel {
  id: string;
  thumbnail: string;
  duration: string;
  category: string;
  title: string;
  channel: string;
  views: string;
  date: string;
}

const FEATURED = {
  id: 'feat',
  thumbnail:
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vietnamese%20vegetarian%20braised%20tofu%20with%20mushroom%20sauce%20in%20white%20bowl%2C%20steam%2C%20cooking%20scene%20with%20chopsticks%20and%20linen%20towel&image_size=landscape_16_9',
  duration: '20:15',
  categoryTags: ['Món chính', 'Công thức nhanh'],
  title: 'Đậu hũ sốt nấm đơn giản trong 20 phút',
  description:
    'Hướng dẫn từng bước chiên đậu hũ vàng giòn rụm bên ngoài mềm mọng bên trong quyện cùng sốt nấm đông cô đậm đà thơm nức mùi, bổ sung nguồn đạm thực vật sạch và cân bằng.',
  chef: 'Chef Minh Tuấn',
  chefRole: 'Bếp trưởng ẩm thực chay',
  date: '14/05/2026',
  views: '42.5K',
};

const VIDEO_LIST: VideoCardModel[] = [
  {
    id: 'v1',
    thumbnail:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vegan%20brown%20rice%20with%20colorful%20stir%20fried%20vegetables%20in%20white%20ceramic%20bowl%2C%20japanese%20wooden%20table%2C%20minimal%20aesthetic&image_size=landscape_16_9',
    duration: '12:15',
    category: 'Món chính',
    title: 'Cơm gạo lứt rau củ thập cẩm thanh vị',
    channel: 'DS. Kim Oanh',
    views: '18.2K',
    date: '3 ngày trước',
  },
  {
    id: 'v2',
    thumbnail:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Fresh%20vegan%20avocado%20chickpea%20sesame%20salad%20in%20white%20bowl%2C%20top%20down%2C%20bright%20kitchen&image_size=landscape_16_9',
    duration: '08:40',
    category: 'Salad',
    title: 'Salad bơ đậu gà sốt mè rang béo ngậy',
    channel: 'Lan Anh',
    views: '24.1K',
    date: '5 ngày trước',
  },
  {
    id: 'v3',
    thumbnail:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Hot%20vegan%20lotus%20root%20mushroom%20seaweed%20soup%20in%20white%20pot%2C%20steam%2C%20cozy%20dining&image_size=landscape_16_9',
    duration: '15:30',
    category: 'Món nước',
    title: 'Canh nấm hạt sen tảo đỏ bồi bổ cơ thể',
    channel: 'BS. Hoàng Nam',
    views: '31.0K',
    date: '1 tuần trước',
  },
  {
    id: 'v4',
    thumbnail:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vegan%20stir%20fried%20morning%20glory%20water%20spinach%20with%20garlic%20and%20chili%20in%20wok%2C%20vietnamese%20dish&image_size=landscape_16_9',
    duration: '10:20',
    category: 'Món chính',
    title: 'Mĩ xào rau củ sốt dầu hào chay',
    channel: 'Chef Minh Tuấn',
    views: '15.6K',
    date: '1 tuần trước',
  },
  {
    id: 'v5',
    thumbnail:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vegan%20cold%20pumpkin%20coconut%20milk%20soup%20dessert%20in%20glass%20bowl%20with%20lotus%20seed&image_size=landscape_16_9',
    duration: '18:00',
    category: 'Món nước',
    title: 'Bún chay thanh đạm nước dùng củ quả',
    channel: 'Thu Hằng',
    views: '29.8K',
    date: '2 tuần trước',
  },
  {
    id: 'v6',
    thumbnail:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Three%20tall%20green%20vegan%20detox%20smoothie%20glasses%20with%20spinach%20apple%20celery%2C%20morning%20sunlight%20bright&image_size=landscape_16_9',
    duration: '05:10',
    category: 'Đồ uống',
    title: 'Sinh tố xanh detox giàu năng lượng và vi chất',
    channel: 'Minh Đức',
    views: '19.4K',
    date: '3 tuần trước',
  },
];

const TOPIC_TAGS = [
  '#Đậu hũ', '#Nấm', '#Salad', '#Bữa sáng',
  '#Bữa tối', '#Protein thực vật', '#Ăn chay giảm cân', '#Canh chay',
];

const TOP_CHEFS = [
  { name: 'Chef Minh Tuấn', role: 'Bếp trưởng ẩm thực chay', count: '24 Video', avatarColor: 'bg-gold' },
  { name: 'DS. Kim Oanh', role: 'Chuyên gia cân bằng vi chất', count: '18 Video', avatarColor: 'bg-rose' },
  { name: 'BS. Hoàng Nam', role: 'Bác sĩ Dinh dưỡng dự phòng', count: '15 Video', avatarColor: 'bg-teal' },
];

const FILTER_TABS = ['Tất cả', 'Món chính', 'Salad', 'Món nước', 'Đồ uống', 'Tráng miệng', 'Mẹo nấu ăn'];

interface VideoListPageProps {
  onNavigate?: (path: string) => void;
}

export default function VideoListPage({ onNavigate }: VideoListPageProps) {
  const [filter, setFilter] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [aiInput, setAiInput] = useState('');

  return (
    <div className="vl-root">
      {/* Topbar */}
      <div className="vl-topbar">
        <div className="vl-breadcrumb">
          <button type="button" className="crumb-link" onClick={() => onNavigate?.('/')}>
            Trang chủ
          </button>
          <span className="crumb-sep">›</span>
          <span className="crumb-active">Video</span>
        </div>
      </div>

      {/* Hero */}
      <header className="vl-header">
        <div className="vl-header-main">
          <span className="vl-badge">
            <Video size={14} />
            VIDEO HƯỚNG DẪN ĂN THỰC CHAY
          </span>
          <h1>Video nấu ăn chay</h1>
          <p>
            Khám phá các video hướng dẫn nấu món chay đơn giản, ngon miệng và dễ thực hiện tại nhà cùng các chuyên gia dinh dưỡng thực vật.
          </p>
        </div>
        <div className="vl-header-actions">
          <button type="button" className="btn btn-upload">
            <Upload size={16} />
            Tải video lên
          </button>
          <button type="button" className="btn btn-count">
            <CalendarDays size={16} />
            <div className="btn-count-col">
              <strong>85+ Video</strong>
              <span>Công thức chi tiết</span>
            </div>
          </button>
        </div>
      </header>

      {/* Search */}
      <section className="vl-search-wrap">
        <div className="vl-search">
          <Search size={18} className="search-ic" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm video theo tên món hoặc chủ đề..."
            className="vl-search-input"
          />
          <button type="button" className="btn btn-search-primary">
            <Search size={14} /> Tìm kiếm
          </button>
        </div>

        <div className="vl-filter-row">
          <div className="vl-tabs">
            {FILTER_TABS.map(tab => (
              <button
                key={tab}
                type="button"
                className={`vl-tab ${filter === tab ? 'active' : ''}`}
                onClick={() => setFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="vl-sort">
            <span>Thời lượng:</span>
            <button type="button" className="sort-chip">
              Tất cả thời lượng
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Main content grid */}
      <div className="vl-main-grid">
        <div className="vl-main-col">
          {/* Featured video */}
          <section className="vl-featured-section">
            <div className="vl-section-head">
              <h2>
                <span className="vl-plus-mini">⊕</span>
                Video nổi bật
              </h2>
            </div>
            <article className="vl-featured-card">
              <div className="vl-featured-thumb">
                <img src={FEATURED.thumbnail} alt={FEATURED.title} />
                <button type="button" className="vl-featured-play">
                  <Play size={40} fill="currentColor" />
                </button>
                <span className="vl-duration-badge">{FEATURED.duration}</span>
                <span className="vl-featured-tag">
                  <Sparkles size={12} />
                  Nổi bật
                </span>
              </div>
              <div className="vl-featured-info">
                <div className="vl-featured-tags">
                  {FEATURED.categoryTags.map(t => (
                    <span key={t} className="vl-cat-tag">{t}</span>
                  ))}
                </div>
                <h3>{FEATURED.title}</h3>
                <p>{FEATURED.description}</p>
                <div className="vl-featured-meta">
                  <div className="vl-meta-row">
                    <div className="vl-avatar chef-a">
                      <ChefHat size={18} />
                    </div>
                    <div>
                      <strong>{FEATURED.chef}</strong>
                      <span>{FEATURED.chefRole}</span>
                    </div>
                  </div>
                  <div className="vl-meta-stats">
                    <span>
                      <CalendarDays size={13} /> {FEATURED.date}
                    </span>
                    <span>
                      <Eye size={13} /> {FEATURED.views} lượt xem
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-watch-now"
                  onClick={() => onNavigate?.(`/videos/${encodeURIComponent(FEATURED.id)}`)}
                >
                  <Play size={16} fill="currentColor" />
                  Xem video
                </button>
              </div>
            </article>
          </section>

          {/* Latest video grid */}
          <section className="vl-latest-section">
            <div className="vl-section-head between">
              <h2>
                <span className="vl-plus-mini">▣</span>
                Video mới nhất
              </h2>
              <div className="sort-select-mini">
                <span>Sắp xếp:</span>
                <button type="button" className="sort-chip light">
                  Mới nhất
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="vl-latest-grid">
              {VIDEO_LIST.map(v => (
                <article key={v.id} className="vl-latest-card">
                  <div className="vl-thumb-wrap">
                    <img src={v.thumbnail} alt={v.title} />
                    <button
                      type="button"
                      className="vl-play-sm"
                      onClick={() => onNavigate?.(`/videos/${encodeURIComponent(v.id)}`)}
                    >
                      <Eye size={14} /> Xem video
                    </button>
                    <span className="vl-duration-sm">{v.duration}</span>
                  </div>
                  <div className="vl-latest-info">
                    <span className="vl-cat-tag small">{v.category}</span>
                    <h4>{v.title}</h4>
                    <div className="vl-latest-meta">
                      <span><CircleUser size={12} /> {v.channel}</span>
                      <span><Eye size={12} /> {v.views} xem</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            <div className="vl-pagination">
              <button type="button" className="page-btn nav" aria-label="prev" disabled>
                <ChevronLeft size={16} />
              </button>
              {[1, 2, 3].map(n => (
                <button
                  key={n}
                  type="button"
                  className={`page-btn ${n === 1 ? 'active' : ''}`}
                >
                  {n}
                </button>
              ))}
              <span className="page-ellipsis"><MoreHorizontal size={16} /></span>
              <button type="button" className="page-btn">8</button>
              <button type="button" className="page-btn nav" aria-label="next">
                <ChevronRight size={16} />
              </button>
            </div>
          </section>
        </div>

        {/* SIDEBAR */}
        <aside className="vl-sidebar">
          {/* Topics */}
          <div className="vl-side-card">
            <h3>
              <span className="vl-plus-mini">※</span>
              Chủ đề phổ biến
            </h3>
            <div className="vl-topics">
              {TOPIC_TAGS.map(t => (
                <button key={t} type="button" className="topic-chip">{t}</button>
              ))}
            </div>
          </div>

          {/* Top chefs */}
          <div className="vl-side-card">
            <div className="vl-side-head-between">
              <h3>
                <span className="vl-plus-mini">♛</span>
                Đầu bếp nổi bật
              </h3>
              <button type="button" className="link-sm">Xem tất cả</button>
            </div>
            <div className="vl-chefs">
              {TOP_CHEFS.map(c => (
                <div key={c.name} className="vl-chef">
                  <div className={`vl-chef-avatar ${c.avatarColor}`}>
                    <ChefHat size={18} />
                  </div>
                  <div className="vl-chef-info">
                    <strong>{c.name}</strong>
                    <span>{c.role}</span>
                  </div>
                  <span className="vl-chef-count">{c.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI assistant */}
          <div className="vl-side-card ai-card">
            <div className="vl-ai-head">
              <div className="vl-ai-badge">
                <Sparkles size={12} />
                TRỢ LÝ DINH DƯỠNG AI
              </div>
            </div>
            <h3 className="vl-ai-title">Học nấu ăn cùng AI</h3>
            <p>
              Nhập các nguyên liệu bạn đang có sẵn trong tủ lạnh (rau củ, nấm, đậu…), AI sẽ tìm ngay video công thức phù hợp nhất cho bạn!
            </p>
            <div className="vl-ai-suggestion">
              VD: Đậu hũ, nấm, rổ dầu, cà chua...
            </div>
            <div className="vl-ai-input-wrap">
              <input
                type="text"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                placeholder="Bạn muốn nấu món gì hôm nay?"
                className="vl-ai-input"
              />
              <button
                type="button"
                className="btn btn-ai"
                onClick={() => {
                  setAiInput('');
                  onNavigate?.('/ai-chat');
                }}
              >
                <Sparkles size={14} />
                Gợi ý video công thức ngày
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
