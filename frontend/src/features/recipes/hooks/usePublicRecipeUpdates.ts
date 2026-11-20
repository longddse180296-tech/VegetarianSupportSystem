import { useEffect, useRef } from 'react'
import { subscribePublicRecipeUpdates } from '../api/publicRecipeUpdates'

export function usePublicRecipeUpdates(onChanged: () => void) {
  const latest = useRef(onChanged)
  useEffect(() => { latest.current = onChanged }, [onChanged])
  // Thay đổi bộ lọc chỉ đổi callback, không mở lại kết nối SignalR.
  useEffect(() => subscribePublicRecipeUpdates(() => latest.current()), [])
}
