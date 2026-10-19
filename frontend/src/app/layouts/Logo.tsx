import React from 'react'
import logoFull from '../../assets/LOGO.png'
import logoIcon from '../../assets/LOGO_ICON.png'

interface LogoProps {
  className?: string
  iconSize?: 'sm' | 'md' | 'lg' | 'xl' | number
  showText?: boolean
}

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
