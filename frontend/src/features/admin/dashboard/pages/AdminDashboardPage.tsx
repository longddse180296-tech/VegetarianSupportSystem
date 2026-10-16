import {
  Apple, ArrowRight, ArrowUpRight, BookOpen, ClipboardCheck, Clock3,
  FileText, LayoutGrid, MapPin, MessageSquare, RefreshCw, Users, Video,
} from 'lucide-react'
import { AdminFrame, Feedback } from '../../components/ApiWorkspace'
import { useApiData } from '../../hooks/useApiData'
import { secondaryClass, formatDate } from '../../utils/apiUi'
import { FeaturedContent } from '../components/FeaturedContent'
import type { DashboardResponse } from '../api/dashboardApi'

const catalogCards = [
  { key: 'categories', label: 'Danh mục công thức', icon: LayoutGrid },
  { key: 'ingredients', label: 'Nguyên liệu', icon: Apple },
  { key: 'recipes', label: 'Công thức', icon: BookOpen },
  { key: 'restaurants', label: 'Nhà hàng', icon: MapPin },
] as const

const activityLabels: Record<string, string> = {
  MemberRegistered: 'Đăng ký thành viên',
  MemberLocked: 'Khóa thành viên',
  MemberUnlocked: 'Mở khóa thành viên',
  ArticleSubmitted: 'Gửi bài viết duyệt',
  VideoSubmitted: 'Gửi video duyệt',
  ArticleApprove: 'Duyệt bài viết',
  ArticleRequestRevision: 'Yêu cầu sửa bài viết',
  ArticleReject: 'Từ chối bài viết',
  ArticleRemove: 'Gỡ bài viết',
  VideoApprove: 'Duyệt video',
  VideoRequestRevision: 'Yêu cầu sửa video',
  VideoReject: 'Từ chối video',
  VideoRemove: 'Gỡ video',
}
const numberFormatter = new Intl.NumberFormat('vi-VN')

export const AdminDashboardPage = ({ onNavigate }: { onNavigate: (path: string) => void }) => {
  const result = useApiData<DashboardResponse>('/api/admin/dashboard')
  const data = result.data
  const cards = data ? [
    {
      label: 'Thành viên', value: data.members.registered, icon: Users,
      detail: `${numberFormatter.format(data.members.active)} hoạt động · ${numberFormatter.format(data.members.locked)} đã khóa`,
      path: '/admin/members',
    },
    {
      label: 'Bài viết công khai', value: data.content.publishedArticles, icon: FileText,
      detail: `${numberFormatter.format(data.pendingAdminReview.articles)} chờ Admin duyệt`,
      path: '/admin/articles',
    },
    {
      label: 'Video công khai', value: data.content.publishedVideos, icon: Video,
      detail: `${numberFormatter.format(data.pendingAdminReview.videos)} chờ Admin duyệt`,
      path: '/admin/videos',
    },
    {
      label: 'Bình luận hiển thị', value: data.content.comments, icon: MessageSquare,
      detail: 'Phản hồi từ cộng đồng', path: '/admin/comments',
    },
    ...catalogCards.map(({ key, label, icon }) => ({
      label, value: data.coreData[key].total, icon,
      detail: `${numberFormatter.format(data.coreData[key].active)} đang sử dụng`,
      path: `/admin/${key}`,
    })),
  ] : []

  return (
    <AdminFrame menu="dashboard" title="Tổng quan hệ thống quản trị" subtitle="Theo dõi cộng đồng, nội dung và hoạt động kiểm duyệt." onNavigate={onNavigate}>
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="flex flex-col justify-between gap-6 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-5 shadow-sm sm:p-7 lg:flex-row lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <LayoutGrid aria-hidden="true" className="h-4 w-4" />KHÔNG GIAN QUẢN TRỊ
            </span>
            <h2 className="mt-3 text-xl font-bold tracking-tight text-emerald-950 sm:text-2xl">Tổng quan nội dung và cộng đồng</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">Theo dõi số liệu, xử lý nội dung chờ duyệt và chọn các mục nổi bật từ một nơi.</p>
          </div>
          <button type="button" className={`${secondaryClass} inline-flex shrink-0 items-center justify-center gap-2 self-start shadow-sm lg:self-auto`} onClick={result.reload} disabled={result.loading}>
            <RefreshCw aria-hidden="true" className={`h-4 w-4 ${result.loading ? 'animate-spin motion-reduce:animate-none' : ''}`} />
            {result.loading ? 'Đang tải dữ liệu' : 'Làm mới dữ liệu'}
          </button>
        </section>

        <Feedback error={result.error} />

        <section aria-labelledby="dashboard-metrics-title" aria-busy={result.loading} className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="dashboard-metrics-title" className="text-lg font-bold text-slate-900">Số liệu tổng quan</h2>
            <span className="text-xs text-slate-500">Thành viên · Nội dung · Kho dữ liệu</span>
          </div>
          {result.loading ? (
            <>
              <p role="status" className="sr-only">Đang tải số liệu tổng quan...</p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 8 }, (_, index) => (
                  <div key={index} aria-hidden="true" className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm motion-reduce:animate-none">
                    <div className="mb-5 h-10 w-10 rounded-xl bg-slate-100" />
                    <div className="h-3 w-28 rounded bg-slate-100" />
                    <div className="my-3 h-8 w-16 rounded bg-slate-100" />
                    <div className="h-3 w-36 max-w-full rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            </>
          ) : data ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((card) => (
                <button key={card.path} type="button" className="group min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md motion-reduce:transition-none" onClick={() => onNavigate(card.path)}>
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><card.icon aria-hidden="true" className="h-5 w-5" /></span>
                    <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-slate-400 transition-colors group-hover:text-emerald-700" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <p className="my-2 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{card.value == null ? '—' : numberFormatter.format(card.value)}</p>
                  <p className="text-xs text-slate-500">{card.detail}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center">
              <LayoutGrid aria-hidden="true" className="mx-auto mb-3 h-7 w-7 text-slate-400" />
              <p className="font-semibold text-slate-700">Chưa có số liệu tổng quan</p>
              <p className="mt-1 text-sm text-slate-500">Chọn “Làm mới dữ liệu” để tải lại.</p>
            </div>
          )}
        </section>

        {data && (
          <section aria-labelledby="review-queue-title" className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="review-queue-title" className="text-lg font-bold text-slate-900">Hàng đợi kiểm duyệt</h2>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">{numberFormatter.format(data.pendingAdminReview.total)} nội dung chờ duyệt</span>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {[
                { type: 'articles', label: 'Bài viết', count: data.pendingAdminReview.articles, icon: FileText, description: 'Xem trực tiếp nội dung bài viết và đưa ra quyết định duyệt.' },
                { type: 'videos', label: 'Video', count: data.pendingAdminReview.videos, icon: Video, description: 'Xem trực tiếp video trước khi đưa ra quyết định.' },
              ].map((queue) => (
                <button key={queue.type} type="button" onClick={() => onNavigate(`/admin/${queue.type}`)} className="group flex min-w-0 items-start gap-4 rounded-2xl border border-emerald-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-400 hover:shadow-md motion-reduce:transition-none sm:p-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><queue.icon aria-hidden="true" className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{queue.label} chờ Admin duyệt</p>
                    <p className="my-2 text-3xl font-bold text-emerald-800 tabular-nums">{numberFormatter.format(queue.count)}</p>
                    <p className="text-sm text-slate-500">{queue.description}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">Mở hàng đợi <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none" /></span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        <FeaturedContent onNavigate={onNavigate} />

        {data && (
          <section aria-labelledby="recent-activity-title" className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 id="recent-activity-title" className="flex items-center gap-2 text-lg font-bold text-slate-900"><Clock3 aria-hidden="true" className="h-5 w-5 text-emerald-700" />Hoạt động gần đây</h2>
              <span className="text-xs text-slate-500">Các hoạt động mới nhất</span>
            </div>
            {data.recentActivity.length ? (
              <ol className="divide-y divide-slate-100">
                {data.recentActivity.map((item, index) => {
                  const ActivityIcon = item.type.startsWith('Member') ? Users : item.type.startsWith('Video') ? Video : FileText
                  return (
                    <li key={`${item.entityId}-${item.type}-${index}`} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><ActivityIcon aria-hidden="true" className="h-4 w-4" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold text-slate-800">{activityLabels[item.type] || item.type}: {item.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                          <span className="break-all">{item.actorName || item.actorUserId || 'Hệ thống'}</span><span aria-hidden="true">·</span>
                          <time dateTime={item.occurredAtUtc}>{formatDate(item.occurredAtUtc)}</time>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
                <ClipboardCheck aria-hidden="true" className="mx-auto mb-3 h-8 w-8 text-emerald-600" />
                <p className="font-semibold text-slate-700">Chưa có hoạt động gần đây</p>
                <p className="mt-1 text-sm text-slate-500">Hoạt động của thành viên và kiểm duyệt sẽ xuất hiện tại đây.</p>
              </div>
            )}
          </section>
        )}
      </div>
    </AdminFrame>
  )
}
export default AdminDashboardPage
