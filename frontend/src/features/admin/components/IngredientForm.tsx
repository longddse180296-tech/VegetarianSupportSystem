import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ValidationMessage from '../../../shared/components/ValidationMessage';
import type { IngredientFormData } from '../types/admin.types';
import './AdminForm.css';

const ingredientSchema = z.object({
  name: z.string().min(1, { message: 'Tên nguyên liệu không được để trống' }),
  unit: z.string().min(1, { message: 'Đơn vị tính không được để trống' }),
  category: z.string().min(1, { message: 'Danh mục không được để trống' }),
  isVegan: z.boolean(),
  notes: z.string().min(1, { message: 'Ghi chú không được để trống' }),
});

interface IngredientFormProps {
  defaultValues?: Partial<IngredientFormData>;
  onCancel?: () => void;
}

export default function IngredientForm({ defaultValues, onCancel }: IngredientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IngredientFormData>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      name: '',
      unit: '',
      category: '',
      isVegan: true,
      notes: '',
      ...defaultValues,
    },
  });

  const onSubmit = (data: IngredientFormData) => {
    console.log('IngredientForm submitted:', data);
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h2 className="admin-form-title">Thông tin nguyên liệu</h2>

      <div className="form-field">
        <label className="form-field-label" htmlFor="ingredient-name">
          Tên nguyên liệu<span className="required-mark">*</span>
        </label>
        <input
          id="ingredient-name"
          type="text"
          className={`form-field-input ${errors.name ? 'input-error' : ''}`}
          placeholder="Ví dụ: Đậu phụ, Nấm hương..."
          {...register('name')}
        />
        <ValidationMessage message={errors.name?.message} />
      </div>

      <div className="form-field-row">
        <div className="form-field">
          <label className="form-field-label" htmlFor="ingredient-unit">
            Đơn vị tính<span className="required-mark">*</span>
          </label>
          <select
            id="ingredient-unit"
            className={`form-field-select ${errors.unit ? 'input-error' : ''}`}
            {...register('unit')}
          >
            <option value="">-- Chọn đơn vị --</option>
            <option value="g">gam (g)</option>
            <option value="kg">kilogram (kg)</option>
            <option value="ml">ml</option>
            <option value="l">lít (l)</option>
            <option value="cái">cái</option>
            <option value="muỗng canh">muỗng canh</option>
            <option value="muỗng cà phê">muỗng cà phê</option>
          </select>
          <ValidationMessage message={errors.unit?.message} />
        </div>

        <div className="form-field">
          <label className="form-field-label" htmlFor="ingredient-category">
            Danh mục<span className="required-mark">*</span>
          </label>
          <select
            id="ingredient-category"
            className={`form-field-select ${errors.category ? 'input-error' : ''}`}
            {...register('category')}
          >
            <option value="">-- Chọn danh mục --</option>
            <option value="protein_nguon_goc_thuc_vat">Protein nguồn gốc thực vật</option>
            <option value="rau_cu">Rau củ</option>
            <option value="trai_cay">Trái cây</option>
            <option value="ngu_coc">Ngũ cốc</option>
            <option value="dau_goi_va_gia_vi">Dầu, gói và gia vị</option>
            <option value="do_kho">Đồ khô</option>
          </select>
          <ValidationMessage message={errors.category?.message} />
        </div>
      </div>

      <div className="form-checkbox-field">
        <input
          id="ingredient-vegan"
          type="checkbox"
          {...register('isVegan')}
        />
        <label htmlFor="ingredient-vegan">Phù hợp chế độ thuần chay (Vegan)</label>
      </div>

      <div className="form-field">
        <label className="form-field-label" htmlFor="ingredient-notes">
          Ghi chú<span className="required-mark">*</span>
        </label>
        <textarea
          id="ingredient-notes"
          className={`form-field-textarea ${errors.notes ? 'input-error' : ''}`}
          placeholder="Thông tin bổ sung, bảo quản, hoặc các lưu ý về nguyên liệu..."
          {...register('notes')}
        />
        <ValidationMessage message={errors.notes?.message} />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang lưu...' : 'Lưu nguyên liệu'}
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
