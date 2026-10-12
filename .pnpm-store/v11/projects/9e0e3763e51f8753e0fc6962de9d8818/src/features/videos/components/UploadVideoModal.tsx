import { useState } from 'react'
import { Info, Upload } from 'lucide-react'
import {
  Button,
  Input,
  Modal,
  Select,
  type SelectOption,
} from '../../../shared/components'
import type { UploadVideoFormState, VideoCategory } from '../types/video.types'
import { CATEGORY_LABELS, INITIAL_UPLOAD_FORM } from '../types/video.types'

interface UploadVideoModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (form: UploadVideoFormState) => Promise<void> | void
  submitting?: boolean
}

const CATEGORY_OPTIONS: SelectOption[] = (
  Object.keys(CATEGORY_LABELS) as VideoCategory[]
).map((k) => ({ value: k, label: CATEGORY_LABELS[k] }))

export const UploadVideoModal: React.FC<UploadVideoModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  submitting = false,
}) => {
  const [form, setForm] = useState<UploadVideoFormState>(INITIAL_UPLOAD_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof UploadVideoFormState, string>>>({})

  const updateField = <K extends keyof UploadVideoFormState>(
    key: K,
    value: UploadVideoFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = (): boolean => {
    const next: Partial<Record<keyof UploadVideoFormState, string>> = {}
    if (!form.title.trim()) next.title = 'Vui lòng nhập tiêu đề video'
    else if (form.title.trim().length < 6) next.title = 'Tiêu đề tối thiểu 6 ký tự'
    if (!form.videoUrl.trim()) next.videoUrl = 'Vui lòng nhập URL video (Youtube, Drive...)'
    if (!form.category) next.category = 'Vui lòng chọn danh mục video'
    if (form.duration !== '' && Number.isNaN(Number(form.duration)))
      next.duration = 'Thời lượng phải là số (giây)'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    try {
      await onSubmit(form)
      setForm(INITIAL_UPLOAD_FORM)
      setErrors({})
      onClose()
    } catch {
      // Keep open on unexpected error
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (submitting) return
        onClose()
      }}
      maxWidth="lg"
      title={
        <span className="flex items-center gap-2">
          <Upload size={18} className="text-[#2e7d32]" />
          Upload video chia sẻ cộng đồng
        </span>
      }
      description="Video của bạn sẽ được AI quét tự động cấm nhạy cảm (gắn cờ với lý do), sau đó Admin xem xét & phê duyệt cuối cùng trước khi xuất bản."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="primary"
            isLoading={submitting}
            leftIcon={<Upload size={14} />}
            onClick={handleSubmit}
          >
            Gửi lên hệ thống
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            label="Tiêu đề video"
            required
            placeholder="Ví dụ: Cách làm phở thuần thực vật chay Hà Nội ngon đậm đà"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            error={errors.title}
            helperText="Nên rõ ràng, có từ khóa chính như tên món, phong cách, đối tượng..."
            autoFocus
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="URL video"
            required
            placeholder="https://www.youtube.com/watch?v=..."
            value={form.videoUrl}
            onChange={(e) => updateField('videoUrl', e.target.value)}
            error={errors.videoUrl}
            helperText="Hỗ trợ YouTube, Google Drive, Vimeo... link public là tốt nhất."
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="URL ảnh thumbnail (tùy chọn)"
            placeholder="https://.../anh-bia.jpg"
            value={form.thumbnailUrl}
            onChange={(e) => updateField('thumbnailUrl', e.target.value)}
            helperText="Để trống hệ thống sẽ tự tạo thumbnail theo tiêu đề."
          />
        </div>
        <div>
          <Select
            label="Danh mục video"
            required
            value={form.category}
            onChange={(e) => updateField('category', e.target.value as VideoCategory | '')}
            error={errors.category}
            options={[
              { value: '', label: '— Chọn danh mục —' },
              ...CATEGORY_OPTIONS,
            ]}
          />
        </div>
        <div>
          <Input
            label="Thời lượng (giây, tùy chọn)"
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="Ví dụ: 420 (tương đương 7 phút)"
            value={form.duration}
            onChange={(e) => updateField('duration', e.target.value)}
            error={errors.duration}
            helperText="Để trống mặc định 5 phút."
          />
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="video-description"
            className="mb-1 block text-[12px] font-bold text-[#1f2937]"
          >
            Mô tả video
          </label>
          <textarea
            id="video-description"
            rows={4}
            placeholder="Mô tả ngắn gọn nội dung, các món ăn bạn giới thiệu, link tài liệu, nguồn tham khảo..."
            className="w-full rounded-[10px] border border-[#e5e7eb] bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-[#9ca3af] focus:border-[#2e7d32] focus:ring-3 focus:ring-[#e8f5e9]"
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
          />
          <p className="mt-1 text-[11px] text-[#6b7280]">
            Lưu ý: nội dung rõ ràng, có cấu trúc bước-bước sẽ giúp AI kiểm tra & Admin duyệt nhanh
            hơn 1.5-2x.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-[12px] border border-sky-200 bg-sky-50/80 p-3 text-[11px] leading-5 text-sky-800">
        <div className="flex items-start gap-2">
          <Info size={14} className="mt-0.5 flex-shrink-0 text-sky-600" />
          <div>
            <strong>Luồng kiểm duyệt 2 bước (Tách biệt AI & Admin):</strong>
            <ol className="mt-1 list-inside list-decimal space-y-0.5 pl-1">
              <li>
                <span className="font-bold">🤖 AI chỉ GẮN CỜ</span> (phát hiện từ khóa nhạy cảm, cảnh
                báo nội dung không phù hợp chủ đề thuần thực vật) và ghi rõ lý do —{' '}
                <span className="font-bold">KHÔNG tự động từ chối</span>.
              </li>
              <li>
                <span className="font-bold">👮 Admin là người quyết định cuối cùng</span>: phê duyệt
                → <code>published</code>, hoặc từ chối có ghi rõ lý do →{' '}
                <code>rejected</code>.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default UploadVideoModal
