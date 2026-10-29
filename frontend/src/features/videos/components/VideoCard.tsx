// Chức năng: video, bản nháp và nội dung công khai. Hiển thị một phần giao diện và phát sự kiện cho màn hình cha xử lý.
import React, { useState } from 'react'
import { Play, PlayCircle } from 'lucide-react'
import { Button, StatusBadge } from '../../../shared/components'
import type { Video, VideoModerationStatus } from '../types/video.types'
import { CATEGORY_LABELS, MODERATION_STATUS_LABELS } from '../types/video.types'
import { formatVideoDuration } from '../utils/videoMetadata'
import type { VideoDetails } from '../api/backendVideos'

// Cấu trúc VideoCardProps quy định dữ liệu trao đổi trong video, bản nháp và nội dung công khai.
export interface VideoCardProps {
  video: Video | VideoDetails
  categoryName?: string
  authorName?: string
  durationText?: string
  onSelect?: (id: string) => void
  onPlay?: (url: string) => void
  onNavigate?: (path: string) => void
  isLarge?: boolean
}

// Curated high-resolution culinary photography for default vegetarian video covers
const CURATED_THUMBNAILS = [
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', // Vibrant green salad bowl
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', // Tofu Buddha bowl
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', // Colorful veggie plate
  'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=800&q=80', // Vegan stir fry
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80', // Fragrant plant-based soup
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80', // Fresh roasted vegetables
]

// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (cleanPrefix); thuộc video, bản nháp và nội dung công khai.
function cleanPrefix(text?: string | null): string {
  if (!text) return ''
  return text
    .replace(/^\[Chế độ:[^\]]+\]\s*/i, '')
    .replace(/^\[Mẫu\]\s*/i, '')
    .trim()
}

// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (cleanDietLabel); thuộc video, bản nháp và nội dung công khai.
function cleanDietLabel(diet?: string | null): string {
  if (!diet) return ''
  const cleaned = cleanPrefix(diet)
  if (/trứng\s*&\s*sữa|lacto-ovo/i.test(cleaned)) return 'Trứng & Sữa (Lacto-ovo)'
  if (/có sữa|lacto/i.test(cleaned)) return 'Ăn chay có sữa (Lacto)'
  if (/có trứng|ovo/i.test(cleaned)) return 'Chay có trứng (Ovo)'
  if (/thuần chay|vegan/i.test(cleaned)) return 'Thuần chay (Vegan)'
  return cleaned
}

// Chuẩn hóa hoặc chuyển đổi dữ liệu giữa các bước xử lý (mapStatusBadge); thuộc video, bản nháp và nội dung công khai.
function mapStatusBadge(
  s: VideoModerationStatus,
):
  | 'info'
  | 'insufficient'
  | 'suitable'
  | 'neutral'
  | 'warning'
  | 'unsuitable'
  | 'danger' {
  switch (s) {
    case 'pending_ai':
    case 'ai_checking':
      return 'info'
    case 'pending_admin':
      return 'insufficient'
    case 'flagged_by_ai':
      return 'warning'
    case 'approved':
    case 'published':
      return 'suitable'
    case 'rejected':
      return 'unsuitable'
    default:
      return 'neutral'
  }
}

// Thành phần VideoCard nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc video, bản nháp và nội dung công khai.
export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  categoryName: customCategoryName,
  authorName: _customAuthorName,
  durationText: customDuration,
  onSelect,
  onPlay,
  onNavigate,
  isLarge = false,
}) => {
  // Lưu dữ liệu và trạng thái thao tác của video, bản nháp và nội dung công khai trong vòng đời màn hình.
  const [imgError, setImgError] = useState(false)

  // Xử lý lựa chọn hoặc chuyển trạng thái giao diện theo thao tác người dùng (handleOpen); thuộc video, bản nháp và nội dung công khai.
  const handleOpen = () => {
    if (onPlay && 'videoUrl' in video && video.videoUrl) {
      onPlay(video.videoUrl)
      return
    }
    if (onNavigate) {
      onNavigate(`/videos/${video.id}`)
      return
    }
    onSelect?.(video.id)
  }

  // Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (handleKey); thuộc video, bản nháp và nội dung công khai.
  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleOpen()
    }
  }

  // Chọn ảnh minh họa ổn định khi video chưa có ảnh bìa; không tạo số liệu tương tác.
  const hash = (video.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const defaultThumbnail = CURATED_THUMBNAILS[hash % CURATED_THUMBNAILS.length]
  const thumbnailSrc = !imgError && video.thumbnailUrl?.trim() ? video.thumbnailUrl : defaultThumbnail

  // Duration
  let durationDisplay = customDuration || ''
  if (!durationDisplay) {
    if ('duration' in video && video.duration) {
      durationDisplay = video.duration
    } else if ('durationSeconds' in video && video.durationSeconds) {
      durationDisplay = formatVideoDuration(video.durationSeconds)
    } else {
      // Không tạo thời lượng giả khi máy chủ chưa có thông tin của tệp.
      durationDisplay = 'metadataStatus' in video && video.metadataStatus === 'Processing' ? 'Đang xử lý' : ''
    }
  }

  // Category label
  let categoryLabel = customCategoryName || ''
  if (!categoryLabel) {
    if ('category' in video && video.category) {
      categoryLabel =
        CATEGORY_LABELS[video.category as keyof typeof CATEGORY_LABELS] ||
        cleanPrefix(video.category)
    }
  }
  if (!categoryLabel) {
    categoryLabel = 'Video Chay'
  }
  categoryLabel = cleanPrefix(categoryLabel)

  // Diet label
  const dietRaw = video.dietType
  const dietBadge = cleanDietLabel(dietRaw)

  // Clean title & description
  const title = cleanPrefix(video.title)
  const description = cleanPrefix(video.description)

  // Moderation status (for profile/admin views)
  const isModeratedNonPublished =
    'moderationStatus' in video &&
    video.moderationStatus &&
    video.moderationStatus !== 'approved' &&
    video.moderationStatus !== 'published'

  // Hiển thị giao diện video, bản nháp và nội dung công khai từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKey}
      className="group focus:outline-none"
    >
      <article
        className={`flex h-full flex-col overflow-hidden rounded-[20px] border border-slate-200/90 bg-white shadow-xs transition-all duration-300 ease-out hover:-translate-y-1 hover:border-emerald-400 hover:shadow-xl ${
          isLarge ? 'p-1' : ''
        }`}
      >
        {/* Thumbnail container */}
        <div className="relative aspect-video w-full overflow-hidden rounded-t-[19px] bg-slate-900">
          <img
            src={thumbnailSrc}
            alt={title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-75" />

          {/* Duration badge: Bottom-Right (Black background, white text) */}
          {durationDisplay && <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-md bg-black/85 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur-xs">
            {durationDisplay}
          </span>}

          {/* Centered Play button with hover animation */}
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-emerald-700 shadow-xl ring-4 ring-white/30 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white">
              <Play size={20} fill="currentColor" className="ml-0.5" />
            </span>
          </span>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 flex-col p-4 sm:p-5 min-w-0">
          {/* Category & Diet Tag Row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200/60">
              {categoryLabel}
            </span>

            <div className="flex items-center gap-1.5">
              {dietBadge && (
                <span className="inline-flex items-center rounded-full bg-[#E8F5E9] px-2.5 py-0.5 text-[11px] font-semibold text-[#2E7D32] border border-[#A5D6A7]">
                  {dietBadge}
                </span>
              )}
              {isModeratedNonPublished && (
                <StatusBadge
                  size="sm"
                  status={mapStatusBadge(video.moderationStatus)}
                  label={MODERATION_STATUS_LABELS[video.moderationStatus] || 'Đang duyệt'}
                />
              )}
            </div>
          </div>

          {/* Title: Line-clamp 2 for uniform card height */}
          <h3
            className={`mt-2.5 line-clamp-2 font-bold leading-snug tracking-tight text-slate-900 transition-colors duration-200 group-hover:text-emerald-700 ${
              isLarge ? 'text-lg sm:text-xl min-h-[56px]' : 'text-[15px] sm:text-base min-h-[46px]'
            }`}
            title={title}
          >
            {title}
          </h3>

          {/* Optional Short Description */}
          {description && (
            <p className="mt-1 line-clamp-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
              {description}
            </p>
          )}

          {/* AI / Admin notes if present */}
          {'aiFlagNote' in video && (video.aiFlagNote || video.flagReason || video.adminNote) && (
            <div className="mt-2 space-y-1">
              {(video.flagReason || video.aiFlagNote) && (
                <div className="rounded-[8px] border border-amber-200 bg-amber-50/90 px-2.5 py-1 text-[11px] text-amber-900 leading-4">
                  <strong>⚠️ AI Flag:</strong> {video.flagReason || video.aiFlagNote}
                </div>
              )}
              {video.adminNote && (
                <div className="rounded-[8px] border border-blue-200 bg-blue-50/90 px-2.5 py-1 text-[11px] text-blue-900 leading-4">
                  <strong>👮 Admin:</strong> {video.adminNote}
                </div>
              )}
            </div>
          )}

          {/* Quick CTA button */}
          <div className="mt-auto pt-3.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              fullWidth
              leftIcon={<PlayCircle size={14} />}
              onClick={(e) => {
                e.stopPropagation()
                handleOpen()
              }}
              className="!h-8 !rounded-[10px] !bg-emerald-50 !text-emerald-800 hover:!bg-emerald-600 hover:!text-white border border-emerald-200/50 transition-colors text-xs font-semibold"
            >
              Xem ngay
            </Button>
          </div>
        </div>
      </article>
    </div>
  )
}

export default VideoCard
