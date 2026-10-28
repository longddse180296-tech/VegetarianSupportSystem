// Chức năng: phân tích ảnh món ăn và nhãn thành phần. Hiển thị một phần giao diện và phát sự kiện cho màn hình cha xử lý.
import {
  AlertCircle,
  CheckCircle2,
  History,
  RotateCcw,
  ShieldAlert,
  TriangleAlert,
  XCircle,
} from 'lucide-react'
import { Button, StatusBadge } from '../../../shared/components'
import {
  assessmentStatus,
  DIET_LABELS,
  INGREDIENT_KIND_LABELS,
  INGREDIENT_SOURCE_LABELS,
  type SavedFoodScan,
} from '../api/foodScanApi'

// Cấu trúc ScanResultCardProps quy định dữ liệu trao đổi trong phân tích ảnh món ăn và nhãn thành phần.
interface ScanResultCardProps {
  result: SavedFoodScan | null
  onResetAll: () => void
  onReevaluate: () => void
  onLoadHistory: () => void
  isLoggedIn: boolean
}

// Chuẩn hóa hoặc chuyển đổi dữ liệu giữa các bước xử lý (formatScanNote); thuộc phân tích ảnh món ăn và nhãn thành phần.
function formatScanNote(note?: string | null): string {
  if (!note) {
    return 'Kết quả phân tích dựa trên danh sách thành phần bạn đã kiểm tra và xác nhận. Do hình ảnh món ăn không thể hiện được các thành phần ẩn (như nước dùng, gia vị nêm, dầu mỡ), vui lòng đối chiếu thêm với người chế biến để đảm bảo chuẩn chay theo nhu cầu.'
  }
  if (
    note.includes('User xác nhận') ||
    note.includes('không xác minh thành phần ẩn') ||
    note.includes('an toàn dị ứng')
  ) {
    return 'Kết quả phân tích dựa trên danh sách thành phần bạn đã kiểm tra và xác nhận. Do hình ảnh món ăn không thể hiện được các thành phần ẩn (như nước dùng, gia vị nêm, dầu mỡ), vui lòng đối chiếu thêm với người chế biến để đảm bảo chuẩn chay theo nhu cầu.'
  }
  return note
}

// Thành phần ScanResultCard nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc phân tích ảnh món ăn và nhãn thành phần.
export default function ScanResultCard({
  result,
  onResetAll,
  onReevaluate,
  onLoadHistory,
  isLoggedIn,
}: ScanResultCardProps) {
  if (!result) {
    return (
      <div className="rounded-2xl border border-slate-200/90 bg-white p-8 text-center space-y-4 shadow-xs">
        <p className="text-slate-600 text-sm">Chưa có kết quả. Hãy tải ảnh và xác nhận nguyên liệu trước khi đánh giá.</p>
        <Button type="button" onClick={onResetAll} className="!bg-[#2E7D32] hover:!bg-[#1B5E20] !text-white">
          Bắt đầu quét ảnh
        </Button>
      </div>
    )
  }

  const currentDiet = result.profileSnapshot.diet
  const currentAssessment = result.assessments.find((item) => item.diet === currentDiet)

  const isSuitable = currentAssessment?.status === 'Suitable'
  const isNotSuitable = currentAssessment?.status === 'NotSuitable'

  // Hiển thị giao diện phân tích ảnh món ăn và nhãn thành phần từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <div className="space-y-6">
      {/* ============= CARD TỔNG KẾT KẾT QUẢ ============= */}
      <section
        className={`rounded-2xl border p-6 shadow-xs transition-all ${
          isSuitable
            ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-white'
            : isNotSuitable
            ? 'border-rose-200 bg-gradient-to-br from-rose-50/80 via-white to-white'
            : 'border-amber-200 bg-gradient-to-br from-amber-50/80 via-white to-white'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                isSuitable
                  ? 'bg-emerald-100 text-emerald-800'
                  : isNotSuitable
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {isSuitable ? (
                <CheckCircle2 size={13} />
              ) : isNotSuitable ? (
                <XCircle size={13} />
              ) : (
                <AlertCircle size={13} />
              )}
              Kết quả đánh giá đối chiếu
            </span>
            <h2 className="text-xl font-extrabold text-slate-900">
              {result.sourceType === 'Dish' ? 'Phân tích món ăn' : 'Phân tích nhãn sản phẩm'}
            </h2>
            <p className="text-xs text-slate-500">
              {new Date(result.createdAtUtc).toLocaleString('vi-VN')} · Đánh giá phiên bản {result.resultVersion}
            </p>
          </div>

          {currentAssessment && (
            <div className="scale-105">
              <StatusBadge status={assessmentStatus(currentAssessment.status)} size="md" />
            </div>
          )}
        </div>

        <div className="mt-4 rounded-xl bg-white/95 border border-slate-200/90 p-4 shadow-2xs">
          <p className="text-sm text-slate-800 font-medium leading-relaxed">
            {formatScanNote(result.note)}
          </p>
        </div>

        <div className="mt-3 flex items-start gap-2 text-xs text-slate-500">
          <ShieldAlert size={14} className="text-[#2E7D32] shrink-0 mt-0.5" />
          <span>
            Lưu ý quan trọng: Hệ thống hỗ trợ tra cứu thông tin tham khảo; luôn kiểm tra trực tiếp bao bì hoặc trao đổi với nhà bếp nếu bạn có tiền sử dị ứng nghiêm trọng.
          </span>
        </div>
      </section>

      {/* ============= 4 CHẾ ĐỘ ĂN ============= */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <h3 className="font-bold text-slate-800 text-base mb-1">Mức độ phù hợp theo từng chế độ ăn</h3>
        <p className="text-xs text-slate-500 mb-4">
          Hệ thống đồng thời phân tích tính tương thích với cả 4 chế độ ăn chay phổ biến.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {result.assessments.map((assessment) => {
            const isUserDiet = assessment.diet === currentDiet
            // Hiển thị giao diện phân tích ảnh món ăn và nhãn thành phần từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
            return (
              <div
                key={assessment.diet}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border p-4 transition-all ${
                  isUserDiet
                    ? 'border-[#2E7D32] bg-emerald-50/60 shadow-xs ring-2 ring-emerald-500/10'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">
                      {DIET_LABELS[assessment.diet] || assessment.diet}
                    </p>
                    {isUserDiet && (
                      <span className="rounded-full bg-[#2E7D32] text-white px-2 py-0.5 text-[10px] font-bold shadow-2xs">
                        Hồ sơ của bạn
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {assessment.diet === 'Vegan'
                      ? 'Thuần thực vật'
                      : assessment.diet === 'Lacto'
                      ? 'Ăn chay có sữa'
                      : assessment.diet === 'Ovo'
                      ? 'Ăn chay có trứng'
                      : 'Ăn chay có trứng & sữa'}
                  </p>
                </div>
                <StatusBadge status={assessmentStatus(assessment.status)} size="sm" />
              </div>
            )
          })}
        </div>
      </section>

      {/* ============= NGUYÊN LIỆU ĐÃ ĐÁNH GIÁ ============= */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="font-bold text-slate-800 text-base">Nguyên liệu đã xác nhận & đưa vào đánh giá</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
            {result.ingredients.length} mục
          </span>
        </div>

        {result.ingredients.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {result.ingredients.map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 flex flex-col justify-between"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-bold text-slate-800">{item.name}</span>
                  <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 shadow-2xs shrink-0">
                    {INGREDIENT_KIND_LABELS[item.kind] || item.kind}
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Nguồn: {INGREDIENT_SOURCE_LABELS[item.source] || item.source}</span>
                  {item.kind === 'Plant' ? (
                    <span className="text-emerald-700 font-semibold">Gốc thực vật</span>
                  ) : item.kind === 'Animal' ? (
                    <span className="text-rose-700 font-semibold">Động vật</span>
                  ) : item.kind === 'Dairy' || item.kind === 'Egg' ? (
                    <span className="text-amber-700 font-semibold">Trứng / Sữa</span>
                  ) : item.kind === 'Honey' ? (
                    <span className="text-amber-700 font-semibold">Mật ong</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Chưa có nguyên liệu được xác nhận.</p>
        )}
      </section>

      {/* ============= ĐỐI CHIẾU KHO NGUYÊN LIỆU ============= */}
      {result.catalogEvidence.length > 0 && (
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
          <h3 className="font-bold text-slate-800 text-base mb-1">Đối chiếu kho nguyên liệu hệ thống</h3>
          <p className="text-xs text-slate-500 mb-3">
            Hệ thống nhận diện được nguyên liệu trùng khớp với danh mục kiểm soát động vật, trứng, sữa hoặc mật ong:
          </p>
          <ul className="space-y-2">
            {result.catalogEvidence.map((item) => (
              <li
                key={item.ingredientId}
                className="flex flex-wrap justify-between items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm"
              >
                <span className="font-bold text-slate-800">{item.name}</span>
                <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                  {INGREDIENT_KIND_LABELS[item.kind] || item.kind}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ============= YẾU TỐ CHƯA RÕ ============= */}
      {result.unknownAnswers.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertCircle size={16} className="text-amber-800 shrink-0" />
            <h3 className="font-bold text-amber-950 text-base">Thông tin còn chưa xác định rõ</h3>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed mb-3">
            Các yếu tố sau đây chưa được làm rõ đầy đủ nên ảnh hưởng đến độ tin cậy của kết quả:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-xs sm:text-sm text-amber-900 font-medium">
            {result.unknownAnswers.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {/* ============= CẢNH BÁO DỊ ỨNG ============= */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <TriangleAlert size={16} className={result.allergyWarnings.length ? 'text-amber-600' : 'text-slate-400'} />
          <h3 className="font-bold text-slate-800 text-base">Cảnh báo dị ứng cá nhân</h3>
        </div>

        {result.allergyWarnings.length ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 mb-3">
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-amber-900 font-bold">
              {result.allergyWarnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-slate-600 mb-2">Không phát hiện cảnh báo dị ứng từ thông tin bạn đã cung cấp.</p>
        )}
        <p className="text-xs text-slate-500 leading-relaxed">{result.allergyNote}</p>
      </section>

      {/* ============= HÀNH ĐỘNG DƯỚI CÙNG ============= */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onReevaluate}
          leftIcon={<RotateCcw size={14} />}
          className="border-slate-300 hover:border-emerald-300 hover:bg-emerald-50/50"
        >
          Bổ sung thông tin / Đánh giá lại
        </Button>
        <Button
          type="button"
          onClick={onResetAll}
          className="!bg-[#2E7D32] hover:!bg-[#1B5E20] !text-white font-bold px-5 shadow-2xs"
        >
          Quét ảnh món khác
        </Button>
        {isLoggedIn && (
          <Button
            type="button"
            variant="ghost"
            onClick={onLoadHistory}
            leftIcon={<History size={14} />}
            className="border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50"
          >
            Xem lịch sử quét
          </Button>
        )}
      </div>
    </div>
  )
}
