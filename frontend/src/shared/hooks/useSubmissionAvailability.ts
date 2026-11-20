import { useEffect, useState } from 'react'
import { useAuth } from '../../features/auth'
import { apiClient } from '../api/apiClient'

interface Availability { articlePending: boolean; videoPending: boolean; unavailable?: boolean }

export function useSubmissionAvailability() {
  const { user } = useAuth()
  const [state, setState] = useState<(Availability & { ownerId: string }) | null>(null)
  useEffect(() => {
    if (!user?.id) return
    let active = true
    let pending = false
    const ownerId = user.id
    const refresh = async () => {
      if (pending || document.visibilityState === 'hidden') return
      pending = true
      try {
        const availability = await apiClient.get<Availability>('/api/moderation/submissions/availability')
        if (active) setState({ ...availability, ownerId })
      } catch {
        // Không khẳng định tài khoản được gửi thêm khi chưa kiểm tra được trạng thái.
        if (active) setState({ ownerId, articlePending: true, videoPending: true, unavailable: true })
      } finally { pending = false }
    }
    const listener = () => { void refresh() }
    void refresh()
    const timer = window.setInterval(listener, 30_000)
    window.addEventListener('focus', listener)
    window.addEventListener('owner-submissions-changed', listener)
    document.addEventListener('visibilitychange', listener)
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', listener); window.removeEventListener('owner-submissions-changed', listener); document.removeEventListener('visibilitychange', listener) }
  }, [user?.id])
  const current = state?.ownerId === user?.id ? state : null
  return { articlePending: !!user && (current?.articlePending ?? true), videoPending: !!user && (current?.videoPending ?? true), loading: !!user && !current, unavailable: current?.unavailable ?? false }
}
