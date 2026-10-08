import { useState } from 'react';
import type { RecipeSummary } from '../../recipes/types/recipes.types';
import './PantryPage.css';

type PantryRecipeSummary = Pick<
  RecipeSummary,
  'id' | 'name' | 'category' | 'imageUrl' | 'cookTimeMinutes' | 'caloriesPerServing' | 'suitabilityScore'
>;

interface PantryPageProps {
  onNavigate?: (path: string) => void;
}

const SUGGESTED_INGREDIENTS = [
  'Đậu hũ', 'Nấm', 'Cà rốt', 'Bông cải xanh', 'Đậu gà', 'Gạo lứt',
  'Khoai lang', 'Cà chua', 'Hành tây', 'Tỏi', 'Nước tương', 'Dầu ăn',
];

export default function PantryPage({ onNavigate }: PantryPageProps) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestedRecipes, setSuggestedRecipes] = useState<PantryRecipeSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleInputChange = (value: string) => {
    setInput(value);
    if (value.trim()) {
      const filtered = SUGGESTED_INGREDIENTS.filter(
        i => i.toLowerCase().includes(value.toLowerCase()) && !ingredients.includes(i)
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const addIngredient = (item: string) => {
    if (!ingredients.includes(item)) {
      setIngredients([...ingredients, item]);
    }
    setInput('');
    setSuggestions([]);
  };

  const removeIngredient = (item: string) => {
    setIngredients(ingredients.filter(i => i !== item));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      addIngredient(input.trim());
    }
  };

  const handleSearch = async () => {
    if (ingredients.length === 0) return;
    setIsSearching(true);
    // Simulate AI recipe suggestions
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSuggestedRecipes([
      {
        id: 'r1', name: 'Đậu hũ sốt nấm', category: 'Món chính',
        imageUrl: 'https://coresg-normal.troe.ai/api/ide/v1/text_to_image?prompt=Tofu%20with%20mushroom%20sauce%20Vietnamese&image_size=square_hd',
        cookTimeMinutes: 25, caloriesPerServing: 320, suitabilityScore: 95,
      },
      {
        id: 'r2', name: 'Salad bơ đậu gà', category: 'Salad',
        imageUrl: 'https://coresg-normal.troe.ai/api/ide/v1/text_to_image?prompt=Avocado%20chickpea%20salad%20fresh%20green&image_size=square_hd',
        cookTimeMinutes: 15, caloriesPerServing: 290, suitabilityScore: 92,
      },
      {
        id: 'r3', name: 'Cơm gạo lứt rau củ', category: 'Món chính',
        imageUrl: 'https://coresg-normal.troe.ai/api/ide/v1/text_to_image?prompt=Brown%20rice%20with%20roasted%20vegetables&image_size=square_hd',
        cookTimeMinutes: 35, caloriesPerServing: 380, suitabilityScore: 90,
      },
    ]);
    setIsSearching(false);
  };

  const handleClearAll = () => {
    setIngredients([]);
    setSuggestedRecipes([]);
  };

  return (
    <div className="pantry-page">
      <header className="pantry-hero">
        <div className="hero-inner">
          <span className="hero-eyebrow">🍳 Tủ bếp của bạn</span>
          <h1 className="hero-title">Gợi ý Món Chay Từ Tủ Bếp</h1>
          <p className="hero-subtitle">
            Nhập nguyên liệu bạn có sẵn, AI sẽ gợi ý những món ăn phù hợp để chế biến ngay.
          </p>
        </div>
      </header>

      <main className="pantry-main">
        <div className="pantry-input-section">
          <div className="pantry-input-wrap">
            <div className="pantry-input-field">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="pantry-input-icon">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#6b8471" strokeWidth="2" strokeLinecap="round"/>
                <polyline points="17 8 12 3 7 8" stroke="#6b8471" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="3" x2="12" y2="15" stroke="#6b8471" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                className="pantry-input"
                placeholder="Nhập nguyên liệu (VD: đậu hũ, nấm, cà rốt...)"
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="Nhập nguyên liệu"
              />
            </div>

            {suggestions.length > 0 && (
              <ul className="pantry-suggestions" role="listbox">
                {suggestions.map(item => (
                  <li key={item}>
                    <button
                      type="button"
                      className="pantry-suggestion-item"
                      onClick={() => addIngredient(item)}
                      role="option"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pantry-ingredients-list">
            {ingredients.map(item => (
              <span key={item} className="pantry-ingredient-tag">
                {item}
                <button
                  type="button"
                  className="pantry-ingredient-remove"
                  onClick={() => removeIngredient(item)}
                  aria-label={`Xóa ${item}`}
                >
                  ×
                </button>
              </span>
            ))}
            {ingredients.length > 0 && (
              <button type="button" className="pantry-clear-btn" onClick={handleClearAll}>
                Xóa tất cả
              </button>
            )}
          </div>

          {ingredients.length > 0 && (
            <div className="pantry-actions">
              <button
                type="button"
                className="btn btn-primary pantry-search-btn"
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? 'Đang tìm...' : 'Tìm công thức phù hợp'}
              </button>
            </div>
          )}
        </div>

        {suggestedRecipes.length > 0 && (
          <div className="pantry-results">
            <h2 className="pantry-results-title">
              Công thức gợi ý cho bạn
            </h2>
            <div className="pantry-recipes-grid">
              {suggestedRecipes.map(recipe => (
                <article
                  key={recipe.id}
                  className="pantry-recipe-card"
                  onClick={() => onNavigate?.(`/recipes/${encodeURIComponent(recipe.id)}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onNavigate?.(`/recipes/${encodeURIComponent(recipe.id)}`);
                  }}
                >
                  <div className="pantry-recipe-image-wrap">
                    <img src={recipe.imageUrl} alt={recipe.name} className="pantry-recipe-image" loading="lazy" />
                    <span className="pantry-recipe-time">{recipe.cookTimeMinutes} phút</span>
                  </div>
                  <div className="pantry-recipe-body">
                    <h3 className="pantry-recipe-name">{recipe.name}</h3>
                    <p className="pantry-recipe-meta">{recipe.caloriesPerServing} kcal • {recipe.category}</p>
                    <div className="pantry-recipe-score">
                      <span>Phù hợp: {recipe.suitabilityScore}%</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {ingredients.length === 0 && (
          <div className="pantry-empty">
            <div className="pantry-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="#b9d9c1" strokeWidth="2"/>
                <polyline points="9 22 9 12 15 12 15 22" stroke="#b9d9c1" strokeWidth="2"/>
              </svg>
            </div>
            <p className="pantry-empty-text">Thêm nguyên liệu để nhận gợi ý món ăn</p>
            <div className="pantry-quick-add">
              {SUGGESTED_INGREDIENTS.slice(0, 6).map(item => (
                <button
                  key={item}
                  type="button"
                  className="pantry-quick-btn"
                  onClick={() => addIngredient(item)}
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}