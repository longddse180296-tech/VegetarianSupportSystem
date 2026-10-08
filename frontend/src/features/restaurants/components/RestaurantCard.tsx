import type { HomeRestaurantSummary } from '../api/restaurants.api';
import './RestaurantCard.css';

interface RestaurantCardProps {
  restaurant: HomeRestaurantSummary;
  onSelect?: (id: string) => void;
}

export default function RestaurantCard({ restaurant, onSelect }: RestaurantCardProps) {
  return (
    <article
      className="restaurant-card"
      role="article"
      aria-label={`Nhà hàng ${restaurant.name}`}
    >
      <div className="restaurant-card-image-wrap">
        <img
          src={restaurant.imageUrl}
          alt={restaurant.name}
          className="restaurant-card-image"
          loading="lazy"
        />
        <span className="restaurant-card-rating">
          ★ {restaurant.rating.toFixed(1)}
        </span>
        <span className="restaurant-card-distance">{restaurant.distanceKm}km</span>
      </div>
      <div className="restaurant-card-body">
        <h3 className="restaurant-card-name">{restaurant.name}</h3>
        <p className="restaurant-card-address">{restaurant.address}</p>
        <div className="restaurant-card-tags">
          {restaurant.cuisineTags.map(tag => (
            <span key={tag} className="restaurant-tag">{tag}</span>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary restaurant-card-btn"
          onClick={() => onSelect?.(restaurant.id)}
        >
          Xem chi tiết
        </button>
      </div>
    </article>
  );
}