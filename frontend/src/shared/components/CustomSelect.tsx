import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface CustomSelectOption<T extends string | number = string> {
  value: T
  label: string
  subLabel?: string
  icon?: React.ReactNode
  disabled?: boolean
}

export interface CustomSelectProps<T extends string | number = string> {
  value: T | null | undefined
  onChange: (value: T) => void
  options: CustomSelectOption<T>[]
  placeholder?: string
  label?: string
  labelClassName?: string
  error?: string
  disabled?: boolean
  className?: string
  dropdownClassName?: string
  id?: string
  required?: boolean
  size?: 'sm' | 'md'
}

export function CustomSelect<T extends string | number = string>({
  value,
  onChange,
  options,
  placeholder = 'Chọn một tùy chọn...',
  label,
  labelClassName = '',
  error,
  disabled = false,
  className = '',
  dropdownClassName = '',
  id,
  required = false,
  size = 'md',
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen(prev => !prev)
    }
  }, [disabled])

  const handleSelect = useCallback(
    (option: CustomSelectOption<T>) => {
      if (option.disabled) return
      onChange(option.value)
      setIsOpen(false)
    },
    [onChange],
  )

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const heightClass = size === 'sm' ? 'min-h-[38px] py-1.5 px-3 text-xs' : 'min-h-[44px] py-2.5 px-3.5 text-sm'

  return (
    <div
      className={`relative flex flex-col gap-1.5 text-left ${isOpen ? 'z-30' : 'z-10'} ${className}`}
      ref={containerRef}
    >
      {label && (
        <label
          htmlFor={id}
          title={typeof label === 'string' ? label : undefined}
          className={`text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1 min-h-[1.25rem] truncate ${labelClassName}`}
        >
          <span className="truncate">{label}</span>
          {required && <span className="text-rose-500 font-bold shrink-0">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2.5 rounded-xl border bg-white font-medium text-slate-800 transition-all duration-150 cursor-pointer text-left select-none outline-none ${heightClass} ${
          isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : error
            ? 'border-rose-400 ring-1 ring-rose-300'
            : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'bg-slate-50 opacity-60 cursor-not-allowed text-slate-400' : ''}`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 flex items-center justify-center text-slate-500">
              {selectedOption.icon}
            </span>
          )}
          <span className={`truncate ${!selectedOption ? 'text-slate-400 font-normal' : 'text-slate-800 font-semibold'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-600' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Floating Menu Popover */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className={`absolute left-0 top-full mt-1.5 w-full z-50 rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-xl shadow-slate-900/10 max-h-60 overflow-y-auto overscroll-contain transition-all duration-150 ${dropdownClassName}`}
        >
          {options.map(option => {
            const isSelected = option.value === value
            return (
              <button
                type="button"
                role="option"
                key={String(option.value)}
                aria-selected={isSelected}
                disabled={option.disabled}
                onClick={() => handleSelect(option)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors cursor-pointer select-none ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                } ${option.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {option.icon && (
                    <span className="shrink-0 flex items-center justify-center">
                      {option.icon}
                    </span>
                  )}
                  <div className="min-w-0">
                    <span className="block truncate">{option.label}</span>
                    {option.subLabel && (
                      <span className="block text-xs text-slate-400 font-normal truncate mt-0.5">
                        {option.subLabel}
                      </span>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {error && <span className="text-xs text-rose-600 font-medium">{error}</span>}
    </div>
  )
}

export default CustomSelect
