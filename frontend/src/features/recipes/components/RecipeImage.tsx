// Chức năng: công thức và định lượng nguyên liệu. Hiển thị một phần giao diện và phát sự kiện cho màn hình cha xử lý.
import { useState } from 'react'
import { ChefHat } from 'lucide-react'

// Cấu trúc RecipeImageProps quy định dữ liệu trao đổi trong công thức và định lượng nguyên liệu.
interface RecipeImageProps {
  src?: string | null
  alt: string
  className: string
}

// Thành phần RecipeImage nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc công thức và định lượng nguyên liệu.
export function RecipeImage({ src, alt, className }: RecipeImageProps) {
  // Lưu dữ liệu và trạng thái thao tác của công thức và định lượng nguyên liệu trong vòng đời màn hình.
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  if (!src || src === failedUrl) {
    return (
      <div className={`${className} flex items-center justify-center gap-2 bg-slate-100 text-slate-500`} role="img" aria-label={`${alt}: chưa có ảnh`}>
        <ChefHat size={22} aria-hidden="true" />
        <span className="text-sm font-medium">Chưa có ảnh</span>
      </div>
    )
  }

  // Hiển thị giao diện công thức và định lượng nguyên liệu từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return <img src={src} alt={alt} loading="lazy" className={className} onError={() => setFailedUrl(src)} />
}
