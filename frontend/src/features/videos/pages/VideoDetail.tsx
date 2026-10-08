interface VideoDetailPageProps {
  videoId: string;
  onNavigate?: (path: string) => void;
}

export default function VideoDetailPage({ videoId, onNavigate }: VideoDetailPageProps) {
  return (
    <div className="video-detail-page">
      <div className="video-detail-container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <ol className="breadcrumbs-list">
            <li className="breadcrumbs-item">
              <a href="#/" onClick={(e) => { e.preventDefault(); onNavigate?.('/'); }}>Trang chủ</a>
            </li>
            <li className="breadcrumbs-separator">/</li>
            <li className="breadcrumbs-item">
              <a href="#/videos" onClick={(e) => { e.preventDefault(); onNavigate?.('/videos'); }}>Video</a>
            </li>
            <li className="breadcrumbs-separator">/</li>
            <li className="breadcrumbs-item breadcrumbs-current">Chi tiết video</li>
          </ol>
        </nav>

        <div className="video-player-placeholder">
          <div className="video-player-inner">
            <div className="video-player-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="#2f7a45">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <p>Video đang được cập nhật...</p>
          </div>
        </div>

        <div className="video-info">
          <h1 className="video-title">Video {videoId}</h1>
          <p className="video-channel">Kênh: Đang cập nhật</p>
        </div>
      </div>
    </div>
  );
}