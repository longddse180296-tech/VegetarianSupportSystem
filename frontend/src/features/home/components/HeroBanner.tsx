import type { HeroHighlight } from '../types/home.types';
import './HeroBanner.css';

interface HeroBannerProps {
  hero: HeroHighlight;
  onExplore?: () => void;
  onOpenAi?: () => void;
}

export default function HeroBanner({ hero, onExplore, onOpenAi }: HeroBannerProps) {
  return (
    <section className="home-hero" aria-label="Giới thiệu nổi bật">
      <div className="home-hero-grid">
        <div className="home-hero-text">
          <span className="home-hero-eyebrow" aria-hidden="true">
            <span className="dot" />
            Ưu tiên cá nhân hoá dinh dưỡng cho bạn
          </span>
          <h1 className="home-hero-title">{hero.title}</h1>
          <p className="home-hero-desc">{hero.description}</p>
          <ul className="home-hero-badges" aria-label="Đặc điểm nổi bật">
            {hero.badges.map((badge) => (
              <li key={badge} className="home-hero-badge">
                {badge}
              </li>
            ))}
          </ul>
          <div className="home-hero-actions">
            <button type="button" className="btn btn-primary home-hero-btn" onClick={onExplore}>
              Khám phá công thức
            </button>
            <button type="button" className="btn btn-outline home-hero-btn" onClick={onOpenAi}>
              Tư vấn ngay với AI
            </button>
          </div>
          <div className="home-hero-stat" aria-label="Mức độ phù hợp">
            <span className="home-hero-stat-label">Mức độ phù hợp</span>
            <div className="home-hero-stat-bar" role="progressbar" aria-valuenow={hero.matchScore} aria-valuemin={0} aria-valuemax={100}>
              <div className="home-hero-stat-fill" style={{ width: `${hero.matchScore}%` }} />
            </div>
            <span className="home-hero-stat-value">{hero.matchScore}/100</span>
          </div>
        </div>
        <div className="home-hero-image-wrap" aria-hidden="true">
          <img src={hero.imageUrl} alt="" className="home-hero-image" loading="eager" />
          <span className="home-hero-floating-card home-hero-floating-card--top">
            <span className="dot dot--green" />
            500+ công thức chuẩn BMI
          </span>
          <span className="home-hero-floating-card home-hero-floating-card--bottom">
            <span className="dot dot--orange" />
            AI cá nhân hoá thực đơn
          </span>
        </div>
      </div>
    </section>
  );
}