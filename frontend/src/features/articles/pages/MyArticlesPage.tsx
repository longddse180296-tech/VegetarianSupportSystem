import { useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { UserProfileShell } from '../../profile/components/UserProfileShell'
import { Select } from '../../../shared/components/Select'
import { Button, EmptyState } from '../../../shared/components'
import { Feedback, Pager } from '../../admin/components/ApiWorkspace'
import { useApiData } from '../../admin/hooks/useApiData'
import { errorMessage, formatDate } from '../../admin/utils/apiUi'
import {
  adminStatusLabels,
  type AdminStatus,
} from '../../admin/moderation/api/adminModerationApi'
import {
  articleApi,
  type ContentPage,
  type MyArticleRecord,
} from '../api/articles.api'

function getStatusBadge(status: string) {
  switch (status) {
    case 'Published':
      return 'bg-emerald-50 text-[#2E7D32] border border-emerald-200'
    case 'PendingAdminReview':
      return 'bg-amber-50 text-amber-800 border border-amber-200'
    case 'Draft':
      return 'bg-slate-100 text-slate-700 border border-slate-200'
    case 'RevisionRequested':
      return 'bg-orange-50 text-orange-800 border border-orange-200'
    case 'Rejected':
    case 'Removed':
      return 'bg-rose-50 text-rose-700 border border-rose-200'
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200'
  }
}

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
      breadcrumbs={[
        { label: 'Trang chủ', path: '/' },
        { label: 'Tài khoản', path: '/profile' },
        { label: 'Bài viết của tôi' },
      ]}
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 space-y-6 shadow-xs">
        {/* Header với nút Viết bài mới */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Bài viết của tôi
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Quản lý các bài viết chia sẻ, theo dõi trạng thái duyệt và chỉnh sửa bản nháp.
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => onNavigate('/articles/create?from=profile')}
          >
            Viết bài mới
          </Button>
        </div>

        {/* Thanh tìm kiếm & bộ lọc trạng thái */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-64">
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
          <Button
            variant="outline"
            size="md"
            leftIcon={<RefreshCw size={14} />}
            onClick={result.reload}
          >
            Làm mới
          </Button>
        </div>

        <Feedback error={error || result.error} />

        {/* Danh sách bài viết */}
        {result.loading ? (
          <div className="space-y-4 py-4">
            <div className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
            <div className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
          </div>
        ) : result.data?.items.length ? (
          <div className="space-y-4">
            {result.data.items.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 hover:border-emerald-200 transition-all shadow-xs"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {item.coverImageUrl && (
                    <img
                      alt={item.title}
                      src={item.coverImageUrl}
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80'
                      }}
                      className="w-full sm:w-28 h-28 rounded-xl object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(item.status)}`}
                      >
                        {adminStatusLabels[item.status as AdminStatus] || item.status}
                      </span>
                      <span className="text-xs text-slate-300 font-medium">·</span>
                      <span className="text-xs text-slate-500 font-medium">
                        {item.category}
                      </span>
                      <span className="text-xs text-slate-300 font-medium">·</span>
                      <span className="text-xs text-slate-400">
                        {formatDate(item.updatedAt)}
                      </span>
                    </div>

                    <h2 className="font-bold text-lg text-slate-900 line-clamp-1 leading-snug">
                      {item.title}
                    </h2>

                    {item.publishedVersion && (
                      <p className="text-xs text-emerald-700 font-medium">
                        Phiên bản {item.publishedVersion.version} đang công khai
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onNavigate(`/articles/editor/${item.id}?from=profile`)
                    }
                  >
                    Xem bản nháp / trạng thái
                  </Button>
                  {item.publishedVersion && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigate(`/articles/${item.id}`)}
                    >
                      Xem bản công khai
                    </Button>
                  )}
                  {!item.versions.length && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
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
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          !result.error && (
            <EmptyState
              title="Chưa có bài viết phù hợp"
              description="Bạn chưa có bài viết nào theo bộ lọc này. Hãy bắt đầu chia sẻ kinh nghiệm ăn chay cùng cộng đồng."
              actionLabel="Viết bài mới ngay"
              onAction={() => onNavigate('/articles/create?from=profile')}
            />
          )
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
