import { Eye, Heart, PlayCircle, User as UserIcon } from 'lucide-react'
import { Button, StatusBadge } from '../../../shared/components'
import type { VideoItem, VideoModerationStatus } from '../types/video.types'
import { CATEGORY_LABELS, MODERATION_STATUS_LABELS, formatDuration } from '../types/video.types'

interface VideoCardProps {
  video: VideoItem
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
    case 'ai_checking':
      return 'info'
    case 'pending_admin':
      return 'insufficient'
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

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKey}
      className="group focus:outline-none"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-[16px] border border-[#e5e7eb] bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        {/* Thumbnail wrapper with aspect-video */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-70 transition group-hover:opacity-90" />

          {/* Duration badge absolute top-right rounded-full */}
          <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-bold text-white">
            {formatDuration(video.durationSeconds)}
          </span>

          {/* Hover play overlay */}
          <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 transition group-hover:opacity-100">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2e7d32] shadow-lg ring-4 ring-white/30">
              <PlayCircle size={24} className="fill-white stroke-white text-white" />
            </span>
          </span>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center rounded-full bg-[#e8f5e9] px-2 py-0.5 text-[11px] font-extrabold text-[#2e7d32]">
              {CATEGORY_LABELS[video.category]}
            </span>
            <span className="text-[11px] font-semibold text-[#6b7280]">
              {new Date(video.createdAt).toLocaleDateString('vi-VN')}
            </span>
          </div>

          <h3 className="line-clamp-2 text-[15px] font-extrabold leading-snug tracking-tight text-[#1f2937] group-hover:text-[#2e7d32]">
            {video.title}
          </h3>

          {/* StatusBadge below title row per task B.4 */}
          <div>
            <StatusBadge
              status={mapStatusBadge(video.moderationStatus)}
              label={MODERATION_STATUS_LABELS[video.moderationStatus]}
            />
          </div>

          <p className="line-clamp-2 text-[12px] leading-5 text-[#6b7280]">
            {video.description}
          </p>

          <div className="flex items-center gap-2">
            {video.creatorAvatar ? (
              <img
                src={video.creatorAvatar}
                alt={video.creatorName}
                className="h-7 w-7 rounded-full object-cover ring-2 ring-[#c8e6c9]"
              />
            ) : (
              <div className="grid h-7 w-7 place-items-center rounded-full bg-[#E8F5E9] text-[#2E7D32] ring-2 ring-[#c8e6c9]">
                <UserIcon size={14} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-extrabold text-[#1f2937]">
                {video.creatorName}
              </div>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-[#6b7280]">
                <span className="inline-flex items-center gap-1">
                  <Eye size={11} />
                  {video.viewCount.toLocaleString('vi-VN')}
                </span>
                <span className="inline-flex items-center gap-1 text-rose-500">
                  <Heart size={11} className="fill-rose-500 stroke-rose-500" />
                  {video.likeCount.toLocaleString('vi-VN')}
                </span>
              </div>
            </div>
          </div>

          {/* AI / Admin flag notes */}
          {(video.aiFlagNote || video.adminNote) && (
            <div className="mt-1 space-y-1.5">
              {video.aiFlagNote && (
                <div className="rounded-[10px] border border-sky-200 bg-sky-50/80 px-3 py-2 text-[11px] leading-5 text-sky-800">
                  <strong>🤖 AI (chỉ gắn cờ):</strong> {video.aiFlagNote}
                </div>
              )}
              {video.adminNote && (
                <div className="rounded-[10px] border border-amber-200 bg-amber-50/80 px-3 py-2 text-[11px] leading-5 text-amber-800">
                  <strong>👮 Admin (quyết định cuối):</strong> {video.adminNote}
                </div>
              )}
            </div>
          )}

          <div className="mt-auto flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="primary"
              size="sm"
              fullWidth
              leftIcon={<PlayCircle size={13} />}
              onClick={(e) => {
                e.stopPropagation()
                handleOpen()
              }}
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
