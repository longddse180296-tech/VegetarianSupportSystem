import type { HomeArticleSummary } from '../types/home.types';
import './ArticleCard.css';

interface ArticleCardProps {
  article: HomeArticleSummary;
  onSelect?: (id: string) => void;
}

export default function ArticleCard({ article, onSelect }: ArticleCardProps) {
  return (
    <article
      className="home-article-card"
      role="link"
      tabIndex={0}
      onClick={() => onSelect?.(article.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(article.id);
        }
      }}
      aria-label={`Đọc bài viết ${article.title}`}
    >
      <div className="home-article-image-wrap">
        <img src={article.imageUrl} alt={article.title} className="home-article-image" loading="lazy" />
        <span className="home-article-tag">{article.topicTag}</span>
      </div>
      <div className="home-article-body">
        <h3 className="home-article-title">{article.title}</h3>
        <p className="home-article-excerpt">{article.excerpt}</p>
        <div className="home-article-meta">
          <span className="home-article-read">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {article.readMinutes} phút đọc
          </span>
          <span className="home-article-more">Xem thêm →</span>
        </div>
      </div>
    </article>
  );
}