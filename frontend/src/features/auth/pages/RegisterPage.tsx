import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '..'

const schema = z
  .object({
    fullName: z.string().trim().min(2, { message: 'Họ tên tối thiểu 2 ký tự' }),
    email: z.string().email({ message: 'Email không hợp lệ' }),
    password: z.string().min(6, { message: 'Mật khẩu tối thiểu 6 ký tự' }),
    confirmPassword: z.string().min(6, { message: 'Xác nhận mật khẩu tối thiểu 6 ký tự' }),
    goal: z.enum(['lose_weight', 'maintain', 'gain_muscle', 'vegan_lifestyle']),
    acceptTerms: z.boolean().refine((v) => v === true, { message: 'Vui lòng đồng ý điều khoản dịch vụ' }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

type RegisterValues = z.infer<typeof schema>

interface RegisterPageProps {
  onNavigate?: (path: string) => void
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register: signup } = useAuth()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: { goal: 'vegan_lifestyle', acceptTerms: true },
  })

  const onSubmit = async (v: RegisterValues) => {
    try {
      await signup({
        fullName: v.fullName,
        email: v.email,
        password: v.password,
        confirmPassword: v.confirmPassword,
        goal: v.goal,
        agreeTerms: v.acceptTerms,
      })
      onNavigate?.('/recipes')
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'Không thể đăng ký' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-4 py-8">
      <div className="w-full max-w-xl bg-white shadow-xl rounded-2xl border border-slate-200 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-emerald-800 mb-1">Tạo tài khoản mới</h1>
          <p className="text-sm text-slate-600">
            Bắt đầu hành trình dinh dưỡng thuần thực vật cùng Vegetarian Support.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Họ và tên</label>
            <input type="text" className="px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" {...register('fullName')} />
            {errors.fullName && <span className="text-xs text-rose-600">{errors.fullName.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <input type="email" className="px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" {...register('email')} />
            {errors.email && <span className="text-xs text-rose-600">{errors.email.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Mật khẩu</label>
              <input type="password" className="px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" {...register('password')} />
              {errors.password && <span className="text-xs text-rose-600">{errors.password.message}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Xác nhận mật khẩu</label>
              <input type="password" className="px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" {...register('confirmPassword')} />
              {errors.confirmPassword && <span className="text-xs text-rose-600">{errors.confirmPassword.message}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Mục tiêu dinh dưỡng</label>
            <select className="px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" {...register('goal')}>
              <option value="vegan_lifestyle">🎋 Áp dụng lối sống thuần chay</option>
              <option value="lose_weight">⚖️ Giảm cân an toàn</option>
              <option value="maintain">🌿 Duy trì cân nặng, ăn lành mạnh</option>
              <option value="gain_muscle">💪 Tăng cơ thực vật</option>
            </select>
          </div>

          <label className="inline-flex items-start gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="mt-1 accent-emerald-600"
              {...register('acceptTerms')}
            />
            <span>
              Tôi đã đọc và đồng ý với <a className="text-emerald-700 underline" href="#/privacy" onClick={(e) => { e.preventDefault(); onNavigate?.('/privacy') }}>Điều khoản dịch vụ & Chính sách bảo mật</a>.
            </span>
          </label>
          {errors.acceptTerms && <span className="text-xs text-rose-600">{errors.acceptTerms.message}</span>}

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
            {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </button>

          <div className="text-center text-sm text-slate-600">
            Đã có tài khoản?{' '}
            <button type="button" className="text-emerald-700 hover:underline" onClick={() => onNavigate?.('/auth/login')}>
              Đăng nhập ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegisterPage
