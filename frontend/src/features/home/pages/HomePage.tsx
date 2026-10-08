import { useState } from 'react';
import {
  Leaf,
  Sparkles,
  Users,
  BadgeCheck,
  Search,
  Clock,
  ChefHat,
  Flame,
  Bookmark,
  ArrowRight,
  MapPin,
  Send,
  BookOpen,
  Play,
  CircleUser,
  Star,
  Navigation,
} from 'lucide-react';
import './HomePage.css';

interface HomePageProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

const SEARCH_TABS = ['Món chính', 'Công thức', 'Bài viết', 'Video'] as const;

const FEATURED_RECIPES = [
  {
    id: 'r1',
    time: '25 phút',
    level: 'Dễ',
    kcal: '380 kcal',
    image:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Delicious%20vegan%20tofu%20mushroom%20stew%20in%20white%20bowl%2C%20top%20down%20view%2C%20wooden%20table&image_size=square_hd',
    name: 'Đậu hũ sốt nấm',
    tags: ['Đậu hũ non xốt nấm', 'Nấm rừng sấy khô', 'Hành tây tím'],
  },
  {
    id: 'r2',
    time: '20 phút',
    level: 'Dễ',
    kcal: '320 kcal',
    image:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vegan%20brown%20rice%20stir%20fry%20with%20colorful%20vegetables%2C%20bowl%20top%20down&image_size=square_hd',
    name: 'Cơm gạo lứt rau củ',
    tags: ['Gạo lứt', 'Đậu xanh cắt nhỏ', 'Ớt chuông', 'Hành tây', 'Cà rốt'],
  },
  {
    id: 'r3',
    time: '15 phút',
    level: 'Dễ',
    kcal: '290 kcal',
    image:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Avocado%20salad%20with%20chickpeas%2C%20cherry%20tomatoes%2C%20cucumber%20in%20white%20bowl&image_size=square_hd',
    name: 'Salad bơ và đậu gà',
    tags: ['Thịt nai', 'Giấm balsamic', 'Rau diếp xanh', 'Hành tây tím'],
  },
  {
    id: 'r4',
    time: '30 phút',
    level: 'Vừa',
    kcal: '410 kcal',
    image:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vegan%20noodle%20soup%20with%20fried%20tofu%20and%20herbs%2C%20Vietnamese%20bun%20style&image_size=square_hd',
    name: 'Bún chay thanh đạm',
    tags: ['Nước dùng quế', 'Đậu phụ rán', 'Nấm', 'Rau thơm', 'Tỏi băm'],
  },
];

const LATEST_ARTICLES = [
  {
    id: 'a1',
    author: 'BS. Hoàng Nam',
    readTime: '6 phút đọc',
    image:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Female%20nutritionist%20consulting%20patient%20about%20B12%20supplements%2C%20clinic%20setting&image_size=landscape_16_9',
    title: 'Làm sao để bổ sung đủ Vitamin B12 khi ăn chế độ thuần chay?',
    excerpt:
      'Phần lớn người ăn thuần chay thường thiếu B12 vì không ăn sản phẩm từ động vật. Hiểu rõ tầm quan trọng và cách bổ sung an toàn giúp bạn tránh được triệu chứng thiếu hụt nguy hiểm...',
  },
  {
    id: 'a2',
    author: 'ThS. Dinh dưỡng Lê Chi',
    readTime: '7 phút đọc',
    image:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=7%20colorful%20plant%20protein%20sources%3A%20tofu%2C%20lentils%2C%20chickpeas%2C%20quinoa%2C%20almonds%2C%20seeds%2C%20tempeh%2C%20wooden%20kitchen&image_size=landscape_16_9',
    title: 'Top 7 nguồn đạm thực vật với giá trị đạo hàm cao',
    excerpt:
      'Đậu xanh nành, hạt chia, đậu đỏ, đậu thầu, hạt điều, đậu phộng, hạt quinoa. 7 loại thực phẩm cung cấp protein hoàn chỉnh không kém thịt, nhưng tốt cho hệ tim mạch và cân bằng đường...',
  },
  {
    id: 'a3',
    author: 'Chuyên gia Minh Anh',
    readTime: '5 phút đọc',
    image:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Young%20woman%20meal%20prepping%20plant%20based%20lunch%20boxes%20with%20colorful%20veggies%20at%20home%20kitchen&image_size=landscape_16_9',
    title: 'Hướng dẫn xây dựng thực đơn 7 ngày chuyển dần sang ăn chay',
    excerpt:
      'Bắt đầu không ăn thịt 1 ngày một tuần, sau đó tăng dần và kết hợp thêm các bữa ăn yến mạch, rau xanh, các loại đậu. Chuyển đổi từ từ giúp cơ thể thích nghi tốt hơn và giảm tối đa cảm giác thèm...',
  },
];

const FEATURED_VIDEOS = [
  {
    id: 'v1',
    duration: '08:45',
    image:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vegan%20broccoli%20tofu%20stir%20fry%20cooking%20in%20wok%2C%20steam%2C%20asian%20kitchen&image_size=landscape_16_9',
    title: 'Bí quyết làm sốt xào nấm đậu rau củ thơm ngon (chuẩn xí)',
    chef: 'Mẹo Dễ Ăn Tốt',
  },
  {
    id: 'v2',
    duration: '10:12',
    image:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Pouring%20golden%20vegan%20pumpkin%20soup%20in%20bowl%2C%20cozy%20kitchen%2C%20autumn&image_size=landscape_16_9',
    title: 'Nấu nước dùng rau củ ngọt thanh không cần mì chính',
    chef: 'Bếp nhà Thu Khoa',
  },
  {
    id: 'v3',
    duration: '06:30',
    image:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Three%20fresh%20green%20smoothies%20with%20spinach%2C%20apple%2C%20kiwi%2C%20banana%2C%20morning%20breakfast&image_size=landscape_16_9',
    title: '3 món sinh tố xanh giàu năng lượng cho buổi sáng bận rộn',
    chef: 'Sống xanh Đơn giản',
  },
];

const RESTAURANTS = [
  {
    id: 'rest1',
    image:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Cozy%20wooden%20interior%20of%20a%20vegan%20vegetarian%20restaurant%20with%20plants%2C%20Vietnam&image_size=landscape_4_3',
    name: 'Nhà hàng Chay An Lạc',
    address: '43 Nguyễn Đình Chính, Quận 3, TP.HCM',
    tags: ['Món mặn chay', 'Món gia truyền'],
    distance: '1.2 km',
  },
  {
    id: 'rest2',
    image:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Minimalist%20modern%20vegetarian%20deli%20counter%20with%20fresh%20salads%2C%20sandwiches%2C%20bright%20lighting&image_size=landscape_4_3',
    name: 'Tiệm Chay Mộc Nhiên',
    address: '45 Trần Hưng Đạo, Quận 1, TP.HCM',
    tags: ['Lẩu nấm chay', 'Cơm hộp đường'],
    distance: '3.0 km',
  },
];

const AI_SUGGESTIONS = [
  'Thực đơn 7 ngày giảm cân, nấu nhanh dưới 30 phút',
  'Bữa ăn nhiều chất sắt cho người thiếu máu',
];

const CHAT_MESSAGES = [
  {
    role: 'user',
    text: 'Bữa sáng đơn giản, 10 phút nấu ăn nhanh rất đầy đủ',
  },
  {
    role: 'assistant',
    text:
      '✨ Gợi ý cho bạn:\n\n• Smoothie Protein: Chuối + sữa đậu nành + hạt điều + rau chân vịt (xay nhuyễn, ~23g Protein)\n• Cháo bí đỏ yến mạch nha đam (~31g Protein)\n• Bánh mì chà bông + thịt kho tàu (30g Protein, Buddha Bowl)\n\nThời gian nấu trung bình 8 phút, đảm bảo đủ no đến trưa. Thêm 1 quả trứng cút nếu bạn ăn Ovo-Lacto nhé! 💪',
  },
];

export default function HomePage({ onNavigate, isLoggedIn: _isLoggedIn = false }: HomePageProps) {
  const [searchTab, setSearchTab] = useState<typeof SEARCH_TABS[number]>('Món chính');
  const [chatInput, setChatInput] = useState('');

  return (
    <div className="home-page">
      {/* ============ HERO ============ */}
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-left">
            <span className="home-hero-eyebrow">
              <Leaf size={14} />
              Dinh dưỡng thuần thực vật mỗi ngày - Trợ lý AI cùng hành
            </span>
            <h1 className="home-hero-title">
              Ăn chay lành mạnh, đơn
              <br />
              giản hơn mỗi ngày
            </h1>
            <p className="home-hero-subtitle">
              Khám phá công thức, tìm cửa hàng hữu cơ, tìm nhà hàng gần bạn và nhận hỗ trợ dinh dưỡng từ AI.
            </p>
            <div className="home-hero-ctas">
              <button
                type="button"
                className="btn btn-primary btn-primary-filled"
                onClick={() => onNavigate?.('/recipes')}
              >
                Khám phá cộng đồng
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => onNavigate?.('/ai-chat')}
              >
                <Sparkles size={16} />
                Trải nghiệm trải AI
              </button>
            </div>

            <div className="home-hero-stats">
              <div className="home-stat">
                <Users size={16} />
                <div>
                  <strong>1.200+</strong>
                  <span>Công thức</span>
                </div>
              </div>
              <div className="home-stat">
                <Star size={16} />
                <div>
                  <strong>đã 85%</strong>
                  <span>Người thích</span>
                </div>
              </div>
              <div className="home-stat">
                <BadgeCheck size={16} />
                <div>
                  <strong>100%</strong>
                  <span>Thuần thực vật</span>
                </div>
              </div>
            </div>
          </div>

          <div className="home-hero-right">
            <div className="hero-image-wrap">
              <img
                src="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vibrant%20colorful%20vegan%20Buddha%20bowl%20with%20chickpeas%2C%20roasted%20vegetables%2C%20quinoa%2C%20avocado%2C%20purple%20cabbage%2C%20top%20view%2C%20marble%20table&image_size=square_hd"
                alt="Món ăn chay dinh dưỡng"
                className="hero-image"
              />
              <div className="hero-image-card-badge top-right">
                <span className="badge-dot" />
                Nguyên liệu Món Anh
                <br />
                <small>buddhabowlexample.com</small>
              </div>
              <div className="hero-image-card-badge top-right-2">
                <div className="meal-plan-header">
                  <CircleUser size={14} />
                  <span>Cho hồ sơ Thuần chay</span>
                </div>
                <div className="meal-plan-row">
                  <span>Lunch 1000 kcal</span>
                  <span>Thứ 6, 18 tháng 10</span>
                </div>
                <button
                  type="button"
                  className="btn btn-mini"
                  onClick={() => onNavigate?.('/meal-plans')}
                >
                  🧭 Xem ngay
                </button>
              </div>
              <div className="hero-image-card-badge bottom-left">
                <Leaf size={12} />
                ăn 40 món Mới
              </div>
              <div className="hero-image-card-badge bottom-right">
                <strong>18.5 • 22.9</strong>
                <small>Gợi ý theo BMI: 19-24</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SEARCH BAR ============ */}
      <section className="home-search-wrap">
        <div className="home-search">
          <div className="home-search-input-wrap">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm công thức, bài viết, video..."
              className="home-search-input"
            />
            <button type="button" className="btn btn-search">
              Tìm kiếm
            </button>
          </div>
          <div className="home-search-tabs" role="tablist">
            {SEARCH_TABS.map(tab => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={searchTab === tab}
                className={`search-tab ${searchTab === tab ? 'search-tab-active' : ''}`}
                onClick={() => setSearchTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURED RECIPES ============ */}
      <section className="home-section recipes-section">
        <div className="home-section-head">
          <div>
            <h2 className="home-section-title">Công thức nổi bật</h2>
            <p className="home-section-desc">
              Được chuyên gia dinh dưỡng chọn lọc và đã được thử món trong các vụ tuần lễ.
            </p>
          </div>
          <button
            type="button"
            className="link-arrow"
            onClick={() => onNavigate?.('/recipes')}
          >
            Xem tất cả công thức
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="recipe-grid">
          {FEATURED_RECIPES.map(recipe => (
            <article key={recipe.id} className="recipe-card-home">
              <div className="recipe-meta-top">
                <span className="chip chip-ghost"><Clock size={12} /> {recipe.time}</span>
                <span className="chip chip-ghost"><ChefHat size={12} /> {recipe.level}</span>
                <span className="chip chip-ghost"><Flame size={12} /> {recipe.kcal}</span>
              </div>
              <div className="recipe-img-wrap">
                <img src={recipe.image} alt={recipe.name} className="recipe-img" />
              </div>
              <h3 className="recipe-name">{recipe.name}</h3>
              <p className="recipe-tags">
                {recipe.tags.slice(0, 3).map(t => (
                  <span key={t}>#{t}</span>
                ))}
              </p>
              <div className="recipe-card-actions">
                <button
                  type="button"
                  className="btn btn-outline-green"
                  onClick={() => onNavigate?.(`/recipes/${encodeURIComponent(recipe.id)}`)}
                >
                  Xem công thức
                </button>
                <button type="button" className="btn-icon" aria-label="Lưu">
                  <Bookmark size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ============ LATEST ARTICLES ============ */}
      <section className="home-section articles-section">
        <div className="home-section-head">
          <div>
            <h2 className="home-section-title">Bài viết mới nhất</h2>
            <p className="home-section-desc">
              Cẩm nang kiến thức khoa học và kinh nghiệm dinh dưỡng từ chuyên gia y tế.
            </p>
          </div>
          <button
            type="button"
            className="link-arrow"
            onClick={() => onNavigate?.('/articles')}
          >
            Xem tất cả bài viết
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="articles-grid">
          {LATEST_ARTICLES.map(article => (
            <article key={article.id} className="article-card-home">
              <img src={article.image} alt={article.title} className="article-img" />
              <div className="article-meta">
                <CircleUser size={14} />
                <span>{article.author}</span>
                <span className="dot">•</span>
                <span>{article.readTime}</span>
              </div>
              <h3 className="article-title">{article.title}</h3>
              <p className="article-excerpt">{article.excerpt}</p>
              <button
                type="button"
                className="link-readmore"
                onClick={() => onNavigate?.(`/articles/${encodeURIComponent(article.id)}`)}
              >
                Đọc thêm →
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* ============ FEATURED VIDEOS ============ */}
      <section className="home-section videos-section">
        <div className="home-section-head">
          <div>
            <h2 className="home-section-title">Video nấu ăn nổi bật</h2>
            <p className="home-section-desc">
              Hướng dẫn trực quan từng bước giúp bạn làm món chay ngon miệng tại nhà.
            </p>
          </div>
          <button
            type="button"
            className="link-arrow"
            onClick={() => onNavigate?.('/videos')}
          >
            Xem thêm video
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="videos-grid">
          {FEATURED_VIDEOS.map(video => (
            <article key={video.id} className="video-card-home">
              <div className="video-thumb-wrap">
                <img src={video.image} alt={video.title} className="video-thumb" />
                <span className="video-duration">{video.duration}</span>
                <button
                  type="button"
                  className="play-btn"
                  onClick={() => onNavigate?.(`/videos/${encodeURIComponent(video.id)}`)}
                  aria-label="Xem video"
                >
                  <Play size={20} fill="currentColor" />
                </button>
              </div>
              <h3 className="video-title">{video.title}</h3>
              <p className="video-chef">
                <ChefHat size={14} /> {video.chef}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ============ RESTAURANTS NEARBY ============ */}
      <section className="home-section restaurants-section">
        <div className="home-section-head">
          <div>
            <h2 className="home-section-title">Nhà hàng chay gần bạn</h2>
            <p className="home-section-desc">
              Địa điểm thưởng thức món chay chất lượng và an lành.
            </p>
          </div>
          <button
            type="button"
            className="link-arrow"
            onClick={() => onNavigate?.('/restaurants')}
          >
            <MapPin size={16} />
            Xem bản đồ
          </button>
        </div>

        <div className="restaurants-layout">
          <div className="restaurants-list-col">
            {RESTAURANTS.map(r => (
              <article key={r.id} className="restaurant-card-home">
                <img src={r.image} alt={r.name} className="restaurant-img" />
                <div className="restaurant-info">
                  <div className="restaurant-top-row">
                    <h3 className="restaurant-name">{r.name}</h3>
                    <span className="distance-chip">{r.distance}</span>
                  </div>
                  <p className="restaurant-addr">
                    <MapPin size={12} /> {r.address}
                  </p>
                  <div className="restaurant-tags">
                    {r.tags.map(t => (
                      <span key={t} className="pill">{t}</span>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-green btn-sm"
                    onClick={() => onNavigate?.(`/restaurants/${encodeURIComponent(r.id)}`)}
                  >
                    Xem chi tiết
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="restaurant-map-col">
            <div className="restaurant-map">
              <img
                src="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Minimal%20clean%20street%20map%20illustration%20with%20green%20location%20pins%20marking%20vegetarian%20restaurants%2C%20flat%20design%2C%20light%20green%20theme&image_size=landscape_4_3"
                alt="Bản đồ nhà hàng"
                className="map-img"
              />
              <div className="map-popup">
                <div className="map-popup-title">🍲 Quán Mộc Nhiên</div>
                <div className="map-popup-sub">⭐ 4.7 • 1.2 km • Quận 3, HCM</div>
                <button
                  type="button"
                  className="btn btn-primary-filled btn-xs"
                  onClick={() => onNavigate?.(`/restaurants/${encodeURIComponent('rest2')}`)}
                >
                  Xem chi tiết
                </button>
              </div>
              <div className="map-actions">
                <span className="map-tab active">Bản đồ</span>
                <span className="map-tab">Vệ tinh</span>
                <button type="button" className="btn-icon map-fullscreen" aria-label="fullscreen">
                  <Navigation size={14} />
                </button>
              </div>
            </div>
            <p className="map-hint">
              💡 Tìm thấy 16 quán chay quanh bạn.
              <button
                type="button"
                className="link-inline"
                onClick={() => onNavigate?.('/restaurants')}
              >
                Hiển thị danh sách đầy đủ
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* ============ AI ASK PANEL ============ */}
      <section className="home-section ai-section">
        <div className="ai-panel-left">
          <span className="ai-eyebrow">
            <Sparkles size={14} />
            AI Nutrition Assistant 2.0
          </span>
          <h2 className="home-section-title">Hỏi trợ lý dinh dưỡng AI</h2>
          <p className="home-section-desc">
            Nhận gợi ý thực đơn, nguyên liệu thay thế (B12, chất sắt và bổ sung calo) trong tích tắc chỉ trong tích tắc.
          </p>
          <div className="ai-suggestions">
            {AI_SUGGESTIONS.map(s => (
              <button key={s} type="button" className="suggestion-chip">
                <BookOpen size={14} /> {s}
              </button>
            ))}
            <button type="button" className="suggestion-chip">
              💡 Thêm 1 món mới vào thực đơn 7 ngày
            </button>
          </div>
          <button
            type="button"
            className="btn btn-primary-filled"
            onClick={() => onNavigate?.('/ai-chat')}
          >
            Mở bác sĩ trò chuyện
          </button>
        </div>

        <div className="ai-panel-right">
          <div className="ai-chat-top">
            <span className="ai-badge-avatar">
              <Sparkles size={12} />
            </span>
            <div>
              <strong>Trợ lý Vegetarian AI</strong>
              <span className="online-dot" />
            </div>
            <span className="ai-right-dot">Mới cập nhật</span>
          </div>

          <div className="ai-question">
            Bạn đang nấu cho mình hay cả nhà? Bao nhiêu khẩu phần?
          </div>

          <div className="ai-bubble user-bubble">
            <strong>🧑</strong>
            <p>{CHAT_MESSAGES[0].text}</p>
          </div>

          <div className="ai-bubble assistant-bubble">
            <strong>🌿</strong>
            <p>
              {CHAT_MESSAGES[1].text.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i < CHAT_MESSAGES[1].text.split('\n').length - 1 && <br />}
                </span>
              ))}
            </p>
          </div>

          <div className="ai-chat-input-wrap">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Hỏi thêm về cơ chế nấu, chế độ..."
              className="ai-chat-input"
            />
            <button
              type="button"
              className="btn ai-send-btn"
              onClick={() => {
                setChatInput('');
                onNavigate?.('/ai-chat');
              }}
              aria-label="Gửi câu hỏi"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
