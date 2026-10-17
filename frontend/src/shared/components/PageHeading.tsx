import type { ReactNode } from 'react'

export interface BreadcrumbItem {
  label: string
  onClick?: () => void
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
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

export function Badge({ children, icon, tone = 'green' }: {
  children: ReactNode
  icon?: ReactNode
  tone?: 'green' | 'neutral' | 'amber'
}) {
  return <span className={`ui-badge ui-badge-${tone}`}>{icon}{children}</span>
}

export function PageHeading({ title, description, breadcrumbs, eyebrow, actions }: {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  eyebrow?: ReactNode
  actions?: ReactNode
}) {
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
