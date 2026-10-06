import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ValidationMessage from '../../../shared/components/ValidationMessage';
import type { RecipeFormData } from '../types/admin.types';
import './AdminForm.css';

const recipeIngredientSchema = z.object({
  name: z.string().min(1, { message: 'Tên nguyên liệu không được để trống' }),
  amount: z.string().min(1, { message: 'Số lượng không được để trống' }),
});

const recipeStepSchema = z.object({
  order: z
    .number()
    .refine((v) => !Number.isNaN(v), { message: 'Thứ tự phải là số' })
    .min(1, { message: 'Thứ tự phải lớn hơn 0' }),
  title: z.string().min(1, { message: 'Tiêu đề bước không được để trống' }),
  description: z.string().min(1, { message: 'Mô tả bước không được để trống' }),
});

const recipeSchema = z.object({
  name: z.string().min(1, { message: 'Tên công thức không được để trống' }),
  category: z.string().min(1, { message: 'Danh mục không được để trống' }),
  description: z.string().min(1, { message: 'Mô tả không được để trống' }),
  imageUrl: z.string().min(1, { message: 'URL ảnh không được để trống' }),
  servings: z
    .number()
    .refine((v) => !Number.isNaN(v), { message: 'Số phần ăn phải là số' })
    .min(1, { message: 'Số phần ăn phải lớn hơn 0' }),
  prepMinutes: z
    .number()
    .refine((v) => !Number.isNaN(v), { message: 'Thời gian chuẩn bị phải là số' })
    .min(0, { message: 'Thời gian chuẩn bị không được âm' }),
  cookMinutes: z
    .number()
    .refine((v) => !Number.isNaN(v), { message: 'Thời gian nấu phải là số' })
    .min(0, { message: 'Thời gian nấu không được âm' }),
  caloriesPerServing: z
    .number()
    .refine((v) => !Number.isNaN(v), { message: 'Lượng calo phải là số' })
    .min(0, { message: 'Lượng calo không được âm' }),
  suitableDiet: z.string().min(1, { message: 'Chế độ ăn phù hợp không được để trống' }),
  difficulty: z.string().min(1, { message: 'Độ khó không được để trống' }),
  ingredients: z
    .array(recipeIngredientSchema)
    .min(1, { message: 'Cần ít nhất 1 nguyên liệu' }),
  steps: z
    .array(recipeStepSchema)
    .min(1, { message: 'Cần ít nhất 1 bước thực hiện' }),
});

interface RecipeFormProps {
  defaultValues?: Partial<RecipeFormData>;
  onCancel?: () => void;
}

export default function RecipeForm({ defaultValues, onCancel }: RecipeFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      name: '',
      category: '',
      description: '',
      imageUrl: '',
      servings: 2,
      prepMinutes: 0,
      cookMinutes: 0,
      caloriesPerServing: 0,
      suitableDiet: '',
      difficulty: '',
      ingredients: [{ name: '', amount: '' }],
      steps: [{ order: 1, title: '', description: '' }],
      ...defaultValues,
    },
  });

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({
    control,
    name: 'ingredients',
  });

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
  } = useFieldArray({
    control,
    name: 'steps',
  });

  const onSubmit = (data: RecipeFormData) => {
    console.log('RecipeForm submitted:', data);
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h2 className="admin-form-title">Thông tin công thức</h2>

      <div className="form-field">
        <label className="form-field-label" htmlFor="recipe-name">
          Tên công thức<span className="required-mark">*</span>
        </label>
        <input
          id="recipe-name"
          type="text"
          className={`form-field-input ${errors.name ? 'input-error' : ''}`}
          placeholder="Ví dụ: Đậu hũ sốt nấm..."
          {...register('name')}
        />
        <ValidationMessage message={errors.name?.message} />
      </div>

      <div className="form-field-row">
        <div className="form-field">
          <label className="form-field-label" htmlFor="recipe-category">
            Danh mục<span className="required-mark">*</span>
          </label>
          <select
            id="recipe-category"
            className={`form-field-select ${errors.category ? 'input-error' : ''}`}
            {...register('category')}
          >
            <option value="">-- Chọn danh mục --</option>
            <option value="main_dish">Món chính</option>
            <option value="salad">Salad</option>
            <option value="soup">Canh/Cháo</option>
            <option value="dessert">Tráng miệng</option>
            <option value="drink">Đồ uống</option>
            <option value="side_dish">Món phụ</option>
          </select>
          <ValidationMessage message={errors.category?.message} />
        </div>

        <div className="form-field">
          <label className="form-field-label" htmlFor="recipe-difficulty">
            Độ khó<span className="required-mark">*</span>
          </label>
          <select
            id="recipe-difficulty"
            className={`form-field-select ${errors.difficulty ? 'input-error' : ''}`}
            {...register('difficulty')}
          >
            <option value="">-- Chọn độ khó --</option>
            <option value="easy">Dễ</option>
            <option value="medium">Trung bình</option>
            <option value="hard">Khó</option>
          </select>
          <ValidationMessage message={errors.difficulty?.message} />
        </div>
      </div>

      <div className="form-field">
        <label className="form-field-label" htmlFor="recipe-description">
          Mô tả<span className="required-mark">*</span>
        </label>
        <textarea
          id="recipe-description"
          className={`form-field-textarea ${errors.description ? 'input-error' : ''}`}
          placeholder="Giới thiệu ngắn gọn về công thức..."
          {...register('description')}
        />
        <ValidationMessage message={errors.description?.message} />
      </div>

      <div className="form-field">
        <label className="form-field-label" htmlFor="recipe-imageUrl">
          URL ảnh bìa<span className="required-mark">*</span>
        </label>
        <input
          id="recipe-imageUrl"
          type="text"
          className={`form-field-input ${errors.imageUrl ? 'input-error' : ''}`}
          placeholder="https://..."
          {...register('imageUrl')}
        />
        <ValidationMessage message={errors.imageUrl?.message} />
      </div>

      <div className="form-field-row">
        <div className="form-field">
          <label className="form-field-label" htmlFor="recipe-servings">
            Số phần ăn<span className="required-mark">*</span>
          </label>
          <input
            id="recipe-servings"
            type="number"
            min="1"
            className={`form-field-input ${errors.servings ? 'input-error' : ''}`}
            {...register('servings', { valueAsNumber: true })}
          />
          <ValidationMessage message={errors.servings?.message} />
        </div>

        <div className="form-field">
          <label className="form-field-label" htmlFor="recipe-suitableDiet">
            Chế độ ăn phù hợp<span className="required-mark">*</span>
          </label>
          <select
            id="recipe-suitableDiet"
            className={`form-field-select ${errors.suitableDiet ? 'input-error' : ''}`}
            {...register('suitableDiet')}
          >
            <option value="">-- Chọn chế độ ăn --</option>
            <option value="Thuần chay(Vegan)">Thuần chay (Vegan)</option>
            <option value="Chay có sữa(Lacto)">Chay có sữa (Lacto)</option>
            <option value="Chay có trứng(Ovo)">Chay có trứng (Ovo)</option>
            <option value="Trứng &amp; sữa(LactoOvo)">Trứng &amp; sữa (LactoOvo)</option>
          </select>
          <ValidationMessage message={errors.suitableDiet?.message} />
        </div>
      </div>

      <div className="form-field-row">
        <div className="form-field">
          <label className="form-field-label" htmlFor="recipe-prepMinutes">
            Thời gian chuẩn bị (phút)<span className="required-mark">*</span>
          </label>
          <input
            id="recipe-prepMinutes"
            type="number"
            min="0"
            className={`form-field-input ${errors.prepMinutes ? 'input-error' : ''}`}
            {...register('prepMinutes', { valueAsNumber: true })}
          />
          <ValidationMessage message={errors.prepMinutes?.message} />
        </div>

        <div className="form-field">
          <label className="form-field-label" htmlFor="recipe-cookMinutes">
            Thời gian nấu (phút)<span className="required-mark">*</span>
          </label>
          <input
            id="recipe-cookMinutes"
            type="number"
            min="0"
            className={`form-field-input ${errors.cookMinutes ? 'input-error' : ''}`}
            {...register('cookMinutes', { valueAsNumber: true })}
          />
          <ValidationMessage message={errors.cookMinutes?.message} />
        </div>
      </div>

      <div className="form-field">
        <label className="form-field-label" htmlFor="recipe-caloriesPerServing">
          Lượng calo / phần (kcal)<span className="required-mark">*</span>
        </label>
        <input
          id="recipe-caloriesPerServing"
          type="number"
          min="0"
          className={`form-field-input ${errors.caloriesPerServing ? 'input-error' : ''}`}
          {...register('caloriesPerServing', { valueAsNumber: true })}
        />
        <ValidationMessage message={errors.caloriesPerServing?.message} />
      </div>

      <div>
        <h3 className="form-section-title">Nguyên liệu</h3>
        {ingredientFields.map((field, index) => (
          <div key={field.id} className="sub-form-card">
            <div className="sub-form-card-header">
              <span className="sub-form-card-title">Nguyên liệu #{index + 1}</span>
              {ingredientFields.length > 1 && (
                <button
                  type="button"
                  className="btn-remove-sub"
                  onClick={() => removeIngredient(index)}
                >
                  Xóa
                </button>
              )}
            </div>
            <div className="form-field-row">
              <div className="form-field">
                <label className="form-field-label" htmlFor={`ingredient-name-${index}`}>
                  Tên nguyên liệu<span className="required-mark">*</span>
                </label>
                <input
                  id={`ingredient-name-${index}`}
                  type="text"
                  className={`form-field-input ${
                    errors.ingredients?.[index]?.name ? 'input-error' : ''
                  }`}
                  placeholder="Ví dụ: Đậu phụ"
                  {...register(`ingredients.${index}.name`)}
                />
                <ValidationMessage message={errors.ingredients?.[index]?.name?.message} />
              </div>
              <div className="form-field">
                <label className="form-field-label" htmlFor={`ingredient-amount-${index}`}>
                  Số lượng<span className="required-mark">*</span>
                </label>
                <input
                  id={`ingredient-amount-${index}`}
                  type="text"
                  className={`form-field-input ${
                    errors.ingredients?.[index]?.amount ? 'input-error' : ''
                  }`}
                  placeholder="Ví dụ: 300g"
                  {...register(`ingredients.${index}.amount`)}
                />
                <ValidationMessage message={errors.ingredients?.[index]?.amount?.message} />
              </div>
            </div>
          </div>
        ))}
        {errors.ingredients && !Array.isArray(errors.ingredients) && (
          <ValidationMessage message={errors.ingredients.message} />
        )}
        <button
          type="button"
          className="btn-add-sub"
          onClick={() => appendIngredient({ name: '', amount: '' })}
        >
          + Thêm nguyên liệu
        </button>
      </div>

      <div>
        <h3 className="form-section-title">Các bước thực hiện</h3>
        {stepFields.map((field, index) => (
          <div key={field.id} className="sub-form-card">
            <div className="sub-form-card-header">
              <span className="sub-form-card-title">Bước #{index + 1}</span>
              {stepFields.length > 1 && (
                <button
                  type="button"
                  className="btn-remove-sub"
                  onClick={() => removeStep(index)}
                >
                  Xóa
                </button>
              )}
            </div>
            <div className="form-field">
              <label className="form-field-label" htmlFor={`step-order-${index}`}>
                Thứ tự<span className="required-mark">*</span>
              </label>
              <input
                id={`step-order-${index}`}
                type="number"
                min="1"
                className={`form-field-input ${
                  errors.steps?.[index]?.order ? 'input-error' : ''
                }`}
                {...register(`steps.${index}.order`, { valueAsNumber: true })}
              />
              <ValidationMessage message={errors.steps?.[index]?.order?.message} />
            </div>
            <div className="form-field">
              <label className="form-field-label" htmlFor={`step-title-${index}`}>
                Tiêu đề bước<span className="required-mark">*</span>
              </label>
              <input
                id={`step-title-${index}`}
                type="text"
                className={`form-field-input ${
                  errors.steps?.[index]?.title ? 'input-error' : ''
                }`}
                placeholder="Ví dụ: Chế biến đậu hũ"
                {...register(`steps.${index}.title`)}
              />
              <ValidationMessage message={errors.steps?.[index]?.title?.message} />
            </div>
            <div className="form-field">
              <label className="form-field-label" htmlFor={`step-description-${index}`}>
                Mô tả chi tiết<span className="required-mark">*</span>
              </label>
              <textarea
                id={`step-description-${index}`}
                className={`form-field-textarea ${
                  errors.steps?.[index]?.description ? 'input-error' : ''
                }`}
                placeholder="Mô tả cách thực hiện bước này..."
                {...register(`steps.${index}.description`)}
              />
              <ValidationMessage message={errors.steps?.[index]?.description?.message} />
            </div>
          </div>
        ))}
        {errors.steps && !Array.isArray(errors.steps) && (
          <ValidationMessage message={errors.steps.message} />
        )}
        <button
          type="button"
          className="btn-add-sub"
          onClick={() =>
            appendStep({
              order: stepFields.length + 1,
              title: '',
              description: '',
            })
          }
        >
          + Thêm bước thực hiện
        </button>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang lưu...' : 'Lưu công thức'}
        </button>
        {onCancel && (
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Hủy
          </button>
        )}
      </div>
    </form>
  );
}
