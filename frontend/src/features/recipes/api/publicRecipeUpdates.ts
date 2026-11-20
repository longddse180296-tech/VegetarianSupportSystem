import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { resolveApiUrl } from '../../../shared/api/apiClient'

// Kênh public không gửi token hoặc nhận dữ liệu riêng của Admin.
export function subscribePublicRecipeUpdates(onChanged: () => void) {
  const hub = new HubConnectionBuilder()
    .withUrl(resolveApiUrl('/api/hubs/public-recipes'))
    .withAutomaticReconnect([0, 2000, 10000, 30000])
    .configureLogging(LogLevel.None)
    .build()
  let disposed = false
  let refreshTimer: ReturnType<typeof setTimeout> | undefined
  let retryTimer: ReturnType<typeof setTimeout> | undefined

  // Gộp thông báo liên tiếp và lấy lại dữ liệu sau khi kết nối để bù các lần bị mất mạng.
  const refresh = () => {
    if (disposed) return
    clearTimeout(refreshTimer)
    refreshTimer = setTimeout(() => { if (!disposed) onChanged() }, 150)
  }
  const start = async () => {
    try {
      await hub.start()
      if (disposed) { await hub.stop(); return }
      refresh()
    } catch {
      if (!disposed) retryTimer = setTimeout(() => { void start() }, 5000)
    }
  }
  hub.on('RecipesChanged', refresh)
  hub.onreconnected(refresh)
  hub.onclose(() => {
    if (!disposed) retryTimer = setTimeout(() => { void start() }, 5000)
  })
  void start()

  return () => {
    disposed = true
    clearTimeout(refreshTimer)
    clearTimeout(retryTimer)
    hub.off('RecipesChanged', refresh)
    void hub.stop().catch(() => {})
  }
}
