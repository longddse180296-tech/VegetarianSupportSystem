import { useState, useRef } from 'react'
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileEdit,
  FileText,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Info,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  X,
  AlertCircle,
  Bold,
  Italic,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react'
import { PublicLayout } from '../../../app/layouts/PublicLayout'
import { useAuth } from '../../auth'
import { Feedback } from '../../admin/components/ApiWorkspace'
import { useApiData } from '../../admin/hooks/useApiData'
import { errorMessage, formatDate } from '../../admin/utils/apiUi'
import { Modal } from '../../../shared/components/Modal'
import {
  adminStatusLabels,
  aiStatusLabels,
  type Submission,
  type AdminStatus,
  type AiStatus,
} from '../../admin/moderation/api/adminModerationApi'
import { AiReview } from '../../admin/moderation/components/ModerationWorkspace'
import {
  articleApi,
  articleCategories,
  type ArticleInput,
  type MyArticleRecord,
} from '../api/articles.api'
import { RichContentRenderer } from '../components/RichContentRenderer'
import {
  BACKEND_DIETARY_TYPE_LABELS,
  BACKEND_DIETARY_TYPES,
  type BackendDietaryType,
} from '../../../shared/constants'
import { PageHeading, Badge } from '../../../shared/components/PageHeading'
import { Button } from '../../../shared/components/Button'

interface ArticleEditorPageProps {
  articleId?: string
  fromSource?: 'articles' | 'profile' | string
  onNavigate: (path: string) => void
}

const categoryIcons: Record<string, string> = {
  'Dinh dưỡng': '🥗',
  'Sức khỏe': '🌿',
  'Ẩm thực': '🍲',
  'Lối sống': '🧘',
  'Mẹo vặt': '💡',
  'Thể thao': '🏃',
  'Kiến thức': '📚',
  'Kinh nghiệm': '✨',
}

const dietaryDescriptions: Record<BackendDietaryType, string> = {
  Vegan: 'Thuần chay 100% từ thực vật, không trứng & không sữa',
  LactoVegetarian: 'Ăn chay có dùng sữa và chế phẩm từ sữa',
  OvoVegetarian: 'Ăn chay có sử dụng các loại trứng',
  LactoOvoVegetarian: 'Ăn chay kết hợp cả sữa và trứng',
}

const dietaryIcons: Record<BackendDietaryType, string> = {
  Vegan: '🌱',
  LactoVegetarian: '🥛',
  OvoVegetarian: '🥚',
  LactoOvoVegetarian: '🍳',
}

function getStatusBadgeStyle(status: AdminStatus) {
  switch (status) {
    case 'Published':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'PendingAdminReview':
    case 'Submitted':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'RevisionRequested':
      return 'bg-orange-50 text-orange-700 border-orange-200'
    case 'Rejected':
    case 'Removed':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    case 'Draft':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

function getAiStatusBadgeStyle(status: AiStatus) {
  switch (status) {
    case 'Passed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'Flagged':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    case 'Partial':
    case 'Checking':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'Failed':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'NotSubmitted':
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}

export const ArticleEditorPage = ({
  articleId,
  fromSource = 'articles',
  onNavigate,
}: ArticleEditorPageProps) => {
  const { user, logout } = useAuth()
  const [id, setId] = useState(articleId)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Contextual navigation determination
  const isFromProfile = fromSource === 'profile'
  const returnPath = isFromProfile ? '/profile/my-articles' : '/articles'
  const returnLabel = isFromProfile ? 'Bài viết của tôi' : 'danh sách bài viết'

  const record = useApiData<MyArticleRecord>(
    id ? `/api/me/articles/${id}` : null,
  )

  const [form, setForm] = useState<ArticleInput>({
    title: '',
    content: '',
    category: '',
    coverImageUrl: null,
    dietaryTypes: [],
  })

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [review, setReview] = useState<Submission | null>(null)
  const [loadedRecord, setLoadedRecord] = useState<MyArticleRecord | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [customCategory, setCustomCategory] = useState('')

  if (record.data && record.data !== loadedRecord) {
    const { title, content, category, coverImageUrl, dietaryTypes } = record.data
    setLoadedRecord(record.data)
    setForm({
      title,
      content,
      category,
      coverImageUrl,
      dietaryTypes: dietaryTypes || [],
    })
    if (category && !articleCategories.includes(category)) {
      setCustomCategory(category)
    }
  }

  const state = record.data?.status || 'Draft'
  const editable =
    !record.loading &&
    !record.error &&
    !['Submitted', 'PendingAdminReview', 'Removed'].includes(state)

  const wordCount = form.content.trim()
    ? form.content.trim().split(/\s+/).length
    : 0
  const charCount = form.content.length
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  const canSubmit = Boolean(
    form.title.trim() &&
    form.category.trim() &&
    form.content.trim(),
  )

  const insertMarkdown = (prefix: string, suffix = '', defaultPlaceholder = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentText = form.content
    const selectedText = currentText.substring(start, end) || defaultPlaceholder

    const replacement = `${prefix}${selectedText}${suffix}`
    const newContent =
      currentText.substring(0, start) + replacement + currentText.substring(end)

    setForm((prev) => ({ ...prev, content: newContent }))

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length,
      )
    }, 0)
  }

  const handleApplySampleImage = () => {
    setImageError(false)
    setForm((prev) => ({
      ...prev,
      coverImageUrl:
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
    }))
  }

  async function save(submit: boolean) {
    if (busy || !editable) return
    setBusy(true)
    setError(null)
    setNotice(null)
    let saved: MyArticleRecord | null = null
    try {
      saved = id
        ? await articleApi.update(id, form)
        : await articleApi.create(form)

      setId(saved.id)
      record.setData(saved)

      if (submit) {
        saved = await articleApi.submit(saved.id)
        record.setData(saved)
        setShowSuccessModal(true)
      } else {
        setNotice('Đã lưu bản nháp bài viết thành công.')
      }
    } catch (reason) {
      setError(
        `${saved && submit ? 'Đã lưu bản nháp nhưng chưa gửi duyệt được. ' : ''}${errorMessage(reason)}`,
      )
    } finally {
      setBusy(false)
    }
  }

  const breadcrumbs = isFromProfile
    ? [
        { label: 'Trang chủ', onClick: () => onNavigate('/') },
        { label: 'Hồ sơ', onClick: () => onNavigate('/profile') },
        { label: 'Bài viết của tôi', onClick: () => onNavigate('/profile/my-articles') },
        { label: id ? 'Chỉnh sửa bài viết' : 'Viết bài mới' },
      ]
    : [
        { label: 'Trang chủ', onClick: () => onNavigate('/') },
        { label: 'Bài viết', onClick: () => onNavigate('/articles') },
        { label: id ? 'Chỉnh sửa bài viết' : 'Viết bài mới' },
      ]

  return (
    <PublicLayout
      activeNav="articles"
      onNavigate={onNavigate}
      isLoggedIn={!!user}
      userName={user?.fullName}
      onLogout={() => void logout().then(() => onNavigate('/auth/login'))}
    >
      <div className="ui-page-container py-8 space-y-6">
        {/* Page Heading with Status Badge */}
        <PageHeading
          title={id ? 'Chỉnh sửa bài viết' : 'Viết bài chia sẻ mới'}
          description="Lan tỏa kiến thức dinh dưỡng thực vật, cẩm nang sức khỏe và trải nghiệm sống chay cùng cộng đồng."
          breadcrumbs={breadcrumbs}
          eyebrow={
            <Badge icon={<Sparkles size={14} className="text-emerald-600" />}>
              Góc tác giả &amp; sáng tạo nội dung
            </Badge>
          }
          actions={
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusBadgeStyle(
                  state,
                )}`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                {adminStatusLabels[state]}
              </span>
              {record.data?.publishedVersion && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate(`/articles/${id}`)}
                  className="!rounded-xl text-xs font-semibold"
                  leftIcon={<ExternalLink size={14} />}
                >
                  Xem bài công khai
                </Button>
              )}
            </div>
          }
        />

        {/* Feedback alerts */}
        <Feedback error={error || record.error} />

        {/* Notice with quick return button */}
        {notice && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-900 shadow-2xs">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              <p className="text-sm font-medium">{notice}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate(returnPath)}
                className="!rounded-xl !bg-white text-xs font-semibold"
              >
                Quay lại {returnLabel}
              </Button>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="p-1 text-emerald-700 hover:text-emerald-900 rounded-lg"
                title="Đóng thông báo"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Loading and Error states */}
        {record.loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-xs">
            Đang tải dữ liệu bài viết...
          </div>
        )}
        {record.error && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-6 flex items-center justify-between gap-4">
            <p className="text-sm text-rose-800">Không thể tải thông tin bài viết này.</p>
            <Button variant="outline" size="sm" onClick={record.reload}>
              Thử tải lại
            </Button>
          </div>
        )}

        {/* Status Callout Card */}
        {record.data && (
          <div
            className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm ${
              state === 'Published'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : state === 'Submitted' || state === 'PendingAdminReview'
                ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                : state === 'RevisionRequested'
                ? 'bg-orange-50/70 border-orange-200 text-orange-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-start gap-3">
              <Info size={18} className="mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-bold">
                  Trạng thái hiện tại: {adminStatusLabels[state]}
                </p>
                {record.data.publishedVersion && (
                  <p className="text-xs opacity-90">
                    Bản đang công khai là phiên bản {record.data.publishedVersion.version}. Các chỉnh sửa lưu mới sẽ được Admin phê duyệt trước khi cập nhật tới độc giả.
                  </p>
                )}
                {!editable && (
                  <p className="text-xs font-semibold opacity-90">
                    Bài viết đang trong hàng đợi kiểm duyệt hoặc đã bị gỡ. Bạn chỉ có thể xem nội dung hiện tại.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MAIN FORM */}
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault()
            void save(false)
          }}
        >
          {/* CARD 1: THÔNG TIN BÀI VIẾT */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText size={20} className="text-emerald-600" />
                <span>Thông tin cơ bản</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Điền tiêu đề hấp dẫn, lựa chọn danh mục và chế độ ăn phù hợp cho bài viết của bạn.
              </p>
            </div>

            <fieldset disabled={busy || !editable} className="space-y-6">
              {/* Tiêu đề */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="article-title" className="text-sm font-bold text-slate-800">
                    Tiêu đề bài viết <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-xs ${
                      form.title.length > 180 ? 'text-amber-600 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {form.title.length}/200 ký tự
                  </span>
                </div>
                <input
                  id="article-title"
                  required
                  maxLength={200}
                  placeholder="Ví dụ: 7 Lợi ích bất ngờ khi áp dụng chế độ thuần chay 30 ngày..."
                  className="w-full text-base sm:text-lg font-bold placeholder:text-slate-400 placeholder:font-normal rounded-2xl border border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 px-4 py-3.5 transition-all outline-none"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              {/* Danh mục bài viết */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-800">
                    Danh mục bài viết <span className="text-rose-500">*</span>
                  </label>
                  {form.category && (
                    <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      Đã chọn: {form.category}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Nhấp chọn danh mục có sẵn hoặc nhập danh mục riêng của bạn:
                </p>
                <div className="flex flex-wrap gap-2">
                  {articleCategories.map((cat) => {
                    const isSelected = form.category === cat
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, category: cat })
                          setCustomCategory('')
                        }}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30 font-bold'
                            : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <span>{categoryIcons[cat] || '🏷️'}</span>
                        <span>{cat}</span>
                        {isSelected && <Check size={14} className="ml-0.5" />}
                      </button>
                    )
                  })}
                </div>
                <div className="pt-1">
                  <input
                    type="text"
                    maxLength={120}
                    placeholder="Hoặc nhập danh mục tùy biến khác..."
                    value={customCategory}
                    onChange={(e) => {
                      setCustomCategory(e.target.value)
                      setForm({ ...form, category: e.target.value })
                    }}
                    className="w-full text-sm rounded-xl border border-slate-200 px-3.5 py-2 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none"
                  />
                </div>
              </div>

              {/* Phù hợp với chế độ ăn nào? */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-bold text-slate-800">
                    Phù hợp với chế độ ăn nào?
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chọn các chế độ ăn áp dụng cho nội dung bài viết này (có thể chọn nhiều):
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {BACKEND_DIETARY_TYPES.map((type) => {
                    const isChecked = form.dietaryTypes.includes(type)
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setForm({
                            ...form,
                            dietaryTypes: isChecked
                              ? form.dietaryTypes.filter((t) => t !== type)
                              : [...form.dietaryTypes, type],
                          })
                        }}
                        className={`text-left p-3.5 rounded-2xl border transition-all relative flex flex-col justify-between gap-2 ${
                          isChecked
                            ? 'bg-emerald-50/80 border-emerald-500 shadow-2xs ring-1 ring-emerald-500/20'
                            : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{dietaryIcons[type]}</span>
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition ${
                              isChecked
                                ? 'bg-emerald-600 text-white'
                                : 'border border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check size={12} strokeWidth={3} />}
                          </span>
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${isChecked ? 'text-emerald-900' : 'text-slate-800'}`}>
                            {BACKEND_DIETARY_TYPE_LABELS[type]}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                            {dietaryDescriptions[type]}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* URL Ảnh đại diện */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="article-cover" className="text-sm font-bold text-slate-800">
                    Ảnh đại diện bài viết (Cover Image URL)
                  </label>
                  {!form.coverImageUrl && (
                    <button
                      type="button"
                      onClick={handleApplySampleImage}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline decoration-dashed transition"
                    >
                      Dùng ảnh mẫu gợi ý
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="article-cover"
                    type="url"
                    pattern="https?://.*"
                    maxLength={2000}
                    placeholder="https://images.unsplash.com/... hoặc link ảnh bất kỳ"
                    className="w-full text-sm rounded-xl border border-slate-300 pl-10 pr-10 py-2.5 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none"
                    value={form.coverImageUrl || ''}
                    onChange={(e) => {
                      setImageError(false)
                      setForm({ ...form, coverImageUrl: e.target.value.trim() || null })
                    }}
                  />
                  <ImageIcon size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  {form.coverImageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageError(false)
                        setForm({ ...form, coverImageUrl: null })
                      }}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100"
                      title="Xóa đường dẫn ảnh"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Cover image preview card */}
                {form.coverImageUrl && (
                  <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 max-w-xl shadow-2xs">
                    {!imageError ? (
                      <div className="relative aspect-[16/9] w-full">
                        <img
                          src={form.coverImageUrl}
                          alt="Xem trước ảnh bìa"
                          onError={() => setImageError(true)}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1.5">
                          <Check size={12} className="text-emerald-400" />
                          <span>Ảnh đại diện hợp lệ</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center space-y-2">
                        <AlertCircle size={24} className="text-amber-500 mx-auto" />
                        <p className="text-xs text-slate-600">
                          Không thể hiển thị ảnh từ liên kết này. Vui lòng kiểm tra lại URL ảnh công khai.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </fieldset>
          </div>

          {/* CARD 2: NỘI DUNG VÀ TRÌNH SOẠN THẢO */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs space-y-4">
            {/* Header of Content Card with Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileEdit size={20} className="text-emerald-600" />
                  <span>Nội dung bài viết <span className="text-rose-500">*</span></span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hỗ trợ định dạng văn bản trực quan Markdown. Bạn có thể chuyển tab để xem trước như độc giả.
                </p>
              </div>

              {/* Mode Tabs */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'edit'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileEdit size={14} />
                  <span>Soạn thảo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'preview'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye size={14} />
                  <span>Xem trước trực tiếp</span>
                </button>
              </div>
            </div>

            {/* TAB: SOẠN THẢO */}
            {activeTab === 'edit' ? (
              <div className="space-y-3">
                {/* Markdown Formatting Toolbar */}
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                  <button
                    type="button"
                    disabled={!editable || busy}
                    onClick={() => insertMarkdown('**', '**', 'in đậm')}
                    className="p-1.5 rounded-lg hover:bg-white hover:text-emerald-700 hover:shadow-2xs transition"
                    title="In đậm (**text**)"
                  >
                    <Bold size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={!editable || busy}
                    onClick={() => insertMarkdown('*', '*', 'in nghiêng')}
                    className="p-1.5 rounded-lg hover:bg-white hover:text-emerald-700 hover:shadow-2xs transition"
                    title="In nghiêng (*text*)"
                  >
                    <Italic size={15} />
                  </button>
                  <div className="h-4 w-px bg-slate-200 mx-0.5" />
                  <button
                    type="button"
                    disabled={!editable || busy}
                    onClick={() => insertMarkdown('\n## ', '\n', 'Tiêu đề mục lớn')}
                    className="p-1.5 rounded-lg hover:bg-white hover:text-emerald-700 hover:shadow-2xs transition"
                    title="Tiêu đề 2 (## Tiêu đề)"
                  >
                    <Heading2 size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={!editable || busy}
                    onClick={() => insertMarkdown('\n### ', '\n', 'Tiêu đề mục con')}
                    className="p-1.5 rounded-lg hover:bg-white hover:text-emerald-700 hover:shadow-2xs transition"
                    title="Tiêu đề 3 (### Tiêu đề)"
                  >
                    <Heading3 size={15} />
                  </button>
                  <div className="h-4 w-px bg-slate-200 mx-0.5" />
                  <button
                    type="button"
                    disabled={!editable || busy}
                    onClick={() => insertMarkdown('\n> ', '\n', 'Nội dung trích dẫn')}
                    className="p-1.5 rounded-lg hover:bg-white hover:text-emerald-700 hover:shadow-2xs transition"
                    title="Trích dẫn (> Trích dẫn)"
                  >
                    <Quote size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={!editable || busy}
                    onClick={() => insertMarkdown('\n- ', '\n', 'Ý thứ nhất')}
                    className="p-1.5 rounded-lg hover:bg-white hover:text-emerald-700 hover:shadow-2xs transition"
                    title="Danh sách gạch đầu dòng (- Mục)"
                  >
                    <List size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={!editable || busy}
                    onClick={() => insertMarkdown('\n1. ', '\n', 'Bước thứ nhất')}
                    className="p-1.5 rounded-lg hover:bg-white hover:text-emerald-700 hover:shadow-2xs transition"
                    title="Danh sách đánh số (1. Mục)"
                  >
                    <ListOrdered size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={!editable || busy}
                    onClick={() => insertMarkdown('[', '](https://example.com)', 'Tên liên kết')}
                    className="p-1.5 rounded-lg hover:bg-white hover:text-emerald-700 hover:shadow-2xs transition"
                    title="Chèn liên kết [Tên](url)"
                  >
                    <LinkIcon size={15} />
                  </button>
                  <div className="h-4 w-px bg-slate-200 mx-0.5" />
                  <button
                    type="button"
                    disabled={!editable || busy}
                    onClick={() => insertMarkdown('\n> [!TIP]\n> ', '\n', 'Mẹo dinh dưỡng hữu ích...')}
                    className="px-2 py-1 rounded-lg text-xs font-semibold hover:bg-white hover:text-emerald-700 hover:shadow-2xs transition flex items-center gap-1"
                    title="Hộp mẹo / ghi chú"
                  >
                    <span>💡 Khung mẹo hay</span>
                  </button>
                </div>

                {/* Textarea */}
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    required
                    disabled={busy || !editable}
                    maxLength={50000}
                    rows={18}
                    placeholder="Bắt đầu viết nội dung bài viết của bạn tại đây... Sử dụng Markdown để định dạng các đề mục, trích dẫn, công thức và hình ảnh minh họa."
                    className="w-full text-sm sm:text-base leading-relaxed rounded-2xl border border-slate-300 p-4 font-mono focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none resize-y transition"
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                  />
                </div>

                {/* Metrics bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-4">
                    <span>
                      <strong>{wordCount}</strong> từ
                    </span>
                    <span>
                      <strong>{charCount.toLocaleString('vi-VN')}</strong> / 50,000 ký tự
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      ~{readingTime} phút đọc
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Nội dung sẽ được kiểm tra an toàn bởi AI trước khi Admin xét duyệt.
                  </span>
                </div>
              </div>
            ) : (
              /* TAB: XEM TRƯỚC TRỰC TIẾP */
              <div className="space-y-6 rounded-2xl border border-slate-200 p-6 md:p-8 bg-slate-50/50">
                {form.title || form.content ? (
                  <article className="space-y-6 max-w-3xl mx-auto bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/80 shadow-xs">
                    {/* Header info in preview */}
                    <div className="space-y-3 border-b border-slate-100 pb-5">
                      <div className="flex flex-wrap items-center gap-2">
                        {form.category && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            {categoryIcons[form.category]} {form.category}
                          </span>
                        )}
                        {form.dietaryTypes.map((type) => (
                          <span
                            key={type}
                            className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700"
                          >
                            {dietaryIcons[type]} {BACKEND_DIETARY_TYPE_LABELS[type]}
                          </span>
                        ))}
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                        {form.title || 'Tiêu đề bài viết'}
                      </h1>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>Tác giả: {user?.fullName || 'Tôi'}</span>
                        <span>·</span>
                        <span>Ước tính: ~{readingTime} phút đọc</span>
                      </div>
                    </div>

                    {/* Cover image in preview */}
                    {form.coverImageUrl && !imageError && (
                      <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                        <img
                          src={form.coverImageUrl}
                          alt={form.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Markdown Body in preview */}
                    <div className="prose prose-emerald max-w-none text-slate-800 leading-relaxed">
                      {form.content ? (
                        <RichContentRenderer content={form.content} />
                      ) : (
                        <p className="text-slate-400 italic">Chưa có nội dung để hiển thị.</p>
                      )}
                    </div>
                  </article>
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <Eye size={36} className="text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">Chưa có nội dung để xem trước</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Hãy chuyển lại tab Soạn thảo và nhập tiêu đề, danh mục cùng nội dung bài viết để xem trước bản dựng thực tế.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('edit')}
                      className="!rounded-xl"
                    >
                      Quay lại soạn thảo
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CARD 3: STICKY ACTION BAR */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4 z-20 backdrop-blur-md bg-white/95">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate(returnPath)}
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
                disabled={busy || !editable}
                onClick={() => void save(false)}
                leftIcon={<Save size={16} />}
                className="!rounded-xl text-xs font-semibold !border-slate-300 hover:!border-emerald-600 hover:!text-emerald-700"
              >
                {busy ? 'Đang lưu...' : 'Lưu bản nháp'}
              </Button>

              <Button
                type="button"
                variant="primary"
                disabled={busy || !editable || !canSubmit}
                onClick={() => void save(true)}
                leftIcon={<Send size={16} />}
                className="!rounded-xl !bg-[#2E7D32] hover:!bg-[#1B5E20] text-xs font-semibold shadow-xs"
              >
                {busy ? 'Đang gửi...' : 'Lưu và gửi duyệt'}
              </Button>
            </div>
          </div>
        </form>

        {/* CARD 4: PHIÊN BẢN & PHẢN HỒI KIỂM DUYỆT */}
        {!!record.data?.versions?.length && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck size={20} className="text-emerald-600" />
                  <span>Lịch sử phiên bản &amp; Đánh giá kiểm duyệt</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Theo dõi kết quả thẩm định nội dung từ hệ thống AI và các phản hồi từ ban quản trị Admin.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={record.reload}
                leftIcon={<RotateCcw size={14} />}
                className="!rounded-xl text-xs"
              >
                Làm mới
              </Button>
            </div>

            <div className="space-y-3">
              {record.data.versions.map((ver) => (
                <div
                  key={ver.submissionId}
                  className="rounded-2xl border border-slate-200 p-5 space-y-3 bg-slate-50/50 hover:bg-slate-50 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                        Phiên bản {ver.version}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(ver.submittedAt)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getAiStatusBadgeStyle(
                          ver.aiStatus,
                        )}`}
                      >
                        AI: {aiStatusLabels[ver.aiStatus]}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeStyle(
                          ver.adminStatus,
                        )}`}
                      >
                        Admin: {adminStatusLabels[ver.adminStatus]}
                      </span>
                    </div>
                  </div>

                  {ver.aiSummary && (
                    <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/60 space-y-1">
                      <span className="font-bold text-slate-900 block">Tóm tắt đánh giá AI:</span>
                      <p className="leading-relaxed">{ver.aiSummary}</p>
                    </div>
                  )}

                  {ver.adminFeedback && (
                    <div className="text-xs text-amber-900 bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 space-y-1">
                      <span className="font-bold block flex items-center gap-1.5">
                        <MessageSquare size={14} className="text-amber-700" />
                        Phản hồi từ Quản trị viên:
                      </span>
                      <p className="leading-relaxed">{ver.adminFeedback}</p>
                    </div>
                  )}

                  <div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true)
                        setError(null)
                        try {
                          setReview(await articleApi.review(ver.submissionId))
                        } catch (reason) {
                          setError(errorMessage(reason))
                        } finally {
                          setBusy(false)
                        }
                      }}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline decoration-emerald-500/40 hover:decoration-emerald-700 transition"
                    >
                      Xem chi tiết kiểm tra và bằng chứng AI →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL: KẾT QUẢ AI REVIEW */}
        <Modal
          isOpen={!!review}
          onClose={() => setReview(null)}
          title={`Kết quả thẩm định phiên bản ${review?.version}`}
          maxWidth="xl"
        >
          {review && <AiReview submission={review} />}
        </Modal>

        {/* MODAL: SUBMISSION SUCCESS */}
        <Modal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="Gửi bài viết thành công"
        >
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={36} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">
                Bài viết đã được gửi duyệt thành công!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Hệ thống AI đang thực hiện quét an toàn nội dung. Bài viết của bạn sẽ được Ban biên tập xét duyệt và xuất bản tới cộng đồng độc giả trong thời gian sớm nhất.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <Button
                variant="primary"
                onClick={() => {
                  setShowSuccessModal(false)
                  onNavigate(returnPath)
                }}
                className="!rounded-xl !bg-[#2E7D32] hover:!bg-[#1B5E20] w-full sm:w-auto font-semibold text-xs sm:text-sm"
              >
                Quay lại {returnLabel}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSuccessModal(false)}
                className="!rounded-xl w-full sm:w-auto font-semibold text-xs sm:text-sm"
              >
                Tiếp tục xem và sửa
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PublicLayout>
  )
}

export default ArticleEditorPage
