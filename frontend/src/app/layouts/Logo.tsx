// Chức năng: giao diện và thành phần dùng chung. Bố trí phần điều hướng và vùng nội dung chung giữa các màn hình.
import React from 'react'
import logoFull from '../../assets/LOGO.png'
import logoIcon from '../../assets/LOGO_ICON.png'

// Cấu trúc LogoProps quy định dữ liệu trao đổi trong giao diện và thành phần dùng chung.
interface LogoProps {
  className?: string
  iconSize?: 'sm' | 'md' | 'lg' | 'xl' | number
  showText?: boolean
}

// Thành phần Logo nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc giao diện và thành phần dùng chung.
export const Logo: React.FC<LogoProps> = ({
  className = '',
  iconSize = 'md',
  showText = true,
}) => {
  const iconPx =
    typeof iconSize === 'number'
      ? iconSize
      : {
          sm: 26,
          md: 32,
          lg: 40,
          xl: 44,
        }[iconSize] ?? 32

  const heightPx = iconPx

  if (!showText) {
    return (
      <span
        className={`app-brand-logo ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 0,
        }}
      >
        <img
          src={logoIcon}
          alt="Vegetarian Support"
          width={iconPx}
          height={iconPx}
          style={{
            width: `${iconPx}px`,
            height: `${iconPx}px`,
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </span>
    )
  }

  // Hiển thị thành phần giao diện dùng chung từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <span
      className={`app-brand-logo ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        lineHeight: 0,
      }}
    >
      <img
        src={logoFull}
        alt="Vegetarian Support"
        height={heightPx}
        style={{
          height: `${heightPx}px`,
          width: 'auto',
          maxWidth: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </span>
  )
}

export default Logo
