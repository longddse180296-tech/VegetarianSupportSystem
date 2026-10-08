import React, { useState } from 'react'
import {
  Search,
  Users,
  CheckCircle2,
  Lock,
  MoreVertical,
  Eye,
  Unlock,
} from 'lucide-react'
import type { Member } from '../api/membersApi'

export interface LiveMemberFilter {
  search: string
  status: 'all' | 'active' | 'locked'
  page: number
}

interface MemberTableProps {
  members: Member[]
  totalCount: number
  activeCount: number
  lockedCount: number
  currentPage: number
  pageSize: number
  currentAdminId: string
  filter: LiveMemberFilter
  onFilterChange: (newFilter: LiveMemberFilter) => void
  onSelectMember: (memberId: string) => void
  onRequestLockToggle: (member: Member) => void
  isLoading?: boolean
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))

const getAvatarStyle = (index: number) => {
  const styles = [
    { bg: 'bg-[#D1F2D9]', text: 'text-[#1E6531]' }, // Green (MA)
    { bg: 'bg-[#CCFBF1]', text: 'text-[#0F766E]' }, // Teal (TH)
    { bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]' }, // Amber (GH)
    { bg: 'bg-[#F1F5F9]', text: 'text-[#475569]' }, // Gray (HL)
    { bg: 'bg-[#F3E8FF]', text: 'text-[#7E22CE]' }, // Purple (QB)
    { bg: 'bg-[#FCE7F3]', text: 'text-[#BE185D]' }, // Pink (PT)
    { bg: 'bg-[#F1F5F9]', text: 'text-[#475569]' }, // Gray (AT)
  ]
  return styles[index % styles.length]
}

export const MemberTable: React.FC<MemberTableProps> = ({
  members,
  totalCount,
  activeCount,
  lockedCount,
  currentPage,
  pageSize,
  currentAdminId,
  filter,
  onFilterChange,
  onSelectMember,
  onRequestLockToggle,
  isLoading = false,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState(filter.search)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onFilterChange({ ...filter, search: searchInput, page: 1 })
  }

  const handleTabChange = (status: 'all' | 'active' | 'locked') => {
    onFilterChange({ ...filter, status, page: 1 })
  }

  const handlePageChange = (newPage: number) => {
    onFilterChange({ ...filter, page: newPage })
  }

  const totalPages = Math.ceil(totalCount / pageSize) || 1
  const firstVisiblePage = Math.max(1, Math.min(currentPage - 1, totalPages - 2))
  const visiblePages = Array.from({ length: Math.min(3, totalPages) }, (_, index) => firstVisiblePage + index)
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalCount)

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 3 Top Stat Cards matching Image 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Total */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">
              Tổng thành viên đã đăng ký
            </span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block">
              {activeCount + lockedCount}
            </span>
          </div>
        </div>

        {/* Card 2: Active */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">
              Tài khoản đang hoạt động
            </span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block">
              {activeCount}
            </span>
          </div>
        </div>

        {/* Card 3: Locked */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Tài khoản tạm khóa</span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block">
              {lockedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar matching Image 2 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="w-full lg:w-96 relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm theo tên hoặc email..."
            className="w-full pl-10 pr-14 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button type="submit" className="absolute right-3 text-xs font-semibold text-[#1E6531]">Tìm</button>
        </form>

        {/* Status filters */}
        <div className="w-full lg:w-auto flex flex-wrap items-center justify-between lg:justify-end gap-3 text-xs">
          {/* Status Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleTabChange('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                (filter.status || 'all') === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Tất cả ({activeCount + lockedCount})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('active')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                filter.status === 'active'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Hoạt động ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('locked')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                filter.status === 'locked'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Bị khóa ({lockedCount})
            </button>
          </div>

        </div>
      </div>

      {/* Main Table Card matching Image 2 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        {/* Table Top Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-slate-900">Danh sách thành viên</h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EAF5EE] text-[#1E6531]">
              {totalCount} thành viên
            </span>
          </div>
          <span className="text-xs text-slate-400">Mới nhất trước</span>
        </div>

        {/* Responsive Table Container */}
        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="p-6 flex flex-col gap-4 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl w-full" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="py-16 px-6 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">Không tìm thấy thành viên nào</p>
              <p className="text-xs text-slate-500">
                Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-200/70 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-6">THÀNH VIÊN</th>
                  <th className="py-3.5 px-6">EMAIL</th>
                  <th className="py-3.5 px-6">NGÀY ĐĂNG KÝ</th>
                  <th className="py-3.5 px-4 text-center">VAI TRÒ</th>
                  <th className="py-3.5 px-6">TRẠNG THÁI</th>
                  <th className="py-3.5 px-6 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {members.map((m, idx) => {
                  const initials = m.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                  const isLocked = m.isLocked
                  const avatarColor = getAvatarStyle(idx)

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors relative">
                      {/* Name & Initials */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full ${avatarColor.bg} ${avatarColor.text} font-bold text-xs flex items-center justify-center flex-shrink-0`}
                          >
                            {initials}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => onSelectMember(m.id)}
                              className="font-bold text-slate-900 hover:text-[#1E6531] text-left transition-colors"
                            >
                              {m.fullName}
                            </button>
                            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{m.role}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-6 font-mono text-slate-600">{m.email}</td>

                      {/* Registered Date */}
                      <td className="py-3.5 px-6 text-slate-500">{formatDate(m.joinedAtUtc)}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">{m.role}</td>

                      {/* Status */}
                      <td className="py-3.5 px-6">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FFE4E6] text-[#E11D48]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
                            <span>Bị khóa</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EAF5EE] text-[#1E6531]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>Hoạt động</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right relative">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectMember(m.id)}
                            className="font-medium text-[#1E6531] hover:underline"
                          >
                            Xem chi tiết
                          </button>

                          {/* 3-dots dropdown */}
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMenuId(activeMenuId === m.id ? null : m.id)
                              }
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuId === m.id && (
                              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-30 flex flex-col text-left">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null)
                                    onSelectMember(m.id)
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Xem chi tiết</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={!isLocked && m.id === currentAdminId}
                                  onClick={() => {
                                    setActiveMenuId(null)
                                    onRequestLockToggle(m)
                                  }}
                                  className={`w-full flex items-center gap-2 px-3.5 py-2 transition-colors border-t border-slate-100 disabled:opacity-40 disabled:cursor-not-allowed ${
                                    isLocked
                                      ? 'text-[#1E6531] hover:bg-emerald-50'
                                      : 'text-rose-600 hover:bg-rose-50'
                                  }`}
                                >
                                  {isLocked ? (
                                    <>
                                      <Unlock className="w-3.5 h-3.5" />
                                      <span>Mở khóa tài khoản</span>
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="w-3.5 h-3.5" />
                                      <span>Khóa tài khoản</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Bottom Pagination matching Image 2 */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>
            Hiển thị {startItem} - {endItem} trong số {totalCount} thành viên
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-600"
            >
              Trước
            </button>

            {visiblePages.map((pageNum) => {
              const isActive = currentPage === pageNum
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 rounded-lg font-bold transition-colors ${
                    isActive
                      ? 'bg-[#1E6531] text-white'
                      : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}

            {totalPages > 3 && !visiblePages.includes(totalPages) && (
              <>
                <span className="px-1 text-slate-400">...</span>
                <button
                  type="button"
                  onClick={() => handlePageChange(totalPages)}
                  className={`w-8 h-8 rounded-lg font-bold transition-colors ${
                    currentPage === totalPages
                      ? 'bg-[#1E6531] text-white'
                      : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-600"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default MemberTable
