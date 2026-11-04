// Chức năng: hiển thị ảnh nội dung đúng nguồn; thiếu ảnh hoặc tải lỗi chỉ hiện trạng thái, không tự gán ảnh minh họa.
import { useState } from 'react'
import { ImageOff } from 'lucide-react'

interface ContentImageProps {
  src?: string | null
  alt: string
  className?: string
  loading?: 'eager' | 'lazy'
}

export function ContentImage({ src, alt, className = '', loading = 'lazy' }: ContentImageProps) {
  const imageUrl = src?.trim() || ''
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  // Ghi lỗi theo URL để ảnh mới vẫn được tải khi dữ liệu thay đổi; không gửi request với src rỗng.
  if (!imageUrl || failedUrl === imageUrl) {
    const label = imageUrl ? 'Không tải được ảnh' : 'Chưa có ảnh'
    return (
      <div className={`${className} flex flex-col items-center justify-center gap-2 bg-slate-100 text-slate-500`} role="img" aria-label={`${alt}: ${label.toLowerCase()}`}>
        <ImageOff size={22} aria-hidden="true" />
        <span className="text-center text-xs font-medium">{label}</span>
      </div>
    )
  }

  return <img key={imageUrl} src={imageUrl} alt={alt} className={className} loading={loading} onError={() => setFailedUrl(imageUrl)} />
}
