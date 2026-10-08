import React from 'react'
import {
  Users,
  FileText,
  Video,
  MessageSquare,
  Tag,
  ArrowRight,
  Eye,
  Edit3,
  Clock,
  Play,
} from 'lucide-react'

interface AdminDashboardOverviewProps {
  onNavigateToMembers: () => void
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({
  onNavigateToMembers,
}) => {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 5 Top Stat Cards matching Image 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Members */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-[#1E6531] bg-[#EAF5EE] px-2 py-0.5 rounded-full">
              +12%
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block leading-tight">
              Thành viên đã đăng ký
            </span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block">128</span>
            <button
              type="button"
              onClick={onNavigateToMembers}
              className="text-xs font-bold text-[#1E6531] hover:underline flex items-center gap-1 mt-2.5"
            >
              <span>Xem chi tiết</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Articles */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded-full">
              +4 MỚI
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block leading-tight">
              Bài viết đã đăng
            </span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block">64</span>
            <span className="text-xs font-bold text-[#1E6531] hover:underline flex items-center gap-1 mt-2.5 cursor-pointer">
              Xem chi tiết →
            </span>
          </div>
        </div>

        {/* Card 3: Videos */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-[#EA580C] bg-[#FFF7ED] px-2 py-0.5 rounded-full">
              +2 MỚI
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block leading-tight">
              Video hướng dẫn
            </span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block">35</span>
            <span className="text-xs font-bold text-[#1E6531] hover:underline flex items-center gap-1 mt-2.5 cursor-pointer">
              Xem chi tiết →
            </span>
          </div>
        </div>

        {/* Card 4: Comments */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#F3E8FF] text-[#7E22CE] flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-[#7E22CE] bg-[#F3E8FF] px-2 py-0.5 rounded-full">
              +28 TUẦN
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block leading-tight">
              Bình luận cộng đồng
            </span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block">412</span>
            <span className="text-xs font-bold text-[#1E6531] hover:underline flex items-center gap-1 mt-2.5 cursor-pointer">
              Xem chi tiết →
            </span>
          </div>
        </div>

        {/* Card 5: Categories */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-[#1E6531] bg-[#EAF5EE] px-2 py-0.5 rounded-full">
              ỔN ĐỊNH
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block leading-tight">
              Danh mục nội dung
            </span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block">12</span>
            <span className="text-xs font-bold text-[#1E6531] hover:underline flex items-center gap-1 mt-2.5 cursor-pointer">
              Xem chi tiết →
            </span>
          </div>
        </div>
      </div>

      {/* Thao tác nhanh (Quick actions) matching Image 1 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Thao tác nhanh</h2>
          <span className="text-xs text-slate-400">Phím tắt điều hướng quản trị</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <button
            type="button"
            onClick={onNavigateToMembers}
            className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:bg-[#EAF5EE]/40 transition-colors text-left flex items-start gap-3 shadow-xs"
          >
            <div className="w-9 h-9 rounded-xl bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                Quản lý thành viên
              </span>
              <span className="text-[11px] text-slate-400 block mt-1 leading-tight">
                Xem danh sách, phân...
              </span>
            </div>
          </button>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 text-left flex items-start gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                Quản lý bài viết
              </span>
              <span className="text-[11px] text-slate-400 block mt-1 leading-tight">
                Duyệt bài, phân loại và...
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 text-left flex items-start gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center flex-shrink-0">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                Quản lý video
              </span>
              <span className="text-[11px] text-slate-400 block mt-1 leading-tight">
                Quản lý video công thức và...
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 text-left flex items-start gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                Quản lý bình luận
              </span>
              <span className="text-[11px] text-slate-400 block mt-1 leading-tight">
                Kiểm duyệt phản hồi và...
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 text-left flex items-start gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center flex-shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                Quản lý danh mục
              </span>
              <span className="text-[11px] text-slate-400 block mt-1 leading-tight">
                Thiết lập danh mục...
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Columns matching Image 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Bài viết & Video mới nhất */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Recent Articles */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1E6531]" />
                <h3 className="text-sm font-bold text-slate-900">Bài viết mới nhất</h3>
              </div>
              <span className="text-xs font-bold text-[#1E6531] hover:underline cursor-pointer">
                Xem tất cả →
              </span>
            </div>

            <div className="flex flex-col divide-y divide-slate-100 text-xs">
              <div className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-900 truncate">
                    Kinh nghiệm bổ sung Protein thực vật cho người mới
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 flex-shrink-0">
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-[11px]">
                    Nguyễn Minh Anh
                  </span>
                  <span>14/10/2024</span>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Eye className="w-3.5 h-3.5 hover:text-[#1E6531] cursor-pointer" />
                    <Edit3 className="w-3.5 h-3.5 hover:text-slate-700 cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-900 truncate">
                    Cách chuẩn bị Meal Prep chay tiện lợi cả tuần
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 flex-shrink-0">
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-[11px]">
                    Lê Thu Hà
                  </span>
                  <span>28/09/2024</span>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Eye className="w-3.5 h-3.5 hover:text-[#1E6531] cursor-pointer" />
                    <Edit3 className="w-3.5 h-3.5 hover:text-slate-700 cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-900 truncate">
                    Top 10 nguồn canxi dồi dào từ hạt và rau xanh
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 flex-shrink-0">
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-[11px]">
                    Trần Gia Huy
                  </span>
                  <span>20/09/2024</span>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Eye className="w-3.5 h-3.5 hover:text-[#1E6531] cursor-pointer" />
                    <Edit3 className="w-3.5 h-3.5 hover:text-slate-700 cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-900 truncate">
                    Lộ trình chuyển đổi ăn thuần thực vật bền vững
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 flex-shrink-0">
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-[11px]">
                    Phạm Quốc Bảo
                  </span>
                  <span>15/09/2024</span>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Eye className="w-3.5 h-3.5 hover:text-[#1E6531] cursor-pointer" />
                    <Edit3 className="w-3.5 h-3.5 hover:text-slate-700 cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Videos */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-[#1E6531]" />
                <h3 className="text-sm font-bold text-slate-900">Video mới nhất</h3>
              </div>
              <span className="text-xs font-bold text-[#1E6531] hover:underline cursor-pointer">
                Xem tất cả →
              </span>
            </div>

            <div className="flex flex-col divide-y divide-slate-100 text-xs">
              <div className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center">
                    <Play className="w-3 h-3 fill-[#1E6531]" />
                  </div>
                  <span className="font-semibold text-slate-900">Đậu hũ sốt nấm hương đậm đà</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 flex-shrink-0">
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-[11px]">
                    Trần Gia Huy
                  </span>
                  <span className="font-mono text-[#1E6531] font-bold bg-[#EAF5EE] px-1.5 py-0.5 rounded text-[11px]">
                    08:45
                  </span>
                  <span>12/10/2024</span>
                </div>
              </div>

              <div className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center">
                    <Play className="w-3 h-3 fill-[#1E6531]" />
                  </div>
                  <span className="font-semibold text-slate-900">Gỏi cuốn nấm ngũ sắc thanh mát</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 flex-shrink-0">
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-[11px]">
                    Nguyễn Minh Anh
                  </span>
                  <span className="font-mono text-[#1E6531] font-bold bg-[#EAF5EE] px-1.5 py-0.5 rounded text-[11px]">
                    05:20
                  </span>
                  <span>05/10/2024</span>
                </div>
              </div>

              <div className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center">
                    <Play className="w-3 h-3 fill-[#1E6531]" />
                  </div>
                  <span className="font-semibold text-slate-900">Nấu canh rong biển hạt sen bồi bổ</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 flex-shrink-0">
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-[11px]">
                    Phạm Quốc Bảo
                  </span>
                  <span className="font-mono text-[#1E6531] font-bold bg-[#EAF5EE] px-1.5 py-0.5 rounded text-[11px]">
                    10:15
                  </span>
                  <span>01/10/2024</span>
                </div>
              </div>

              <div className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center">
                    <Play className="w-3 h-3 fill-[#1E6531]" />
                  </div>
                  <span className="font-semibold text-slate-900">Cách làm sốt tương mè rang thơm ngậy</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 flex-shrink-0">
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-[11px]">
                    Lê Thu Hà
                  </span>
                  <span className="font-mono text-[#1E6531] font-bold bg-[#EAF5EE] px-1.5 py-0.5 rounded text-[11px]">
                    04:35
                  </span>
                  <span>26/09/2024</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hoạt động gần đây (Timeline) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1E6531]" />
              <h3 className="text-sm font-bold text-slate-900">Hoạt động gần đây</h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              Thời gian thực
            </span>
          </div>

          {/* Timeline Items matching Image 1 */}
          <div className="flex flex-col gap-4 text-xs">
            {/* Item 1 */}
            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-0.5 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">Nguyễn Minh Anh</span>
                  <span className="text-[10px] text-slate-400">10 phút trước</span>
                </div>
                <p className="text-slate-600 leading-snug">
                  Đã đăng bài viết mới: &ldquo;Kinh nghiệm bổ sung Protein thực vật&rdquo;
                </p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Video className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-0.5 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">Trần Gia Huy</span>
                  <span className="text-[10px] text-slate-400">1 giờ trước</span>
                </div>
                <p className="text-slate-600 leading-snug">
                  Đã tải video mới: &ldquo;Đậu hũ sốt nấm hương&rdquo;
                </p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F3E8FF] text-[#7E22CE] flex items-center justify-center flex-shrink-0 mt-0.5">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-0.5 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">Lê Thu Hà</span>
                  <span className="text-[10px] text-slate-400">2 giờ trước</span>
                </div>
                <p className="text-slate-600 leading-snug">
                  Đã bình luận bài viết: &ldquo;Top 10 nguồn canxi dồi dào&rdquo;
                </p>
              </div>
            </div>

            {/* Item 4 */}
            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Tag className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-0.5 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">Admin</span>
                  <span className="text-[10px] text-slate-400">Hôm qua</span>
                </div>
                <p className="text-slate-600 leading-snug">
                  Đã cập nhật danh mục: &ldquo;Dinh dưỡng thuần chay&rdquo;
                </p>
              </div>
            </div>

            {/* Item 5 */}
            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#059669] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-0.5 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">Vũ Hoàng Long</span>
                  <span className="text-[10px] text-slate-400">Hôm qua</span>
                </div>
                <p className="text-slate-600 leading-snug">
                  Đã đăng ký tài khoản thành viên mới trong hệ thống
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default AdminDashboardOverview
