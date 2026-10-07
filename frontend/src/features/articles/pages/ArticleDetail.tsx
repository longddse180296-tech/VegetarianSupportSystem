import React, { useEffect, useState } from 'react'
import {
  addArticleComment,
  getArticleById,
  toggleArticleLike,
  toggleArticleSave,
} from '../api/articles.api'
import type { ArticleDetailDto } from '../types/article.types'
import { ArticleDetailSkeleton } from '../components/ArticleSkeleton'

interface ArticleDetailProps {
  articleId: string
  onBackToList: () => void
  onSelectRelatedArticle: (id: string) => void
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({
  articleId,
  onBackToList,
  onSelectRelatedArticle,
}) => {
  const [article, setArticle] = useState<ArticleDetailDto | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Interactive local states
  const [isLiked, setIsLiked] = useState<boolean>(false)
  const [likesCount, setLikesCount] = useState<number>(0)
  const [isSaved, setIsSaved] = useState<boolean>(false)
  const [commentText, setCommentText] = useState<string>('')
  const [submittingComment, setSubmittingComment] = useState<boolean>(false)
  const [commentSuccess, setCommentSuccess] = useState<boolean>(false)

  useEffect(() => {
    let isMounted = true
    const fetchDetail = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getArticleById(articleId)
        if (isMounted) {
          setArticle(data)
          setLikesCount(data.likesCount || 0)
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Không tìm thấy bài viết.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchDetail()
    // Scroll to top on id change
    window.scrollTo({ top: 0, behavior: 'smooth' })

    return () => {
      isMounted = false
    }
  }, [articleId])

  const handleLikeToggle = async () => {
    if (!article) return
    const nextState = !isLiked
    setIsLiked(nextState)
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)))
    try {
      await toggleArticleLike(article.id)
    } catch {
      // Revert if API fails
      setIsLiked(!nextState)
      setLikesCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)))
    }
  }

  const handleSaveToggle = async () => {
    if (!article) return
    const nextState = !isSaved
    setIsSaved(nextState)
    try {
      await toggleArticleSave(article.id)
    } catch {
      setIsSaved(!nextState)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!article || !commentText.trim()) return

    try {
      setSubmittingComment(true)
      await addArticleComment(article.id, commentText)

      // Optimistically insert comment
      const newComment = {
        id: `c-new-${Date.now()}`,
        articleId: article.id,
        authorName: 'Bạn',
        authorAvatar:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        badge: 'Bạn đọc',
        createdAt: 'Vừa xong',
        content: commentText.trim(),
        likesCount: 0,
      }

      setArticle((prev) =>
        prev
          ? {
              ...prev,
              comments: [newComment, ...prev.comments],
            }
          : null
      )

      setCommentText('')
      setCommentSuccess(true)
      setTimeout(() => setCommentSuccess(false), 3000)
    } catch {
      // Handled
    } finally {
      setSubmittingComment(false)
    }
  }

  if (loading) {
    return <ArticleDetailSkeleton />
  }

  if (error || !article) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-2xl mx-auto mb-4">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy bài viết</h2>
        <p className="text-sm text-gray-600 mb-6">{error || 'Bài viết không tồn tại hoặc đã bị gỡ.'}</p>
        <button
          onClick={onBackToList}
          className="px-6 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-semibold hover:bg-emerald-800 transition-colors"
        >
          Quay lại danh sách bài viết
        </button>
      </div>
    )
  }

  return (
    <article className="min-h-screen bg-white pb-20">
      {/* Header Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6 truncate">
          <button
            type="button"
            onClick={onBackToList}
            className="hover:text-emerald-700 transition-colors shrink-0"
          >
            Trang chủ
          </button>
          <span className="shrink-0">/</span>
          <button
            type="button"
            onClick={onBackToList}
            className="hover:text-emerald-700 transition-colors shrink-0"
          >
            Bài viết
          </button>
          <span className="shrink-0">/</span>
          <span className="text-emerald-700 font-semibold truncate">{article.title}</span>
        </nav>

        {/* Category Tag */}
        <div className="mb-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
            {article.categoryLabel}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-snug mb-4">
          {article.title}
        </h1>

        {/* Excerpt */}
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-6 font-normal">
          {article.excerpt}
        </p>

        {/* Author & Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-gray-100 mb-8">
          <div className="flex items-center gap-3">
            <img
              src={article.author.avatar}
              alt={article.author.name}
              className="w-11 h-11 rounded-full object-cover border border-emerald-100"
            />
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold text-gray-900">
                {article.author.name}
              </span>
              <span className="text-xs text-gray-500">
                {article.author.roleTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>📅 {article.publishedAt}</span>
            <span>•</span>
            <span>⏱️ {article.readTimeMinutes} phút đọc</span>
            {article.viewsCount && (
              <>
                <span>•</span>
                <span>👁️ {article.viewsCount.toLocaleString()} lượt xem</span>
              </>
            )}
          </div>
        </div>

        {/* Hero Image */}
        <div className="mb-8">
          <div className="aspect-[16/9] w-full rounded-3xl overflow-hidden bg-gray-100 shadow-sm">
            <img
              src={article.thumbnailUrl}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
          {article.captionHeroImage && (
            <p className="mt-2 text-center text-xs text-gray-500 italic">
              {article.captionHeroImage}
            </p>
          )}
        </div>

        {/* Article Body Content */}
        <div className="prose prose-emerald max-w-none mb-12">
          {article.sections.map((sec, index) => (
            <div key={index} className="mb-6">
              {sec.number ? (
                <div className="flex items-start gap-3 mb-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                    {sec.number}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    {sec.title}
                  </h2>
                </div>
              ) : null}
              <p
                className={`text-sm sm:text-base text-gray-700 leading-relaxed ${
                  sec.number ? 'pl-9' : ''
                }`}
              >
                {sec.content}
              </p>
            </div>
          ))}

          {/* Inspirational Quote Box */}
          {article.quoteBox && (
            <div className="my-8 p-6 sm:p-8 bg-emerald-50/70 border-l-4 border-emerald-600 rounded-r-2xl">
              <p className="text-sm sm:text-base font-medium text-emerald-950 italic leading-relaxed mb-3">
                {article.quoteBox.quote}
              </p>
              {article.quoteBox.author && (
                <p className="text-xs font-bold text-emerald-800">
                  — {article.quoteBox.author}
                </p>
              )}
            </div>
          )}

          {/* Expert Advice Highlight Box */}
          {article.expertAdvice && (
            <div className="my-8 p-6 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-2">
                <span>💡</span>
                <span>{article.expertAdvice.title}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                {article.expertAdvice.content}
              </p>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-gray-100 mb-8">
          <span className="text-xs font-semibold text-gray-500 mr-2">Từ khóa:</span>
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-full cursor-pointer transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Interaction Action Bar */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-10">
          <span className="text-xs font-medium text-gray-600">Đánh giá bài viết này:</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLikeToggle}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                isLiked
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span>👍 Hữu ích</span>
              <span className="opacity-80">({likesCount})</span>
            </button>

            <button
              type="button"
              onClick={handleSaveToggle}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                isSaved
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span>🔖 {isSaved ? 'Đã lưu' : 'Lưu bài viết'}</span>
            </button>
          </div>
        </div>

        {/* Author Bio Box */}
        <div className="p-6 bg-gradient-to-r from-emerald-50/50 to-teal-50/40 rounded-3xl border border-emerald-100/80 mb-12 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <img
            src={article.author.avatar}
            alt={article.author.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
          />
          <div className="flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <h3 className="text-sm font-bold text-gray-900">{article.author.name}</h3>
              {article.author.isExpert && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Chuyên gia
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">
              {article.author.bio ||
                'Chuyên gia nghiên cứu và phát triển kiến thức lối sống thuần chay khoa học, đồng hành cùng bạn trên con đường sống xanh an lành.'}
            </p>
            <button
              type="button"
              onClick={onBackToList}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
            >
              Xem thêm bài viết của tác giả →
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <section className="mb-14">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-base font-bold text-gray-900">
              Bình luận ({article.comments.length})
            </h3>
          </div>

          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="mb-8">
            <div className="border border-gray-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
              <textarea
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Chia sẻ suy nghĩ hoặc đặt câu hỏi cho tác giả..."
                className="w-full p-4 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none resize-none"
              />
              <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between border-t border-gray-100">
                <span className="text-[11px] text-gray-500">
                  Vui lòng giữ văn minh và tôn trọng cộng đồng.
                </span>
                <button
                  type="submit"
                  disabled={submittingComment || !commentText.trim()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  {submittingComment ? 'Đang gửi...' : 'Gửi bình luận'}
                </button>
              </div>
            </div>
            {commentSuccess && (
              <p className="mt-2 text-xs font-medium text-emerald-700">
                ✓ Bình luận của bạn đã được đăng thành công!
              </p>
            )}
          </form>

          {/* Comment List */}
          <div className="space-y-4">
            {article.comments.map((comment) => (
              <div
                key={comment.id}
                className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 flex gap-3"
              >
                <img
                  src={comment.authorAvatar}
                  alt={comment.authorName}
                  className="w-9 h-9 rounded-full object-cover shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-900">
                      {comment.authorName}
                    </span>
                    {comment.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">
                        {comment.badge}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400 ml-auto">
                      {comment.createdAt}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed mb-2">
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-4 text-[11px] text-gray-500">
                    <button
                      type="button"
                      className="hover:text-emerald-700 flex items-center gap-1 font-medium"
                    >
                      <span>👍 Thích</span>
                      <span>({comment.likesCount})</span>
                    </button>
                    <button
                      type="button"
                      className="hover:text-emerald-700 font-medium"
                    >
                      Trả lời
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Related Articles Section */}
        {article.relatedArticles && article.relatedArticles.length > 0 && (
          <section className="pt-8 border-t border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-gray-900">
                Bài viết bạn có thể quan tâm
              </h3>
              <button
                type="button"
                onClick={onBackToList}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Xem tất cả →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {article.relatedArticles.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectRelatedArticle(rel.id)}
                  className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer"
                >
                  <div className="aspect-[16/10] w-full overflow-hidden bg-gray-100">
                    <img
                      src={rel.thumbnailUrl}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mb-1">
                      <span>{rel.categoryLabel}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500 font-normal">{rel.readTimeMinutes} phút đọc</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-emerald-700 line-clamp-2 mb-2 leading-snug">
                      {rel.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mb-3 flex-1 leading-relaxed">
                      {rel.excerpt}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      Đọc tiếp →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}
