import { useState } from 'react'
import { ChefHat } from 'lucide-react'

interface RecipeImageProps {
  src?: string | null
  alt: string
  className: string
}

export function RecipeImage({ src, alt, className }: RecipeImageProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  if (!src || src === failedUrl) {
    return (
      <div className={`${className} flex items-center justify-center gap-2 bg-slate-100 text-slate-500`} role="img" aria-label={`${alt}: chưa có ảnh`}>
        <ChefHat size={22} aria-hidden="true" />
        <span className="text-sm font-medium">Chưa có ảnh</span>
      </div>
    )
  }

  return <img src={src} alt={alt} loading="lazy" className={className} onError={() => setFailedUrl(src)} />
}
