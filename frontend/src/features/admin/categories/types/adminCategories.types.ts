// Chức năng: danh mục nội dung. Khai báo cấu trúc dữ liệu để các màn hình và hàm xử lý dùng thống nhất.
// Cấu trúc AdminCategoryItem quy định dữ liệu trao đổi trong danh mục nội dung.
export interface AdminCategoryItem {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

// Cấu trúc CategoryFormData quy định dữ liệu trao đổi trong danh mục nội dung.
export interface CategoryFormData { name: string; description: string }
