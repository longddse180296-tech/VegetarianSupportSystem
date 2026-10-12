import { useEffect, useMemo, useState } from 'react'
import { UserProfileShell } from '../../profile/components/UserProfileShell'
import { Button, EmptyState, Input, Modal, Select, Textarea } from '../../../shared/components'
import AlertError from '../../../shared/components/AlertError'
import {
  createVideo,
  getPrivateMediaUrl,
  listVideoCategories,
  listVideos,
  submitVideo,
  updateVideo,
  uploadVideoFile,
  type VideoCategoryOption,
  type VideoDetails,
} from '../api/backendVideos'

interface Props {
  onNavigate?: (path: string) => void
}

interface VideoForm {
  title: string
  description: string
  categoryId: string
  media: File | null
  thumbnail: File | null
  submitNow: boolean
}

const emptyForm = (): VideoForm => ({
  title: '', description: '', categoryId: '', media: null, thumbnail: null, submitNow: true,
})

function statusOf(video: VideoDetails): { key: string; label: string; color: string } {
  switch (video.adminReviewStatus) {
    case 'Published': return { key: 'published', label: 'Đã xuất bản', color: 'bg-emerald-100 text-emerald-800' }
    case 'PendingAdminReview':
    case 'Submitted': return { key: 'pending', label: 'Chờ Admin duyệt', color: 'bg-amber-100 text-amber-800' }
    case 'RevisionRequested': return { key: 'draft', label: 'Cần chỉnh sửa', color: 'bg-orange-100 text-orange-800' }
    case 'Rejected': return { key: 'draft', label: 'Bị từ chối', color: 'bg-red-100 text-red-800' }
    case 'Removed': return { key: 'draft', label: 'Đã gỡ', color: 'bg-gray-100 text-gray-700' }
    default: return { key: 'draft', label: 'Bản nháp', color: 'bg-slate-100 text-slate-700' }
  }
}

function validateFile(file: File, thumbnail: boolean): string | null {
  const max = (thumbnail ? 10 : 200) * 1024 * 1024
  const types = thumbnail ? ['image/jpeg', 'image/png', 'image/webp'] : ['video/mp4', 'video/webm']
  if (!types.includes(file.type)) return thumbnail ? 'Ảnh bìa phải là JPG, PNG hoặc WEBP.' : 'Video phải là MP4 hoặc WEBM.'
  if (file.size === 0 || file.size > max) return `Tệp phải lớn hơn 0 và không quá ${thumbnail ? 10 : 200} MB.`
  return null
}

function VideoThumbnail({ video }: { video: VideoDetails }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!video.thumbnailUrl) return
    if (video.adminReviewStatus === 'Published') return
    let active = true
    let objectUrl: string | null = null
    void getPrivateMediaUrl(video.thumbnailUrl).then((value) => {
      objectUrl = value
      if (active) setUrl(value)
      else URL.revokeObjectURL(value)
    }).catch(() => undefined)
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [video.id, video.thumbnailUrl, video.adminReviewStatus])
  const source = video.adminReviewStatus === 'Published' ? video.thumbnailUrl : url
  return <div className="flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-sm text-slate-500 sm:w-48">
    {source ? <img src={source} alt={video.title} className="h-full w-full object-cover" /> : 'Chưa có ảnh bìa'}
  </div>
}

export default function MyVideosPage({ onNavigate }: Props) {
  const [videos, setVideos] = useState<VideoDetails[]>([])
  const [categories, setCategories] = useState<VideoCategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [tab, setTab] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<VideoDetails | null>(null)
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null)
  const [form, setForm] = useState<VideoForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    void Promise.all([listVideos(true), listVideoCategories().catch(() => [])])
      .then(([rows, categoryRows]) => {
        if (!active) return
        setVideos(rows)
        setCategories(categoryRows)
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Không thể tải video.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [refresh])

  const categoryName = (id: string | null) => categories.find((item) => item.id === id)?.name ?? 'Chưa chọn danh mục'
  const filtered = useMemo(() => videos
    .filter((video) => tab === 'all' || statusOf(video).key === tab)
    .filter((video) => categoryFilter === 'all' || video.categoryId === categoryFilter)
    .filter((video) => `${video.title} ${video.description}`.toLocaleLowerCase().includes(keyword.toLocaleLowerCase().trim()))
    .sort((a, b) => new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime()),
  [videos, tab, categoryFilter, keyword])
  const pageCount = Math.max(1, Math.ceil(filtered.length / 6))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice((currentPage - 1) * 6, currentPage * 6)

  const startCreate = () => {
    setEditing(null)
    setSavedDraftId(null)
    setForm(emptyForm())
    setError(null)
    setOpen(true)
  }

  const startEdit = (video: VideoDetails) => {
    setEditing(video)
    setSavedDraftId(null)
    setForm({ title: video.title, description: video.description, categoryId: video.categoryId ?? '', media: null, thumbnail: null, submitNow: false })
    setError(null)
    setOpen(true)
  }

  const save = async () => {
    const title = form.title.trim()
    if (!title) { setError('Vui lòng nhập tiêu đề video.'); return }
    if (form.media) {
      const fileError = validateFile(form.media, false)
      if (fileError) { setError(fileError); return }
    }
    if (form.thumbnail) {
      const fileError = validateFile(form.thumbnail, true)
      if (fileError) { setError(fileError); return }
    }
    if (form.submitNow && !form.media && !editing?.mediaUrl && !savedDraftId) {
      setError('Chọn tệp MP4 hoặc WEBM trước khi gửi duyệt.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      let video: VideoDetails
      if (editing) {
        video = await updateVideo(editing.id, title, form.description.trim(), form.categoryId || null)
      } else if (savedDraftId) {
        video = await updateVideo(savedDraftId, title, form.description.trim(), form.categoryId || null)
      } else {
        video = await createVideo(title, form.description.trim(), form.categoryId || null)
        setSavedDraftId(video.id)
      }
      if (form.media) video = await uploadVideoFile(video.id, form.media)
      if (form.thumbnail) video = await uploadVideoFile(video.id, form.thumbnail, true)
      if (form.submitNow) {
        if (video.uploadStatus !== 'Ready') throw new Error('Video chưa tải lên thành công. Bản nháp đã được lưu để thử lại.')
        await submitVideo(video.id)
      }
      setNotice(form.submitNow ? 'Video đã được gửi tới hàng đợi Admin duyệt.' : 'Bản nháp đã được lưu trên server.')
      setOpen(false)
      setRefresh((value) => value + 1)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể lưu video.')
      setRefresh((value) => value + 1)
    } finally {
      setSaving(false)
    }
  }

  const sendDraft = async (video: VideoDetails) => {
    setError(null)
    try {
      await submitVideo(video.id)
      setNotice('Video đã được gửi tới hàng đợi Admin duyệt.')
      setRefresh((value) => value + 1)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể gửi duyệt video.')
    }
  }

  return (
    <UserProfileShell
      activeTab="my-videos"
      breadcrumbs={[{ label: 'Trang chủ', path: '/' }, { label: 'Tài khoản', path: '/profile' }, { label: 'Video của tôi' }]}
      statBadge={{ count: videos.length, label: 'Video' }}
      onNavigate={onNavigate}
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Video của tôi</h1>
            <p className="mt-1 text-sm text-slate-500">Tải video lên, lưu bản nháp và gửi Admin duyệt.</p>
          </div>
          <Button variant="primary" onClick={startCreate}>+ Tải video mới</Button>
        </div>

        {notice && <p className="my-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
        {error && <div className="my-4"><AlertError title="Không thể xử lý video" message={error} onRetry={() => setRefresh((value) => value + 1)} /></div>}

        <div className="my-6 flex flex-wrap gap-2">
          {([['all', 'Tất cả'], ['published', 'Đã xuất bản'], ['pending', 'Chờ duyệt'], ['draft', 'Bản nháp / cần sửa']] as const).map(([key, label]) => (
            <button key={key} type="button" onClick={() => { setTab(key); setPage(1) }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === key ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600 hover:bg-slate-50'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <Input value={keyword} onChange={(event) => { setKeyword(event.target.value); setPage(1) }} placeholder="Tìm theo tiêu đề hoặc mô tả" fullWidth />
          <Select value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setPage(1) }}
            options={[{ value: 'all', label: 'Tất cả danh mục' }, ...categories.map((item) => ({ value: item.id, label: item.name }))]} fullWidth />
        </div>

        {loading ? <p className="py-8 text-center text-slate-500">Đang tải video...</p> : null}
        {!loading && !error && visible.length === 0 && <EmptyState title="Chưa có video" description="Tải video đầu tiên hoặc thay đổi bộ lọc." actionLabel="Tải video mới" onAction={startCreate} />}
        {!loading && visible.length > 0 && (
          <div className="space-y-4">
            {visible.map((video) => {
              const status = statusOf(video)
              const editable = status.key !== 'pending'
              return <article key={video.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row">
                <VideoThumbnail video={video} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.color}`}>{status.label}</span>
                    <span className="text-xs text-slate-500">{categoryName(video.categoryId)}</span>
                    <span className="text-xs text-slate-500">{video.uploadStatus === 'Ready' ? 'Tệp đã tải lên' : 'Chưa có tệp phát được'}</span>
                  </div>
                  <h2 className="mt-2 text-lg font-bold text-slate-900">{video.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{video.description}</p>
                  {video.adminReason && <p className="mt-2 rounded-lg bg-orange-50 p-2 text-sm text-orange-800">Phản hồi Admin: {video.adminReason}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {status.key === 'published' && <Button size="sm" variant="outline" onClick={() => onNavigate?.(`/videos/${video.id}`)}>Xem video</Button>}
                    {editable && <Button size="sm" variant="outline" onClick={() => startEdit(video)}>Chỉnh sửa / tải tệp</Button>}
                    {editable && video.uploadStatus === 'Ready' && status.key !== 'published' &&
                      <Button size="sm" variant="primary" onClick={() => void sendDraft(video)}>Gửi Admin duyệt</Button>}
                  </div>
                </div>
              </article>
            })}
          </div>
        )}
        {pageCount > 1 && <div className="mt-6 flex items-center justify-end gap-3 text-sm">
          <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Trước</Button>
          <span>{currentPage} / {pageCount}</span>
          <Button variant="outline" size="sm" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Sau</Button>
        </div>}
      </div>

      <Modal isOpen={open} onClose={() => { if (!saving) setOpen(false) }}
        title={editing ? 'Chỉnh sửa video' : 'Tải video mới'}
        description="Video sẽ chỉ công khai sau khi Admin duyệt. MP4/WEBM tối đa 200 MB."
        footer={<div className="flex justify-end gap-3">
          <Button variant="outline" disabled={saving} onClick={() => setOpen(false)}>Đóng</Button>
          <Button variant="primary" isLoading={saving} onClick={() => void save()}>{form.submitNow ? 'Lưu và gửi duyệt' : 'Lưu bản nháp'}</Button>
        </div>}
      >
        <div className="space-y-4 py-2">
          {error && <AlertError title="Không thể lưu video" message={error} />}
          {savedDraftId && <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-800">Bản nháp đã được tạo trên server. Có thể thử tải tệp lại.</p>}
          <Input label="Tiêu đề" required value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} fullWidth />
          <Textarea label="Mô tả" value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} rows={3} fullWidth />
          <Select label="Danh mục" value={form.categoryId} onChange={(event) => setForm((value) => ({ ...value, categoryId: event.target.value }))}
            options={[{ value: '', label: 'Chưa chọn' }, ...categories.map((item) => ({ value: item.id, label: item.name }))]} fullWidth />
          <label className="block text-sm font-semibold text-slate-700">Tệp video (MP4/WEBM, tối đa 200 MB)
            <input className="mt-2 block w-full text-sm" type="file" accept=".mp4,.webm,video/mp4,video/webm"
              onChange={(event) => setForm((value) => ({ ...value, media: event.target.files?.[0] ?? null }))} />
          </label>
          {editing?.mediaUrl && <p className="text-xs text-emerald-700">Video hiện tại đã có tệp. Chọn tệp mới để thay thế.</p>}
          <label className="block text-sm font-semibold text-slate-700">Ảnh bìa (JPG/PNG/WEBP, tối đa 10 MB)
            <input className="mt-2 block w-full text-sm" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={(event) => setForm((value) => ({ ...value, thumbnail: event.target.files?.[0] ?? null }))} />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.submitNow} onChange={(event) => setForm((value) => ({ ...value, submitNow: event.target.checked }))} />
            Gửi Admin duyệt sau khi tải tệp thành công
          </label>
        </div>
      </Modal>
    </UserProfileShell>
  )
}
