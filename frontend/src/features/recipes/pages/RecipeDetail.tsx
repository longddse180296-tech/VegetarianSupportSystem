import { useCallback, useEffect, useRef, useState } from 'react';
import type { RecipeDetail as RecipeDetailType } from '../types/recipes.types';
import SkeletonLoader from '../../../shared/components/SkeletonLoader';
import EmptyState from '../../../shared/components/EmptyState';
import AlertError from '../../../shared/components/AlertError';
import { fetchRecipeDetail } from '../api/recipes.api';
import './RecipeDetail.css';

type RequestStatus = 'loading' | 'success' | 'error';

interface RecipeDetailState {
  data: RecipeDetailType | null;
  status: RequestStatus;
  errorMessage?: string;
}

const INITIAL_STATE: RecipeDetailState = {
  data: null,
  status: 'loading',
};

const DEFAULT_RECIPE_ID = 'r1';

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-cell">
      <div className="info-cell-label">{label}</div>
      <div className="info-cell-value">{value}</div>
    </div>
  );
}

export default function RecipeDetailPage() {
  const [state, setState] = useState<RecipeDetailState>(INITIAL_STATE);
  const cancelledRef = useRef(false);

  const load = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, status: 'loading', errorMessage: undefined }));
    try {
      const data = await fetchRecipeDetail(id);
      if (cancelledRef.current) return;
      setState({ data, status: 'success' });
    } catch (err) {
      if (cancelledRef.current) return;
      setState({
        data: null,
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'Không xác định',
      });
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    Promise.resolve().then(() => {
      if (!cancelledRef.current) void load(DEFAULT_RECIPE_ID);
    });
    return () => {
      cancelledRef.current = true;
    };
  }, [load]);

  const handleRetry = () => load(DEFAULT_RECIPE_ID);

  const isLoading = state.status === 'loading';
  const isError = state.status === 'error';
  const hasData = state.status === 'success' && state.data != null;

  return (
    <div className="recipe-detail-page">
      <div className="recipe-detail-container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <ol className="breadcrumbs-list">
            <li className="breadcrumbs-item">
              <a href="#home">Trang chủ</a>
            </li>
            <li className="breadcrumbs-separator" aria-hidden="true">/</li>
            <li className="breadcrumbs-item">
              <a href="#recipes">Công thức</a>
            </li>
            <li className="breadcrumbs-separator" aria-hidden="true">/</li>
            <li className="breadcrumbs-item breadcrumbs-current" aria-current="page">
              {hasData ? state.data?.name : 'Đậu hũ sốt nấm'}
            </li>
          </ol>
        </nav>

        {isLoading && (
          <div className="recipe-detail-loading">
            <SkeletonLoader count={6} />
          </div>
        )}

        {isError && (
          <AlertError
            title="Không thể tải chi tiết công thức"
            message={
              state.errorMessage
                ? `Chi tiết: ${state.errorMessage}. Vui lòng thử lại sau.`
                : 'Kiểm tra lại đường truyền hoặc thử lại sau ít phút.'
            }
            onRetry={handleRetry}
          />
        )}

        {!isLoading && !isError && !hasData && (
          <EmptyState
            title="Công thức không tồn tại"
            description="Công thức bạn đang tìm kiếm có thể đã bị gỡ hoặc chưa được cập nhật. Vui lòng thử lại sau hoặc xem các công thức khác."
          />
        )}

        {hasData && state.data && (
          <>
            <section className="recipe-hero" aria-label="Thông tin tổng quan công thức">
              <div className="recipe-hero-image-wrap">
                <img
                  src={state.data.imageUrl}
                  alt={state.data.name}
                  className="recipe-hero-image"
                />
              </div>
              <div className="recipe-hero-info">
                <span className="recipe-hero-category-tag">Món chính</span>
                <h1 className="recipe-hero-title">{state.data.name}</h1>
                <p className="recipe-hero-description">{state.data.description}</p>
                <div className="recipe-info-grid" role="grid">
                  <InfoCell label="Chuẩn bị" value={`${state.data.timing.prepMinutes} phút`} />
                  <InfoCell label="Thời gian nấu" value={`${state.data.timing.cookMinutes} phút`} />
                  <InfoCell label="Tổng thời gian" value={`${state.data.timing.totalMinutes} phút`} />
                  <InfoCell label="Khẩu phần" value={state.data.servings} />
                  <InfoCell label="Năng lượng" value={`${state.data.caloriesPerServing} kcal`} />
                  <InfoCell label="Độ khó" value={state.data.difficultyLabel} />
                </div>
              </div>
            </section>

            <section className="recipe-content-grid" aria-label="Nguyên liệu và cách thực hiện">
              <div className="panel ingredients-panel">
                <header className="panel-header">
                  <h2 className="panel-title">
                    <span className="panel-title-dot" aria-hidden="true" />
                    Nguyên liệu
                  </h2>
                </header>
                <ul className="ingredients-list">
                  {state.data.ingredients.map((ingredient) => (
                    <li key={ingredient.name} className="ingredients-row">
                      <span className="ingredients-name">{ingredient.name}</span>
                      <span className="ingredients-amount">{ingredient.amount}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="panel steps-panel">
                <header className="panel-header">
                  <h2 className="panel-title">
                    <span className="panel-title-dot" aria-hidden="true" />
                    Cách thực hiện
                  </h2>
                </header>
                <ol className="steps-list">
                  {state.data.steps.map((step) => (
                    <li key={step.order} className="steps-item">
                      <div className="steps-order" aria-hidden="true">
                        {step.order}
                      </div>
                      <div className="steps-body">
                        <div className="steps-title">{step.title}</div>
                        <p className="steps-description">{step.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            <section className="panel nutrition-panel" aria-label="Thông tin dinh dưỡng">
              <header className="panel-header">
                <h2 className="panel-title">
                  <span className="panel-title-dot" aria-hidden="true" />
                  Thống kê dinh dưỡng
                </h2>
              </header>
              <div className="nutrition-grid">
                <div className="nutrition-card">
                  <div className="nutrition-label">Năng lượng</div>
                  <div className="nutrition-value">{state.data.nutrition.caloriesKcal} kcal</div>
                </div>
                <div className="nutrition-card">
                  <div className="nutrition-label">Protein</div>
                  <div className="nutrition-value">{state.data.nutrition.proteinG}g</div>
                </div>
                <div className="nutrition-card">
                  <div className="nutrition-label">Carbohydrate</div>
                  <div className="nutrition-value">{state.data.nutrition.carbsG}g</div>
                </div>
                <div className="nutrition-card">
                  <div className="nutrition-label">Chất béo</div>
                  <div className="nutrition-value">{state.data.nutrition.fatG}g</div>
                </div>
              </div>
              <p className="nutrition-footnote">
                * Dưới đây là mức tham khảo tính trên 1 khẩu phần theo công thức chuẩn khoa học.
              </p>
            </section>

            <section className="related-section" aria-label="Bài viết liên quan">
              <header className="related-header">
                <h2 className="related-title">Bài viết liên quan</h2>
                <a href="#articles" className="related-more-link">
                  Xem thêm kho bài viết hữu ích
                  <span className="related-more-arrow" aria-hidden="true">→</span>
                </a>
              </header>
              <div className="related-articles-grid">
                {state.data.relatedArticles.map((article) => (
                  <article key={article.id} className="article-card">
                    <div className="article-card-image-wrap">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="article-card-image"
                        loading="lazy"
                      />
                    </div>
                    <div className="article-card-body">
                      <h3 className="article-card-title">{article.title}</h3>
                      <p className="article-card-excerpt">{article.excerpt}</p>
                      <a href="#article" className="article-card-link">
                        Xem thêm →
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="related-section" aria-label="Video liên quan">
              <header className="related-header">
                <h2 className="related-title">Video liên quan</h2>
                <a href="#videos" className="related-more-link">
                  Khám phá thêm video hướng dẫn nấu ăn
                  <span className="related-more-arrow" aria-hidden="true">→</span>
                </a>
              </header>
              <div className="related-videos-grid">
                {state.data.relatedVideos.map((video) => (
                  <article key={video.id} className="video-card">
                    <div className="video-card-thumb-wrap">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="video-card-thumb"
                        loading="lazy"
                      />
                      <button type="button" className="video-play-btn" aria-label="Xem video">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                      <span className="video-duration">{video.duration}</span>
                    </div>
                    <div className="video-card-body">
                      <h3 className="video-card-title">{video.title}</h3>
                      <a href="#video" className="video-card-channel">
                        {video.channelName}
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="related-section" aria-label="Nhà hàng có món tương tự">
              <header className="related-header">
                <h2 className="related-title">Nhà hàng có món tương tự</h2>
                <a href="#restaurants" className="related-more-link">
                  Tìm thêm nhà hàng chay gần bạn theo vị trí
                  <span className="related-more-arrow" aria-hidden="true">→</span>
                </a>
              </header>
              <div className="related-restaurants-grid">
                {state.data.relatedRestaurants.map((restaurant) => (
                  <article key={restaurant.id} className="restaurant-card">
                    <div className="restaurant-card-image-wrap">
                      <img
                        src={restaurant.imageUrl}
                        alt={restaurant.name}
                        className="restaurant-card-image"
                        loading="lazy"
                      />
                    </div>
                    <div className="restaurant-card-body">
                      <div className="restaurant-card-head">
                        <h3 className="restaurant-card-title">{restaurant.name}</h3>
                        <span className="restaurant-distance">{restaurant.distanceKm}km</span>
                      </div>
                      <p className="restaurant-card-address">{restaurant.address}</p>
                      <button type="button" className="btn btn-primary restaurant-card-btn">
                        Xem chi tiết
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
