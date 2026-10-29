// Định dạng thời lượng thật; thiếu metadata thì để trống, không tạo số phút giả.
export function formatVideoDuration(seconds?: number | null): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return ''
  const total = Math.max(1, Math.round(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor(total / 60) % 60
  const remainder = String(total % 60).padStart(2, '0')
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${remainder}` : `${minutes}:${remainder}`
}

// Preview chỉ giúp người đăng xem trước; backend vẫn tự đọc lại tệp để quyết định metadata lưu.
export function readLocalVideoDuration(file: File, signal: AbortSignal): Promise<number | null> {
  return new Promise(resolve => {
    if (signal.aborted) { resolve(null); return }
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    const cleanup = () => {
      clearTimeout(timeout)
      signal.removeEventListener('abort', abort)
      video.onloadedmetadata = null
      video.onerror = null
      video.removeAttribute('src')
      video.load()
      URL.revokeObjectURL(url)
    }
    const finish = (value: number | null) => { cleanup(); resolve(value) }
    const abort = () => finish(null)
    const timeout = setTimeout(() => finish(null), 15000)
    signal.addEventListener('abort', abort, { once: true })
    video.preload = 'metadata'
    video.onloadedmetadata = () => finish(Number.isFinite(video.duration) && video.duration > 0 ? video.duration : null)
    video.onerror = () => finish(null)
    video.src = url
  })
}
