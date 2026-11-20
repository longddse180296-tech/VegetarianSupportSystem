import { useEffect, useRef } from 'react'

// Cập nhật phản hồi khi quay lại tab hoặc sau 30 giây, giữ nguyên danh sách đang xem trong lúc tải.
export function useOwnerReviewUpdates<T>(key: string, fetchLatest: () => Promise<T>, onUpdated: (data: T) => void) {
  const handlers = useRef({ fetchLatest, onUpdated })
  useEffect(() => { handlers.current = { fetchLatest, onUpdated } }, [fetchLatest, onUpdated])
  useEffect(() => {
    let active = true
    let pending = false
    const refresh = async () => {
      if (pending || document.visibilityState === 'hidden') return
      pending = true
      try {
        const updated = await handlers.current.fetchLatest()
        if (active) handlers.current.onUpdated(updated)
      } catch { /* Giữ dữ liệu hiện tại; nút làm mới của trang vẫn hiển thị lỗi khi tải thủ công. */ }
      finally { pending = false }
    }
    const onRefresh = () => { void refresh() }
    const timer = window.setInterval(onRefresh, 30_000)
    window.addEventListener('focus', onRefresh)
    document.addEventListener('visibilitychange', onRefresh)
    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener('focus', onRefresh)
      document.removeEventListener('visibilitychange', onRefresh)
    }
  }, [key])
}
