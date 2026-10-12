import { AdminFrame, Feedback } from '../../components/ApiWorkspace'
import { useApiData } from '../../hooks/useApiData'
import { secondaryClass, formatDate } from '../../utils/apiUi'
import type { DashboardResponse } from '../api/dashboardApi'
const catalogLabels = {
  categories: 'Danh mục công thức',
  ingredients: 'Nguyên liệu',
  recipes: 'Công thức',
  restaurants: 'Nhà hàng',
}
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
export const AdminDashboardPage = ({
  onNavigate,
}: {
  onNavigate: (path: string) => void
}) => {
  const result = useApiData<DashboardResponse>('/api/admin/dashboard')
  const data = result.data
  const cards = data
    ? [
        {
          label: 'Thành viên',
          value: data.members.registered,
          detail: `${data.members.active} hoạt động · ${data.members.locked} đã khóa`,
          path: '/admin/members',
        },
        {
          label: 'Bài viết công khai',
          value: data.content.publishedArticles,
          detail: `${data.pendingAdminReview.articles} chờ Admin`,
          path: '/admin/articles',
        },
        {
          label: 'Video công khai',
          value: data.content.publishedVideos,
          detail: `${data.pendingAdminReview.videos} chờ Admin`,
          path: '/admin/videos',
        },
        {
          label: 'Bình luận hiển thị',
          value: data.content.comments ?? '—',
          detail: 'Bình luận cộng đồng',
          path: '/admin/comments',
        },
        ...Object.entries(catalogLabels).map(([key, label]) => {
          const count = data.coreData[key as keyof typeof catalogLabels]
          return {
            label,
            value: count.total,
            detail: `${count.active} đang sử dụng`,
            path: `/admin/${key}`,
          }
        }),
      ]
    : []
  return (
    <AdminFrame
      menu="dashboard"
      title="Tổng quan hệ thống quản trị"
      subtitle="Số liệu thành viên, kho dữ liệu và hàng đợi kiểm duyệt."
      onNavigate={onNavigate}
    >
      <Feedback error={result.error} />
      <div className="flex justify-end">
        <button className={secondaryClass} onClick={result.reload}>
          Làm mới dữ liệu
        </button>
      </div>
      {result.loading && <p>Đang tải tổng quan...</p>}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <button
            key={card.path}
            className="fe1-control rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xs hover:border-emerald-400"
            onClick={() => onNavigate(card.path)}
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="text-3xl font-extrabold text-[#1E6531] my-3">
              {card.value}
            </p>
            <p className="text-xs text-slate-500">{card.detail}</p>
          </button>
        ))}
      </div>
      {data && (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <button
              className="fe1-control rounded-2xl bg-[#EAF5EE] border border-emerald-200 p-5 text-left"
              onClick={() => onNavigate('/admin/articles')}
            >
              <strong className="text-[#1E6531]">
                {data.pendingAdminReview.articles} bài viết đang chờ Admin duyệt →
              </strong>
              <p className="mt-2 text-xs text-slate-600">
                Kiểm duyệt bài viết, xem kết quả AI và lưu quyết định.
              </p>
            </button>
            <button
              className="fe1-control rounded-2xl bg-[#EAF5EE] border border-emerald-200 p-5 text-left"
              onClick={() => onNavigate('/admin/videos')}
            >
              <strong className="text-[#1E6531]">
                {data.pendingAdminReview.videos} video đang chờ Admin duyệt →
              </strong>
              <p className="mt-2 text-xs text-slate-600">
                Admin xem trực tiếp video và lưu quyết định.
              </p>
            </button>
          </div>
          <section className="rounded-2xl border bg-white p-5 space-y-4">
            <h2 className="font-bold text-lg">Hoạt động gần đây</h2>
            {data.recentActivity.length ? (
              data.recentActivity.map((item, index) => (
                <div
                  key={`${item.entityId}-${item.type}-${index}`}
                  className="border-t pt-3"
                >
                  <p className="text-sm font-semibold">
                    {activityLabels[item.type] || item.type}: {item.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {item.actorName || item.actorUserId || 'Hệ thống'} ·{' '}
                    {formatDate(item.occurredAtUtc)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Chưa có hoạt động.</p>
            )}
          </section>
        </>
      )}
    </AdminFrame>
  )
}
export default AdminDashboardPage
