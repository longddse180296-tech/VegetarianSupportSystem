import React from 'react'
import { TrendingUp, BarChart3 } from 'lucide-react'

export const ChartPlaceholder: React.FC = () => {
  const months = ['T5', 'T6', 'T7', 'T8', 'T9', 'T10']
  const userGrowth = [45, 60, 78, 92, 110, 128]
  const contentGrowth = [20, 28, 38, 48, 56, 64]

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-bold text-gray-900">
            Xu hướng tăng trưởng hệ thống (6 tháng qua)
          </h3>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            Thành viên mới
          </span>
          <span className="flex items-center gap-1.5 text-sky-600">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            Bài viết xuất bản
          </span>
        </div>
      </div>

      <div className="pt-4">
        {/* Mock Chart Visualizer with Bar chart simulation */}
        <div className="grid grid-cols-6 gap-3 sm:gap-6 items-end h-44 px-2 sm:px-6 pb-2 border-b border-gray-100">
          {months.map((m, idx) => {
            const userH = `${Math.round((userGrowth[idx] / 140) * 100)}%`
            const contentH = `${Math.round((contentGrowth[idx] / 140) * 100)}%`

            return (
              <div key={m} className="flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-1.5 h-full">
                  <div
                    style={{ height: userH }}
                    className="w-3.5 sm:w-5 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all group-hover:opacity-90 relative"
                  >
                    <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none transition-opacity">
                      {userGrowth[idx]}
                    </span>
                  </div>
                  <div
                    style={{ height: contentH }}
                    className="w-3.5 sm:w-5 bg-gradient-to-t from-sky-600 to-sky-400 rounded-t-lg transition-all group-hover:opacity-90 relative"
                  >
                    <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none transition-opacity">
                      {contentGrowth[idx]}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-gray-500">{m}</span>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-3">
          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            Tăng trưởng trung bình: +18.4% mỗi tháng
          </span>
          <span className="text-[11px]">Dữ liệu được tổng hợp định kỳ 00:00 UTC</span>
        </div>
      </div>
    </div>
  )
}
