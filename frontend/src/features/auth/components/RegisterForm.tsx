// Chức năng: đăng ký, đăng nhập và khôi phục mật khẩu. Hiển thị một phần giao diện và phát sự kiện cho màn hình cha xử lý.
import React, { useState } from 'react'
import {
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { ApiError } from '../../../shared/api/apiClient'
import type { RegisterPayload } from '../types'

// Cấu trúc RegisterFormProps quy định dữ liệu trao đổi trong đăng ký, đăng nhập và khôi phục mật khẩu.
interface RegisterFormProps {
  onSubmit: (payload: RegisterPayload) => Promise<void>
  onNavigateToLogin?: () => void
  isLoading?: boolean
}

// Kiểm tra và gửi thông tin tạo tài khoản (RegisterForm); thuộc đăng ký, đăng nhập và khôi phục mật khẩu.
export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  onNavigateToLogin,
  isLoading = false,
}) => {
  // Lưu dữ liệu và trạng thái thao tác của đăng ký, đăng nhập và khôi phục mật khẩu trong vòng đời màn hình.
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({})

  // Kiểm tra điều kiện hợp lệ trước khi cho phép xử lý tiếp (validate); thuộc đăng ký, đăng nhập và khôi phục mật khẩu.
  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const trimmedName = fullName.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName) {
      errors.fullName = 'Họ tên không được để trống.'
    } else if (trimmedName.length > 150) {
      errors.fullName = 'Họ tên không vượt quá 150 ký tự.'
    }

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      errors.email = 'Email không hợp lệ.'
    } else if (trimmedEmail.length > 254) {
      errors.email = 'Email không vượt quá 254 ký tự.'
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu.'
    } else if (password.length < 6 || password.length > 128) {
      errors.password = 'Mật khẩu phải dài từ 6 đến 128 ký tự.'
    } else if (/\s/.test(password)) {
      errors.password = 'Mật khẩu không được chứa khoảng trắng.'
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.'
    }

    if (!agreeTerms) {
      errors.agreeTerms = 'Yêu cầu tích chọn đồng ý Điều khoản sử dụng.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Kiểm tra dữ liệu trước khi gửi thao tác và xử lý kết quả trả về (handleSubmit); thuộc đăng ký, đăng nhập và khôi phục mật khẩu.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!validate()) {
      return
    }

    try {
      await onSubmit({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        agreeTerms,
      })
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          const msg = err.title || 'Email đã được đăng ký.'
          setFieldErrors((prev) => ({ ...prev, email: msg }))
          setErrorMessage(msg)
        } else if (err.status === 400 && err.errors) {
          const newFieldErrors: Record<string, string> = {}
          for (const [key, msgs] of Object.entries(err.errors)) {
            const lowerKey = key.toLowerCase()
            if (lowerKey.includes('fullname') || lowerKey.includes('name')) {
              newFieldErrors.fullName = msgs[0]
            } else if (lowerKey.includes('email')) {
              newFieldErrors.email = msgs[0]
            } else if (lowerKey.includes('confirmpassword')) {
              newFieldErrors.confirmPassword = msgs[0]
            } else if (lowerKey.includes('password')) {
              newFieldErrors.password = msgs[0]
            }
          }
          setFieldErrors(newFieldErrors)
          setErrorMessage(err.message || 'Thông tin đăng ký không hợp lệ.')
        } else {
          setErrorMessage(err.message || 'Đăng ký không thành công. Vui lòng thử lại.')
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Đăng ký không thành công. Vui lòng thử lại.')
      }
    }
  }

  // Hiển thị giao diện đăng ký, đăng nhập và khôi phục mật khẩu từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col gap-5">
      {/* Card Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Tạo tài khoản</h2>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Tham gia Vegetarian Support để lưu thực đơn, đăng bài và sử dụng đầy đủ các tính năng AI.
        </p>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {/* Full Name */}
        <div className="flex flex-col gap-1">
          <label htmlFor="reg-fullname" className="text-xs font-semibold text-slate-700">
            Họ và tên <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              id="reg-fullname"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: undefined })
              }}
              placeholder="Nguyễn Văn An"
              disabled={isLoading}
              className={`w-full pl-10 pr-3.5 py-2 text-sm rounded-lg border bg-white text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed ${
                fieldErrors.fullName
                  ? 'border-rose-400 focus:border-rose-500'
                  : 'border-slate-300 focus:border-emerald-500'
              }`}
            />
          </div>
          {fieldErrors.fullName && (
            <span className="text-xs text-rose-600 font-medium">{fieldErrors.fullName}</span>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1">
          <label htmlFor="reg-email" className="text-xs font-semibold text-slate-700">
            Email <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined })
              }}
              placeholder="nguyen.an@example.com"
              disabled={isLoading}
              className={`w-full pl-10 pr-3.5 py-2 text-sm rounded-lg border bg-white text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed ${
                fieldErrors.email
                  ? 'border-rose-400 focus:border-rose-500'
                  : 'border-slate-300 focus:border-emerald-500'
              }`}
            />
          </div>
          {fieldErrors.email && (
            <span className="text-xs text-rose-600 font-medium">{fieldErrors.email}</span>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1">
          <label htmlFor="reg-password" className="text-xs font-semibold text-slate-700">
            Mật khẩu <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined })
              }}
              placeholder="Nhập mật khẩu (6–128 ký tự)"
              disabled={isLoading}
              className={`w-full pl-10 pr-10 py-2 text-sm rounded-lg border bg-white text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed ${
                fieldErrors.password
                  ? 'border-rose-400 focus:border-rose-500'
                  : 'border-slate-300 focus:border-emerald-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="fe1-link absolute right-3 p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <span className="text-[11px] text-slate-400">
            Mật khẩu dài 6–128 ký tự, không chứa khoảng trắng.
          </span>
          {fieldErrors.password && (
            <span className="text-xs text-rose-600 font-medium">{fieldErrors.password}</span>
          )}
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-1">
          <label htmlFor="reg-confirm-password" className="text-xs font-semibold text-slate-700">
            Xác nhận mật khẩu <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              id="reg-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (fieldErrors.confirmPassword)
                  setFieldErrors({ ...fieldErrors, confirmPassword: undefined })
              }}
              placeholder="Nhập lại mật khẩu của bạn"
              disabled={isLoading}
              className={`w-full pl-10 pr-10 py-2 text-sm rounded-lg border bg-white text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed ${
                fieldErrors.confirmPassword
                  ? 'border-rose-400 focus:border-rose-500'
                  : 'border-slate-300 focus:border-emerald-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="fe1-link absolute right-3 p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <span className="text-xs text-rose-600 font-medium">{fieldErrors.confirmPassword}</span>
          )}
        </div>

        {/* Agree Terms Checkbox */}
        <div className="flex items-start gap-2 pt-1">
          <input
            id="reg-terms"
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => {
              setAgreeTerms(e.target.checked)
              if (fieldErrors.agreeTerms)
                setFieldErrors({ ...fieldErrors, agreeTerms: undefined })
            }}
            className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
          />
          <label htmlFor="reg-terms" className="text-xs text-slate-600 cursor-pointer select-none leading-relaxed">
            Tôi đồng ý với{' '}
            <a href="#/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 hover:underline">Điều khoản sử dụng</a>{' '}
            và{' '}
            <a href="#/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 hover:underline">
              Chính sách bảo mật
            </a>{' '}
            của Vegetarian Support.
          </label>
        </div>
        {fieldErrors.agreeTerms && (
          <span className="text-xs text-rose-600 font-medium">{fieldErrors.agreeTerms}</span>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="fe1-btn fe1-btn-primary mt-2 w-full py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang tạo tài khoản...</span>
            </>
          ) : (
            <>
              <span>Đăng ký tài khoản</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Login link */}
      <div className="text-center text-xs text-slate-600">
        <span>Đã có tài khoản? </span>
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="fe1-link font-bold text-emerald-700 hover:text-emerald-800 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded"
        >
          Đăng nhập
        </button>
      </div>

      {/* System Guidelines Box */}
      <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-slate-600 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Quy chuẩn xác thực hệ thống:</span>
        </div>
        <ul className="flex flex-col gap-1 pl-4 text-slate-600 text-[11px]">
          <li>• Họ tên không được để trống (1–150 ký tự)</li>
          <li>• Email hợp lệ &amp; chưa tồn tại trên hệ thống</li>
          <li>• Mật khẩu dài 6–128 ký tự, không chứa khoảng trắng</li>
          <li>• Mật khẩu xác nhận phải trùng khớp</li>
          <li>• Yêu cầu tích chọn đồng ý Điều khoản sử dụng</li>
        </ul>
      </div>
    </div>
  )
}
export default RegisterForm
