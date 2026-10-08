import { useState, useEffect, useRef } from 'react';
import type { HomeRestaurantSummary } from '../api/restaurants.api';
import RestaurantCard from '../components/RestaurantCard';
import SkeletonLoader from '../../../shared/components/SkeletonLoader';
import AlertError from '../../../shared/components/AlertError';
import EmptyState from '../../../shared/components/EmptyState';
import './RestaurantList.css';

interface RestaurantListPageProps {
  onNavigate?: (path: string) => void;
}

export default function RestaurantListPage({ onNavigate }: RestaurantListPageProps) {
  const [restaurants, setRestaurants] = useState<HomeRestaurantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    const request = ++requestRef.current;

    void (async () => {
      try {
        const data = await import('../api/restaurants.api').then(m => m.fetchRestaurants());
        if (request !== requestRef.current) return;
        setRestaurants(data);
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
        const data = await import('../api/restaurants.api').then(m => m.fetchRestaurants());
        setRestaurants(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi không xác định');
        setLoading(false);
      }
    })();
  };

  return (
    <div className="restaurant-list-page">
      <header className="restaurant-list-hero">
        <div className="hero-inner">
          <span className="hero-eyebrow">🍽️ Nhà hàng chay</span>
          <h1 className="hero-title">Nhà hàng chay gần bạn</h1>
          <p className="hero-subtitle">
            Tìm kiếm và khám phá những quán chay uy tín gần vị trí của bạn.
          </p>
        </div>
      </header>

      <main className="restaurant-list-main">
        {loading && <SkeletonLoader count={4} />}

        {error && (
          <AlertError
            title="Không thể tải danh sách nhà hàng"
            message={error}
            onRetry={handleRetry}
          />
        )}

        {!loading && !error && restaurants.length === 0 && (
          <EmptyState
            title="Chưa có nhà hàng nào"
            description="Danh sách nhà hàng chay sẽ được cập nhật sớm nhất."
            onReset={handleRetry}
          />
        )}

        {!loading && !error && restaurants.length > 0 && (
          <div className="restaurant-grid">
            {restaurants.map(restaurant => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onSelect={(id) => onNavigate?.(`/restaurants/${encodeURIComponent(id)}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}