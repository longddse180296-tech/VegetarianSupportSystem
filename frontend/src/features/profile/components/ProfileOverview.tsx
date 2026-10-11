import React from 'react'
import {
  FileText,
  MessageSquare,
  Video,
  ArrowRight,
  ThumbsUp,
  Settings,
  Leaf,
  Activity,
  Flame,
  MapPin,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Bot,
  ExternalLink,
} from 'lucide-react'
import type { UserProfile, ProfileStats, RecentPost } from '../types'
import { Button } from '../../../shared/components'

interface ProfileOverviewProps {
  profile: UserProfile
  stats: ProfileStats
  recentPosts: RecentPost[]
  onGoToSettings: () => void
  onNavigate?: (path: string) => void
}

export const ProfileOverview: React.FC<ProfileOverviewProps> = ({
  profile,
  stats,
  recentPosts,
  onGoToSettings,
  onNavigate,
}) => {
  const getBMILabel = (cat: string) => {
    switch (cat) {
      case 'underweight':
        return { label: 'Thiếu cân', color: 'text-amber-600 bg-amber-50 border-amber-200' }
      case 'normal':
        return { label: 'Cân nặng phù hợp', color: 'text-[#2e7d32] bg-[#e8f5e9] border-emerald-200' }
      case 'overweight':
        return { label: 'Thừa cân', color: 'text-orange-600 bg-orange-50 border-orange-200' }
      case 'obese':
        return { label: 'Béo phì', color: 'text-rose-600 bg-rose-50 border-rose-200' }
      default:
        return { label: 'Chưa đủ dữ liệu', color: 'text-slate-600 bg-slate-50 border-slate-200' }
    }
  }

  const bmiInfo = getBMILabel(profile.metrics.bmiCategory)

  const clampedBMI = Math.min(Math.max(profile.metrics.bmi, 15), 35)
  const pinPercentage = ((clampedBMI - 15) / 20) * 100

  // Personalized AI Nutrition Advice based on profile metrics & diet
  const getAiAdvice = () => {
    const isVegan = profile.dietaryType === 'Vegan'
    const bmiVal = profile.metrics.bmi
    const calorieNeed = profile.metrics.tdeeKcal

    if (!bmiVal) {
      return {
        summary: 'Hãy khai báo số đo và thông tin cơ thể để xem BMI/TDEE ước tính từ backend.',
        details: 'Kết quả dinh dưỡng chỉ mang tính tham khảo và không thay thế tư vấn y khoa.',
        actionLabel: 'Cập nhật hồ sơ', actionPath: '/profile/settings',
      }
    }
    if (!calorieNeed) {
      return {
        summary: `BMI ước tính là ${bmiVal}. Chưa đủ dữ liệu để ước tính TDEE.`,
        details: 'Hãy kiểm tra tuổi, giới tính và mức vận động. Kết quả chỉ mang tính tham khảo.',
        actionLabel: 'Cập nhật hồ sơ', actionPath: '/profile/settings',
      }
    }
    if (profile.metrics.bmiCategory === 'unknown') {
      return {
        summary: `BMI ước tính là ${bmiVal}; TDEE ước tính là ${calorieNeed.toLocaleString()} kcal/ngày.`,
        details: 'Chưa có phân loại BMI người lớn cho độ tuổi này. Kết quả chỉ mang tính tham khảo.',
        actionLabel: 'Xem hồ sơ', actionPath: '/profile/settings',
      }
    }

    if (profile.metrics.bmiCategory === 'underweight') {
      return {
        summary: `BMI ước tính của bạn là ${bmiVal}; TDEE ước tính là ${calorieNeed.toLocaleString()} kcal/ngày.`,
        details: isVegan
          ? 'Nên bổ sung thêm các nguồn chất béo lành mạnh như bơ đậu phộng, hạt chia, dầu ô liu và các món đậu hũ non chiên giòn, sữa hạt óc chó để tăng mật độ calo an toàn.'
          : 'Có thể bổ sung thêm phô mai, sữa chua thanh trùng và các bữa phụ dinh dưỡng từ hạt hạnh nhân để tăng cân lành mạnh.',
        actionLabel: 'Xem thực đơn tăng cân lành mạnh',
        actionPath: '/meal-plans',
      }
    }
    if (profile.metrics.bmiCategory === 'overweight' || profile.metrics.bmiCategory === 'obese') {
      return {
        summary: `BMI ước tính của bạn là ${bmiVal}; TDEE ước tính là ${calorieNeed.toLocaleString()} kcal/ngày.`,
        details:
          'Nên ưu tiên các món hấp, luộc, canh rau củ tươi mát, tăng cường nấm hương, đậu lăng và giảm bớt các món chay chiên rán nhiều dầu mỡ ngập.',
        actionLabel: 'Khám phá thực đơn thâm hụt calo',
        actionPath: '/meal-plans',
      }
    }
    return {
      summary: `BMI ước tính là ${bmiVal}; TDEE ước tính khoảng ${calorieNeed.toLocaleString()} kcal/ngày.`,
      details: isVegan
        ? 'Duy trì phối hợp đa dạng các họ đậu (đậu gà, đậu đỏ, đậu đen) cùng ngũ cốc nguyên cám để đảm bảo chuỗi acid amin thiết yếu và bổ sung Vitamin B12 định kỳ.'
        : 'Chế độ ăn của bạn rất hài hòa giữa nguồn đạm thực vật và vi chất. Hãy tiếp tục duy trì lượng nước từ 2 - 2.5 lít/ngày và chế độ luyện tập đều đặn.',
      actionLabel: 'Tư vấn chi tiết với Trợ lý AI',
      actionPath: '/ai-chat',
    }
  }

  const aiAdvice = getAiAdvice()

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Specialized Domain Component: AI Nutrition Companion Module (DESIGN.md #256) */}
      <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-5 sm:p-6 shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] relative overflow-hidden">
        {/* Top Header with Pulsating Organic Beacon */}
        <div className="flex items-center justify-between gap-3 flex-wrap pb-3.5 border-b border-[#e5e7eb]">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#e8f5e9] text-[#2e7d32]">
              <Bot className="w-4 h-4" />
              {/* Pulsating Beacon */}
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2e7d32] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2e7d32]" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1f2937] leading-none">
                  Trợ lý Dinh dưỡng AI Cá nhân
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e8f5e9] text-[#2e7d32] border border-emerald-200/80 uppercase">
                  Tương tác trực tiếp
                </span>
              </div>
              <p className="text-[11px] text-[#6b7280] mt-0.5">
                 Tham khảo hồ sơ thể trạng &amp; chế độ {profile.dietaryType || 'chưa chọn'}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onGoToSettings}
            leftIcon={<Settings className="w-3.5 h-3.5 text-[#2e7d32]" />}
          >
            Chỉnh sửa chỉ số &amp; dinh dưỡng
          </Button>
        </div>

        {/* AI Conversational Bubble (DESIGN.md #256: surfaced in #E8F5E9 with #1F2937 text) */}
        <div className="mt-4 p-4 rounded-[12px] bg-[#e8f5e9] border border-emerald-200/70 text-[#1f2937] text-xs leading-relaxed space-y-1.5 shadow-2xs">
          <p className="font-semibold text-[#1b5e20] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#2e7d32]" />
            <span>{aiAdvice.summary}</span>
          </p>
          <p className="text-slate-700">{aiAdvice.details}</p>
        </div>

        {/* Quick Action Prompt Chips (DESIGN.md #256: pill buttons along bottom) */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <span className="text-[11px] font-medium text-[#6b7280]">Gợi ý nhanh:</span>
          <button
            type="button"
            onClick={() => onNavigate?.(aiAdvice.actionPath)}
            className="h-8 px-3 rounded-full text-xs font-semibold bg-white border border-[#e5e7eb] text-[#2e7d32] hover:bg-[#e8f5e9] hover:border-[#2e7d32] transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <span>{aiAdvice.actionLabel}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('/ai-chat')}
            className="h-8 px-3 rounded-full text-xs font-semibold bg-white border border-[#e5e7eb] text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <span>Hỏi AI về lượng Protein</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('/food-scan')}
            className="h-8 px-3 rounded-full text-xs font-semibold bg-white border border-[#e5e7eb] text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <span>Quét nhãn thực phẩm an toàn</span>
          </button>
        </div>
      </div>

      {/* 2. Specialized Domain Component: BMI Health Spectrum Bar (DESIGN.md #255) */}
      <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-5 sm:p-6 shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#2e7d32]" />
            <h3 className="text-sm font-bold text-[#1f2937]">
               Phổ BMI người lớn theo ngưỡng backend
            </h3>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${bmiInfo.color} inline-flex items-center gap-1`}
          >
             <span>BMI {profile.metrics.bmi || '—'}</span>
            <span>•</span>
            <span>{bmiInfo.label}</span>
          </span>
        </div>

        {/* Linear Track (8px height, radius 9999px) with floating 16px circular pin */}
        <div className="relative pt-6 pb-2">
          {/* Floating 16px Circular Pin Indicator with Tooltipped Readout */}
           {profile.metrics.bmi > 0 && profile.metrics.bmiCategory !== 'unknown' && <div
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300 z-10"
            style={{ left: `${pinPercentage}%` }}
          >
            <div className="bg-[#1b5e20] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap mb-1">
               {profile.metrics.bmi}
           </div>
            <div className="w-4 h-4 rounded-full bg-[#2e7d32] border-2 border-white ring-2 ring-emerald-300 shadow-sm" />
          </div>}

          {/* 8px Track */}
          <div className="w-full h-2 rounded-full flex overflow-hidden bg-slate-100 shadow-inner">
            {/* Underweight: < 18.5 */}
            <div className="h-full bg-amber-400 flex-[3.5]" title="Thiếu cân (< 18.5)" />
             <div className="h-full bg-[#2e7d32] flex-[6.5]" title="Cân nặng phù hợp (18.5 - 24.9)" />
             <div className="h-full bg-orange-400 flex-[5]" title="Thừa cân (25.0 - 29.9)" />
             <div className="h-full bg-rose-500 flex-[5]" title="Béo phì (≥ 30.0)" />
          </div>
        </div>

        {/* Labels under spectrum bar */}
        <div className="grid grid-cols-4 text-[11px] text-[#6b7280] text-center font-medium pt-1">
          <span>Thiếu cân (&lt; 18.5)</span>
           <span className="text-[#1b5e20] font-bold">Phù hợp (18.5 - 24.9)</span>
           <span>Thừa cân (25 - 29.9)</span>
           <span>Béo phì (≥ 30)</span>
        </div>
      </div>

      {/* 3. Four Core Metric Tiles (16px radius, Level 1 shadow) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Tile 1: Diet Type */}
        <div className="p-4 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6b7280]">Chế độ ăn chay</span>
            <div className="w-8 h-8 rounded-[10px] bg-[#e8f5e9] text-[#2e7d32] flex items-center justify-center">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-base font-bold text-[#1f2937] leading-snug">
               {profile.dietaryType || 'Chưa chọn'}
            </div>
            <p className="text-[11px] text-[#6b7280] mt-1">Đồng bộ toàn bộ công thức</p>
          </div>
        </div>

        {/* Tile 2: BMI Category */}
        <div className="p-4 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6b7280]">Chỉ số BMI</span>
            <div className="w-8 h-8 rounded-[10px] bg-emerald-50 text-[#2e7d32] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-[#1f2937] tabular-nums tracking-tight">
               {profile.metrics.bmi || '—'}
            </div>
            <p className="text-[11px] font-medium text-[#2e7d32] mt-0.5">{bmiInfo.label}</p>
          </div>
        </div>

        {/* Tile 3: TDEE Energy */}
        <div className="p-4 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6b7280]">Nhu cầu Năng lượng</span>
            <div className="w-8 h-8 rounded-[10px] bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-[#1f2937] tabular-nums tracking-tight">
               {profile.metrics.tdeeKcal ? profile.metrics.tdeeKcal.toLocaleString() : '—'}
              <span className="text-xs font-medium text-[#6b7280] ml-1">kcal/ngày</span>
            </div>
            <p className="text-[11px] text-[#6b7280] mt-0.5">Ước tính theo Mifflin-St Jeor</p>
          </div>
        </div>

        {/* Tile 4: Allergy & Hidden Ingredients Count */}
        <div className="p-4 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6b7280]">Bảo vệ Dị ứng</span>
            <div className="w-8 h-8 rounded-[10px] bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-rose-600 tabular-nums tracking-tight">
              {profile.allergies.length}
              <span className="text-xs font-medium text-[#6b7280] ml-1">thành phần</span>
            </div>
            <p className="text-[11px] text-[#6b7280] mt-0.5">Tự động cảnh báo khi quét</p>
          </div>
        </div>
      </div>

      {/* Preferred Location Strip if set */}
      {profile.preferredRegion && (
        <div className="bg-white rounded-[12px] border border-[#e5e7eb] px-4 py-3 text-xs text-[#6b7280] flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#2e7d32]" />
            <span>
              Khu vực ẩm thực ưu tiên:{' '}
              <strong className="text-[#1f2937] font-semibold">{profile.preferredRegion}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.('/restaurants')}
            className="text-[11px] font-semibold text-[#2e7d32] hover:text-[#1b5e20] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Tìm quán chay gần đây</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 4. Three Activity Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Articles */}
        <div className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] hover:shadow-[0_8px_20px_-4px_rgba(46,125,50,0.08),0_4px_12px_-2px_rgba(31,41,55,0.04)] transition-all flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#1f2937]">Bài viết chia sẻ</span>
            <div className="w-9 h-9 rounded-[10px] bg-[#e8f5e9] text-[#2e7d32] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#1f2937] tabular-nums tracking-tight">
              {stats.postCount}
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('/profile/my-articles')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2e7d32] hover:text-[#1b5e20] hover:underline mt-2 cursor-pointer"
            >
              <span>Xem danh sách bài viết</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] hover:shadow-[0_8px_20px_-4px_rgba(46,125,50,0.08),0_4px_12px_-2px_rgba(31,41,55,0.04)] transition-all flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#1f2937]">Bình luận &amp; Thảo luận</span>
            <div className="w-9 h-9 rounded-[10px] bg-amber-50 text-amber-700 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#1f2937] tabular-nums tracking-tight">
              {stats.commentCount}
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('/profile/my-comments')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2e7d32] hover:text-[#1b5e20] hover:underline mt-2 cursor-pointer"
            >
              <span>Xem lịch sử bình luận</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Videos */}
        <div className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] hover:shadow-[0_8px_20px_-4px_rgba(46,125,50,0.08),0_4px_12px_-2px_rgba(31,41,55,0.04)] transition-all flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#1f2937]">Video hướng dẫn</span>
            <div className="w-9 h-9 rounded-[10px] bg-purple-50 text-purple-700 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#1f2937] tabular-nums tracking-tight">
              {stats.videoCount}
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('/profile/my-videos')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2e7d32] hover:text-[#1b5e20] hover:underline mt-2 cursor-pointer"
            >
              <span>Xem video đã đăng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Recent Posts Section */}
      <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-6 sm:p-7 shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1f2937]">Bài viết chia sẻ gần đây</h2>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Những bài chia sẻ kinh nghiệm, công thức và cẩm nang sống xanh bạn đã đóng góp
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.('/profile/my-articles')}
            className="text-xs font-semibold text-[#2e7d32] hover:text-[#1b5e20] hover:underline cursor-pointer"
          >
            Xem tất cả ({stats.postCount})
          </button>
        </div>

        {/* Posts List */}
        {recentPosts.length === 0 ? (
          <div className="p-8 text-center bg-[#f8faf8] rounded-[12px] border border-dashed border-[#e5e7eb]">
            <p className="text-xs text-[#6b7280]">Bạn chưa đăng tải bài viết nào.</p>
            <button
              type="button"
              onClick={() => onNavigate?.('/articles')}
              className="mt-2 text-xs font-semibold text-[#2e7d32] hover:underline"
            >
              Tạo bài viết mới ngay
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recentPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-[12px] bg-[#f8faf8] border border-[#e5e7eb] hover:border-emerald-200 hover:bg-emerald-50/20 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#e8f5e9] text-[#2e7d32] border border-emerald-200/60">
                      {post.category}
                    </span>
                    <span className="text-xs text-slate-400">{post.publishedDate}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#1f2937] leading-snug">{post.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-[#6b7280] mt-0.5">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                      <span>{post.likeCount} lượt thích</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      <span>{post.commentCount} bình luận</span>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => onNavigate?.(`/articles/${post.id}`)}
                    className="px-3 py-1.5 text-xs font-semibold text-[#2e7d32] hover:bg-[#e8f5e9] rounded-[10px] transition-colors cursor-pointer"
                  >
                    Xem bài
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate?.(`/articles/edit/${post.id}`)}
                    className="px-3 py-1.5 text-xs font-semibold text-[#1f2937] hover:bg-slate-200 rounded-[10px] transition-colors cursor-pointer"
                  >
                    Chỉnh sửa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfileOverview
