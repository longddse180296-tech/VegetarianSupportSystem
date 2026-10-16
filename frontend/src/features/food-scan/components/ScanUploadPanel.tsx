import type { ChangeEvent, RefObject } from 'react'
import { CheckCircle2, RefreshCw, Trash2, Upload } from 'lucide-react'
import { Button } from '../../../shared/components'
import type { ScanSourceType } from '../types/foodScan.types'

interface ScanUploadPanelProps {
  sourceType: ScanSourceType
  imageFile: File | null
  imagePreview: string | null
  fileInputRef: RefObject<HTMLInputElement | null>
  isScanning: boolean
  onSourceTypeChange: (type: ScanSourceType) => void
  onPickFile: () => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onClearImage: () => void
}

export default function ScanUploadPanel({
  sourceType,
  imageFile,
  imagePreview,
  fileInputRef,
  isScanning,
  onSourceTypeChange,
  onPickFile,
  onFileChange,
  onClearImage,
}: ScanUploadPanelProps) {
  const isDish = sourceType === 'Dish'

  return (
    <div className="space-y-5">
      <section className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
        <h2 className="text-base font-bold text-[#1f2937]">1. Chọn loại ảnh</h2>
        <p className="mt-1 text-xs text-[#6b7280]">
          BE xử lý ảnh món ăn và ảnh nhãn thành phần bằng hai luồng riêng.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {([
            ['Dish', 'Ảnh món ăn', 'Gợi ý món và nguyên liệu nhìn thấy; bạn xác nhận phần chưa rõ.'],
            ['Label', 'Ảnh nhãn thành phần', 'OCR đọc chữ trên nhãn; bạn sửa chữ và xác nhận nguyên liệu.'],
          ] as const).map(([type, title, description]) => (
            <button
              key={type}
              type="button"
              aria-pressed={sourceType === type}
              disabled={isScanning}
              onClick={() => onSourceTypeChange(type)}
              className={`rounded-xl border p-4 text-left transition ${
                sourceType === type
                  ? 'border-[#2e7d32] bg-[#e8f5e9]'
                  : 'border-[#e5e7eb] hover:border-[#2e7d32]'
              }`}
            >
              <span className="block text-sm font-bold text-[#1f2937]">{title}</span>
              <span className="mt-1 block text-xs text-[#6b7280]">{description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
        <h2 className="text-base font-bold text-[#1f2937]">
          2. Tải {isDish ? 'ảnh món ăn' : 'ảnh nhãn thành phần'}
        </h2>
        <p className="mt-1 text-xs text-[#6b7280]">
          JPG, PNG hoặc WEBP, tối đa 5 MB. {isDish
            ? 'Ảnh rõ món ăn giúp AI gợi ý nguyên liệu nhìn thấy.'
            : 'Chụp rõ toàn bộ bảng thành phần để OCR đọc được chữ.'}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onFileChange}
        />

        {!imagePreview ? (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#c8e6c9] bg-[#e8f5e9]/50 p-8 text-center">
            <Upload size={24} className="text-[#2e7d32]" />
            <span className="text-sm text-[#1f2937]">Chọn ảnh từ máy của bạn</span>
            <Button type="button" leftIcon={<Upload size={14} />} onClick={onPickFile} disabled={isScanning}>
              Tải ảnh lên
            </Button>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="overflow-hidden rounded-xl border bg-slate-50">
              <img
                src={imagePreview}
                alt={isDish ? 'Ảnh món ăn đã chọn' : 'Ảnh nhãn đã chọn'}
                className="h-60 w-full object-contain"
              />
            </div>
            <div className="flex flex-col items-start gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2e7d32]">
                <CheckCircle2 size={13} /> Đã chọn ảnh
              </span>
              <span className="max-w-40 break-all text-xs text-[#6b7280]">{imageFile?.name}</span>
              <Button type="button" variant="outline" size="sm" onClick={onPickFile} disabled={isScanning} leftIcon={<RefreshCw size={13} />}>
                Thay ảnh
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onClearImage} disabled={isScanning} leftIcon={<Trash2 size={13} />}>
                Xóa ảnh
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
