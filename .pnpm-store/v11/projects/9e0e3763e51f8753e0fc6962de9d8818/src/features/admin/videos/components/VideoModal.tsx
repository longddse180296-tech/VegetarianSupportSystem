import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import type { AdminVideoItem, VideoFormData } from '../types/adminVideos.types'

const videoSchema = z.object({
  title: z.string().min(5, 'Tiêu đề video phải từ 5 ký tự').max(150, 'Tối đa 150 ký tự'),
  videoUrl: z.string().url('Đường dẫn video không hợp lệ (URL đầy đủ)').min(5, 'Vui lòng nhập URL'),
  thumbnailUrl: z.string().optional(),
  category: z.string().min(1, 'Vui lòng chọn danh mục'),
  duration: z.string().regex(/^\d{1,2}:\d{2}$/, 'Thời lượng dạng MM:SS (ví dụ 08:45)'),
  resolution: z.string().min(1, 'Chọn độ phân giải'),
  description: z.string().max(500, 'Tối đa 500 ký tự').optional(),
  isPublished: z.boolean(),
})

type VideoFormValues = z.infer<typeof videoSchema>

interface VideoModalProps {
  isOpen: boolean
  onClose: () => void
  videoToEdit?: AdminVideoItem | null
  onSubmit: (data: VideoFormData) => Promise<void>
}

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  videoToEdit,
  onSubmit,
}) => {
  const isEditing = Boolean(videoToEdit)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VideoFormValues>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      title: '',
      videoUrl: '',
      thumbnailUrl: '',
      category: 'main-dish',
      duration: '05:00',
      resolution: '1080p Full HD',
      description: '',
      isPublished: true,
    },
  })

  useEffect(() => {
    if (videoToEdit) {
      reset({
        title: videoToEdit.title,
        videoUrl: videoToEdit.videoUrl,
        thumbnailUrl: videoToEdit.thumbnailUrl || '',
        category: videoToEdit.category,
        duration: videoToEdit.duration,
        resolution: videoToEdit.resolution,
        description: videoToEdit.description || '',
        isPublished: videoToEdit.status === 'published',
      })
    } else {
      reset({
        title: '',
        videoUrl: '',
        thumbnailUrl: '',
        category: 'main-dish',
        duration: '05:00',
        resolution: '1080p Full HD',
        description: '',
        isPublished: true,
      })
    }
  }, [videoToEdit, reset, isOpen])

  if (!isOpen) return null

  const handleFormSubmit = async (values: VideoFormValues) => {
    await onSubmit({
      id: videoToEdit?.id,
      title: values.title,
      videoUrl: values.videoUrl,
      thumbnailUrl: values.thumbnailUrl || undefined,
      category: values.category,
      duration: values.duration,
      resolution: values.resolution,
      description: values.description,
      isPublished: values.isPublished,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-gray-100 shadow-xl relative space-y-5 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {isEditing ? 'Chỉnh sửa Video' : 'Thêm Video Hướng Dẫn Mới'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Đăng tải hoặc cập nhật video ẩm thực thuần chay lên kho nội dung cộng đồng.
          </p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Tiêu đề video <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('title')}
              placeholder="Ví dụ: Cách làm Đậu hũ sốt nấm thơm ngon đậm vị..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {errors.title && (
              <p className="text-[11px] text-red-500 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Đường dẫn Video URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              {...register('videoUrl')}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {errors.videoUrl && (
              <p className="text-[11px] text-red-500 mt-1">{errors.videoUrl.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                {...register('category')}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              >
                <option value="main-dish">Món chính</option>
                <option value="salad">Salad</option>
                <option value="soup">Món nước</option>
                <option value="drinks">Đồ uống</option>
                <option value="cooking-tips">Mẹo nấu ăn</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Thời lượng (MM:SS) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('duration')}
                placeholder="08:45"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              {errors.duration && (
                <p className="text-[11px] text-red-500 mt-1">{errors.duration.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Độ phân giải
              </label>
              <select
                {...register('resolution')}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              >
                <option value="1080p Full HD">1080p Full HD</option>
                <option value="2K QHD">2K QHD</option>
                <option value="4K UHD">4K UHD</option>
                <option value="720p HD">720p HD</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Ảnh Thumbnail URL (Tùy chọn)
              </label>
              <input
                type="url"
                {...register('thumbnailUrl')}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Mô tả tóm tắt nội dung
            </label>
            <textarea
              rows={3}
              {...register('description')}
              placeholder="Tóm tắt ngắn gọn quy trình chế biến hoặc lưu ý khi thực hiện món ăn..."
              className="w-full p-3 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isPublished"
              {...register('isPublished')}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="isPublished" className="text-xs text-gray-700 font-medium cursor-pointer">
              Xuất bản hiển thị ngay trên hệ thống
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
              {isSubmitting ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Thêm video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default VideoModal
