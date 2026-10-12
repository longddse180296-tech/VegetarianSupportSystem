import React from 'react'
import { PlayCircle, User as UserIcon } from 'lucide-react'
import { Button, StatusBadge } from '../../../shared/components'
import type { Video, VideoModerationStatus } from '../types/video.types'
import { CATEGORY_LABELS, MODERATION_STATUS_LABELS, formatDuration } from '../types/video.types'

interface VideoCardProps {
  video: Video
  onSelect?: (id: string) => void
  onPlay?: (url: string) => void
  onNavigate?: (path: string) => void
}

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

export const VideoCard: React.FC<VideoCardProps> = ({ video, onSelect, onPlay, onNavigate }) => {
  const handleOpen = () => {
    if (onPlay) {
      onPlay(video.videoUrl)
      return
    }
    if (onNavigate) {
      onNavigate(`/videos/${video.id}`)
      return
    }
    onSelect?.(video.id)
  }

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleOpen()
    }
  }

  const categoryLabel =
    CATEGORY_LABELS[video.category as keyof typeof CATEGORY_LABELS] ||
    video.category ||
    'Món chính'

  const authorName = video.author?.name || video.creatorName || 'Bếp Chay'
  const viewsText = video.views
    ? String(video.views)
    : `${(video.viewCount || 0).toLocaleString('vi-VN')} xem`

  const durationText =
    video.duration ||
    (video.durationSeconds ? formatDuration(video.durationSeconds) : '10:00')

  const isModeratedNonPublished =
    video.moderationStatus &&
    video.moderationStatus !== 'approved' &&
    video.moderationStatus !== 'published'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKey}
      className="group focus:outline-none"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#2E7D32]/40">
        {/* Thumbnail wrapper with aspect-video */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60 transition group-hover:opacity-80" />

          {/* Duration badge bottom-right */}
          <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {durationText}
          </span>

          {/* Hover play overlay */}
          <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 transition group-hover:opacity-100">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2E7D32] shadow-lg ring-4 ring-white/30">
              <PlayCircle size={22} className="fill-white stroke-white text-white" />
            </span>
          </span>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-2.5 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center rounded-full bg-[#E8F5E9] px-2.5 py-0.5 text-[11px] font-semibold text-[#2E7D32]">
              {categoryLabel}
            </span>
            {isModeratedNonPublished && (
              <StatusBadge
                size="sm"
                status={mapStatusBadge(video.moderationStatus)}
                label={MODERATION_STATUS_LABELS[video.moderationStatus] || 'Đang duyệt'}
              />
            )}
          </div>

          <h3 className="line-clamp-2 text-[14.5px] font-bold leading-snug tracking-tight text-[#111827] group-hover:text-[#2E7D32] transition-colors">
            {video.title}
          </h3>

          <div className="mt-auto flex items-center justify-between gap-2 text-[12px] text-[#6B7280]">
            <span className="inline-flex items-center gap-1.5 truncate font-medium">
              <UserIcon size={13} className="text-[#9CA3AF] shrink-0" />
              <span className="truncate">{authorName}</span>
            </span>
            <span className="shrink-0 font-medium text-[#6B7280]">
              {viewsText}
            </span>
          </div>

          {/* AI / Admin flag notes if present */}
          {(video.aiFlagNote || video.flagReason || video.adminNote) && (
            <div className="mt-1 space-y-1">
              {(video.flagReason || video.aiFlagNote) && (
                <div className="rounded-[8px] border border-amber-200 bg-amber-50/90 px-2.5 py-1.5 text-[11px] text-amber-900 leading-4">
                  <strong>⚠️ AI Flag:</strong> {video.flagReason || video.aiFlagNote}
                </div>
              )}
              {video.adminNote && (
                <div className="rounded-[8px] border border-blue-200 bg-blue-50/90 px-2.5 py-1.5 text-[11px] text-blue-900 leading-4">
                  <strong>👮 Admin:</strong> {video.adminNote}
                </div>
              )}
            </div>
          )}

          <div className="pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              fullWidth
              leftIcon={<PlayCircle size={13} />}
              onClick={(e) => {
                e.stopPropagation()
                handleOpen()
              }}
              className="!h-8 !rounded-[8px] !bg-[#E8F5E9] !text-[#2E7D32] hover:!bg-[#2E7D32] hover:!text-white transition-colors text-[12px] font-semibold"
            >
              Xem video
            </Button>
          </div>
        </div>
      </article>
    </div>
  )
}

export default VideoCard
