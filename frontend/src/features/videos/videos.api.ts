// Compatibility exports use the real backend API without artificial latency.
export * from './api/videoApi'
export { getVideos as fetchVideos } from './api/videoApi'
export { DEFAULT_VIDEO_FILTER } from './types/video.types'
export type {
  UploadVideoFormState, VideoCategory, VideoItem, VideoListFilter,
  VideoListResponse, VideoModerationStatus, VideoSortOption,
} from './types/video.types'
