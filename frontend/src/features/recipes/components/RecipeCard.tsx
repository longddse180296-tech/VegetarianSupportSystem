import type { RecipeSummary } from '../types/recipes.types';
import './RecipeCard.css';

interface RecipeCardProps {
  recipe: RecipeSummary;
  onNavigate?: (path: string) => void;
}

export default function RecipeCard({ recipe, onNavigate }: RecipeCardProps) {
  const detailPath = `/recipes/${encodeURIComponent(recipe.id)}`;

  const handleViewClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(detailPath);
    }
  };
  return (
    <article className="recipe-card" aria-label={`Công thức ${recipe.name}`}>
      <div className="recipe-card-image-wrap">
        <img
          src={recipe.imageUrl}
          alt={recipe.name}
          className="recipe-card-image"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
          }}
        />
        <div className="recipe-card-badges">
          <span className="badge badge-time" title={`Thời gian nấu ${recipe.cookTimeMinutes} phút`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {recipe.cookTimeMinutes} phút
          </span>
          <span className="badge badge-calorie" title={`${recipe.caloriesPerServing} kcal / khẩu phần`}>
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
      </div>
      <div className="recipe-card-body">
        <span className="recipe-card-category">{recipe.category}</span>
        <h3 className="recipe-card-name" title={recipe.name}>
          {recipe.name}
        </h3>
        <div className="recipe-card-suitability" aria-label={`Độ phù hợp ${recipe.suitabilityScore} phần trăm`}>
          <div className="suitability-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2l2.9 6.3L22 9.3l-5 4.7 1.3 7L12 17.8 5.7 21l1.3-7L2 9.3l7.1-1L12 2z"
                fill="#e4c242"
                stroke="#c6a232"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
            <span>Độ phù hợp</span>
          </div>
          <div className="suitability-bar" role="progressbar" aria-valuenow={recipe.suitabilityScore} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="suitability-bar-fill"
              style={{ width: `${Math.min(100, Math.max(0, recipe.suitabilityScore))}%` }}
            />
          </div>
          <span className="suitability-value">{recipe.suitabilityScore}%</span>
        </div>
        <a href={`#${detailPath}`} className="recipe-card-btn" onClick={handleViewClick}>
          Xem công thức
        </a>
      </div>
    </article>
  );
}
