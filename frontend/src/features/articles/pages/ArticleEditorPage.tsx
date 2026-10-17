import { useState } from 'react'
import { PublicLayout } from '../../../app/layouts/PublicLayout'
import { useAuth } from '../../auth'
import { Feedback } from '../../admin/components/ApiWorkspace'
import { useApiData } from '../../admin/hooks/useApiData'
import {
  primaryClass,
  secondaryClass,
  fieldClass,
  errorMessage,
  formatDate,
} from '../../admin/utils/apiUi'
import { Modal } from '../../../shared/components/Modal'
import {
  adminStatusLabels,
  aiStatusLabels,
  type Submission,
} from '../../admin/moderation/api/adminModerationApi'
import { AiReview } from '../../admin/moderation/components/ModerationWorkspace'
import {
  articleApi,
  articleCategories,
  type ArticleInput,
  type MyArticleRecord,
} from '../api/articles.api'
import { RichContentRenderer } from '../components/RichContentRenderer'
import { BACKEND_DIETARY_TYPE_LABELS, BACKEND_DIETARY_TYPES } from '../../../shared/constants'

export const ArticleEditorPage = ({
  articleId,
  onNavigate,
}: {
  articleId?: string
  onNavigate: (path: string) => void
}) => {
  const { user, logout } = useAuth()
  const [id, setId] = useState(articleId)
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
  const [preview, setPreview] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [review, setReview] = useState<Submission | null>(null)
  const [loadedRecord, setLoadedRecord] = useState<MyArticleRecord | null>(null)
  if (record.data && record.data !== loadedRecord) {
    const { title, content, category, coverImageUrl, dietaryTypes } = record.data
    setLoadedRecord(record.data)
    setForm({ title, content, category, coverImageUrl, dietaryTypes: dietaryTypes || [] })
  }
  const state = record.data?.status || 'Draft'
  const editable =
    !record.loading &&
    !record.error &&
    !['Submitted', 'PendingAdminReview', 'Removed'].includes(state)
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
      // Keep the created ID even when submission fails, so retry never creates another draft.
      setId(saved.id)
      record.setData(saved)
      if (submit) {
        saved = await articleApi.submit(saved.id)
        record.setData(saved)
      }
      setNotice(
        submit
          ? 'Đã gửi bài viết để kiểm tra và chờ Admin duyệt.'
          : 'Đã lưu bản nháp.',
      )
    } catch (reason) {
      setError(
        `${saved && submit ? 'Đã lưu bản nháp nhưng chưa gửi duyệt. ' : ''}${errorMessage(reason)}`,
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <PublicLayout
      activeNav="articles"
      onNavigate={onNavigate}
      isLoggedIn={!!user}
      userName={user?.fullName}
      onLogout={() => void logout().then(() => onNavigate('/auth/login'))}
    >
      <div className="ui-page-container py-8 space-y-5">
        <button
          className="fe1-link text-sm font-bold text-emerald-800"
          onClick={() => onNavigate('/profile/my-articles')}
        >
          ← Bài viết của tôi
        </button>
        <div className="rounded-2xl border bg-white p-5 sm:p-8 space-y-5">
          <h1 className="text-2xl font-bold text-[#184d28]">
            {id ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}
          </h1>
          <Feedback error={error || record.error} notice={notice} />
          {record.loading && <p>Đang tải bản nháp...</p>}
          {record.error && (
            <button className={secondaryClass} onClick={record.reload}>
              Thử tải lại
            </button>
          )}
          {record.data && (
            <div className="rounded-xl bg-emerald-50 p-4 text-sm space-y-2">
              <p>
                Trạng thái: <strong>{adminStatusLabels[state]}</strong>
              </p>
              {record.data.publishedVersion && (
                <p>
                  Bản công khai hiện tại: phiên bản{' '}
                  {record.data.publishedVersion.version}. Bản sửa chỉ thay thế
                  sau khi được Admin duyệt.
                </p>
              )}
              {!editable && <p>Bản hiện tại chưa được phép chỉnh sửa.</p>}
            </div>
          )}
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              void save(false)
            }}
          >
            <fieldset disabled={busy || !editable} className="space-y-4">
              <label className="block text-sm">
                Tiêu đề
                <input
                  required
                  maxLength={200}
                  className={fieldClass}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>
              <fieldset className="space-y-2 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                <legend className="px-1 text-sm font-semibold">Phù hợp với chế độ ăn nào?</legend>
                <p className="text-xs text-slate-600">Chọn các chế độ mà nội dung bài viết áp dụng. Thông tin này giúp người đọc lọc bài viết phù hợp.</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {BACKEND_DIETARY_TYPES.map((dietaryType) => (
                    <label key={dietaryType} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.dietaryTypes.includes(dietaryType)}
                        onChange={(event) => setForm({
                          ...form,
                          dietaryTypes: event.target.checked
                            ? [...form.dietaryTypes, dietaryType]
                            : form.dietaryTypes.filter((item) => item !== dietaryType),
                        })}
                      />
                      {BACKEND_DIETARY_TYPE_LABELS[dietaryType]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="block text-sm">
                Danh mục
                <input
                  required
                  maxLength={120}
                  list="article-categories"
                  className={fieldClass}
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
                <datalist id="article-categories">
                  {articleCategories.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </label>
              <label className="block text-sm">
                URL ảnh đại diện
                <input
                  type="url"
                  pattern="https?://.*"
                  maxLength={2000}
                  className={fieldClass}
                  value={form.coverImageUrl || ''}
                  onChange={(e) =>
                    setForm({ ...form, coverImageUrl: e.target.value || null })
                  }
                />
              </label>
              <label className="block text-sm">
                Nội dung
                <textarea
                  required
                  maxLength={50000}
                  rows={16}
                  className={fieldClass}
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                />
              </label>
            </fieldset>
            <p className="text-xs text-slate-500">
              Ảnh đại diện sử dụng URL HTTP/HTTPS. Bài viết được AI kiểm tra và
              Admin quyết định xuất bản.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={secondaryClass}
                onClick={() => setPreview(!preview)}
              >
                {preview ? 'Ẩn xem trước' : 'Xem trước'}
              </button>
              <button disabled={busy || !editable} className={secondaryClass}>
                {busy ? 'Đang xử lý...' : 'Lưu nháp'}
              </button>
              <button
                type="button"
                disabled={
                  busy ||
                  !editable ||
                  !form.title.trim() ||
                  !form.category.trim() ||
                  !form.content.trim()
                }
                className={primaryClass}
                onClick={(event) => {
                  if (event.currentTarget.form?.reportValidity())
                    void save(true)
                }}
              >
                Lưu và gửi duyệt
              </button>
            </div>
          </form>
          {preview && (
            <section className="rounded-xl border p-5">
              <h2 className="text-xl font-bold mb-4">
                {form.title || 'Tiêu đề bài viết'}
              </h2>
              {!!form.dietaryTypes.length && <div className="mb-4 flex flex-wrap gap-2">{form.dietaryTypes.map((dietaryType) => <span key={dietaryType} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">{BACKEND_DIETARY_TYPE_LABELS[dietaryType]}</span>)}</div>}
              <RichContentRenderer content={form.content} />
            </section>
          )}
          {!!record.data?.versions.length && (
            <section className="border-t pt-5 space-y-3">
              <h2 className="font-bold">Phiên bản và phản hồi</h2>
              {record.data.versions.map((version) => (
                <div
                  key={version.submissionId}
                  className="rounded-xl border p-4 text-sm space-y-2"
                >
                  <p>
                    Phiên bản {version.version} ·{' '}
                    {formatDate(version.submittedAt)}
                  </p>
                  <p>
                    AI: {aiStatusLabels[version.aiStatus]} · Admin:{' '}
                    {adminStatusLabels[version.adminStatus]}
                  </p>
                  {version.aiSummary && <p>{version.aiSummary}</p>}
                  {version.adminFeedback && (
                    <p className="text-amber-900">
                      Phản hồi Admin: {version.adminFeedback}
                    </p>
                  )}
                  <button
                    disabled={busy}
                    className="fe1-link font-bold text-emerald-800"
                    onClick={async () => {
                      setBusy(true)
                      setError(null)
                      try {
                        setReview(await articleApi.review(version.submissionId))
                      } catch (reason) {
                        setError(errorMessage(reason))
                      } finally {
                        setBusy(false)
                      }
                    }}
                  >
                    Xem kết quả và phạm vi kiểm tra
                  </button>
                </div>
              ))}
              <button className={secondaryClass} onClick={record.reload}>
                Cập nhật trạng thái
              </button>
            </section>
          )}
        </div>
        <Modal
          isOpen={!!review}
          onClose={() => setReview(null)}
          title={`Kết quả phiên bản ${review?.version}`}
          maxWidth="xl"
        >
          {review && <AiReview submission={review} />}
        </Modal>
      </div>
    </PublicLayout>
  )
}
export default ArticleEditorPage
