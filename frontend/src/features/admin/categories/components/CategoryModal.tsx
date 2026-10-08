import React, { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import type { AdminCategoryItem, CategoryFormData } from '../types/adminCategories.types'

const categorySchema = z.object({
  name: z.string().min(2, 'Tên danh mục phải có ít nhất 2 ký tự').max(60, 'Tối đa 60 ký tự'),
  slug: z.string().min(2, 'Slug phải có ít nhất 2 ký tự').max(80, 'Tối đa 80 ký tự'),
  classification: z.enum(['ingredient', 'recipe']),
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
      classification: 'ingredient',
      description: '',
      isActive: true,
    },
  })

  const watchedName = useWatch({ control, name: 'name' })

  // Auto-generate slug when name changes (if not manual)
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
        classification: 'ingredient',
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
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-gray-100 shadow-xl relative space-y-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {isEditing ? 'Chỉnh sửa Danh mục' : 'Tạo Danh mục mới'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Thiết lập thông tin phân loại cho hệ thống nguyên liệu và công thức nấu chay.
          </p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="Ví dụ: Rau củ, Món chính..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {errors.name && (
              <p className="text-[11px] text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Đường dẫn (Slug) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('slug')}
              placeholder="rau-cu, mon-chinh..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {errors.slug && (
              <p className="text-[11px] text-red-500 mt-1">{errors.slug.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Phân loại hệ thống <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 text-xs">
                <input
                  type="radio"
                  value="ingredient"
                  {...register('classification')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-gray-800">Loại thực phẩm</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 text-xs">
                <input
                  type="radio"
                  value="recipe"
                  {...register('classification')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-gray-800">Công thức</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Mô tả ngắn <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              {...register('description')}
              placeholder="Mô tả tóm tắt ý nghĩa và nhóm nội dung của danh mục..."
              className="w-full p-3 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            />
            {errors.description && (
              <p className="text-[11px] text-red-500 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActive"
              {...register('isActive')}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="isActive" className="text-xs text-gray-700 font-medium cursor-pointer">
              Kích hoạt sử dụng ngay trên hệ thống
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-xs"
            >
              {isSubmitting ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Tạo danh mục'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
