import React, { useState } from 'react'
import {
  Mail,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
} from 'lucide-react'

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<{ success: boolean; message: string }>
  onNavigateToLogin?: () => void
  isLoading?: boolean
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSubmit,
  onNavigateToLogin,
  isLoading = false,
}) => {
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<1 | 2>(1)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)

  const validate = (): boolean => {
    const trimmed = email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!trimmed) {
      setFieldError('Vui lòng nhập email.')
      return false
    }

    if (!emailRegex.test(trimmed)) {
      setFieldError('Email không hợp lệ.')
      return false
    }

    setFieldError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!validate()) {
      return
    }

    try {
      const res = await onSubmit(email)
      setSuccessMessage(res.message)
      setStep(2)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Gửi liên kết thất bại. Vui lòng thử lại.')
      }
    }
  }

  return (
    <div className="w-full flex flex-col items-center gap-8 py-8">
      {/* Top Process Steps Bar (strictly matching Figma) */}
      <div className="w-full max-w-2xl bg-white rounded-xl border border-slate-200/90 p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span className="font-bold text-slate-700 tracking-wider uppercase text-[11px]">
          QUY TRÌNH KHÔI PHỤC:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {/* Step 1 */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              step === 1
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>1. Yêu cầu đặt lại</span>
          </div>

          {/* Step 2 */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              step === 2
                ? 'bg-emerald-700 text-white shadow-sm font-semibold'
                : 'text-slate-500 bg-slate-100'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>2. Email đã gửi</span>
          </div>

          {/* Step 3 */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 bg-slate-50 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>3. Đặt lại mật khẩu</span>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
        {step === 1 ? (
          <>
            {/* Icon & Title */}
            <div className="flex flex-col items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shadow-sm">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Quên mật khẩu?</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Nhập email đã đăng ký. Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu cho bạn.
                </p>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="forgot-email" className="text-xs font-semibold text-slate-700">
                  Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (fieldError) setFieldError(null)
                    }}
                    placeholder="Nhập email của bạn"
                    disabled={isLoading}
                    className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed ${
                      fieldError
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-slate-300 focus:border-emerald-500'
                    }`}
                  />
                </div>
                {fieldError && (
                  <span className="text-xs text-rose-600 font-medium">{fieldError}</span>
                )}
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Chúng tôi sẽ gửi một liên kết an toàn có hiệu lực trong 30 phút.</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang gửi liên kết...</span>
                  </>
                ) : (
                  <>
                    <span>Gửi liên kết đặt lại mật khẩu</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Back to Login */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded p-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại đăng nhập</span>
              </button>
            </div>

            {/* Error Rules Box (matching Figma) */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-600 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <FileCheck2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Quy chuẩn thông báo lỗi:</span>
              </div>
              <ul className="flex flex-col gap-1 pl-4 text-slate-500 text-[11px]">
                <li>
                  • Email trống: <span className="text-rose-600 font-medium">&ldquo;Vui lòng nhập email.&rdquo;</span>
                </li>
                <li>
                  • Email sai định dạng: <span className="text-rose-600 font-medium">&ldquo;Email không hợp lệ.&rdquo;</span>
                </li>
              </ul>
            </div>
          </>
        ) : (
          /* Step 2 Success Confirmation */
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-xl font-bold text-slate-900">Email đã được gửi!</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Chúng tôi đã gửi đường dẫn khôi phục mật khẩu đến:
                <br />
                <span className="font-semibold text-slate-900 text-sm">{email}</span>
              </p>
              {successMessage && (
                <p className="text-xs text-emerald-700 mt-2 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                  {successMessage}
                </p>
              )}
            </div>

            <div className="w-full flex flex-col gap-2 mt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2.5 px-4 rounded-lg border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-50 transition-colors"
              >
                Gửi lại email khác
              </button>
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay về trang đăng nhập</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default ForgotPasswordForm
