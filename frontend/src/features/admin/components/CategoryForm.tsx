import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ValidationMessage from '../../../shared/components/ValidationMessage';
import type { CategoryFormData } from '../types/admin.types';
import './AdminForm.css';

const categorySchema = z.object({
  name: z.string().min(1, { message: 'Tên danh mục không được để trống' }),
  key: z.string().min(1, { message: 'Mã danh mục không được để trống' }),
  description: z.string().min(1, { message: 'Mô tả không được để trống' }),
  isActive: z.boolean(),
});

interface CategoryFormProps {
  defaultValues?: Partial<CategoryFormData>;
  onCancel?: () => void;
}

export default function CategoryForm({ defaultValues, onCancel }: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      key: '',
      description: '',
      isActive: true,
      ...defaultValues,
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    console.log('CategoryForm submitted:', data);
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h2 className="admin-form-title">Thông tin danh mục</h2>

      <div className="form-field">
        <label className="form-field-label" htmlFor="category-name">
          Tên danh mục<span className="required-mark">*</span>
        </label>
        <input
          id="category-name"
          type="text"
          className={`form-field-input ${errors.name ? 'input-error' : ''}`}
          placeholder="Ví dụ: Món chính, Salad..."
          {...register('name')}
        />
        <ValidationMessage message={errors.name?.message} />
      </div>

      <div className="form-field">
        <label className="form-field-label" htmlFor="category-key">
          Mã danh mục<span className="required-mark">*</span>
        </label>
        <input
          id="category-key"
          type="text"
          className={`form-field-input ${errors.key ? 'input-error' : ''}`}
          placeholder="Ví dụ: main_dish, salad..."
          {...register('key')}
        />
        <ValidationMessage message={errors.key?.message} />
      </div>

      <div className="form-field">
        <label className="form-field-label" htmlFor="category-description">
          Mô tả<span className="required-mark">*</span>
        </label>
        <textarea
          id="category-description"
          className={`form-field-textarea ${errors.description ? 'input-error' : ''}`}
          placeholder="Mô tả ngắn gọn về danh mục này..."
          {...register('description')}
        />
        <ValidationMessage message={errors.description?.message} />
      </div>

      <div className="form-checkbox-field">
        <input
          id="category-active"
          type="checkbox"
          {...register('isActive')}
        />
        <label htmlFor="category-active">Kích hoạt danh mục</label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang lưu...' : 'Lưu danh mục'}
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
