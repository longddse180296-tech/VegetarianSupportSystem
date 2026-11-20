import type { ReactNode } from 'react'
import { useSubmissionAvailability } from '../hooks/useSubmissionAvailability'
import { Button } from './Button'

export function NewSubmissionGate({ type, children, onNavigate }: { type: 'Article' | 'Video'; children: ReactNode; onNavigate: (path: string) => void }) {
  const status = useSubmissionAvailability()
  if (status.loading) return <p className="p-8 text-center text-slate-500">Đang kiểm tra trạng thái gửi duyệt...</p>
  const isArticle = type === 'Article'
  if (isArticle ? status.articlePending : status.videoPending) return <section className="ui-page-container py-10">
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <h1 className="text-lg font-bold text-slate-900">{status.unavailable ? 'Chưa kiểm tra được trạng thái gửi duyệt' : `Bạn đang có ${isArticle ? 'bài viết' : 'video'} chờ xử lý`}</h1>
      <p className="my-3 text-sm text-slate-700">{status.unavailable ? 'Vui lòng xem nội dung của bạn hoặc tải lại trang để thử lại.' : 'Vui lòng đợi Quản trị viên chấp nhận hoặc từ chối nội dung đang chờ trước khi gửi nội dung mới cùng loại.'}</p>
      <Button variant="primary" onClick={() => onNavigate(isArticle ? '/profile/my-articles' : '/profile/my-videos')}>Xem {isArticle ? 'bài viết' : 'video'} của tôi</Button>
    </div>
  </section>
  return children
}
