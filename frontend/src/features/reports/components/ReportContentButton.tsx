// Chức năng: báo cáo nội dung cần xem xét. Hiển thị một phần giao diện và phát sự kiện cho màn hình cha xử lý.
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CheckCircle2, Flag } from 'lucide-react'
import { useAuth } from '../../auth'
import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import { REPORT_REASONS, getContentReportStatus, submitContentReport, type ReportReason, type ReportTarget } from '../api/contentReports'

// Thành phần ReportContentButton nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc báo cáo nội dung cần xem xét.
export default function ReportContentButton({ targetType, targetId }: { targetType: ReportTarget; targetId: string }) {
  const { user } = useAuth()
  // Lưu dữ liệu và trạng thái thao tác của báo cáo nội dung cần xem xét trong vòng đời màn hình.
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [details, setDetails] = useState('')
  const [pending, setPending] = useState(false)
  const [reportedKey, setReportedKey] = useState<string | null>(null)
  const [error, setError] = useState('')
  // Giữ tham chiếu giữa các lần render để quản lý yêu cầu hoặc phần tử giao diện.
  const reasonRef = useRef<HTMLSelectElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const label = targetType === 'Article' ? 'bài viết' : 'video'
  const currentKey = user && targetId ? `${user.id}:${targetType}:${targetId}` : null
  const sent = Boolean(currentKey && reportedKey === currentKey)

  // Đồng bộ trạng thái hoặc tác động bên ngoài khi các phụ thuộc thay đổi.
  useEffect(() => { if (open) reasonRef.current?.focus() }, [open])

  // Kiểm tra trạng thái đã báo cáo của tài khoản hiện tại để chống gửi báo cáo spam lặp lại.
  useEffect(() => {
    if (!currentKey || !targetId) return
    let active = true
    void getContentReportStatus(targetType, targetId)
      .then(res => {
        if (active && res.hasReported) setReportedKey(currentKey)
      })
      .catch(() => {
        // Bỏ qua lỗi mạng khi kiểm tra trạng thái ban đầu; backend vẫn chặn khi gửi trùng.
      })
    return () => { active = false }
  }, [currentKey, targetType, targetId])

  // Khôi phục hoặc kết thúc trạng thái thao tác hiện tại (close); thuộc báo cáo nội dung cần xem xét.
  function close() {
    if (pending) return
    setOpen(false)
    triggerRef.current?.focus()
  }
  // Kiểm tra dữ liệu trước khi gửi thao tác và xử lý kết quả trả về (submit); thuộc báo cáo nội dung cần xem xét.
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (pending || !reason || sent || !currentKey) return
    setPending(true)
    setError('')
    try {
      await submitContentReport(targetType, targetId, reason, details)
      setReportedKey(currentKey)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Chưa gửi được báo cáo. Vui lòng thử lại.'
      if (message.includes('đã gửi báo cáo') || message.includes('đã có báo cáo')) {
        setReportedKey(currentKey)
      }
      setError(message)
    } finally { setPending(false) }
  }

  return <>
    <button ref={triggerRef} type="button" disabled={sent} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-60" onClick={() => {
      if (sent) return
      if (!user) {
        const returnUrl = `/${targetType === 'Article' ? 'articles' : 'videos'}/${targetId}`
        window.location.hash = `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`
        return
      }
      setOpen(true)
    }}><Flag size={16} aria-hidden="true" />{sent ? 'Đã gửi báo cáo' : `Báo cáo ${label}`}</button>
    <Modal isOpen={open} onClose={close} title={`Báo cáo ${label}`} description="Báo cáo được gửi riêng cho Admin để xem xét. Mỗi tài khoản chỉ gửi báo cáo một lần cho mỗi nội dung." maxWidth="lg">
      {sent ? <div className="space-y-4 py-3">
        <p role="status" className="flex items-start gap-2 rounded-xl bg-emerald-50 p-4 text-emerald-800"><CheckCircle2 className="shrink-0" size={20} />Đã gửi báo cáo. Quản trị viên sẽ xem xét nội dung và quyết định cách xử lý.</p>
        <Button onClick={close}>Đóng</Button>
      </div> : <form onSubmit={submit} className="space-y-4" aria-busy={pending}>
        <label className="block font-semibold">Lý do báo cáo <span className="text-rose-600">*</span>
          <select ref={reasonRef} value={reason} required disabled={pending} onChange={event => setReason(event.target.value as ReportReason)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal">
            <option value="">Chọn lý do</option>
            {Object.entries(REPORT_REASONS).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
          </select>
        </label>
        <label className="block font-semibold">Mô tả thêm {reason === 'Other' ? '(bắt buộc)' : '(không bắt buộc)'}
          <textarea value={details} onChange={event => setDetails(event.target.value)} disabled={pending} required={reason === 'Other'} maxLength={2000} rows={5} className="mt-2 w-full resize-y rounded-xl border border-slate-300 p-3 font-normal" placeholder={targetType === 'Video' ? 'Mô tả vấn đề và mốc thời gian trong video nếu có...' : 'Mô tả vấn đề hoặc đoạn nội dung cần Admin kiểm tra...'} />
        </label>
        <p className="text-xs text-slate-500">{details.length}/2000 ký tự. Vui lòng không gửi thông tin cá nhân nhạy cảm.</p>
        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-700">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={close} disabled={pending}>Hủy</Button>
          <Button type="submit" isLoading={pending} disabled={!reason || (reason === 'Other' && !details.trim())}>{pending ? 'Đang gửi...' : 'Gửi báo cáo'}</Button>
        </div>
      </form>}
    </Modal>
  </>
}
