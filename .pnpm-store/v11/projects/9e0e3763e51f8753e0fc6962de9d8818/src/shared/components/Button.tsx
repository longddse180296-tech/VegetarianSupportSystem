import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  type = 'button',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold transition-all duration-150 ease-out select-none rounded-[10px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]'

  const sizeStyles = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2.5',
  }[size]

  const variantStyles = {
    primary:
      'bg-[#2e7d32] text-white hover:bg-[#1b5e20] shadow-sm hover:shadow active:bg-[#1b5e20] focus-visible:ring-2 focus-visible:ring-[#2e7d32] focus-visible:ring-offset-2',
    secondary:
      'bg-[#e8f5e9] text-[#2e7d32] hover:bg-[#d8eedb] active:bg-[#c9e7ce] focus-visible:ring-2 focus-visible:ring-[#2e7d32] focus-visible:ring-offset-2',
    outline:
      'bg-transparent text-[#1f2937] border border-[#e5e7eb] hover:bg-[#f8faf8] hover:border-[#2e7d32] hover:text-[#2e7d32] focus-visible:ring-2 focus-visible:ring-[#2e7d32]',
    danger:
      'bg-[#dc2626] text-white hover:bg-[#b91c1c] active:bg-[#991b1b] focus-visible:ring-2 focus-visible:ring-[#dc2626] focus-visible:ring-offset-2',
    ghost:
      'bg-transparent text-[#4b5563] hover:bg-[#f3f4f6] hover:text-[#111827] focus-visible:ring-2 focus-visible:ring-slate-400',
  }[variant]

  const widthStyle = fullWidth ? 'w-full' : ''

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${widthStyle} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  )
}

export default Button
