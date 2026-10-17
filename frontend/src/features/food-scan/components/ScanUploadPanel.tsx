import { useState } from 'react'
import type { ChangeEvent, DragEvent, RefObject } from 'react'
import { CheckCircle2, RefreshCw, Upload, X } from 'lucide-react'
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
    <div className="space-y-5">
      <section className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
        <h2 className="text-base font-bold text-[#1f2937]">1. Chọn loại ảnh</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {([
            ['Dish', 'Ảnh món ăn', 'Nhận diện món ăn và nguyên liệu từ hình ảnh thực tế.'],
            ['Label', 'Ảnh nhãn thành phần', 'Quét chữ trên bao bì sản phẩm để kiểm tra bảng thành phần.'],
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
        {/* Input file chuẩn Desktop Web */}
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
            className={`mt-4 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200 select-none ${
              isDragging
                ? 'border-[#2e7d32] bg-[#c8e6c9]/50 scale-[1.01] shadow-inner'
                : 'border-[#c8e6c9] bg-[#e8f5e9]/50 hover:bg-[#e8f5e9]/80 hover:border-[#2e7d32]'
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#2e7d32] shadow-xs">
              <Upload size={22} className={isDragging ? 'animate-bounce' : ''} />
            </div>
            <div>
              <span className="text-sm font-semibold text-[#1f2937] block">
                {isDragging ? 'Thả ảnh vào đây...' : 'Kéo & thả file ảnh từ máy tính vào đây hoặc nhấp để chọn tệp'}
              </span>
              <span className="mt-1 text-xs text-[#6b7280] block">
                Hỗ trợ định dạng JPG, PNG, WEBP (tối đa 5 MB)
              </span>
            </div>
          </div>
        ) : (
          <div className="relative mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="relative flex justify-center items-center bg-slate-100 rounded-xl overflow-hidden min-h-[220px]">
              <img
                src={imagePreview}
                alt={isDish ? 'Ảnh món ăn đã chọn' : 'Ảnh nhãn đã chọn'}
                className="max-h-72 w-full object-contain"
              />
              {/* Nút X ở góc trên bên phải để xóa ảnh */}
              <button
                type="button"
                onClick={onClearImage}
                disabled={isScanning}
                title="Xóa ảnh"
                aria-label="Xóa ảnh"
                className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-red-600 transition shadow-md backdrop-blur-xs cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1 py-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2e7d32] shrink-0">
                  <CheckCircle2 size={14} /> Đã chọn ảnh
                </span>
                <span className="truncate text-xs text-[#6b7280]" title={imageFile?.name}>
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
