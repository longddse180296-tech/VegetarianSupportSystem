import React, { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import type { AdminCategoryItem, CategoryFormData } from '../types/adminCategories.types'

const categorySchema = z.object({
  name: z.string().min(2, 'Tên danh mục phải có ít nhất 2 ký tự').max(60, 'Tối đa 60 ký tự'),
  slug: z.string().min(2, 'Slug phải có ít nhất 2 ký tự').max(80, 'Tối đa 80 ký tự'),
  classification: z.enum(['food_type', 'recipe', 'ingredient']),
  description: z.string().min(5, 'Mô tả ngắn phải từ 5 ký tự').max(200, 'Tối đa 200 ký tự'),
  isActive: z.boolean(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  categoryToEdit?: AdminCategoryItem | null
  onSubmit: (data: CategoryFormData) => Promise<void>
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
  onSubmit,
}) => {
  const isEditing = Boolean(categoryToEdit)

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
      classification: 'food_type',
      description: '',
      isActive: true,
    },
  })

  const watchedName = useWatch({ control, name: 'name' })

  // Auto-generate slug when name changes (if not editing existing)
  useEffect(() => {
    if (!categoryToEdit && watchedName) {
      const generatedSlug = watchedName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
      setValue('slug', generatedSlug)
    }
  }, [watchedName, categoryToEdit, setValue])

  useEffect(() => {
    if (categoryToEdit) {
      reset({
        name: categoryToEdit.name,
        slug: categoryToEdit.slug,
        classification: categoryToEdit.classification,
        description: categoryToEdit.description,
        isActive: categoryToEdit.isActive,
      })
    } else {
      reset({
        name: '',
        slug: '',
        classification: 'food_type',
        description: '',
        isActive: true,
      })
    }
  }, [categoryToEdit, reset, isOpen])

  if (!isOpen) return null

  const handleFormSubmit = async (values: CategoryFormValues) => {
    await onSubmit({
      id: categoryToEdit?.id,
      ...values,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-[20px] max-w-lg w-full p-6 sm:p-7 border border-[#e5e7eb] shadow-xl relative space-y-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-[10px] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-lg font-bold text-[#1f2937]">
            {isEditing ? 'Chỉnh sửa Danh mục Master Data' : 'Tạo Danh mục Master Data mới'}
          </h3>
          <p className="text-xs text-[#6b7280] mt-1">
            Thiết lập dữ liệu phân loại cho Loại ẩm thực chay (Food Types), Công thức (Recipes) và Nguyên liệu (Ingredients).
          </p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#1f2937] block mb-1">
              Tên danh mục <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="Ví dụ: Thuần thực vật, Món chính, Rau củ..."
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#e5e7eb] text-xs text-[#1f2937] focus:outline-none focus:border-[#2e7d32] focus:ring-2 focus:ring-[#e8f5e9]"
            />
            {errors.name && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-[#1f2937] block mb-1">
              Đường dẫn (Slug) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('slug')}
              placeholder="thuan-thuc-vat, mon-chinh, rau-cu..."
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#e5e7eb] text-xs font-mono text-[#1f2937] focus:outline-none focus:border-[#2e7d32] focus:ring-2 focus:ring-[#e8f5e9]"
            />
            {errors.slug && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.slug.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-[#1f2937] block mb-1.5">
              Phân loại Master Data <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="flex flex-col gap-1 p-3 rounded-[12px] border border-[#e5e7eb] cursor-pointer hover:bg-[#f8faf8] text-xs transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="food_type"
                    {...register('classification')}
                    className="text-[#2e7d32] focus:ring-[#2e7d32]"
                  />
                  <span className="font-bold text-[#1f2937]">Chế độ ăn chay</span>
                </div>
                <span className="text-[10px] text-[#6b7280] pl-5">4 loại chuẩn</span>
              </label>

              <label className="flex flex-col gap-1 p-3 rounded-[12px] border border-[#e5e7eb] cursor-pointer hover:bg-[#f8faf8] text-xs transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="recipe"
                    {...register('classification')}
                    className="text-[#2e7d32] focus:ring-[#2e7d32]"
                  />
                  <span className="font-bold text-[#1f2937]">Công thức</span>
                </div>
                <span className="text-[10px] text-[#6b7280] pl-5">Recipes</span>
              </label>

              <label className="flex flex-col gap-1 p-3 rounded-[12px] border border-[#e5e7eb] cursor-pointer hover:bg-[#f8faf8] text-xs transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="ingredient"
                    {...register('classification')}
                    className="text-[#2e7d32] focus:ring-[#2e7d32]"
                  />
                  <span className="font-bold text-[#1f2937]">Nguyên liệu</span>
                </div>
                <span className="text-[10px] text-[#6b7280] pl-5">Ingredients</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#1f2937] block mb-1">
              Mô tả ngắn <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              {...register('description')}
              placeholder="Mô tả tóm tắt ý nghĩa và nhóm nội dung của danh mục..."
              className="w-full p-3 rounded-[10px] border border-[#e5e7eb] text-xs text-[#1f2937] focus:outline-none focus:border-[#2e7d32] focus:ring-2 focus:ring-[#e8f5e9] resize-none"
            />
            {errors.description && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActive"
              {...register('isActive')}
              className="w-4 h-4 rounded text-[#2e7d32] focus:ring-[#2e7d32]"
            />
            <label htmlFor="isActive" className="text-xs text-[#1f2937] font-medium cursor-pointer">
              Kích hoạt sử dụng ngay trên toàn hệ thống
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e5e7eb]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[10px] border border-[#e5e7eb] text-xs font-semibold text-[#1f2937] hover:bg-[#f8faf8] transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-[10px] bg-[#2e7d32] hover:bg-[#1b5e20] disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            >
              {isSubmitting ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Tạo danh mục'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CategoryModal
