import type { HomeRecipeSummary } from '../types/home.types';
import './RecipeMiniCard.css';

interface RecipeMiniCardProps {
  recipe: HomeRecipeSummary;
  onSelect?: (id: string) => void;
}

export default function RecipeMiniCard({ recipe, onSelect }: RecipeMiniCardProps) {
  return (
    <article
      className="home-recipe-mini"
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(recipe.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(recipe.id);
        }
      }}
      aria-label={`Xem công thức ${recipe.name}`}
    >
      <div className="home-recipe-mini-image-wrap">
        <img src={recipe.imageUrl} alt={recipe.name} className="home-recipe-mini-image" loading="lazy" />
        <span className="home-recipe-mini-tag">{recipe.category}</span>
      </div>
      <div className="home-recipe-mini-body">
        <h3 className="home-recipe-mini-name">{recipe.name}</h3>
        <div className="home-recipe-mini-meta">
          <span className="home-recipe-mini-meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {recipe.cookTimeMinutes} phút
          </span>
          <span className="home-recipe-mini-meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2c1.5 3 3 4.5 3 7a3 3 0 1 1-6 0c0-1 .5-2 1-2.5M12 14c2.5 1 4 3 4 6a8 8 0 0 1-16 0c0-2 1-4 4-5.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {recipe.caloriesPerServing} kcal
          </span>
        </div>
        <div className="home-recipe-mini-suitability" aria-label={`Tỷ lệ phù hợp ${recipe.suitabilityScore} phần trăm`}>
          <span className="home-recipe-mini-suitability-label">Phù hợp</span>
          <div className="home-recipe-mini-suitability-bar">
            <div className="home-recipe-mini-suitability-fill" style={{ width: `${recipe.suitabilityScore}%` }} />
          </div>
          <span className="home-recipe-mini-suitability-value">{recipe.suitabilityScore}%</span>
        </div>
      </div>
    </article>
  );
}