import React, { useState } from 'react'
import { X, Check, Copy, Download, ShoppingBag } from 'lucide-react'

interface ShoppingListModalProps {
  isOpen: boolean
  onClose: () => void
  weekRange: string
  onDownloadPdf?: () => void
}

interface Item {
  id: string
  name: string
  qty: string
  category: 'Rau củ tươi' | 'Đậu & Hạt đạm' | 'Gia vị & Ngũ cốc'
}

const DEFAULT_SHOPPING_ITEMS: Item[] = [
  { id: '1', name: 'Yến mạch cán dẹt', qty: '500g', category: 'Gia vị & Ngũ cốc' },
  { id: '2', name: 'Gạo lứt huyết rồng', qty: '1kg', category: 'Gia vị & Ngũ cốc' },
  { id: '3', name: 'Chuối tiêu chín', qty: '1 nải', category: 'Rau củ tươi' },
  { id: '4', name: 'Hạt chia hữu cơ', qty: '100g', category: 'Đậu & Hạt đạm' },
  { id: '5', name: 'Hạnh nhân lát nướng', qty: '150g', category: 'Đậu & Hạt đạm' },
  { id: '6', name: 'Đậu hũ non sạch', qty: '4 miếng', category: 'Đậu & Hạt đạm' },
  { id: '7', name: 'Nấm đùi gà baby', qty: '300g', category: 'Rau củ tươi' },
  { id: '8', name: 'Nấm hương tươi', qty: '200g', category: 'Rau củ tươi' },
  { id: '9', name: 'Bí đỏ hồ lô', qty: '1 quả (800g)', category: 'Rau củ tươi' },
  { id: '10', name: 'Đậu gà (Chickpeas) ngâm sẵn', qty: '300g', category: 'Đậu & Hạt đạm' },
  { id: '11', name: 'Quả bơ sáp Đắk Lắk', qty: '2 quả', category: 'Rau củ tươi' },
  { id: '12', name: 'Rong biển Wakame khô', qty: '50g', category: 'Gia vị & Ngũ cốc' },
]

export const ShoppingListModal: React.FC<ShoppingListModalProps> = ({
  isOpen,
  onClose,
  weekRange,
  onDownloadPdf,
}) => {
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const toggleItem = (id: string) => {
    setCheckedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleCopy = () => {
    const text = DEFAULT_SHOPPING_ITEMS.map(
      (item) => `- ${item.name}: ${item.qty} (${item.category})`,
    ).join('\n')
    navigator.clipboard.writeText(`DANH SÁCH ĐI CHỢ TUẦN (${weekRange}):\n\n${text}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const categories = ['Rau củ tươi', 'Đậu & Hạt đạm', 'Gia vị & Ngũ cốc'] as const

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-xl border border-slate-100 p-6 space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Danh sách đi chợ tuần
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {weekRange} • 12 nguyên liệu cần mua
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable list grouped by category */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {categories.map((cat) => {
            const catItems = DEFAULT_SHOPPING_ITEMS.filter((i) => i.category === cat)
            return (
              <div key={cat} className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {cat} ({catItems.length})
                </span>
                <div className="space-y-1.5">
                  {catItems.map((item) => {
                    const isChecked = Boolean(checkedIds[item.id])
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className={`flex items-center justify-between rounded-xl border p-2.5 text-xs transition-all cursor-pointer ${
                          isChecked
                            ? 'border-emerald-200 bg-emerald-50/50 text-slate-400 line-through'
                            : 'border-slate-100 bg-slate-50/60 hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                              isChecked
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="h-3 w-3" />}
                          </div>
                          <span className="font-semibold">{item.name}</span>
                        </div>
                        <span className="font-bold text-slate-600">{item.qty}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>{copied ? 'Đã sao chép!' : 'Sao chép văn bản'}</span>
          </button>

          <button
            type="button"
            onClick={onDownloadPdf}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#184d28] hover:bg-[#123e1f] py-2.5 text-xs font-bold text-white shadow-2xs transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Tải danh sách PDF</span>
          </button>
        </div>
      </div>
    </div>
  )
}
