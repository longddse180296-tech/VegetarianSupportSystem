import React, { forwardRef } from 'react'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      className = '',
      id,
      rows = 4,
      disabled,
      ...props
    },
    ref,
  ) => {
    const textareaId =
      id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

    return (
      <div className={`${fullWidth ? 'w-full' : 'inline-block'} flex flex-col gap-1.5 text-left`}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-semibold text-[#1f2937] tracking-tight flex items-center gap-1"
          >
            <span>{label}</span>
            {props.required && <span className="text-[#dc2626] font-bold">*</span>}
          </label>
        )}

        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          disabled={disabled}
          className={`p-3 w-full bg-white text-sm text-[#1f2937] placeholder:text-slate-400 border rounded-[10px] transition-all duration-150 outline-none resize-y
            ${
              error
                ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-3 focus:ring-red-100'
                : 'border-[#e5e7eb] focus:border-[#2e7d32] focus:ring-3 focus:ring-[#e8f5e9]'
            }
            ${disabled ? 'bg-slate-50 opacity-60 cursor-not-allowed' : ''}
            ${className}
          `}
          {...props}
        />

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

Textarea.displayName = 'Textarea'

export default Textarea
