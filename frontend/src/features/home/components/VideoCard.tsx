import type { HomeVideoSummary } from '../types/home.types';
import './VideoCard.css';

interface VideoCardProps {
  video: HomeVideoSummary;
  onSelect?: (id: string) => void;
}

export default function VideoCard({ video, onSelect }: VideoCardProps) {
  return (
    <article
      className="home-video-card"
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(video.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(video.id);
        }
      }}
      aria-label={`Xem video ${video.title}`}
    >
      <div className="home-video-thumb-wrap">
        <img src={video.thumbnailUrl} alt={video.title} className="home-video-thumb" loading="lazy" />
        <button type="button" className="home-video-play" aria-label="Phát video">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        <span className="home-video-duration">{video.duration}</span>
      </div>
      <div className="home-video-body">
        <h3 className="home-video-title">{video.title}</h3>
        <p className="home-video-channel">{video.channelName}</p>
      </div>
    </article>
  );
}