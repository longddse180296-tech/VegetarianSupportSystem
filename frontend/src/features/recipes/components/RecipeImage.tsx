// Chức năng: công thức và định lượng nguyên liệu. Hiển thị một phần giao diện và phát sự kiện cho màn hình cha xử lý.
import { ContentImage } from '../../../shared/components/ContentImage'

// Cấu trúc RecipeImageProps quy định dữ liệu trao đổi trong công thức và định lượng nguyên liệu.
interface RecipeImageProps {
  src?: string | null
  alt: string
  className: string
}

// Thành phần RecipeImage nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc công thức và định lượng nguyên liệu.
export function RecipeImage({ src, alt, className }: RecipeImageProps) {
  return <ContentImage src={src} alt={alt} className={className} />
}
