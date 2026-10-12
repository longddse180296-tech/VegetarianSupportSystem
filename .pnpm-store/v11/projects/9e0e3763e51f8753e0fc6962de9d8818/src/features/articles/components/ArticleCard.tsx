import React from 'react'
import type { ArticleSummary } from '../types/article.types'

interface ArticleCardProps {
  article: ArticleSummary
  onSelect: (articleId: string) => void
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onSelect }) => {
  return (
    <article
      onClick={() => onSelect(article.id)}
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
        <img
          src={article.thumbnailUrl}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
            {article.categoryLabel}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <span>📅 {article.publishedAt}</span>
          <span>•</span>
          <span>⏱️ {article.readTimeMinutes} phút</span>
        </div>

        <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2 mb-2 leading-snug">
          {article.title}
        </h3>

        <p className="text-xs text-gray-600 line-clamp-2 mb-4 leading-relaxed flex-1">
          {article.excerpt}
        </p>

        {/* Footer Meta */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
          <span className="text-gray-600 font-medium truncate max-w-[140px]">
            {article.author.name}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 group-hover:text-emerald-700">
            Đọc thêm
            <svg
              className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </span>
        </div>
      </div>
    </article>
  )
}
