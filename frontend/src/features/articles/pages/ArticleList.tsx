import { useState } from 'react'
import { Leaf, Plus, Search } from 'lucide-react'
import { Feedback, Pager } from '../../admin/components/ApiWorkspace'
import { useApiData } from '../../admin/hooks/useApiData'
import { primaryClass, fieldClass, formatDate } from '../../admin/utils/apiUi'
import {
  articleCategories,
  type ContentPage,
  type PublicArticleSummary,
} from '../api/articles.api'
interface Props {
  onSelectArticle: (id: string) => void
  onCreateArticle?: () => void
  onNavigateHome?: () => void
  onOpenAiChat?: () => void
}
export const ArticleList = ({ onSelectArticle, onCreateArticle }: Props) => {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const result = useApiData<ContentPage<PublicArticleSummary>>(
    `/api/articles?page=${page}&pageSize=9&search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`,
  )
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="rounded-3xl bg-[#EAF5EE] p-6 sm:p-9 flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="text-sm text-emerald-800 flex items-center gap-2">
            <Leaf size={17} />
            Kiến thức & cộng đồng
          </p>
          <h1 className="text-3xl font-extrabold text-[#184d28] mt-2">
            Bài viết về lối sống chay
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Khám phá kiến thức và trải nghiệm đã được kiểm duyệt.
          </p>
        </div>
        <button className={primaryClass} onClick={onCreateArticle}>
          <Plus className="inline w-4 h-4 mr-2" />
          Viết bài
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 flex-1">
          <Search size={18} />
          <input
            aria-label="Tìm bài viết"
            className={fieldClass}
            maxLength={120}
            placeholder="Tìm tiêu đề hoặc nội dung..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </label>
        <select
          aria-label="Danh mục bài viết"
          className="rounded-xl border p-3 text-sm"
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
        </select>
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
              className="fe1-control overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-xs hover:border-emerald-300 transition-colors"
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
                <span className="text-xs font-bold text-emerald-800">
                  {item.category}
                </span>
                <h2 className="text-lg font-bold text-slate-900">
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
