// Chức năng: thực đơn bảy ngày và danh sách đi chợ. Hiển thị một phần giao diện và phát sự kiện cho màn hình cha xử lý.
import React, { useState } from 'react'
import { X, Check, Copy, Download, ShoppingBag } from 'lucide-react'

// Cấu trúc ShoppingListModalProps quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
interface ShoppingListModalProps {
  isOpen: boolean
  onClose: () => void
  weekRange: string
  onDownloadPdf?: () => void
  items?: Item[]
}

// Cấu trúc Item quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
interface Item {
  id: string
  name: string
  qty: string
  category: 'Rau củ tươi' | 'Đậu & Hạt đạm' | 'Gia vị & Ngũ cốc'
}

// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (ShoppingListModal); thuộc thực đơn bảy ngày và danh sách đi chợ.
export const ShoppingListModal: React.FC<ShoppingListModalProps> = ({
  isOpen,
  onClose,
  weekRange,
  onDownloadPdf,
  items = [],
}) => {
  // Lưu dữ liệu và trạng thái thao tác của thực đơn bảy ngày và danh sách đi chợ trong vòng đời màn hình.
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  // Xử lý lựa chọn hoặc chuyển trạng thái giao diện theo thao tác người dùng (toggleItem); thuộc thực đơn bảy ngày và danh sách đi chợ.
  const toggleItem = (id: string) => {
    setCheckedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (handleCopy); thuộc thực đơn bảy ngày và danh sách đi chợ.
  const handleCopy = () => {
    const text = items.map(
      (item) => `- ${item.name}: ${item.qty} (${item.category})`,
    ).join('\n')
    navigator.clipboard.writeText(`DANH SÁCH ĐI CHỢ TUẦN (${weekRange}):\n\n${text}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const categories = ['Rau củ tươi', 'Đậu & Hạt đạm', 'Gia vị & Ngũ cốc'] as const

  // Hiển thị giao diện thực đơn bảy ngày và danh sách đi chợ từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-xl border border-slate-100 p-6 space-y-4 max-h-[90vh] flex flex-col">
        {/* Tiêu đề và thao tác chính. */}
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
                {weekRange} • {items.length} nguyên liệu cần mua
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
            const catItems = items.filter((i) => i.category === cat)
            // Hiển thị giao diện thực đơn bảy ngày và danh sách đi chợ từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
            return (
              <div key={cat} className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {cat} ({catItems.length})
                </span>
                <div className="space-y-1.5">
                  {catItems.map((item) => {
                    const isChecked = Boolean(checkedIds[item.id])
                    // Hiển thị giao diện thực đơn bảy ngày và danh sách đi chợ từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
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
            disabled={!onDownloadPdf || items.length === 0}
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
