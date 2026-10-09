import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '..'

const schema = z.object({
  email: z
    .string()
    .min(1, { message: 'Vui lòng nhập email' })
    .email('Email không hợp lệ'),
  password: z
    .string()
    .min(1, { message: 'Vui lòng nhập mật khẩu' })
    .min(6, { message: 'Mật khẩu tối thiểu 6 ký tự' }),
  rememberMe: z.boolean().optional(),
})

type LoginFormValues = z.infer<typeof schema>

interface LoginPageProps {
  onNavigate?: (path: string) => void
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (v: LoginFormValues) => {
    try {
      await login({ email: v.email, password: v.password, rememberMe: v.rememberMe })
      onNavigate?.('/recipes')
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'Đăng nhập thất bại' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl border border-slate-200 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-emerald-800 mb-1">Đăng nhập</h1>
          <p className="text-sm text-slate-600">
            Chào mừng trở lại Vegetarian Support – đồng hành cùng chế độ thuần thực vật.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <input
              type="email"
              className="px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="ban@vegetarian.vn"
              {...register('email')}
            />
            {errors.email && <span className="text-xs text-rose-600">{errors.email.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Mật khẩu</label>
            <input
              type="password"
              className="px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="••••••"
              {...register('password')}
            />
            {errors.password && <span className="text-xs text-rose-600">{errors.password.message}</span>}
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" className="accent-emerald-600" {...register('rememberMe')} />
            Ghi nhớ đăng nhập trên thiết bị này
          </label>

          {errors.root && (
            <div className="rounded-lg bg-rose-50 text-rose-700 text-sm px-3 py-2 border border-rose-200">
              {errors.root.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800 disabled:opacity-60 transition"
          >
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          <div className="flex justify-between items-center text-sm">
            <button
              type="button"
              className="text-emerald-700 hover:underline"
              onClick={() => onNavigate?.('/auth/forgot-password')}
            >
              Quên mật khẩu?
            </button>
            <button
              type="button"
              className="text-slate-600 hover:text-emerald-700 hover:underline"
              onClick={() => onNavigate?.('/auth/register')}
            >
              Tạo tài khoản mới
            </button>
          </div>
          <div className="text-center text-xs text-slate-500">
            Hoặc dùng nhanh demo@vegetarian.vn / demo123
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
