import type { HomeRestaurantSummary } from '../types/home.types';
import './RestaurantCard.css';

interface RestaurantCardProps {
  restaurant: HomeRestaurantSummary;
  onSelect?: (id: string) => void;
}

export default function RestaurantCard({ restaurant, onSelect }: RestaurantCardProps) {
  return (
    <article className="home-restaurant-card" aria-label={`Nhà hàng ${restaurant.name}`}>
      <div className="home-restaurant-image-wrap">
        <img src={restaurant.imageUrl} alt={restaurant.name} className="home-restaurant-image" loading="lazy" />
        <span className="home-restaurant-rating" aria-label={`Đánh giá ${restaurant.rating} trên 5`}>
          ★ {restaurant.rating.toFixed(1)}
        </span>
      </div>
      <div className="home-restaurant-body">
        <h3 className="home-restaurant-name">{restaurant.name}</h3>
        <p className="home-restaurant-address">{restaurant.address}</p>
        <div className="home-restaurant-meta">
          <span className="home-restaurant-distance">{restaurant.distanceKm}km</span>
          <div className="home-restaurant-tags">
            {restaurant.cuisineTags.map((tag) => (
              <span key={tag} className="home-restaurant-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary home-restaurant-btn"
          onClick={() => onSelect?.(restaurant.id)}
        >
          Xem chi tiết
        </button>
      </div>
    </article>
  );
}