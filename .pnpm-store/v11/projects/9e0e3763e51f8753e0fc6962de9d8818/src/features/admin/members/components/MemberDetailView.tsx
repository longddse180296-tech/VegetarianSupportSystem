import React, { useState } from 'react'
import {
  ArrowLeft,
  Calendar,
  Lock,
  Unlock,
  FileText,
  Video,
  MessageSquare,
  Search,
  ThumbsUp,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Hash,
  Mail,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react'
import type { MemberDetail } from '../types'

interface MemberDetailViewProps {
  member: MemberDetail
  onBack: () => void
  onRequestLockToggle: () => void
  isLoading?: boolean
}

export const MemberDetailView: React.FC<MemberDetailViewProps> = ({
  member,
  onBack,
  onRequestLockToggle,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'articles' | 'videos' | 'comments'>('articles')
  const [articleSearch, setArticleSearch] = useState('')
  const [articlePage, setArticlePage] = useState(1)

  const isLocked = member.status === 'locked'

  const filteredArticles = member.articles.filter((art) =>
    art.title.toLowerCase().includes(articleSearch.toLowerCase()),
  )

  const pageSize = 4
  const totalArticles = filteredArticles.length
  const totalPages = Math.ceil(totalArticles / pageSize) || 1
  const displayedArticles = filteredArticles.slice(
    (articlePage - 1) * pageSize,
    articlePage * pageSize,
  )

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Breadcrumb & Back button matching Image 3 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="text-slate-500">Bảng điều khiển</span>
          <span>&gt;</span>
          <button type="button" onClick={onBack} className="hover:text-emerald-700">
            Quản lý thành viên
          </button>
          <span>&gt;</span>
          <span className="text-slate-900 font-bold">{member.fullName}</span>
        </nav>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors self-start sm:self-auto shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
          <span>Quay lại danh sách</span>
        </button>
      </div>

      {/* Member Banner Card matching Image 3 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar Initials Circle */}
          <div className="w-16 h-16 rounded-full bg-[#D1F2D9] text-[#1E6531] font-extrabold text-2xl flex items-center justify-center flex-shrink-0">
            {member.fullName
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {member.fullName}
              </h2>
              {member.tagTitle && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EAF5EE] text-[#1E6531] border border-emerald-200/60">
                  {member.tagTitle}
                </span>
              )}
              {isLocked ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FFE4E6] text-[#E11D48]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
                  <span>Đã bị khóa</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EAF5EE] text-[#1E6531]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>Đang hoạt động</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-mono">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{member.email}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Ngày tham gia: 08/09/2026</span>
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span>Mã định danh: {member.code}</span>
              </span>
            </div>

            {isLocked && member.lockReason && (
              <p className="text-xs text-rose-600 mt-1 font-medium bg-rose-50 p-2 rounded-lg border border-rose-100">
                Lý do khóa: {member.lockReason}
              </p>
            )}
          </div>
        </div>

        {/* Lock/Unlock Button matching Image 3 */}
        <button
          type="button"
          onClick={onRequestLockToggle}
          disabled={isLoading}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors focus:outline-none focus:ring-2 self-start md:self-center shadow-xs ${
            isLocked
              ? 'bg-[#EAF5EE] text-[#1E6531] border border-emerald-200 hover:bg-[#D1F2D9] focus:ring-emerald-500'
              : 'bg-[#FFE4E6] text-[#E11D48] border border-[#FECDD3] hover:bg-[#FDD2D7] focus:ring-rose-500'
          }`}
        >
          {isLocked ? (
            <>
              <Unlock className="w-4 h-4" />
              <span>Mở khóa tài khoản</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Khóa tài khoản</span>
            </>
          )}
        </button>
      </div>

      {/* 3 Activity Metrics Cards matching Image 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Articles */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              BÀI VIẾT ĐÃ XUẤT BẢN
            </span>
            <span className="text-3xl font-extrabold text-slate-900">{member.postCount}</span>
            <span className="text-xs text-[#1E6531] font-semibold flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1E6531]" /> 100% Đã được duyệt
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Videos */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              VIDEO CHIA SẺ
            </span>
            <span className="text-3xl font-extrabold text-slate-900">{member.videoCount}</span>
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Gần nhất: 3 ngày trước
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
            <Video className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Comments */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              BÌNH LUẬN CỘNG ĐỒNG
            </span>
            <span className="text-3xl font-extrabold text-slate-900">{member.commentCount}</span>
            <span className="text-xs text-[#1E6531] font-semibold flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#1E6531]" /> Tương tác tích cực
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs & Search Bar matching Image 3 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('articles')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'articles'
                ? 'bg-[#EAF5EE] text-[#1E6531] border border-emerald-200/60'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Bài viết ({member.postCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'videos'
                ? 'bg-[#EAF5EE] text-[#1E6531] border border-emerald-200/60'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Video ({member.videoCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('comments')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'comments'
                ? 'bg-[#EAF5EE] text-[#1E6531] border border-emerald-200/60'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Bình luận ({member.commentCount})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-64 relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={articleSearch}
            onChange={(e) => {
              setArticleSearch(e.target.value)
              setArticlePage(1)
            }}
            placeholder="Tìm kiếm bài viết..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Articles Table Card matching Image 3 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
          <h3 className="text-sm font-bold text-slate-900">Danh sách bài viết của thành viên</h3>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {totalArticles} bài
          </span>
        </div>

        <div className="overflow-x-auto min-h-[220px]">
          {displayedArticles.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Không có bài viết nào phù hợp.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-200/70 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-6">TIÊU ĐỀ BÀI VIẾT</th>
                  <th className="py-3.5 px-6">CHUYÊN MỤC</th>
                  <th className="py-3.5 px-6">NGÀY ĐĂNG</th>
                  <th className="py-3.5 px-4 text-center">LƯỢT VOTE</th>
                  <th className="py-3.5 px-4 text-center">BÌNH LUẬN</th>
                  <th className="py-3.5 px-6 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {displayedArticles.map((art) => (
                  <tr key={art.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-start gap-2.5">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-900 leading-snug">{art.title}</span>
                          <span className="text-[11px] text-slate-400">
                            Độ dài: {art.wordCount.toLocaleString()} từ • {art.readTimeMinutes} phút đọc
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">{art.category}</td>
                    <td className="py-3.5 px-6 text-slate-500">{art.publishedDate}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-[#1E6531] bg-[#EAF5EE] px-2 py-0.5 rounded-lg text-xs">
                        <ThumbsUp className="w-3 h-3 text-[#1E6531]" /> {art.voteCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                      {art.commentCount}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="inline-flex items-center gap-3">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 font-medium text-[#1E6531] hover:underline"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem</span>
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 font-medium text-[#E11D48] hover:underline"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination matching Image 3 */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Hiển thị {(articlePage - 1) * pageSize + 1} -{' '}
            {Math.min(articlePage * pageSize, totalArticles)} trong số {totalArticles} bài viết
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setArticlePage(Math.max(1, articlePage - 1))}
              disabled={articlePage <= 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setArticlePage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                  articlePage === p
                    ? 'bg-[#1E6531] text-white'
                    : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setArticlePage(Math.min(totalPages, articlePage + 1))}
              disabled={articlePage >= totalPages}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default MemberDetailView
