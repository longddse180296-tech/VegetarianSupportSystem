import React, { forwardRef } from 'react'

export interface SelectOption {
  value: string | number
  label: string
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options?: SelectOption[]
  fullWidth?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options = [],
      fullWidth = true,
      children,
      className = '',
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const selectId =
      id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

    return (
      <div className={`${fullWidth ? 'w-full' : 'inline-block'} flex flex-col gap-1.5 text-left`}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold text-[#1f2937] tracking-tight flex items-center gap-1"
          >
            <span>{label}</span>
            {props.required && <span className="text-[#dc2626] font-bold">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={`h-11 px-3.5 pr-10 w-full bg-white text-sm text-[#1f2937] border rounded-[10px] transition-all duration-150 outline-none appearance-none cursor-pointer
              ${
                error
                  ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-3 focus:ring-red-100'
                  : 'border-[#e5e7eb] focus:border-[#2e7d32] focus:ring-3 focus:ring-[#e8f5e9]'
              }
              ${disabled ? 'bg-slate-50 opacity-60 cursor-not-allowed' : ''}
              ${className}
            `}
            {...props}
          >
            {children ||
              options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
          </select>

          <span className="absolute right-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>

        {error ? (
          <span className="text-xs text-[#dc2626] font-medium flex items-center gap-1 mt-0.5">
            <svg
              className="w-3.5 h-3.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </span>
        ) : helperText ? (
          <span className="text-xs text-slate-500 mt-0.5">{helperText}</span>
        ) : null}
      </div>
    )
  },
)

Select.displayName = 'Select'

export default Select
