export const fieldClass =
  'admin-field mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm disabled:bg-slate-50'
export const primaryClass =
  'fe1-btn fe1-btn-primary rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white enabled:hover:bg-primary-hover disabled:opacity-50'
export const secondaryClass =
  'fe1-btn fe1-btn-outline rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold enabled:hover:border-primary enabled:hover:text-primary disabled:opacity-50'
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Không thể hoàn tất yêu cầu.'
export const formatDate = (date?: string | null) =>
  date ? new Date(date).toLocaleString('vi-VN') : '—'
