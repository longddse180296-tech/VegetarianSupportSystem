import { useState } from 'react'
import { ArrowUpRight, FileText, LoaderCircle, MapPin, Pin, PinOff, RefreshCw, Video } from 'lucide-react'
import {
  setFeaturedPin, type FeaturedContentItem, type FeaturedContentPage, type FeaturedContentType,
} from '../../../../shared/api/featuredContentApi'
import { useApiData } from '../../hooks/useApiData'
import { errorMessage, fieldClass } from '../../utils/apiUi'

const groups = [
  { type: 'Restaurant', title: 'Nhà hàng nổi bật', icon: MapPin, path: '/admin/restaurants', tone: 'bg-teal-50 text-teal-700' },
  { type: 'Video', title: 'Video nổi bật', icon: Video, path: '/admin/videos', tone: 'bg-violet-50 text-violet-700' },
  { type: 'Article', title: 'Bài viết nổi bật', icon: FileText, path: '/admin/articles', tone: 'bg-indigo-50 text-indigo-700' },
] satisfies Array<{ type: FeaturedContentType; title: string; icon: typeof MapPin; path: string; tone: string }>

function FeaturedGroup({ group, onNavigate }: { group: typeof groups[number]; onNavigate: (path: string) => void }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const query = new URLSearchParams({ contentType: group.type, search, page: String(page), pageSize: '5' })
  const result = useApiData<FeaturedContentPage>(`/api/admin/featured-content?${query}`)
  const pageCount = Math.max(1, Math.ceil((result.data?.totalCount ?? 0) / 5))

  async function togglePin(item: FeaturedContentItem) {
    if (savingId) return
    setSavingId(item.id)
    setError(null)
    setNotice('')
    try {
      await setFeaturedPin(group.type, item.id, !item.isPinned)
      // Pinning changes the backend sort order; fetch page one after saving.
      setPage(1)
      result.reload()
      setNotice(`${item.isPinned ? 'Đã bỏ ghim' : 'Đã ghim'} “${item.title}” trên trang chủ.`)
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${group.tone}`}><group.icon aria-hidden="true" className="h-5 w-5" /></span>
          <h3 className="font-semibold text-slate-900">{group.title}</h3>
        </div>
        <button type="button" aria-label={`Làm mới ${group.title.toLowerCase()}`} disabled={result.loading || !!savingId} onClick={result.reload} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-emerald-700 disabled:opacity-40"><RefreshCw aria-hidden="true" className="h-4 w-4" /></button>
      </div>
      <input type="search" aria-label={`Tìm ${group.title.toLowerCase()}`} placeholder="Tìm nội dung để ghim..." disabled={!!savingId} maxLength={120} className={`${fieldClass} mb-4`} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
      {(error || result.error) && <p role="alert" className="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error || result.error}</p>}
      <p role="status" className="mb-2 text-xs text-emerald-700">{notice}</p>
      <div className="flex-1" aria-busy={result.loading}>
        {result.loading ? <p role="status" className="py-6 text-center text-sm text-slate-400">Đang tải nội dung...</p> : (
          <ul className="space-y-3">
            {result.data?.items.map((item) => {
              const PinIcon = item.isPinned ? PinOff : Pin
              return (
                <li key={item.id} className={`flex flex-wrap items-center gap-3 rounded-xl border p-3.5 ${item.isPinned ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-100 bg-slate-50/60'}`}>
                  <div className="min-w-0 flex-1 basis-32">
                    <p className="break-words text-sm font-semibold text-slate-800">{item.title}</p>
                    <p className="mt-1 line-clamp-2 break-words text-xs text-slate-500">{item.address || item.description || 'Đã công khai'}</p>
                  </div>
                  <button type="button" aria-pressed={item.isPinned} aria-label={`${item.isPinned ? 'Bỏ ghim' : 'Ghim'} ${item.title}`} disabled={!!savingId} onClick={() => void togglePin(item)} className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold shadow-sm disabled:cursor-wait disabled:opacity-50 ${item.isPinned ? 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700'}`}>
                    {savingId === item.id ? <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 motion-safe:animate-spin" /> : <PinIcon aria-hidden="true" className="h-3.5 w-3.5" />}
                    {item.isPinned ? 'Đã ghim' : 'Ghim'}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        {!result.loading && !result.error && !result.data?.items.length && <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">{search ? 'Không tìm thấy nội dung phù hợp.' : 'Chưa có nội dung công khai để ghim.'}</p>}
      </div>
      {(pageCount > 1 || page > 1) && <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>Trang {page}{page <= pageCount ? `/${pageCount}` : ''}</span>
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1 || result.loading || !!savingId} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-slate-200 px-2 py-1.5 disabled:opacity-40">Trước</button>
          <button type="button" disabled={page >= pageCount || result.loading || !!savingId} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-200 px-2 py-1.5 disabled:opacity-40">Sau</button>
        </div>
      </div>}
      <button type="button" onClick={() => onNavigate(group.path)} className="mt-5 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-900">Quản lý nội dung<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></button>
    </article>
  )
}

export function FeaturedContent({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <section aria-labelledby="featured-content-title" className="space-y-5">
      <div>
        <h2 id="featured-content-title" className="text-lg font-bold text-slate-900">Nội dung nổi bật</h2>
        <p className="mt-1 text-sm text-slate-500">Chọn nội dung công khai để giới thiệu trên trang chủ. Các thay đổi được lưu ngay.</p>
      </div>
      <div className="grid items-stretch gap-5 xl:grid-cols-3">{groups.map((group) => <FeaturedGroup key={group.type} group={group} onNavigate={onNavigate} />)}</div>
    </section>
  )
}
