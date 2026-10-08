import type { HomeVideoSummary } from '../api/videos.api';
import './VideoCard.css';

interface VideoCardProps {
  video: HomeVideoSummary;
  onSelect?: (id: string) => void;
}

export default function VideoCard({ video, onSelect }: VideoCardProps) {
  return (
    <article
      className="video-card"
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
      <div className="video-thumb-wrap">
        <img src={video.thumbnailUrl} alt={video.title} className="video-thumb" loading="lazy" />
        <button type="button" className="video-play-btn" aria-label="Phát video">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        <span className="video-duration">{video.duration}</span>
      </div>
      <div className="video-card-body">
        <h3 className="video-card-title">{video.title}</h3>
        <p className="video-card-channel">{video.channelName}</p>
      </div>
    </article>
  );
}