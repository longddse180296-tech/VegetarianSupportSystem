import React from 'react'
import {
  BookOpen,
  Sparkles,
  Calendar,
  Bookmark,
  Store,
  CheckCircle2,
  Quote,
} from 'lucide-react'

interface AuthFeatureCardsProps {
  mode: 'login' | 'register'
}

export const AuthFeatureCards: React.FC<AuthFeatureCardsProps> = ({ mode }) => {
  if (mode === 'login') {
    return (
      <div className="flex flex-col gap-6 max-w-lg">
        {/* Top Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 self-start shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Đồng hành cùng lối sống chay khoa học</span>
        </div>

        {/* Heading & Subtitle */}
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Khám phá dinh dưỡng thuần thực vật chuẩn xác mỗi ngày
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Đăng nhập vào tài khoản để truy cập kế hoạch thực đơn 7 ngày cá nhân hóa, lưu trữ kho
            công thức yêu thích và nhận tư vấn chi tiết từ Trợ lý dinh dưỡng AI.
          </p>
        </div>

        {/* 3 Feature cards */}
        <div className="flex flex-col gap-3.5 mt-2">
          {/* Card 1 */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm hover:border-emerald-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-bold text-slate-900">1.200+ Công thức chay chọn lọc</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Chi tiết calo, vi chất và các bước hướng dẫn chuẩn đầu bếp.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm hover:border-emerald-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-bold text-slate-900">Trợ lý AI phân tích theo BMI</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tự động gợi ý món thay thế và cân bằng protein thông minh.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm hover:border-emerald-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-bold text-slate-900">Thực đơn cá nhân hóa trọn tuần</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tối ưu nguyên liệu tủ bếp, tiết kiệm thời gian đi chợ.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Register Mode
  return (
    <div className="flex flex-col gap-6 max-w-lg">
      {/* Top Tag */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 self-start shadow-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
        <span>Gia nhập cộng đồng thuần thực vật</span>
      </div>

      {/* Heading & Subtitle */}
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Bắt đầu hành trình dinh dưỡng thuần chay chuẩn khoa học
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Tạo tài khoản miễn phí để mở khóa toàn diện kế hoạch dinh dưỡng cá nhân hóa theo BMI, lưu
          trữ công thức yêu thích và hỏi đáp không giới hạn cùng Trợ lý AI.
        </p>
      </div>

      {/* 4 Feature Cards */}
      <div className="flex flex-col gap-3 mt-1">
        {/* Item 1 */}
        <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-bold text-slate-900">Kế hoạch thực đơn 7 ngày riêng biệt</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tối ưu calo và vi chất theo thể trạng.
            </p>
          </div>
        </div>

        {/* Item 2 */}
        <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <Bookmark className="w-4 h-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-bold text-slate-900">Lưu trữ & cá nhân hóa công thức</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Đánh dấu các món chay yêu thích chỉ với 1 cú nhấp.
            </p>
          </div>
        </div>

        {/* Item 3 */}
        <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-bold text-slate-900">Trợ lý AI đồng hành 24/7</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Giải đáp nguyên liệu thay thế, cân bằng protein.
            </p>
          </div>
        </div>

        {/* Item 4 */}
        <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <Store className="w-4 h-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-bold text-slate-900">Đánh giá & đóng góp nhà hàng</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Chia sẻ trải nghiệm ẩm thực chay cùng cộng đồng.
            </p>
          </div>
        </div>
      </div>

      {/* Testimonial Quote */}
      <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold uppercase tracking-wider">
          <Quote className="w-3.5 h-3.5" />
          <span>CỘNG ĐỒNG TIN CHỌN</span>
        </div>
        <p className="text-sm italic text-slate-700 leading-relaxed">
          &ldquo;Vegetarian Support giúp tôi ăn chay đủ chất và dễ dàng hơn bao giờ hết.&rdquo;
        </p>
        <div className="flex items-center gap-2.5 mt-1">
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
            LA
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 leading-none">Lan Anh</p>
            <p className="text-[11px] text-slate-500 leading-none mt-0.5">Thành viên từ 2024</p>
          </div>
        </div>
      </div>
    </div>
  )
}
export default AuthFeatureCards
