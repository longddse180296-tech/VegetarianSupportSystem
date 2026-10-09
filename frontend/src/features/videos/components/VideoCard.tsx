import { Eye, Heart, PlayCircle } from 'lucide-react'
import { Button, StatusBadge } from '../../../shared/components'
import type { VideoItem, VideoModerationStatus } from '../types/video.types'
import { CATEGORY_LABELS, MODERATION_STATUS_LABELS, formatDuration } from '../types/video.types'

interface VideoCardProps {
  video: VideoItem
  onSelect?: (id: string) => void
  onPlay?: (url: string) => void
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

export const VideoCard: React.FC<VideoCardProps> = ({ video, onSelect, onPlay }) => {
  return (
    <article className="group flex flex-col overflow-hidden rounded-[16px] border border-[#e5e7eb] bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Thumbnail */}
      <button
        type="button"
        onClick={() => (onPlay ? onPlay(video.videoUrl) : onSelect?.(video.id))}
        className="relative block w-full text-left focus:outline-none"
        aria-label={`Xem video ${video.title}`}
      >
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          loading="lazy"
          className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-70 transition group-hover:opacity-90" />
        <span className="absolute left-3 top-3 z-10">
          <StatusBadge
            size="sm"
            status={mapStatusBadge(video.moderationStatus)}
            label={MODERATION_STATUS_LABELS[video.moderationStatus]}
          />
        </span>
        <span className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-1 text-[11px] font-extrabold text-white backdrop-blur">
          {formatDuration(video.durationSeconds)}
        </span>
        <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 transition group-hover:opacity-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2e7d32] shadow-lg ring-4 ring-white/30">
            <PlayCircle size={24} className="fill-white stroke-white text-white" />
          </span>
        </span>
      </button>

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

        <button
          type="button"
          onClick={() => (onPlay ? onPlay(video.videoUrl) : onSelect?.(video.id))}
          className="text-left"
        >
          <h3 className="line-clamp-2 text-[15px] font-extrabold leading-snug tracking-tight text-[#1f2937] group-hover:text-[#2e7d32]">
            {video.title}
          </h3>
        </button>

        <p className="line-clamp-2 text-[12px] leading-5 text-[#6b7280]">
          {video.description}
        </p>

        <div className="flex items-center gap-2">
          <img
            src={video.creatorAvatar}
            alt={video.creatorName}
            className="h-7 w-7 rounded-full object-cover ring-2 ring-[#c8e6c9]"
          />
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
            onClick={() => (onPlay ? onPlay(video.videoUrl) : onSelect?.(video.id))}
          >
            Xem video
          </Button>
        </div>
      </div>
    </article>
  )
}

export default VideoCard
