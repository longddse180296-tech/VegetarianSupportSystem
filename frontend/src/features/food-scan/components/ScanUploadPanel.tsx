import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react'
import {
  CheckCircle2,
  FileText,
  Factory,
  Package2,
  RefreshCw,
  Scale,
  Trash2,
  Upload,
} from 'lucide-react'
import { Button, Input, Textarea } from '../../../shared/components'
import type { ScanInputForm } from '../types/foodScan.types'

interface ScanUploadPanelProps {
  form: ScanInputForm
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>
  onUpdate: <K extends keyof ScanInputForm>(key: K, value: ScanInputForm[K]) => void
  onPickFile: () => void
  onClearImage: () => void
  onFillSample: () => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  isScanning: boolean
}

const handleKey = (e: KeyboardEvent<HTMLElement>, action: () => void) => {
  if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
    e.preventDefault()
    action()
  }
}

export default function ScanUploadPanel({
  form,
  fileInputRef,
  onUpdate,
  onPickFile,
  onClearImage,
  onFillSample,
  onFileChange,
  isScanning,
}: ScanUploadPanelProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#1f2937]">
              1. Tải ảnh nhãn hoặc món ăn
            </h2>
            <p className="mt-1 text-xs text-[#6b7280]">
              Hỗ trợ JPG, PNG, WEBP. Nên chụp rõ phần in thành phần và nhãn nguồn gốc.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<FileText size={13} />}
            onClick={onFillSample}
          >
            Điền mẫu thử
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onFileChange}
        />

        {!form.imagePreview ? (
          <div
            role="button"
            tabIndex={0}
            aria-label="Tải ảnh nhãn sản phẩm"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-[#c8e6c9] bg-[#e8f5e9]/50 px-4 py-10 text-center transition hover:border-[#2e7d32] hover:bg-[#e8f5e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2e7d32]"
            onClick={onPickFile}
            onKeyDown={(e) => handleKey(e, onPickFile)}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#e5e7eb]">
              <Upload size={18} className="text-[#2e7d32]" />
            </div>
            <div className="text-sm font-semibold text-[#1f2937]">
              Kéo ảnh vào đây hoặc click để chọn ảnh từ máy
            </div>
            <div className="text-xs text-[#6b7280]">
              JPG / PNG / WEBP · Dưới 10MB · Chụp rõ danh sách thành phần
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="mt-2"
              leftIcon={<Upload size={13} />}
              onClick={(e: MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation()
                onPickFile()
              }}
              disabled={isScanning}
            >
              Tải ảnh lên
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-slate-50">
              <img
                src={form.imagePreview}
                alt="Ảnh nhãn sản phẩm xem trước"
                className="h-60 w-full object-cover"
              />
            </div>
            <div className="flex flex-col items-start gap-2 self-start">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e9] px-2 py-1 text-[11px] font-bold text-[#2e7d32]">
                <CheckCircle2 size={12} /> Đã tải ảnh
              </span>
              <span className="text-xs text-[#6b7280]">
                {form.imageFile?.name ?? 'Ảnh xem trước'}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw size={13} />}
                onClick={onPickFile}
                disabled={isScanning}
              >
                Thay ảnh khác
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={<Trash2 size={13} className="text-red-600" />}
                onClick={onClearImage}
                disabled={isScanning}
              >
                <span className="text-red-700">Xóa ảnh</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
        <h2 className="mb-3 text-base font-bold text-[#1f2937]">
          2. Thông tin sản phẩm & Thành phần
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Tên sản phẩm"
            placeholder="Ví dụ: Nước tương hữu cơ 500ml"
            leftIcon={<Package2 size={14} />}
            value={form.productName}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onUpdate('productName', e.target.value)
            }
            required
          />
          <Input
            label="Thương hiệu / Nhà sản xuất"
            placeholder="Ví dụ: Organic Plus"
            leftIcon={<Factory size={14} />}
            value={form.productBrand}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onUpdate('productBrand', e.target.value)
            }
          />
          <Input
            label="Khối lượng tịnh (gam)"
            type="number"
            placeholder="Ví dụ: 350"
            leftIcon={<Scale size={14} />}
            helperText="Nếu không chắc, bạn có thể bỏ trống."
            value={form.quantityGram}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onUpdate('quantityGram', e.target.value)
            }
          />
        </div>
        <div className="mt-4">
          <Textarea
            label="Danh sách thành phần in trên nhãn (nếu có)"
            required
            rows={5}
            placeholder="Dán hoặc nhập từng thành phần, cách nhau bởi dấu phẩy. Ví dụ: nước, đường, muối, dầu nành, hạt tiêu, phụ gia E441."
            helperText={`Hệ thống sẽ đối chiếu các yếu tố phổ biến. Hiện tại: ${form.ingredientText.length} ký tự.`}
            value={form.ingredientText}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              onUpdate('ingredientText', e.target.value)
            }
          />
        </div>
      </div>
    </div>
  )
}
