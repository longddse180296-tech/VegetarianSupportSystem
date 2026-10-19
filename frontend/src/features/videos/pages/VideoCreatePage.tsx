import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Check,
  FileVideo,
  Image as ImageIcon,
  Info,
  Save,
  Send,
  Sparkles,
} from 'lucide-react'
import {
  Badge,
  Button,
  Input,
  Modal,
  PageHeading,
  Textarea,
} from '../../../shared/components'
import AlertError from '../../../shared/components/AlertError'
import { getStoredToken } from '../../../shared/api/apiClient'
import {
  createVideo,
  listVideoCategories,
  submitVideo,
  uploadVideoFile,
  type VideoCategoryOption,
} from '../api/backendVideos'

interface Props {
  fromSource?: string
  onNavigate?: (path: string) => void
}

function cleanPrefix(text?: string | null): string {
  if (!text) return ''
  return text.replace(/^\[Mẫu\]\s*/i, '').trim()
}

const DIET_CARDS = [
  {
    type: 'Thuần chay (Vegan)',
    icon: '🌱',
    label: 'Thuần chay (Vegan)',
    desc: 'Hoàn toàn từ thực vật, không trứng, không sữa hay mật ong.',
  },
  {
    type: 'Ăn chay có sữa (Lacto)',
    icon: '🥛',
    label: 'Ăn chay có sữa (Lacto)',
    desc: 'Sử dụng sữa và các chế phẩm bơ sữa, không trứng.',
  },
  {
    type: 'Chay có trứng (Ovo)',
    icon: '🥚',
    label: 'Chay có trứng (Ovo)',
    desc: 'Sử dụng trứng gà tươi, không sử dụng sữa hay bơ động vật.',
  },
  {
    type: 'Trứng & Sữa (Lacto-ovo)',
    icon: '🍳',
    label: 'Trứng & Sữa (Lacto-ovo)',
    desc: 'Chế độ ăn chay phổ biến, có sử dụng cả trứng và các chế phẩm từ sữa.',
  },
]

export default function VideoCreatePage({ fromSource = 'videos', onNavigate }: Props) {
  const isFromProfile = fromSource === 'profile'
  const returnPath = isFromProfile ? '/profile/my-videos' : '/videos'
  const returnLabel = isFromProfile ? 'quản lý video' : 'danh sách video'

  const breadcrumbs = isFromProfile
    ? [
        { label: 'Trang chủ', onClick: () => onNavigate?.('/') },
        { label: 'Hồ sơ', onClick: () => onNavigate?.('/profile') },
        { label: 'Video của tôi', onClick: () => onNavigate?.('/profile/my-videos') },
        { label: 'Đăng video mới' },
      ]
    : [
        { label: 'Trang chủ', onClick: () => onNavigate?.('/') },
        { label: 'Video', onClick: () => onNavigate?.('/videos') },
        { label: 'Đăng video mới' },
      ]

  const [categories, setCategories] = useState<VideoCategoryOption[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [dietType, setDietType] = useState('Thuần chay (Vegan)')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isDraftCreated, setIsDraftCreated] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!getStoredToken()) {
      onNavigate?.(`/auth/login?returnUrl=${encodeURIComponent('/videos/create')}`)
    }
  }, [onNavigate])

  // Load categories
  useEffect(() => {
    let active = true
    void listVideoCategories()
      .then((items) => {
        if (!active) return
        setCategories(items)
        if (items.length > 0 && !categoryId) {
          setCategoryId(items[0].id)
        }
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [categoryId])

  // Thumbnail preview derived from thumbnailFile
  const thumbnailPreview = useMemo(() => {
    if (!thumbnailFile) return null
    return URL.createObjectURL(thumbnailFile)
  }, [thumbnailFile])

  useEffect(() => {
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview)
      }
    }
  }, [thumbnailPreview])

  const handleSave = async (submitNow: boolean) => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Vui lòng nhập tiêu đề video.')
      return
    }
    if (trimmedTitle.length < 6) {
      setError('Tiêu đề video tối thiểu 6 ký tự.')
      return
    }
    if (submitNow && !mediaFile) {
      setError('Vui lòng chọn tệp video (MP4 hoặc WEBM) trước khi gửi duyệt.')
      return
    }
    if (mediaFile && mediaFile.size > 200 * 1024 * 1024) {
      setError('Tệp video vượt quá dung lượng tối đa 200 MB.')
      return
    }
    if (thumbnailFile && thumbnailFile.size > 10 * 1024 * 1024) {
      setError('Ảnh bìa vượt quá dung lượng tối đa 10 MB.')
      return
    }

    setBusy(true)
    setError(null)

    try {
      const fullDescription = dietType
        ? `[Chế độ: ${dietType}]\n${description.trim()}`
        : description.trim()

      let video = await createVideo(trimmedTitle, fullDescription, categoryId || null)
      if (mediaFile) {
        video = await uploadVideoFile(video.id, mediaFile, false)
      }
      if (thumbnailFile) {
        video = await uploadVideoFile(video.id, thumbnailFile, true)
      }
      if (submitNow) {
        if (video.uploadStatus !== 'Ready') {
          throw new Error('Video chưa tải lên thành công. Bản nháp đã được lưu.')
        }
        await submitVideo(video.id)
      }

      setIsDraftCreated(!submitNow)
      setShowSuccessModal(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu video. Vui lòng thử lại.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ui-page-container py-8 space-y-6">
      {/* Page Heading with Status Badge (đồng bộ 100% bên bài viết) */}
      <PageHeading
        title="Đăng video hướng dẫn nấu chay"
        description="Chia sẻ công thức và cách nấu các món ăn chay thơm ngon, giàu dinh dưỡng tới cộng đồng."
        breadcrumbs={breadcrumbs}
        eyebrow={
          <Badge icon={<Sparkles size={14} className="text-emerald-600" />}>
            Góc tác giả &amp; sáng tạo nội dung
          </Badge>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border bg-slate-100 text-slate-700 border-slate-200">
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              Bản nháp
            </span>
          </div>
        }
      />

      {error && (
        <AlertError title="Không thể lưu video" message={error} />
      )}

      {/* Main Content Form Card */}
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-10 shadow-xs space-y-8">
        {/* Section 1: Thông tin cơ bản */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">1</span>
            Thông tin video
          </h2>

          <div className="space-y-4">
            <Input
              label="Tiêu đề video"
              required
              placeholder="Ví dụ: Cách làm Mì Ý Carbonara sốt trứng phô mai chuẩn vị Ý..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              className="!text-base font-medium"
            />

            <Textarea
              label="Mô tả chi tiết"
              placeholder="Giới thiệu nguyên liệu, các bước thực hiện, lưu ý khi nấu hoặc câu chuyện đằng sau món ăn..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              fullWidth
            />
          </div>
        </section>

        {/* Section 2: Danh mục món ăn */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">2</span>
              Danh mục món ăn
            </h2>
            <span className="text-xs text-slate-500">Bấm chọn danh mục phù hợp</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const active = categoryId === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    active
                      ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30 font-bold'
                      : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <span>{cleanPrefix(cat.name)}</span>
                  {active && <Check size={14} className="ml-0.5" />}
                </button>
              )
            })}
          </div>
        </section>

        {/* Section 3: Phù hợp với chế độ ăn nào? (Đồng bộ ArticleEditorPage) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">3</span>
              Phù hợp với chế độ ăn nào?
            </h2>
            <span className="text-xs text-slate-500">Chọn trường phái ăn chay</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {DIET_CARDS.map((card) => {
              const active = dietType === card.type
              return (
                <button
                  key={card.type}
                  type="button"
                  onClick={() => setDietType(card.type)}
                  className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    active
                      ? 'bg-emerald-50/80 border-emerald-500 shadow-2xs ring-2 ring-emerald-500/20'
                      : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{card.icon}</span>
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition ${
                        active
                          ? 'bg-emerald-600 text-white'
                          : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {active && <Check size={12} strokeWidth={3} />}
                    </span>
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${active ? 'text-emerald-900' : 'text-slate-800'}`}>
                      {card.label}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Section 4: Tải tệp lên (Video + Thumbnail) */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">4</span>
            Tải video & ảnh bìa
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tệp video */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">
                Tệp video <span className="text-red-500">*</span>{' '}
                <span className="text-xs font-normal text-slate-500">
                  (Định dạng MP4 hoặc WEBM, tối đa 200 MB)
                </span>
              </label>

              <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-6 text-center transition-colors hover:border-emerald-500 hover:bg-emerald-50/30">
                <input
                  type="file"
                  accept=".mp4,.webm,video/mp4,video/webm"
                  onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mb-2">
                  <FileVideo size={24} />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {mediaFile ? mediaFile.name : 'Bấm để tải tệp video lên'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {mediaFile
                    ? `${(mediaFile.size / (1024 * 1024)).toFixed(1)} MB`
                    : 'Hỗ trợ MP4, WEBM (tối đa 200 MB)'}
                </p>
              </div>
            </div>

            {/* Thumbnail */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">
                Ảnh bìa thumbnail{' '}
                <span className="text-xs font-normal text-slate-500">
                  (Tùy chọn: JPG, PNG, WEBP, tối đa 10 MB)
                </span>
              </label>

              <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-6 text-center transition-colors hover:border-emerald-500 hover:bg-emerald-50/30 overflow-hidden">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
                  className="absolute inset-0 cursor-pointer opacity-0 z-10"
                />
                {thumbnailPreview ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-xs">
                    <img
                      src={thumbnailPreview}
                      alt="Ảnh bìa xem trước"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 right-2 rounded-lg bg-black/75 px-2 py-0.5 text-xs text-white">
                      Bấm để đổi ảnh
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mb-2">
                      <ImageIcon size={24} />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      Bấm để chọn ảnh bìa
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tùy chọn (để trống sẽ sử dụng ảnh mặc định)
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Information Notice Box */}
        <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-xs sm:text-sm text-sky-900 flex items-start gap-3">
          <Info size={18} className="shrink-0 text-sky-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Quy trình kiểm duyệt nội dung:</p>
            <p className="leading-relaxed">
              Video sau khi gửi sẽ được hệ thống kiểm duyệt bảo đảm không vi phạm tiêu chuẩn cộng đồng. Sau khi Admin phê duyệt, video sẽ xuất hiện công khai trên kho video cho tất cả thành viên theo dõi.
            </p>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM ACTION BAR (đồng bộ 100% bên bài viết) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4 z-20 backdrop-blur-md bg-white/95">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => onNavigate?.(returnPath)}
            leftIcon={<ArrowLeft size={16} />}
            className="!rounded-xl w-full sm:w-auto text-xs font-semibold"
          >
            Hủy và quay lại
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void handleSave(false)}
            leftIcon={<Save size={16} />}
            className="!rounded-xl text-xs font-semibold !border-slate-300 hover:!border-emerald-600 hover:!text-emerald-700"
          >
            {busy ? 'Đang lưu...' : 'Lưu bản nháp'}
          </Button>

          <Button
            type="button"
            variant="primary"
            disabled={busy}
            onClick={() => void handleSave(true)}
            leftIcon={<Send size={16} />}
            className="!rounded-xl !bg-[#2E7D32] hover:!bg-[#1B5E20] text-xs font-semibold shadow-xs"
          >
            {busy ? 'Đang gửi...' : 'Lưu và gửi duyệt'}
          </Button>
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          onNavigate?.(returnPath)
        }}
        maxWidth="md"
      >
        <div className="p-6 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
            <Check size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {isDraftCreated ? 'Bản nháp đã được lưu!' : 'Đã gửi video thành công!'}
            </h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {isDraftCreated
                ? 'Bản nháp video đã được lưu vào hệ thống. Bạn có thể quay lại chỉnh sửa và gửi duyệt bất cứ lúc nào.'
                : 'Video của bạn đã được chuyển vào hàng đợi kiểm duyệt của Admin. Bạn sẽ được thông báo ngay khi video xuất bản!'}
            </p>
          </div>
          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              fullWidth
              onClick={() => {
                setShowSuccessModal(false)
                onNavigate?.(returnPath)
              }}
              className="!bg-[#2E7D32] hover:!bg-[#1B5E20] font-semibold"
            >
              Về {returnLabel}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
