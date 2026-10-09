import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '..'

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  newPassword: z.string().min(6, 'Mật khẩu mới tối thiểu 6 ký tự').optional(),
})

type Values = z.infer<typeof schema>

interface Props {
  onNavigate?: (path: string) => void
}

export const ForgotPasswordPage: React.FC<Props> = ({ onNavigate }) => {
  const { resetPassword } = useAuth()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  const [sent, setSent] = useState<{ email: string; tempToken: string } | null>(null)

  const onSubmit = async (v: Values) => {
    try {
      const r = await resetPassword(v.email)
      setSent({ email: v.email, tempToken: r.tempToken })
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'Không thể gửi yêu cầu' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl border border-slate-200 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-emerald-800 mb-1">Khôi phục mật khẩu</h1>
          <p className="text-sm text-slate-600">
            Nhập email đã đăng ký – bạn sẽ nhận được mật khẩu tạm thời để đăng nhập lại.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <input type="email" className="px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="ban@vegetarian.vn" {...register('email')} />
            {errors.email && <span className="text-xs text-rose-600">{errors.email.message}</span>}
          </div>

          {sent && (
            <div className="rounded-xl bg-emerald-50 text-emerald-800 text-sm px-4 py-3 border border-emerald-200">
              <div className="font-semibold mb-1">✅ Đã gửi yêu cầu</div>
              <div>
                Email: <strong>{sent.email}</strong>
              </div>
              <div>
                Token tạm thời (hiển thị demo): <code>{sent.tempToken}</code>
              </div>
              <div className="mt-1">Bạn có thể đăng nhập lại với mật khẩu đã được tạo sẵn trên form, bấm nút dưới để quay về đăng nhập.</div>
            </div>
          )}

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
            {isSubmitting ? 'Đang xử lý...' : 'Gửi yêu cầu khôi phục'}
          </button>

          <button
            type="button"
            className="text-sm text-emerald-700 hover:underline"
            onClick={() => onNavigate?.('/auth/login')}
          >
            ← Quay lại đăng nhập
          </button>
        </form>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
