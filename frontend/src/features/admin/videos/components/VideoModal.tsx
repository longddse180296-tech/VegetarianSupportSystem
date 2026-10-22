import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { Select } from '../../../../shared/components/Select'
import type { AdminVideoItem, VideoFormData } from '../types/adminVideos.types'
import { uploadPublicImage } from '../../../../shared/api/publicImageApi'

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
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [thumbnailUploadError, setThumbnailUploadError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
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

  const categoryValue = watch('category')
  const resolutionValue = watch('resolution')
  const thumbnailUrl = watch('thumbnailUrl')

  useEffect(() => {
    setThumbnailUploadError(null)
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

  const uploadThumbnail = async (file?: File) => {
    if (!file || uploadingThumbnail) return
    setUploadingThumbnail(true)
    setThumbnailUploadError(null)
    try {
      setValue('thumbnailUrl', await uploadPublicImage(file), { shouldDirty: true })
    } catch (reason) {
      setThumbnailUploadError(
        reason instanceof Error ? reason.message : 'Không thể tải ảnh lên. Vui lòng thử lại.',
      )
    } finally {
      setUploadingThumbnail(false)
    }
  }

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
              <Select
                label="Danh mục"
                required
                value={categoryValue}
                onChange={(e) => setValue('category', e.target.value, { shouldValidate: true })}
                options={[
                  { value: 'main-dish', label: 'Món chính' },
                  { value: 'salad', label: 'Salad' },
                  { value: 'soup', label: 'Món nước' },
                  { value: 'drinks', label: 'Đồ uống' },
                  { value: 'cooking-tips', label: 'Mẹo nấu ăn' },
                ]}
                error={errors.category?.message}
              />
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
              <Select
                label="Độ phân giải"
                value={resolutionValue}
                onChange={(e) => setValue('resolution', e.target.value, { shouldValidate: true })}
                options={[
                  { value: '1080p Full HD', label: '1080p Full HD' },
                  { value: '2K QHD', label: '2K QHD' },
                  { value: '4K UHD', label: '4K UHD' },
                  { value: '720p HD', label: '720p HD' },
                ]}
                error={errors.resolution?.message}
              />
            </div>

            <div>
              <label htmlFor="admin-video-thumbnail" className="text-xs font-semibold text-gray-700 block mb-1">
                Ảnh thumbnail <span className="font-normal text-gray-500">(tùy chọn)</span>
              </label>
              <input
                id="admin-video-thumbnail"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={isSubmitting || uploadingThumbnail}
                className="w-full cursor-pointer px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 file:mr-2 file:rounded-md file:border-0 file:bg-emerald-50 file:px-2.5 file:py-1 file:font-semibold file:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  void uploadThumbnail(file)
                }}
              />
              <p className="mt-1 text-[11px] text-gray-500">
                {uploadingThumbnail ? 'Đang tải ảnh lên...' : 'JPG, PNG hoặc WEBP từ thiết bị, tối đa 10 MB.'}
              </p>
              {thumbnailUploadError && <p className="mt-1 text-[11px] text-red-500">{thumbnailUploadError}</p>}
              {thumbnailUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={thumbnailUrl} alt="Xem trước ảnh thumbnail" className="size-10 rounded-md object-cover" />
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-600 hover:underline"
                    onClick={() => setValue('thumbnailUrl', '', { shouldDirty: true })}
                  >
                    Bỏ ảnh
                  </button>
                </div>
              )}
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
