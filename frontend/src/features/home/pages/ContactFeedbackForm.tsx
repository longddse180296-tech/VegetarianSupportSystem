import { useState, type FormEvent } from 'react'
import { Send } from 'lucide-react'
import { apiClient } from '../../../shared/api/apiClient'

export default function ContactFeedbackForm() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const form = event.currentTarget
    const data = new FormData(form)
    setPending(true)
    setError('')
    setReceipt(null)
    try {
      const result = await apiClient.post<{ id: string }>('/api/feedback', {
        name: String(data.get('name') || '').trim(),
        email: String(data.get('email') || '').trim(),
        subject: String(data.get('subject') || '').trim(),
        message: String(data.get('message') || '').trim(),
      }, { requiresAuth: false })
      setReceipt(result.id)
      form.reset()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Chưa gửi được góp ý. Vui lòng thử lại.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="contact-feedback-form" onSubmit={submit} aria-label="Gửi góp ý cho Admin" aria-busy={pending}>
      <h2>Gửi góp ý cho Admin</h2>
      <p>Góp ý được gửi riêng đến quản trị viên của Vegetarian Support.</p>
      {receipt && <div role="status" className="contact-feedback-success">Đã gửi góp ý đến Admin. Cảm ơn bạn!<br /><small>Mã góp ý: {receipt}</small></div>}
      {error && <div role="alert" className="contact-feedback-error">{error}</div>}
      <fieldset disabled={pending}>
        <div className="contact-feedback-row">
          <label htmlFor="feedback-name">Họ tên <span>(bắt buộc)</span>
            <input id="feedback-name" name="name" autoComplete="name" required maxLength={100} placeholder="Họ tên của bạn" />
          </label>
          <label htmlFor="feedback-email">Email <span>(bắt buộc)</span>
            <input id="feedback-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="Email để Admin liên hệ khi cần" />
          </label>
        </div>
        <label htmlFor="feedback-subject">Tiêu đề <span>(bắt buộc)</span>
          <input id="feedback-subject" name="subject" required maxLength={150} placeholder="Bạn muốn góp ý về điều gì?" />
        </label>
        <label htmlFor="feedback-message">Nội dung <span>(bắt buộc)</span>
          <textarea id="feedback-message" name="message" required maxLength={4000} rows={6} placeholder="Mô tả góp ý hoặc vấn đề bạn gặp phải (tối đa 4.000 ký tự)" aria-describedby="feedback-note" />
        </label>
        <p id="feedback-note">Không gửi mật khẩu, mã đăng nhập hoặc thông tin sức khỏe nhạy cảm trong góp ý.</p>
        <button type="submit"><Send size={17} />{pending ? 'Đang gửi...' : 'Gửi góp ý cho Admin'}</button>
      </fieldset>
    </form>
  )
}
