import { useEffect } from 'react';

interface MyVideosPageProps {
  onNavigate?: (path: string) => void;
}

export default function MyVideosPage({ onNavigate }: MyVideosPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="my-videos-page">
      <div className="my-videos-container">
        <h1>Video của tôi</h1>
        <p>Tính năng đang được phát triển.</p>
        <button type="button" className="btn btn-outline" onClick={() => onNavigate?.('/videos')}>
          Quay lại danh sách video
        </button>
      </div>
    </div>
  );
}