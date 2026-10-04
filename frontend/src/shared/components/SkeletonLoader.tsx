import './SkeletonLoader.css';

interface SkeletonLoaderProps {
  count?: number;
}

export default function SkeletonLoader({ count = 8 }: SkeletonLoaderProps) {
  return (
    <div className="recipe-grid" aria-busy="true" aria-label="Đang tải danh sách công thức">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton skeleton-image" />
          <div className="skeleton-body">
            <div className="skeleton skeleton-tag" />
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-line short" />
            <div className="skeleton skeleton-btn" />
          </div>
        </div>
      ))}
    </div>
  );
}
