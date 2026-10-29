// Chức năng: giao diện và thành phần dùng chung. Hiển thị một phần giao diện và phát sự kiện cho màn hình cha xử lý.
import { Component, type ErrorInfo, type ReactNode } from 'react'

// Chặn lỗi render lan ra toàn bộ ứng dụng và đưa người dùng về màn hình có thể thao tác.
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Chi tiết phục vụ lập trình viên; giao diện chỉ hiển thị hướng khôi phục.
    console.error('Không thể hiển thị màn hình', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    // Hiển thị thành phần giao diện dùng chung từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
    return (
      <main className="mx-auto my-12 max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6" role="alert">
        <h1 className="text-xl font-bold text-slate-900">Chưa thể hiển thị trang này</h1>
        <p className="text-sm text-slate-600">Bạn có thể tải lại trang để thử lại. Những thay đổi chưa lưu có thể cần nhập lại.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="rounded-xl bg-emerald-700 px-4 py-2 text-white" onClick={() => window.location.reload()}>Tải lại trang</button>
          <button type="button" className="rounded-xl border px-4 py-2" onClick={() => { window.location.hash = '/'; this.setState({ failed: false }) }}>Về trang chủ</button>
        </div>
      </main>
    )
  }
}
