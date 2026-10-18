import { useState } from 'react'
import { UserProfileShell } from '../../profile/components/UserProfileShell'
import { Select } from '../../../shared/components/Select'
import { Feedback, Pager } from '../../admin/components/ApiWorkspace'
import { useApiData } from '../../admin/hooks/useApiData'
import {
  primaryClass,
  secondaryClass,
  errorMessage,
  formatDate,
} from '../../admin/utils/apiUi'
import {
  adminStatusLabels,
  type AdminStatus,
} from '../../admin/moderation/api/adminModerationApi'
import {
  articleApi,
  type ContentPage,
  type MyArticleRecord,
} from '../api/articles.api'
export const MyArticlesPage = ({
  onNavigate,
}: {
  onNavigate: (path: string) => void
}) => {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const result = useApiData<ContentPage<MyArticleRecord>>(
    `/api/me/articles?page=${page}&pageSize=6${status ? `&status=${status}` : ''}`,
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return (
    <UserProfileShell
      activeTab="my-articles"
      statBadge={{ count: result.data?.totalCount || 0, label: 'Bài viết' }}
      onNavigate={onNavigate}
    >
      <div className="rounded-2xl border bg-white p-5 sm:p-8 space-y-5">
        <div className="flex flex-wrap justify-between gap-3">
          <h1 className="text-2xl font-bold text-[#184d28]">
            Bài viết của tôi
          </h1>
          <button
            className={primaryClass}
            onClick={() => onNavigate('/articles/create?from=profile')}
          >
            Viết bài mới
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-56">
            <Select
              aria-label="Trạng thái bài viết"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              options={[
                { value: '', label: 'Tất cả trạng thái' },
                ...Object.entries(adminStatusLabels).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />
          </div>
          <button className={secondaryClass} onClick={result.reload}>
            Làm mới
          </button>
        </div>
        <Feedback error={error || result.error} />
        {result.loading ? (
          <p>Đang tải...</p>
        ) : result.data?.items.length ? (
          result.data.items.map((item) => (
            <article key={item.id} className="rounded-xl border p-5 space-y-3">
              <div className="flex gap-4">
                {item.coverImageUrl && (
                  <img
                    alt=""
                    src={item.coverImageUrl}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                )}
                <div>
                  <h2 className="font-bold text-lg">{item.title}</h2>
                  <p className="text-sm text-slate-500">
                    {item.category} · {formatDate(item.updatedAt)}
                  </p>
                  <p className="text-sm text-emerald-800 font-semibold">
                    {adminStatusLabels[item.status as AdminStatus]}
                  </p>
                </div>
              </div>
              {item.publishedVersion && (
                <p className="text-xs text-slate-500">
                  Phiên bản {item.publishedVersion.version} đang công khai.
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  className={secondaryClass}
                  onClick={() => onNavigate(`/articles/editor/${item.id}?from=profile`)}
                >
                  Xem bản nháp / trạng thái
                </button>
                {item.publishedVersion && (
                  <button
                    className={secondaryClass}
                    onClick={() => onNavigate(`/articles/${item.id}`)}
                  >
                    Xem bản công khai
                  </button>
                )}
                {!item.versions.length && (
                  <button
                    disabled={busy}
                    className="fe1-link text-sm text-rose-700"
                    onClick={async () => {
                      if (!window.confirm('Xóa bản nháp chưa gửi này?')) return
                      setBusy(true)
                      setError(null)
                      try {
                        await articleApi.remove(item.id)
                        result.reload()
                      } catch (reason) {
                        setError(errorMessage(reason))
                      } finally {
                        setBusy(false)
                      }
                    }}
                  >
                    Xóa nháp
                  </button>
                )}
              </div>
            </article>
          ))
        ) : (
          !result.error && <p>Chưa có bài viết phù hợp.</p>
        )}
        <Pager
          page={page}
          pageSize={6}
          total={result.data?.totalCount || 0}
          onChange={setPage}
        />
      </div>
    </UserProfileShell>
  )
}
export default MyArticlesPage
