// Chức năng: thực đơn bảy ngày và danh sách đi chợ. Ghép dữ liệu, thao tác và các trạng thái tải/lỗi cho màn hình.
import {
  ArrowRight,
  Calendar,
  Leaf,
  Lock,
  ShoppingCart,
  Sparkles,
  Utensils,
} from 'lucide-react'
import { useAuth } from '../../auth'
import { MyMealPlanPage } from './MyMealPlanPage'
import { Badge, Button, PageHeading } from '../../../shared/components'

// Cấu trúc MealPlansPublicProps quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
export interface MealPlansPublicProps {
  onNavigate?: (path: string) => void
}

// Thành phần MealPlansPublic nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc thực đơn bảy ngày và danh sách đi chợ.
export const MealPlansPublic = ({ onNavigate }: MealPlansPublicProps) => {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <MyMealPlanPage onNavigate={onNavigate} />
  // Ghi nhận thay đổi dữ liệu và cập nhật kết quả cho bên gọi (create); thuộc thực đơn bảy ngày và danh sách đi chợ.
  const create = () =>
    onNavigate?.('/login?returnUrl=' + encodeURIComponent('/meal-plans/setup'))
  // Hiển thị giao diện thực đơn bảy ngày và danh sách đi chợ từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <div className="ui-page-container py-8 space-y-6">
      <PageHeading
        title="Lập thực đơn món chay"
        description="Lập kế hoạch 7 ngày với 21 bữa ăn từ kho công thức, dựa trên thông tin trong hồ sơ của bạn."
        breadcrumbs={[{ label: 'Trang chủ', onClick: () => onNavigate?.('/') }, { label: 'Thực đơn' }]}
        eyebrow={<Badge icon={<Leaf size={14} />}>Kế hoạch &amp; Dinh dưỡng</Badge>}
        actions={
          <Button
            variant="primary"
            leftIcon={<Sparkles size={16} />}
            onClick={create}
          >
            Tạo thực đơn cá nhân hóa
          </Button>
        }
      />
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B5E20] via-[#2E7D32] to-[#388E3C] p-8 md:p-10 lg:p-12 shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white/95 text-xs font-semibold">
              <Leaf className="w-4 h-4" />
              Theo hồ sơ và chế độ ăn của bạn
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
              Lập thực đơn chay <span className="text-emerald-300">7 ngày</span>{' '}
              phù hợp riêng cho bạn
            </h2>
            <p className="text-white/90">
              Tạo 21 bữa ăn từ các công thức đang có, dựa trên chế độ ăn, dị ứng
              và thực phẩm cần tránh trong hồ sơ.
            </p>
            <button
              onClick={create}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-[#2E7D32] hover:text-[#1B5E20] font-bold shadow-md hover:bg-emerald-50 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Tạo thực đơn cá nhân hóa
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="flex items-center gap-2 text-white/70 text-xs">
              <Lock className="w-3.5 h-3.5" />
              Đăng nhập để tạo và lưu kế hoạch của riêng bạn.
            </p>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-2xl p-5 space-y-3 shrink-0 lg:w-52 text-white">
            <p className="flex items-center gap-2 text-sm">
              <Utensils className="w-4 h-4" />
              Cấu trúc kế hoạch
            </p>
            <p className="text-2xl font-black">7 ngày · 21 bữa</p>
            <p className="text-xs text-white/70">
              Sáng, trưa, tối mỗi ngày. Có thể đổi món và khẩu phần sau khi tạo.
            </p>
          </div>
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-extrabold text-slate-900">
          Chuẩn bị kế hoạch của bạn
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: Leaf,
              title: '1. Lưu hồ sơ ăn uống',
              text: 'Chọn chế độ ăn, ghi dị ứng và thực phẩm cần tránh trong Hồ sơ.',
            },
            {
              icon: Calendar,
              title: '2. Tạo thực đơn 7 ngày',
              text: 'Chọn ngày bắt đầu, tạo kế hoạch rồi xem dinh dưỡng và đổi món theo nhu cầu.',
            },
            {
              icon: ShoppingCart,
              title: '3. Chuẩn bị đi chợ',
              text: 'Xem nguyên liệu cần mua, đánh dấu đã mua và tải bản PDF. Có thể áp dụng kế hoạch sang tuần mới.',
            },
          ].map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-emerald-100 bg-white p-6 space-y-3"
            >
              <Icon className="w-7 h-7 text-emerald-700" />
              <h3 className="font-bold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
export default MealPlansPublic
