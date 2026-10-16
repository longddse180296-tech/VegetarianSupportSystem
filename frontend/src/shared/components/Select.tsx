import React, { forwardRef, useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { ChevronDown, Check, AlertCircle } from 'lucide-react'

export interface SelectOption {
  value: string | number
  label: string
  subLabel?: string
  disabled?: boolean
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  options?: SelectOption[]
  fullWidth?: boolean
  placeholder?: string
  size?: 'sm' | 'md'
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
      name,
      value,
      defaultValue,
      onChange,
      disabled = false,
      required = false,
      placeholder = 'Chọn một tùy chọn...',
      size = 'md',
      ...props
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const hiddenSelectRef = useRef<HTMLSelectElement | null>(null)

    const selectId =
      id || (label ? `select-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined)

    // Extract options from either props.options or props.children (<option>)
    const parsedOptions: SelectOption[] = useMemo(() => {
      if (options && options.length > 0) {
        return options
      }

      const extracted: SelectOption[] = []
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
          const childProps = child.props as { value?: string | number; children?: React.ReactNode; disabled?: boolean }
          if (child.type === 'option' || childProps.value !== undefined) {
            extracted.push({
              value: childProps.value ?? '',
              label:
                typeof childProps.children === 'string'
                  ? childProps.children
                  : String(childProps.value ?? ''),
              disabled: Boolean(childProps.disabled),
            })
          }
        }
      })
      return extracted
    }, [options, children])

    // Internal state for uncontrolled mode (e.g. react-hook-form register)
    const [uncontrolledValue, setUncontrolledValue] = useState<string>(
      defaultValue !== undefined ? String(defaultValue) : ''
    )

    // Current effective value (controlled or uncontrolled fallback)
    const effectiveValue =
      value !== undefined
        ? String(value)
        : uncontrolledValue || (defaultValue !== undefined ? String(defaultValue) : (parsedOptions[0]?.value !== undefined && !placeholder ? String(parsedOptions[0].value) : ''))
    const selectedOption = parsedOptions.find((opt) => String(opt.value) === effectiveValue)

    const handleToggle = useCallback(() => {
      if (!disabled) {
        setIsOpen((prev) => !prev)
      }
    }, [disabled])

    const handleSelect = useCallback(
      (opt: SelectOption) => {
        if (opt.disabled || disabled) return
        setIsOpen(false)
        setUncontrolledValue(String(opt.value))

        if (hiddenSelectRef.current) {
          hiddenSelectRef.current.value = String(opt.value)
        }

        if (onChange) {
          const syntheticEvent = {
            target: {
              value: String(opt.value),
              name: name || '',
              id: selectId,
            },
            currentTarget: {
              value: String(opt.value),
              name: name || '',
              id: selectId,
            },
            preventDefault: () => {},
            stopPropagation: () => {},
          } as unknown as React.ChangeEvent<HTMLSelectElement>

          onChange(syntheticEvent)
        }
      },
      [disabled, name, onChange, selectId],
    )

    // Close on click outside and escape key
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

    return (
      <div
        ref={containerRef}
        className={`${fullWidth ? 'w-full' : 'inline-block min-w-44'} relative flex flex-col gap-1.5 text-left`}
      >
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold text-slate-700 tracking-tight flex items-center gap-1 select-none"
          >
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold">*</span>}
          </label>
        )}

        {/* Hidden native select for form submit and ref compatibility */}
        <select
          {...props}
          id={selectId}
          name={name}
          ref={(node) => {
            hiddenSelectRef.current = node
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
          }}
          value={effectiveValue}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only pointer-events-none"
          disabled={disabled}
          required={required}
          onChange={onChange}
        >
          {parsedOptions.map((opt) => (
            <option key={String(opt.value)} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom styled trigger button */}
        <button
          type="button"
          disabled={disabled}
          onClick={handleToggle}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`${size === 'sm' ? 'h-9 px-3 text-xs' : 'h-11 px-3.5 text-sm'} w-full bg-white text-slate-800 rounded-xl border transition-all duration-150 outline-none cursor-pointer flex items-center justify-between gap-2.5 text-left select-none ${
            isOpen
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : error
              ? 'border-rose-400 ring-1 ring-rose-300'
              : 'border-slate-200 hover:border-slate-300'
          } ${disabled ? 'bg-slate-50 opacity-60 cursor-not-allowed text-slate-400' : ''} ${className}`}
        >
          <span className="truncate flex-1">
            {selectedOption ? (
              <span className="font-semibold text-slate-800">{selectedOption.label}</span>
            ) : (
              <span className="text-slate-400 font-normal">{placeholder}</span>
            )}
          </span>

          <ChevronDown
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-emerald-600' : ''
            }`}
            aria-hidden="true"
          />
        </button>

        {/* Floating popover dropdown */}
        {isOpen && (
          <div
            role="listbox"
            tabIndex={-1}
            className="absolute left-0 top-full mt-1.5 w-full z-50 rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-xl shadow-slate-900/10 max-h-60 overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-100"
          >
            {parsedOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 text-center">Không có tùy chọn nào</div>
            ) : (
              parsedOptions.map((opt) => {
                const isSelected = String(opt.value) === effectiveValue
                return (
                  <button
                    type="button"
                    role="option"
                    key={String(opt.value)}
                    aria-selected={isSelected}
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors cursor-pointer select-none ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    } ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block truncate">{opt.label}</span>
                      {opt.subLabel && (
                        <span className="block text-xs text-slate-400 font-normal truncate mt-0.5">
                          {opt.subLabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        )}

        {/* Error or helper text */}
        {error ? (
          <span className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
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
