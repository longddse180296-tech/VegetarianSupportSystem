// Chức năng: danh mục nguyên liệu và dữ liệu dinh dưỡng. Cấu hình hoặc hỗ trợ luồng xử lý của các thành phần trong ứng dụng.
// Count quantities have no universal gram conversion.
export const ingredientUnits = [
  { value: 'g', label: 'g (Gam)' },
  { value: 'kg', label: 'kg (Kilôgam)' },
  { value: 'ml', label: 'ml (Mililít)' },
  { value: 'đơn vị', label: 'Số lượng' },
]

// Chuẩn hóa hoặc chuyển đổi dữ liệu giữa các bước xử lý (normalizeIngredientUnit); thuộc danh mục nguyên liệu và dữ liệu dinh dưỡng.
export function normalizeIngredientUnit(unit: string | null | undefined) {
  const normalized = unit?.trim().toLowerCase() || 'g'
  return ingredientUnits.some(option => option.value === normalized) ? normalized : 'đơn vị'
}
