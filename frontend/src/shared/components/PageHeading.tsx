// Chức năng: giao diện và thành phần dùng chung. Hiển thị một phần giao diện và phát sự kiện cho màn hình cha xử lý.
import type { ReactNode } from 'react'

// Cấu trúc BreadcrumbItem quy định dữ liệu trao đổi trong giao diện và thành phần dùng chung.
export interface BreadcrumbItem {
  label: string
  onClick?: () => void
}

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (Breadcrumb); thuộc giao diện và thành phần dùng chung.
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  // Hiển thị thành phần giao diện dùng chung từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <nav aria-label="Đường dẫn" className="ui-breadcrumb">
      <ol>
        {items.map((item, index) => (
          <li key={`${index}-${item.label}`}>
            {index > 0 && <span aria-hidden="true" className="ui-breadcrumb-separator">›</span>}
            {item.onClick && index < items.length - 1 ? (
              <button type="button" onClick={item.onClick}>{item.label}</button>
            ) : <span aria-current={index === items.length - 1 ? 'page' : undefined}>{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Thành phần Badge nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc giao diện và thành phần dùng chung.
export function Badge({ children, icon, tone = 'green' }: {
  children: ReactNode
  icon?: ReactNode
  tone?: 'green' | 'neutral' | 'amber'
}) {
  // Hiển thị thành phần giao diện dùng chung từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return <span className={`ui-badge ui-badge-${tone}`}>{icon}{children}</span>
}

// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (PageHeading); thuộc giao diện và thành phần dùng chung.
export function PageHeading({ title, description, breadcrumbs, eyebrow, actions }: {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  eyebrow?: ReactNode
  actions?: ReactNode
}) {
  // Hiển thị thành phần giao diện dùng chung từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <header className="ui-page-heading">
      {breadcrumbs && <Breadcrumb items={breadcrumbs} />}
      <div className="ui-page-heading-row">
        <div className="min-w-0">
          {eyebrow && <div className="ui-page-eyebrow">{eyebrow}</div>}
          <h1 className="ui-page-title">{title}</h1>
          {description && <p className="ui-page-description">{description}</p>}
        </div>
        {actions && <div className="ui-page-actions">{actions}</div>}
      </div>
    </header>
  )
}
