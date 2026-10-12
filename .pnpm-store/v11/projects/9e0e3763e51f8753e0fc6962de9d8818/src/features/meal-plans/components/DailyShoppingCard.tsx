import React, { useState } from 'react'
import { ShoppingBag, Share2, Check } from 'lucide-react'
import type { ShoppingItem } from '../types/mealPlans.types'

interface DailyShoppingCardProps {
  initialItems: ShoppingItem[]
}

export const DailyShoppingCard: React.FC<DailyShoppingCardProps> = ({
  initialItems,
}) => {
  const [items, setItems] = useState<ShoppingItem[]>(initialItems)
  const [copied, setCopied] = useState(false)

  const handleToggle = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      )
    )
  }

  const handleShare = () => {
    const text = items
      .map((it) => `- ${it.name}: ${it.quantity} ${it.isChecked ? '(Đã mua)' : ''}`)
      .join('\n')
    navigator.clipboard.writeText(`DANH SÁCH ĐI CHỢ CHO NGÀY:\n${text}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-gray-900 text-sm">Đi chợ cho ngày</h3>
        </div>

        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
          {items.length} nguyên liệu
        </span>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        Danh sách định lượng cần thiết để chuẩn bị cho đủ 4 bữa trong ngày hôm nay:
      </p>

      {/* Ingredient Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <label
            key={item.id}
            className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors cursor-pointer text-xs ${
              item.isChecked
                ? 'bg-slate-50/60 border-slate-100 text-gray-400'
                : 'bg-white border-slate-200/80 hover:bg-slate-50 text-gray-800'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <input
                type="checkbox"
                checked={item.isChecked}
                onChange={() => handleToggle(item.id)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span
                className={`font-medium truncate ${
                  item.isChecked ? 'line-through text-gray-400' : 'text-gray-900'
                }`}
              >
                {item.name}
              </span>
            </div>

            <span className="font-bold text-[11px] text-gray-500 shrink-0 font-mono">
              {item.quantity}
            </span>
          </label>
        ))}
      </div>

      {/* Export / Share Button */}
      <button
        type="button"
        onClick={handleShare}
        className="w-full py-2.5 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-200/80 shadow-xs"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-700">Đã sao chép danh sách!</span>
          </>
        ) : (
          <>
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất danh sách qua Zalo / Tin nhắn</span>
          </>
        )}
      </button>
    </div>
  )
}
export default DailyShoppingCard
