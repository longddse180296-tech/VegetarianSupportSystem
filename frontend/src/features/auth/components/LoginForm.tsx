import React, { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Info, AlertCircle } from 'lucide-react'
import type { LoginCredentials } from '../types'

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>
  onNavigateToRegister?: () => void
  onNavigateToForgotPassword?: () => void
  isLoading?: boolean
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onNavigateToRegister,
  onNavigateToForgotPassword,
  isLoading = false,
}) => {
  const [email, setEmail] = useState('nguyen.an@example.com')
  const [password, setPassword] = useState('Matkhau123')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!email.trim() || !emailRegex.test(email.trim())) {
      errors.email = 'Email không hợp lệ.'
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu.'
    } else if (password.length < 6) {
      errors.password = 'Mật khẩu tối thiểu 6 ký tự.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!validate()) {
      return
    }

    try {
      await onSubmit({ email, password, rememberMe })
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Đăng nhập thất bại. Vui lòng thử lại.')
      }
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
      {/* Card Header */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Chào mừng bạn trở lại</h2>
        <p className="text-sm text-slate-500">Đăng nhập để tiếp tục sử dụng Vegetarian Support.</p>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email Field */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-email" className="text-xs font-semibold text-slate-700">
            Email
          </label>
          <div className="relative flex items-center">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined })
              }}
              placeholder="nguyen.an@example.com"
              disabled={isLoading}
              className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed ${
                fieldErrors.email
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-emerald-500'
              }`}
            />
          </div>
          {fieldErrors.email && (
            <span className="text-xs text-rose-600 font-medium">{fieldErrors.email}</span>
          )}
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-xs font-semibold text-slate-700">
              Mật khẩu
            </label>
            <button
              type="button"
              onClick={onNavigateToForgotPassword}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded"
            >
              Quên mật khẩu?
            </button>
          </div>
          <div className="relative flex items-center">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined })
              }}
              placeholder="••••••••••••"
              disabled={isLoading}
              className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border bg-white text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed ${
                fieldErrors.password
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-emerald-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <span className="text-xs text-rose-600 font-medium">{fieldErrors.password}</span>
          )}
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center gap-2 pt-1">
          <input
            id="login-remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
          />
          <label htmlFor="login-remember" className="text-xs text-slate-600 cursor-pointer select-none">
            Ghi nhớ đăng nhập
          </label>
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
              <span>Đang đăng nhập...</span>
            </>
          ) : (
            <>
              <span>Đăng nhập</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Register link */}
      <div className="text-center text-xs text-slate-600">
        <span>Chưa có tài khoản? </span>
        <button
          type="button"
          onClick={onNavigateToRegister}
          className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded"
        >
          Đăng ký ngay
        </button>
      </div>

      {/* System Error Guidelines Box (Matching Figma bottom box) */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-600 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>Quy chuẩn thông báo lỗi hệ thống:</span>
        </div>
        <ul className="flex flex-col gap-1 pl-4 text-slate-500 text-[11px]">
          <li>
            • Email trống / sai định dạng: <span className="text-rose-600 font-medium">&ldquo;Email không hợp lệ.&rdquo;</span>
          </li>
          <li>
            • Sai tài khoản: <span className="text-rose-600 font-medium">&ldquo;Email hoặc mật khẩu không chính xác.&rdquo;</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
export default LoginForm
