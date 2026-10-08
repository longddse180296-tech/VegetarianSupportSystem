import { useState, useEffect, useRef } from 'react';
import type { HomeVideoSummary } from '../api/videos.api';
import VideoCard from '../components/VideoCard';
import SkeletonLoader from '../../../shared/components/SkeletonLoader';
import AlertError from '../../../shared/components/AlertError';
import EmptyState from '../../../shared/components/EmptyState';
import './VideoList.css';

interface VideoListPageProps {
  onNavigate?: (path: string) => void;
}

export default function VideoListPage({ onNavigate }: VideoListPageProps) {
  const [videos, setVideos] = useState<HomeVideoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    const request = ++requestRef.current;

    void (async () => {
      try {
        const data = await import('../api/videos.api').then(m => m.fetchVideos());
        if (request !== requestRef.current) return;
        setVideos(data);
        setLoading(false);
      } catch (err) {
        if (request !== requestRef.current) return;
        setError(err instanceof Error ? err.message : 'Lỗi không xác định');
        setLoading(false);
      }
    })();
  }, []);

  const handleRetry = () => {
    requestRef.current += 1;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const data = await import('../api/videos.api').then(m => m.fetchVideos());
        setVideos(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi không xác định');
        setLoading(false);
      }
    })();
  };

  return (
    <div className="video-list-page">
      <header className="video-list-hero">
        <div className="hero-inner">
          <span className="hero-eyebrow">🎬 Video nấu ăn chay</span>
          <h1 className="hero-title">Video hướng dẫn nấu ăn chay</h1>
          <p className="hero-subtitle">
            Hướng dẫn trực quan từng bước, dễ thực hiện tại nhà với các chuyên gia ẩm thực.
          </p>
        </div>
      </header>

      <main className="video-list-main">
        {loading && <SkeletonLoader count={6} />}

        {error && (
          <AlertError
            title="Không thể tải danh sách video"
            message={error}
            onRetry={handleRetry}
          />
        )}

        {!loading && !error && videos.length === 0 && (
          <EmptyState
            title="Chưa có video nào"
            description="Video mới sẽ được cập nhật sớm nhất."
            onReset={handleRetry}
          />
        )}

        {!loading && !error && videos.length > 0 && (
          <div className="video-grid">
            {videos.map(video => (
              <VideoCard
                key={video.id}
                video={video}
                onSelect={(id) => onNavigate?.(`/videos/${encodeURIComponent(id)}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}