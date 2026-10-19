import { useState } from 'react'
import type { ChangeEvent, DragEvent, RefObject } from 'react'
import { CheckCircle2, FileText, RefreshCw, Upload, UtensilsCrossed, X } from 'lucide-react'
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
  onFileDrop?: (file: File) => void
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
  onFileDrop,
  onClearImage,
}: ScanUploadPanelProps) {
  const isDish = sourceType === 'Dish'
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      onFileDrop?.(files[0])
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Chọn loại ảnh */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[#2E7D32] text-xs font-bold">
            1
          </span>
          <h2 className="text-base font-bold text-slate-800">Chọn chế độ quét</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4 ml-8">
          Hệ thống sẽ áp dụng mô hình AI nhận diện món hoặc bộ đọc chữ OCR tương ứng.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Option Dish */}
          <button
            type="button"
            aria-pressed={sourceType === 'Dish'}
            disabled={isScanning}
            onClick={() => onSourceTypeChange('Dish')}
            className={`group relative rounded-2xl border p-4.5 text-left transition-all cursor-pointer ${
              sourceType === 'Dish'
                ? 'border-[#2E7D32] bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/10'
                : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50/80'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                  sourceType === 'Dish'
                    ? 'bg-[#2E7D32] text-white shadow-xs'
                    : 'bg-emerald-50 text-[#2E7D32] group-hover:bg-emerald-100'
                }`}
              >
                <UtensilsCrossed size={18} />
              </div>
              {sourceType === 'Dish' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#2E7D32] px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                  <CheckCircle2 size={11} /> Đang chọn
                </span>
              )}
            </div>
            <div className="mt-3">
              <span className="block text-sm font-bold text-slate-800">Ảnh món ăn</span>
              <span className="mt-1 block text-xs text-slate-500 leading-relaxed">
                Nhận diện trực quan món ăn và phân tích các loại nguyên liệu bề mặt.
              </span>
            </div>
          </button>

          {/* Option Label */}
          <button
            type="button"
            aria-pressed={sourceType === 'Label'}
            disabled={isScanning}
            onClick={() => onSourceTypeChange('Label')}
            className={`group relative rounded-2xl border p-4.5 text-left transition-all cursor-pointer ${
              sourceType === 'Label'
                ? 'border-[#2E7D32] bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/10'
                : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50/80'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                  sourceType === 'Label'
                    ? 'bg-[#2E7D32] text-white shadow-xs'
                    : 'bg-emerald-50 text-[#2E7D32] group-hover:bg-emerald-100'
                }`}
              >
                <FileText size={18} />
              </div>
              {sourceType === 'Label' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#2E7D32] px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                  <CheckCircle2 size={11} /> Đang chọn
                </span>
              )}
            </div>
            <div className="mt-3">
              <span className="block text-sm font-bold text-slate-800">Ảnh nhãn thành phần</span>
              <span className="mt-1 block text-xs text-slate-500 leading-relaxed">
                Quét chữ OCR từ bảng thành phần trên bao bì sản phẩm đóng gói.
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* 2. Tải ảnh */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[#2E7D32] text-xs font-bold">
            2
          </span>
          <h2 className="text-base font-bold text-slate-800">
            Tải lên {isDish ? 'ảnh món ăn' : 'ảnh nhãn thành phần'}
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-4 ml-8">
          Ảnh càng rõ nét, đủ ánh sáng và không bị che khuất thì kết quả nhận diện càng chính xác.
        </p>

        {/* Input file ẩn */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg, image/png, image/webp"
          className="hidden"
          onChange={onFileChange}
        />

        {!imagePreview ? (
          <div
            role="button"
            tabIndex={0}
            onClick={onPickFile}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onPickFile()
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center gap-3.5 rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200 select-none ${
              isDragging
                ? 'border-[#2E7D32] bg-emerald-100/60 scale-[1.01] shadow-inner'
                : 'border-emerald-200 bg-gradient-to-b from-emerald-50/40 to-slate-50/50 hover:bg-emerald-50/80 hover:border-[#2E7D32]'
            }`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#2E7D32] shadow-xs border border-emerald-100">
              <Upload size={26} className={isDragging ? 'animate-bounce' : ''} />
            </div>
            <div className="space-y-1">
              <span className="text-sm font-bold text-slate-800 block">
                {isDragging ? 'Thả ảnh vào đây...' : 'Kéo & thả file ảnh vào đây hoặc nhấp để chọn tệp'}
              </span>
              <span className="text-xs text-slate-500 block">
                Chụp cận cảnh món ăn hoặc toàn bộ bảng thành phần nguyên liệu
              </span>
            </div>

            {/* Badges info */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              <span className="rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 shadow-2xs">
                JPG
              </span>
              <span className="rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 shadow-2xs">
                PNG
              </span>
              <span className="rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 shadow-2xs">
                WEBP
              </span>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 shadow-2xs">
                Tối đa 5 MB
              </span>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 shadow-2xs">
            <div className="relative flex justify-center items-center bg-slate-900/5 rounded-xl overflow-hidden min-h-[240px]">
              <img
                src={imagePreview}
                alt={isDish ? 'Ảnh món ăn đã chọn' : 'Ảnh nhãn đã chọn'}
                className="max-h-80 w-full object-contain rounded-lg"
              />
              {/* Nút X ở góc trên bên phải */}
              <button
                type="button"
                onClick={onClearImage}
                disabled={isScanning}
                title="Xóa ảnh"
                aria-label="Xóa ảnh"
                className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/75 text-white hover:bg-rose-600 transition shadow-md backdrop-blur-xs cursor-pointer active:scale-95"
              >
                <X size={15} />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1 py-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2E7D32] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                  <CheckCircle2 size={13} /> Sẵn sàng phân tích
                </span>
                <span className="truncate text-xs font-medium text-slate-600" title={imageFile?.name}>
                  {imageFile?.name}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onPickFile}
                disabled={isScanning}
                leftIcon={<RefreshCw size={13} />}
                className="border-slate-300 hover:border-emerald-300 hover:bg-emerald-50/50"
              >
                Đổi ảnh khác
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
