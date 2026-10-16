import { PageHeading, Badge, Button, Input, Select } from '../../../shared/components'
import { useState } from 'react'
import { Leaf, Plus, Search } from 'lucide-react'
import { Feedback, Pager } from '../../admin/components/ApiWorkspace'
import { useApiData } from '../../admin/hooks/useApiData'
import { primaryClass, formatDate } from '../../admin/utils/apiUi'
import {
  articleCategories,
  type ContentPage,
  type PublicArticleSummary,
} from '../api/articles.api'
import { BACKEND_DIETARY_TYPE_LABELS, BACKEND_DIETARY_TYPES, type BackendDietaryType } from '../../../shared/constants'
interface Props {
  onSelectArticle: (id: string) => void
  onCreateArticle?: () => void
  onNavigateHome?: () => void
  onOpenAiChat?: () => void
}
export const ArticleList = ({ onSelectArticle, onCreateArticle, onNavigateHome }: Props) => {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [dietaryType, setDietaryType] = useState<BackendDietaryType | ''>('')
  const [page, setPage] = useState(1)
  const result = useApiData<ContentPage<PublicArticleSummary>>(
    `/api/articles?page=${page}&pageSize=9&search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&dietaryType=${encodeURIComponent(dietaryType)}`,
  )
  return (
    <div className="ui-page-container py-8 space-y-6">
      <PageHeading
        title="Bài viết về lối sống chay"
        description="Khám phá kiến thức và trải nghiệm đã được kiểm duyệt."
        breadcrumbs={[{ label: 'Trang chủ', onClick: onNavigateHome }, { label: 'Bài viết' }]}
        eyebrow={<Badge icon={<Leaf />}>Kiến thức &amp; cộng đồng</Badge>}
        actions={<Button leftIcon={<Plus size={16} />} onClick={onCreateArticle}>Viết bài</Button>}
      />
      <div className="flex flex-wrap gap-3">
        <div className="min-w-[220px] flex-1">
          <Input
            aria-label="Tìm bài viết"
            leftIcon={<Search size={16} />}
            maxLength={120}
            placeholder="Tìm tiêu đề hoặc nội dung..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <Select
          aria-label="Danh mục bài viết"
          className="min-w-[180px]"
          fullWidth={false}
          value={category}
          onChange={(e) => {
            setCategory(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Tất cả danh mục</option>
          {articleCategories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
        <Select
          aria-label="Chế độ ăn áp dụng"
          className="min-w-[180px]"
          fullWidth={false}
          value={dietaryType}
          onChange={(event) => {
            setDietaryType(event.target.value as BackendDietaryType | '')
            setPage(1)
          }}
        >
          <option value="">Tất cả chế độ ăn</option>
          {BACKEND_DIETARY_TYPES.map((type) => <option key={type} value={type}>{BACKEND_DIETARY_TYPE_LABELS[type]}</option>)}
        </Select>
      </div>
      <Feedback error={result.error} />
      {result.error && (
        <button className={primaryClass} onClick={result.reload}>
          Thử lại
        </button>
      )}
      {result.loading ? (
        <p>Đang tải bài viết...</p>
      ) : result.data?.items.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {result.data.items.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectArticle(item.id)}
              className="ui-card ui-content-card overflow-hidden text-left transition-colors"
            >
              {item.coverImageUrl ? (
                <img
                  src={item.coverImageUrl}
                  alt=""
                  className="h-44 w-full object-cover"
                />
              ) : (
                <div className="h-32 bg-emerald-50 flex items-center justify-center text-emerald-700">
                  <Leaf size={36} />
                </div>
              )}
              <div className="p-5 space-y-3">
                <span className="ui-badge ui-badge-green">
                  {item.category}
                </span>
                {!!item.dietaryTypes?.length && <div className="flex flex-wrap gap-1">{item.dietaryTypes.map((type) => <span key={type} className="ui-badge ui-badge-green">{BACKEND_DIETARY_TYPE_LABELS[type]}</span>)}</div>}
                <h2 className="ui-card-title">
                  {item.title}
                </h2>
                <p className="text-xs text-slate-500">
                  Xuất bản {formatDate(item.publishedAt)} · Phiên bản{' '}
                  {item.version}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        !result.error && (
          <p className="rounded-2xl border bg-white p-8 text-slate-500">
            Chưa có bài viết phù hợp.
          </p>
        )
      )}
      <Pager
        page={page}
        pageSize={9}
        total={result.data?.totalCount || 0}
        onChange={setPage}
      />
    </div>
  )
}
export default ArticleList
