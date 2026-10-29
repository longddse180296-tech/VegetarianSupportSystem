// Chức năng: lưu công thức từ trang Công thức/Tủ bếp vào cùng mục đã lưu của tài khoản hiện tại.
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth'
import { listAllFavorites, toggleFavorite, type FavoriteSaveSource } from '../api/favoritesApi'

// Trạng thái gắn với userId để không hiển thị danh sách của tài khoản trước khi đổi phiên.
export function useRecipeSaves(source: FavoriteSaveSource) {
  const { user } = useAuth()
  const owner = user?.id ?? null
  const [revision, setRevision] = useState(0)
  const [snapshot, setSnapshot] = useState<{ owner: string | null; revision: number; ids: Set<string>; error: string | null }>({ owner: null, revision: -1, ids: new Set(), error: null })
  const [pending, setPending] = useState<Set<string>>(new Set())
  const requests = useRef(new Set<string>())
  const currentOwner = useRef(owner)
  useEffect(() => { currentOwner.current = owner }, [owner])

  // Tải trạng thái thật; dữ liệu thiếu/lỗi không bị coi là đã bỏ lưu tất cả.
  useEffect(() => {
    if (!owner) return
    const controller = new AbortController()
    void listAllFavorites('Recipe', controller.signal).then(items => {
      if (!controller.signal.aborted) setSnapshot({ owner, revision, ids: new Set(items.map(item => item.targetId.toLowerCase())), error: null })
    }).catch(error => {
      if (!controller.signal.aborted) setSnapshot({ owner, revision, ids: new Set(), error: error instanceof Error ? error.message : 'Chưa tải được công thức đã lưu.' })
    })
    return () => controller.abort()
  }, [owner, revision])

  const loading = !!owner && (snapshot.owner !== owner || snapshot.revision !== revision)
  const error = snapshot.owner === owner ? snapshot.error : null
  const ready = !loading && !error
  const isSaved = (id: string) => snapshot.owner === owner && snapshot.ids.has(id.toLowerCase())
  const isSaving = (id: string) => pending.has(`${owner}:${id.toLowerCase()}`)

  // Chỉ cập nhật trạng thái sau khi máy chủ xác nhận; chặn bấm lặp trên cùng công thức.
  const toggle = async (id: string): Promise<boolean> => {
    if (!owner) throw new Error('Vui lòng đăng nhập để lưu công thức.')
    if (!ready) throw new Error('Vui lòng tải lại trạng thái công thức đã lưu trước khi tiếp tục.')
    const key = `${owner}:${id.toLowerCase()}`
    if (requests.current.has(key)) return isSaved(id)
    requests.current.add(key)
    setPending(current => new Set(current).add(key))
    try {
      const next = await toggleFavorite('Recipe', id, !isSaved(id), source)
      if (currentOwner.current === owner) setSnapshot(current => {
        if (current.owner !== owner) return current
        const ids = new Set(current.ids)
        if (next) ids.add(id.toLowerCase()); else ids.delete(id.toLowerCase())
        return { ...current, ids }
      })
      return next
    } finally {
      requests.current.delete(key)
      setPending(current => { const next = new Set(current); next.delete(key); return next })
    }
  }
  return { authenticated: !!owner, ready, loading, error, isSaved, isSaving, toggle, reload: () => setRevision(current => current + 1) }
}
