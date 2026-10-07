import React from 'react'

export const Logo: React.FC<{ iconSize?: 'sm' | 'md' | 'lg' }> = ({ iconSize = 'md' }) => {
  const dims = iconSize === 'sm' ? { w: 26, h: 26 } : iconSize === 'lg' ? { w: 48, h: 48 } : { w: 34, h: 34 }
  const titleCls = iconSize === 'sm' ? 'text-base' : iconSize === 'lg' ? 'text-2xl' : 'text-lg'
  return (
    <div className="inline-flex items-center gap-2.5">
      <div
        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm"
        style={{ width: dims.w, height: dims.h }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" width={dims.w * 0.6} height={dims.h * 0.6} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M7 20c4.5-2 7-5 7-10 0 0-3 0-6 2C4.5 14 4 17 4 18.5 4 19.5 5 20 7 20Z"
            fill="currentColor"
          />
          <path
            d="M17 21c3-1.5 4.5-4.5 4.5-8 0 0-2.5-.2-5.5 1.5-2.3 1.4-3 3.2-3 4.8 0 .9.8 1.7 1.8 1.7h2.2Z"
            fill="currentColor"
            opacity="0.85"
          />
          <path
            d="M12 19c0-4-1-7.5-2.5-10.5C7.8 5.5 5.5 4.2 3 4c.5 3.2 1.8 6 4 8.2C9.5 14.7 11 17 12 19Z"
            fill="#bbf7d0"
          />
        </svg>
      </div>
      <div className="leading-tight">
        <div className={`font-extrabold text-emerald-800 tracking-tight ${titleCls}`}>
          Vegetarian Support
        </div>
        {iconSize !== 'sm' && (
          <div className="text-[11px] text-emerald-700/80 font-semibold uppercase tracking-wider">
            Nền tảng ẩm thực & dinh dưỡng thực vật
          </div>
        )}
      </div>
    </div>
  )
}

export default Logo
