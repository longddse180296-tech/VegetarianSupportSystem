// Chức năng: thực đơn bảy ngày và danh sách đi chợ. Ghép dữ liệu, thao tác và các trạng thái tải/lỗi cho màn hình.
import React from 'react'
import { MealPlansPublic, type MealPlansPublicProps } from './MealPlansPublic'

// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (MealPlansPublicPage); thuộc thực đơn bảy ngày và danh sách đi chợ.
export const MealPlansPublicPage: React.FC<MealPlansPublicProps> = (props) => {
  // Hiển thị giao diện thực đơn bảy ngày và danh sách đi chợ từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return <MealPlansPublic {...props} />
}

export default MealPlansPublicPage
