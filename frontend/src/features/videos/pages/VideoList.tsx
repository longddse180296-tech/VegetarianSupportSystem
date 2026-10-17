import { useEffect, useMemo, useState } from 'react'
import { Play, Search, Sparkles, Upload, Video as VideoIcon } from 'lucide-react'
import { Badge, PageHeading, Button, EmptyState, Input, Select } from '../../../shared/components'
import AlertError from '../../../shared/components/AlertError'
import { getStoredToken } from '../../../shared/api/apiClient'
import { getPublicFeaturedContent, type FeaturedContentItem } from '../../../shared/api/featuredContentApi'
import { listVideoCategories, listVideos, type VideoCategoryOption, type VideoDetails } from '../api/backendVideos'

interface Props {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

export default function VideoList({ onNavigate }: Props) {
  const [videos, setVideos] = useState<VideoDetails[]>([])
  const [featuredVideos, setFeaturedVideos] = useState<FeaturedContentItem[]>([])
  const [categories, setCategories] = useState<VideoCategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let active = true
    void Promise.all([
      listVideos(),
      listVideoCategories().catch(() => []),
      getPublicFeaturedContent('Video').catch(() => []),
    ])
      .then(([rows, categoryRows, featuredRows]) => {
        if (!active) return
        setVideos(rows)
        setCategories(categoryRows)
        setFeaturedVideos(featuredRows)
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Không thể tải video.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [retry])

  const showFeatured = page === 1 && category === 'all' && !search.trim() && sort === 'newest' && featuredVideos.length > 0
  const featuredIds = useMemo(() => new Set(featuredVideos.map((v) => v.id)), [featuredVideos])

  const results = useMemo(() => {
    const filtered = videos
      .filter((video) => category === 'all' || video.categoryId === category)
      .filter((video) => `${video.title} ${video.description}`.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim()))
      .filter((video) => !showFeatured || !featuredIds.has(video.id))

    return filtered.sort((a, b) => sort === 'views'
      ? b.viewCount - a.viewCount
      : new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime())
  }, [videos, category, search, sort, showFeatured, featuredIds])

  const pageCount = Math.max(1, Math.ceil(results.length / 9))
  const currentPage = Math.min(page, pageCount)
  const visible = results.slice((currentPage - 1) * 9, currentPage * 9)
  const categoryName = (id: string | null) => categories.find((item) => item.id === id)?.name ?? 'Video'

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-slate-900">
      <main className="ui-page-container py-8">
        <PageHeading
          title="Video nấu ăn chay"
          description="Khám phá video nấu ăn và kinh nghiệm ăn chay từ cộng đồng."
          breadcrumbs={[{ label: 'Trang chủ', onClick: () => onNavigate?.('/') }, { label: 'Video' }]}
          eyebrow={<Badge icon={<VideoIcon />}>Kho video cộng đồng</Badge>}
          actions={<Button leftIcon={<Upload size={16} />} onClick={() => onNavigate?.(getStoredToken() ? '/profile/my-videos' : '/login?returnUrl=%2Fprofile%2Fmy-videos')}>Đăng video</Button>}
        />

        <div className="mb-7 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_220px_180px]">
          <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Tìm video" leftIcon={<Search size={16} />} fullWidth />
          <Select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1) }}
            options={[{ value: 'all', label: 'Tất cả danh mục' }, ...categories.map((item) => ({ value: item.id, label: item.name }))]} fullWidth />
          <Select value={sort} onChange={(event) => setSort(event.target.value)} options={[{ value: 'newest', label: 'Mới nhất' }, { value: 'views', label: 'Xem nhiều nhất' }]} fullWidth />
        </div>

        {/* =========================================================================
         * 1. SECTION: VIDEO NỔI BẬT (FULL-WIDTH HERO, RỘNG BẰNG 3 VIDEO)
         * ========================================================================= */}
        {showFeatured && (
          <section className="mb-8 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Video nổi bật
              </h2>
            </div>

            <div className="space-y-4">
              {featuredVideos.map((video) => (
                <article
                  key={video.id}
                  onClick={() => onNavigate?.(`/videos/${video.id}`)}
                  className="group flex flex-col md:flex-row overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition duration-200 cursor-pointer text-left"
                >
                  <div className="relative aspect-video md:w-1/2 lg:w-7/12 shrink-0 overflow-hidden bg-slate-900">
                    {video.imageUrl ? (
                      <img
                        src={video.imageUrl}
                        alt={video.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105 opacity-90"
                      />
                    ) : (
                      <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-white">Chưa có ảnh bìa</div>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-emerald-700 shadow-xl group-hover:scale-110 transition duration-200">
                        <Play size={26} fill="currentColor" className="ml-1" />
                      </span>
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-6 sm:p-8 space-y-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="ui-badge ui-badge-green font-semibold">
                          {video.dietaryTypes?.[0] || 'Món chay chọn lọc'}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug group-hover:text-emerald-700 transition">
                        {video.title}
                      </h3>
                      <p className="mt-3 text-sm text-slate-600 line-clamp-3 leading-relaxed">
                        {video.description || 'Video hướng dẫn nấu món chay chi tiết với các bước thực hiện dễ hiểu và bí quyết chế biến chuẩn vị.'}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{video.authorName || 'Cộng đồng'}</span>
                      <span>{(video.viewCount ?? 0).toLocaleString()} lượt xem {video.publishedAt ? `· ${new Date(video.publishedAt).toLocaleDateString('vi-VN')}` : ''}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* =========================================================================
         * 2. SECTION: TẤT CẢ VIDEO
         * ========================================================================= */}
        {showFeatured && visible.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900">Tất cả video</h3>
          </div>
        )}

        {loading && <p className="py-16 text-center text-slate-500">Đang tải video...</p>}
        {error && <AlertError title="Không thể tải video" message={error} onRetry={() => { setLoading(true); setError(null); setRetry((value) => value + 1) }} />}
        {!loading && !error && visible.length === 0 && !showFeatured && (
          <EmptyState title="Chưa có video công khai" description="Hãy quay lại khi có video được Admin duyệt." />
        )}
        {!loading && !error && visible.length > 0 && (
          <>
            {!showFeatured && <p className="mb-4 text-sm text-slate-500">{results.length} video</p>}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((video) => (
                <article key={video.id} className="ui-card ui-content-card overflow-hidden border border-slate-200 bg-white hover:border-slate-300">
                  <button type="button" onClick={() => onNavigate?.(`/videos/${video.id}`)} className="relative block aspect-video w-full bg-slate-100">
                    {video.thumbnailUrl ? <img src={video.thumbnailUrl} alt={video.title} className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-slate-500">Chưa có ảnh bìa</span>}
                    <span className="absolute inset-0 flex items-center justify-center"><span className="rounded-full bg-white p-3 text-emerald-700 shadow-lg"><Play size={22} fill="currentColor" /></span></span>
                  </button>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="ui-badge ui-badge-green">{categoryName(video.categoryId)}</span>
                      {video.dietType && (
                        <span className="ui-badge ui-badge-green">
                          {video.dietType}
                        </span>
                      )}
                    </div>
                    <h2 className="ui-card-title mt-2 line-clamp-2"><button onClick={() => onNavigate?.(`/videos/${video.id}`)} className="text-left hover:text-emerald-700">{video.title}</button></h2>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{video.description}</p>
                    <p className="mt-4 text-xs text-slate-500">{video.viewCount.toLocaleString()} lượt xem · {new Date(video.createdAtUtc).toLocaleDateString('vi-VN')}</p>
                  </div>
                </article>
              ))}
            </div>
            {pageCount > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button variant="outline" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Trước</Button>
                <span className="text-sm">{currentPage} / {pageCount}</span>
                <Button variant="outline" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Sau</Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
