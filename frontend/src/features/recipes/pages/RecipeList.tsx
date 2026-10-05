import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  RecipeFilterValues,
} from '../types/recipes.types';
import { DEFAULT_FILTER_VALUES } from '../types/recipes.types';
import RecipeFilter from '../components/RecipeFilter';
import RecipeCard from '../components/RecipeCard';
import SkeletonLoader from '../../../shared/components/SkeletonLoader';
import EmptyState from '../../../shared/components/EmptyState';
import AlertError from '../../../shared/components/AlertError';
import { fetchRecipes } from '../api/recipes.api';
import type { RecipeSummary } from '../types/recipes.types';
import './RecipeList.css';

type RequestStatus = 'loading' | 'success' | 'error';

interface RecipeListState {
  items: RecipeSummary[];
  totalItems: number;
  status: RequestStatus;
  errorMessage?: string;
}

const INITIAL_STATE: RecipeListState = {
  items: [],
  totalItems: 0,
  status: 'loading',
};

interface RecipeListPageProps {
  onNavigate?: (path: string) => void;
}

export default function RecipeList({ onNavigate }: RecipeListPageProps) {
  const [filters, setFilters] = useState<RecipeFilterValues>(DEFAULT_FILTER_VALUES);
  const [state, setState] = useState<RecipeListState>(INITIAL_STATE);
  const cancelledRef = useRef(false);

  const loadRecipes = useCallback(async (values: RecipeFilterValues) => {
    setState((prev) => ({ ...prev, status: 'loading', errorMessage: undefined }));
    try {
      const params = {
        search: values.search.trim() || undefined,
        category: values.category === 'all' ? undefined : values.category,
        diet: values.diet === 'all' ? undefined : values.diet,
        timeRangeKey: values.timeRangeKey === 'all' ? undefined : values.timeRangeKey,
        calorieRangeKey: values.calorieRangeKey === 'all' ? undefined : values.calorieRangeKey,
        page: 1,
        pageSize: 24,
      };
      const data = await fetchRecipes(params);
      if (cancelledRef.current) return;
      setState({
        items: data.items,
        totalItems: data.pagination.totalItems,
        status: 'success',
      });
    } catch (err) {
      if (cancelledRef.current) return;
      setState((prev) => ({
        ...prev,
        items: [],
        totalItems: 0,
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'Không xác định',
      }));
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    Promise.resolve().then(() => {
      if (!cancelledRef.current) void loadRecipes(DEFAULT_FILTER_VALUES);
    });
    return () => {
      cancelledRef.current = true;
    };
  }, [loadRecipes]);

  const handleFilterChange = (next: RecipeFilterValues) => {
    setFilters(next);
  };

  const handleFilterSubmit = () => {
    loadRecipes(filters);
  };

  const handleFilterReset = () => {
    setFilters(DEFAULT_FILTER_VALUES);
    loadRecipes(DEFAULT_FILTER_VALUES);
  };

  const handleRetry = () => {
    loadRecipes(filters);
  };

  const hasActiveFilter =
    filters.search.trim() !== '' ||
    filters.category !== 'all' ||
    filters.diet !== 'all' ||
    filters.timeRangeKey !== 'all' ||
    filters.calorieRangeKey !== 'all';

  const isLoading = state.status === 'loading';
  const isError = state.status === 'error';
  const isEmptySuccess = state.status === 'success' && state.items.length === 0;

  return (
    <div className="recipe-list-page">
      <header className="recipe-list-hero">
        <div className="hero-inner">
          <span className="hero-eyebrow" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2a4 4 0 0 1 4 4c0 2-1 3-2 4 2 1 4 2 4 5a7 7 0 1 1-14 0c0-3 2-4 4-5-1-1-2-2-2-4a4 4 0 0 1 6-3.46A4 4 0 0 1 12 2z"
                fill="#2f7a45"
              />
            </svg>
            Kho tàng định dưỡng thuần chay
          </span>
          <h1 className="hero-title">Công thức món chay</h1>
          <p className="hero-subtitle">
            Khám phá những công thức chay ngon, lành mạnh và dễ thực hiện mỗi ngày được tinh
            chỉnh khoa học theo nhu cầu dinh dưỡng.
          </p>
          <div className="hero-stats">
            <div className="stat-card">
              <div className="stat-number">500+</div>
              <div className="stat-label">Món chay chuẩn thực</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                &lt; 30<span className="stat-unit">p</span>
              </div>
              <div className="stat-label">Chuẩn bị nhanh gọn</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">100%</div>
              <div className="stat-label">Chuẩn khoa học BMI</div>
            </div>
          </div>
        </div>
      </header>

      <main className="recipe-list-main">
        <RecipeFilter
          values={filters}
          onChange={handleFilterChange}
          onSubmit={handleFilterSubmit}
          onReset={handleFilterReset}
        />

        <section className="recipe-result-section">
          <header className="result-header">
            <div className="result-title-wrap">
              <h2 className="result-title">
                Công thức dành cho bạn
                {!isLoading && !isError && (
                  <span className="result-count" title={`Tổng cộng ${state.totalItems} công thức`}>
                    {state.totalItems} công thức
                  </span>
                )}
              </h2>
            </div>
            <div className="result-sort" aria-label="Sắp xếp công thức">
              <label htmlFor="recipe-sort-select" className="sort-label">
                Sắp xếp theo:
              </label>
              <div className="select-wrap sort-select-wrap">
                <select id="recipe-sort-select" className="filter-select" defaultValue="match" disabled={isLoading || isError}>
                  <option value="match">Phù hợp nhất</option>
                  <option value="time_asc">Thời gian: Tăng dần</option>
                  <option value="time_desc">Thời gian: Giảm dần</option>
                  <option value="calo_asc">Calo: Tăng dần</option>
                  <option value="calo_desc">Calo: Giảm dần</option>
                </select>
              </div>
            </div>
          </header>

          <div className="result-body">
            {isLoading && <SkeletonLoader count={8} />}

            {isError && (
              <AlertError
                title="Không thể tải danh sách công thức"
                message={
                  state.errorMessage
                    ? `Chi tiết: ${state.errorMessage}. Vui lòng thử lại sau.`
                    : 'Kiểm tra lại đường truyền hoặc thử lại sau ít phút.'
                }
                onRetry={handleRetry}
              />
            )}

            {!isLoading && !isError && isEmptySuccess && (
              <EmptyState
                title={
                  hasActiveFilter
                    ? 'Không có công thức nào khớp với bộ lọc'
                    : 'Hiện chưa có công thức nào'
                }
                description={
                  hasActiveFilter
                    ? 'Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc (danh mục, chế độ ăn, thời gian, calo) để xem thêm kết quả nhé.'
                    : 'Hệ thống đang cập nhật công thức. Vui lòng quay lại sau.'
                }
                onReset={hasActiveFilter ? handleFilterReset : undefined}
              />
            )}

            {!isLoading && !isError && state.items.length > 0 && (
              <div className="recipe-grid" aria-label="Danh sách công thức món chay">
                {state.items.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} onNavigate={onNavigate} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
