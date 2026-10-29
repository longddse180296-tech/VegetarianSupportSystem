// Chức năng: công thức và định lượng nguyên liệu. Quản lý trạng thái, vòng đời yêu cầu và dữ liệu được tái sử dụng.
import { useEffect, useRef, useState } from 'react'
import { HubConnectionBuilder, HubConnectionState, LogLevel, type HubConnection } from '@microsoft/signalr'
import { getStoredToken, resolveApiUrl } from '../../../../shared/api/apiClient'
import type { RecipeNutritionInput, RecipeNutritionResult } from '../api/recipeNutrition'

// Tính hoặc tổng hợp chỉ số từ dữ liệu đầu vào của tính năng (useRecipeNutrition); thuộc công thức và định lượng nguyên liệu.
export function useRecipeNutrition(input: RecipeNutritionInput | null) {
  // Giữ tham chiếu giữa các lần render để quản lý yêu cầu hoặc phần tử giao diện.
  const connection = useRef<HubConnection | null>(null)
  // Lưu dữ liệu và trạng thái thao tác của công thức và định lượng nguyên liệu trong vòng đời màn hình.
  const [retry, setRetry] = useState(0)
  const [link, setLink] = useState({ connected: false, failed: false, generation: 0 })
  const [calculation, setCalculation] = useState<{
    key: string; generation: number; result: RecipeNutritionResult | null; error: boolean
  } | null>(null)
  const key = JSON.stringify(input)

  // Đồng bộ dữ liệu theo thay đổi đầu vào; hủy hoặc bỏ qua kết quả cũ khi màn hình thay đổi.
  useEffect(() => {
    let active = true
    const hub = new HubConnectionBuilder()
      .withUrl(resolveApiUrl('/api/hubs/recipe-nutrition'), { accessTokenFactory: () => getStoredToken() || '' })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(LogLevel.None)
      .build()
    connection.current = hub
    // Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (connected); thuộc công thức và định lượng nguyên liệu.
    const connected = () => {
      if (active) setLink(current => ({ connected: true, failed: false, generation: current.generation + 1 }))
    }
    hub.onreconnecting(() => { if (active) setLink(current => ({ ...current, connected: false, failed: false })) })
    hub.onreconnected(connected)
    hub.onclose(() => { if (active) setLink(current => ({ ...current, connected: false, failed: true })) })
    void hub.start().then(connected).catch(() => {
      if (active) setLink(current => ({ ...current, connected: false, failed: true }))
    })
    return () => {
      active = false
      if (connection.current === hub) connection.current = null
      void hub.stop().catch(() => {})
    }
  }, [retry])

  // Đồng bộ dữ liệu theo thay đổi đầu vào; hủy hoặc bỏ qua kết quả cũ khi màn hình thay đổi.
  useEffect(() => {
    if (key === 'null' || !link.connected) return
    let active = true
    const timer = setTimeout(() => {
      const hub = connection.current
      if (!hub || hub.state !== HubConnectionState.Connected) return
      void hub.invoke<RecipeNutritionResult>('Calculate', JSON.parse(key)).then(result => {
        if (active) setCalculation({ key, generation: link.generation, result, error: false })
      }).catch(() => {
        if (active) setCalculation({ key, generation: link.generation, result: null, error: true })
      })
    }, 300)
    return () => { active = false; clearTimeout(timer) }
  }, [key, link.connected, link.generation])

  const current = calculation?.key === key && calculation.generation === link.generation && link.connected ? calculation : null
  return {
    result: input ? current?.result ?? null : null,
    loading: !!input && !current && !link.failed,
    error: link.failed ? 'Mất kết nối tính dinh dưỡng. Vui lòng kết nối lại.'
      : current?.error ? 'Không thể tính dinh dưỡng. Kiểm tra dữ liệu hoặc thử kết nối lại.' : null,
    retry: () => setRetry(current => current + 1),
  }
}
