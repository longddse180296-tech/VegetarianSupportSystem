import React from 'react'

interface LogoProps {
  className?: string
  iconSize?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  iconSize = 'md',
  showText = true,
}) => {
  const iconPx = {
    sm: 34,
    md: 40,
    lg: 46,
  }[iconSize]

  const textPx = {
    sm: '15px',
    md: '18.5px',
    lg: '22px',
  }[iconSize]

  return (
    <div className={`app-brand-logo ${className}`} style={{ gap: '10px' }}>
      <svg
        width={iconPx}
        height={iconPx}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="app-brand-logo-icon"
        aria-hidden="true"
      >
        <rect
          x="0.5"
          y="0.5"
          width="47"
          height="47"
          rx="14"
          fill="#ECF7F0"
          stroke="#D5E5DB"
          strokeWidth="1"
        />
        <path
          d="M21.5 9.5C15 10 10.5 16 10.5 24.5C10.5 33 15.5 38.5 22 38.5C28.5 38.5 33.5 33 33.5 24.5C33.5 18 30.5 12 25 10C24 9.6 22.5 9.4 21.5 9.5Z"
          fill="#1F6A36"
        />
        <circle cx="30" cy="14" r="4.2" fill="#1F6A36" />
        <line
          x1="21.5"
          y1="13"
          x2="21.5"
          y2="34"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M21.5 20.5L27 16.5"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M21.5 26.5L16 29"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
      {showText && (
        <span
          className="app-brand-logo-text"
          style={{
            fontSize: textPx,
            fontWeight: 800,
            letterSpacing: '-0.4px',
            color: '#186333',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          Vegetarian Support
        </span>
      )}
    </div>
  )
}

export default Logo
