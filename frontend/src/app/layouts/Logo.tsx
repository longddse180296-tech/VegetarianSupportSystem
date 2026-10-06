import React from 'react'

interface LogoProps {
  className?: string
  iconSize?: 'sm' | 'md' | 'lg'
  showText?: boolean
  textColor?: string
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  iconSize = 'md',
  showText = true,
  textColor = 'text-[#237038]',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  const textSizes = {
    sm: 'text-base font-bold tracking-tight',
    md: 'text-xl font-bold tracking-tight',
    lg: 'text-2xl font-bold tracking-tight',
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Exact SVG Brand Icon */}
      <svg
        className={`${sizeClasses[iconSize]} flex-shrink-0`}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft mint squircle background */}
        <rect width="48" height="48" rx="14" fill="#EAF5EE" />

        {/* Dark green bean/leaf body */}
        <path
          d="M21.5 9.5C15 10 10.5 16 10.5 24.5C10.5 33 15.5 38.5 22 38.5C28.5 38.5 33.5 33 33.5 24.5C33.5 18 30.5 12 25 10C24 9.6 22.5 9.4 21.5 9.5Z"
          fill="#237038"
        />

        {/* Small circular leaf/bud at top right */}
        <circle cx="30" cy="14" r="4.2" fill="#237038" />

        {/* White plant sprout lines */}
        {/* Central stem */}
        <line
          x1="21.5"
          y1="13"
          x2="21.5"
          y2="34"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {/* Top-right branch pointing towards bud */}
        <path
          d="M21.5 20.5L27 16.5"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {/* Bottom-left branch */}
        <path
          d="M21.5 26.5L16 29"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>

      {/* Brand Text */}
      {showText && (
        <span
          className={`${textSizes[iconSize]} ${textColor} font-sans leading-none whitespace-nowrap`}
        >
          Vegetarian Support
        </span>
      )}
    </div>
  )
}
export default Logo
