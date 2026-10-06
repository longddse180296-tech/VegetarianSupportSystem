import { useMemo } from 'react';
import type {
  CategoryKey,
  DietType,
  RecipeFilterValues,
} from '../types/recipes.types';
import { DEFAULT_FILTER_VALUES } from '../types/recipes.types';
import {
  CATEGORY_OPTIONS,
  DIET_OPTIONS,
  TIME_RANGE_OPTIONS,
  CALORIE_RANGE_OPTIONS,
} from '../api/recipes.api';
import './RecipeFilter.css';

export type { RecipeFilterValues };
export { DEFAULT_FILTER_VALUES };

interface RecipeFilterProps {
  values: RecipeFilterValues;
  onChange: (next: RecipeFilterValues) => void;
  onSubmit?: () => void;
  onReset: () => void;
}

export default function RecipeFilter({
  values,
  onChange,
  onSubmit,
  onReset,
}: RecipeFilterProps) {
  const hasActiveFilter = useMemo(() => {
    return (
      values.search.trim() !== '' ||
      values.category !== 'all' ||
      values.diet !== 'all' ||
      values.timeRangeKey !== 'all' ||
      values.calorieRangeKey !== 'all'
    );
  }, [values]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...values, search: e.target.value });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit?.();
    }
  };

  const handleSearchClick = () => {
    onSubmit?.();
  };

  const handleCategoryClick = (key: CategoryKey) => {
    onChange({ ...values, category: key });
    onSubmit?.();
  };

  const handleDietClick = (key: DietType | 'all') => {
    onChange({ ...values, diet: key });
    onSubmit?.();
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...values, timeRangeKey: e.target.value });
    onSubmit?.();
  };

  const handleCalorieChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...values, calorieRangeKey: e.target.value });
    onSubmit?.();
  };

  return (
    <section className="recipe-filter" aria-label="Bộ lọc công thức">
      <form
        className="recipe-filter-search"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.();
        }}
      >
        <label className="search-label" htmlFor="recipe-search-input">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="#6a8975" strokeWidth="2" />
            <path d="M20 20l-3.5-3.5" stroke="#6a8975" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </label>
        <input
          id="recipe-search-input"
          type="search"
          className="search-input"
          placeholder="Tìm kiếm công thức theo tên món hoặc nguyên liệu (đậu hũ, nấm, hạt sen...)"
          value={values.search}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
        />
        <button
          type="submit"
          className="search-submit-btn"
          onClick={handleSearchClick}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 7h18M6 12h12M10 17h4"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          Tìm kiếm
        </button>
      </form>

      <div className="filter-groups">
        <div className="filter-group">
          <h4 className="filter-group-title">Chế độ ăn</h4>
          <div className="filter-pills" role="group" aria-label="Lọc theo chế độ ăn">
            {DIET_OPTIONS.map((opt) => {
              const isActive = values.diet === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  className={isActive ? 'filter-pill filter-pill-active' : 'filter-pill'}
                  onClick={() => handleDietClick(opt.key)}
                  aria-pressed={isActive}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="filter-group">
          <h4 className="filter-group-title">Danh mục</h4>
          <div className="filter-pills" role="group" aria-label="Lọc theo danh mục món ăn">
            {CATEGORY_OPTIONS.map((opt) => {
              const isActive = values.category === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  className={isActive ? 'filter-pill filter-pill-active' : 'filter-pill'}
                  onClick={() => handleCategoryClick(opt.key)}
                  aria-pressed={isActive}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="filter-row-2col">
          <div className="filter-field">
            <label className="filter-field-label" htmlFor="recipe-time-select">
              Thời gian nấu
            </label>
            <div className="select-wrap">
              <select
                id="recipe-time-select"
                className="filter-select"
                value={values.timeRangeKey}
                onChange={handleTimeChange}
              >
                {TIME_RANGE_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-field filter-field-calorie">
            <label className="filter-field-label" htmlFor="recipe-calorie-select">
              Mức Calo (Kcal / Khẩu phần)
            </label>
            <div className="filter-field-row">
              <div className="select-wrap">
                <select
                  id="recipe-calorie-select"
                  className="filter-select"
                  value={values.calorieRangeKey}
                  onChange={handleCalorieChange}
                >
                  {CALORIE_RANGE_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="reset-filter-btn"
                onClick={onReset}
                disabled={!hasActiveFilter}
                title={hasActiveFilter ? 'Xóa bộ lọc' : 'Chưa có bộ lọc nào đang áp dụng'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M6 6h12M6 12h12M10 18h4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M16 6l-2 3M8 6l2 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
