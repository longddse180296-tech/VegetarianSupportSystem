import { useEffect, useId, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { searchIngredientNames } from '../api/dietarySuggestions'

interface Props {
  value: string
  onChange: (value: string) => void
  onAdd: (name?: string) => void
  names: string[]
  selected: string[]
  placeholder: string
  disabled?: boolean
}

// Tìm theo tên trong danh mục; nút Thêm vẫn chấp nhận tên người dùng tự nhập.
export function CatalogNameInput({ value, onChange, onAdd, names, selected, placeholder, disabled }: Props) {
  const listId = useId()
  const container = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const matches = searchIngredientNames(names, value, selected)
  const expanded = open && !!value.trim() && !disabled
  useEffect(() => {
    if (expanded && active >= 0) document.getElementById(`${listId}-${active}`)?.scrollIntoView({block: 'nearest'})
  }, [active, expanded, listId])
  const add = (name?: string) => { onAdd(name); setOpen(false); setActive(-1) }

  return <div ref={container} className="relative" onBlur={event => {
    if (!container.current?.contains(event.relatedTarget)) setOpen(false)
  }}>
    <div className="flex gap-2">
      <input type="text" role="combobox" aria-label={placeholder} aria-autocomplete="list"
        aria-expanded={expanded} aria-controls={expanded ? listId : undefined}
        aria-activedescendant={expanded && active >= 0 && matches[active] ? `${listId}-${active}` : undefined}
        autoComplete="off" disabled={disabled} placeholder={placeholder} value={value}
        onFocus={() => setOpen(true)}
        onChange={event => { onChange(event.target.value); setOpen(true); setActive(-1) }}
        onKeyDown={event => {
          if (event.key === 'Escape') { setOpen(false); setActive(-1) }
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault(); setOpen(true)
            setActive(previous => matches.length ? (previous < 0 ? (event.key === 'ArrowDown' ? 0 : matches.length - 1) : (previous + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length) : -1)
          }
          if (event.key === 'Enter') { event.preventDefault(); add(expanded && active >= 0 ? matches[active] : undefined) }
        }}
        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]" />
      <button type="button" disabled={disabled || !value.trim()} onClick={() => add()}
        className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#2E7D32] disabled:opacity-40">
        <Plus size={14} /><span>Thêm</span>
      </button>
    </div>
    {expanded && <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
      <p className="border-b border-slate-100 px-3 py-2 text-[11px] text-slate-500">Tên nguyên liệu khớp ({matches.length})</p>
      <ul id={listId} role="listbox" className="max-h-52 overflow-y-auto">
        {matches.map((name, index) => <li key={name} id={`${listId}-${index}`} role="option" aria-selected={active === index}
          onMouseDown={event => event.preventDefault()} onClick={() => add(name)}
          className={`cursor-pointer px-3 py-2.5 text-xs text-slate-800 hover:bg-emerald-50 ${active === index ? 'bg-emerald-50' : ''}`}>
          {name}
        </li>)}
      </ul>
      {!matches.length && <p className="px-3 py-3 text-xs text-slate-500">Không có tên khớp trong danh mục. Bạn vẫn có thể bấm Thêm để lưu tên vừa nhập.</p>}
    </div>}
  </div>
}
