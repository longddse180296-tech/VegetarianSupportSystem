// Chức năng: video, bản nháp và nội dung công khai. Cấu hình hoặc hỗ trợ luồng xử lý của các thành phần trong ứng dụng.
// Pages
export { default as VideoList } from './pages/VideoList'
export { default as VideoListPage } from './pages/VideoList'
export { default as VideosPage } from './pages/VideosPage'
export { default as VideoDetail } from './pages/VideoDetail'
export { default as VideoDetailPage } from './pages/VideoDetail'
export { default as VideoCreatePage } from './pages/VideoCreatePage'
export { default as MyVideosPage } from './pages/MyVideos'

// Components
export { VideoCard } from './components/VideoCard'
export { UploadVideoModal } from './components/UploadVideoModal'

// Types & API
export * from './types/video.types'
export * from './api/videoApi'
