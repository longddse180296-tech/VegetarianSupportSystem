import React, { useEffect, useState } from 'react'
import {
  Folder,
  Sprout,
  BookOpen,
  Download,
  Plus,
  Search,
  CheckCircle2,
  MoreVertical,
  Trash2,
  Power,
  UtensilsCrossed,
  Leaf,
  Layers,
  Sparkles,
} from 'lucide-react'
import { AdminLayout } from '../../../../app/layouts/AdminLayout'
import { SharedDataTable, type ColumnDef } from '../../../../shared/components/SharedDataTable'
import { CategoryModal } from '../components/CategoryModal'
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  getAdminCategoryStats,
  toggleAdminCategoryStatus,
  updateAdminCategory,
} from '../api/adminCategoriesApi'
import type {
  AdminCategoryItem,
  AdminCategoryStats,
  CategoryFormData,
} from '../types/adminCategories.types'

interface AdminCategoriesPageProps {
  onNavigate?: (path: string) => void
}

export const AdminCategoriesPage: React.FC<AdminCategoriesPageProps> = ({
  onNavigate,
}) => {
  const [stats, setStats] = useState<AdminCategoryStats | null>(null)
  const [categories, setCategories] = useState<AdminCategoryItem[]>([])
  const [total, setTotal] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Filters
  const [activeTab, setActiveTab] = useState<'all' | 'ingredient' | 'recipe'>('all')
  const [keyword, setKeyword] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'name'>('newest')

  // UI state
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Action popover state: stores category id currently having open menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<AdminCategoryItem | null>(null)

  // Fetch data
  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [statsRes, listRes] = await Promise.all([
          getAdminCategoryStats(),
          getAdminCategories({
            classification: activeTab,
            keyword,
            status: statusFilter,
            sortBy,
            page: currentPage,
            pageSize: 6,
          }),
        ])
        if (isMounted) {
          setStats(statsRes)
          setCategories(listRes.items)
          setTotal(listRes.total)
          setTotalPages(listRes.totalPages)
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Lỗi khi tải danh sách danh mục')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void fetchData()
    return () => {
      isMounted = false
    }
  }, [activeTab, keyword, statusFilter, sortBy, currentPage, refreshTrigger])

  // Close open popovers when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuId(null)
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  const handleOpenCreateModal = () => {
    setEditingCategory(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (cat: AdminCategoryItem) => {
    setEditingCategory(cat)
    setIsModalOpen(true)
    setOpenMenuId(null)
  }

  const handleModalSubmit = async (data: CategoryFormData) => {
    if (editingCategory) {
      await updateAdminCategory(editingCategory.id, data)
      setActionSuccessMsg(`Đã cập nhật danh mục "${data.name}" thành công!`)
    } else {
      await createAdminCategory(data)
      setActionSuccessMsg(`Đã tạo danh mục mới "${data.name}" thành công!`)
    }
    setTimeout(() => setActionSuccessMsg(null), 3000)
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleToggleStatus = async (id: string, name: string, currentStatus: boolean) => {
    try {
      setOpenMenuId(null)
      await toggleAdminCategoryStatus(id)
      setActionSuccessMsg(
        `Đã ${currentStatus ? 'ngừng sử dụng' : 'kích hoạt lại'} danh mục "${name}".`
      )
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Không thể thay đổi trạng thái danh mục.')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}"? Thao tác này không thể hoàn tác.`)) {
      return
    }
    try {
      setOpenMenuId(null)
      await deleteAdminCategory(id)
      setActionSuccessMsg(`Đã xóa danh mục "${name}" thành công.`)
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Không thể xóa danh mục.')
    }
  }

  const handleExportData = () => {
    const jsonStr = JSON.stringify(categories, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `categories_export_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getCategoryIcon = (iconName: string, classification: string) => {
    if (classification === 'ingredient') {
      if (iconName === 'leaf') return <Leaf className="w-5 h-5 text-emerald-600" />
      if (iconName === 'grid') return <Layers className="w-5 h-5 text-teal-600" />
      return <Sprout className="w-5 h-5 text-emerald-600" />
    }
    return <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
  }

  const columns: ColumnDef<AdminCategoryItem>[] = [
    {
      key: 'name',
      header: 'TÊN DANH MỤC',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-center shrink-0">
            {getCategoryIcon(item.iconName, item.classification)}
          </div>
          <div>
            <span className="font-bold text-gray-900 block text-xs leading-snug">
              {item.name}
            </span>
            <span className="text-[11px] text-gray-400 font-mono block mt-0.5">
              Slug: {item.slug}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'classification',
      header: 'PHÂN LOẠI',
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${
            item.classification === 'ingredient'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
          }`}
        >
          {item.classification === 'ingredient' ? (
            <Sprout className="w-3.5 h-3.5" />
          ) : (
            <UtensilsCrossed className="w-3.5 h-3.5" />
          )}
          <span>{item.classificationLabel}</span>
        </span>
      ),
    },
    {
      key: 'description',
      header: 'MÔ TẢ',
      render: (item) => (
        <p className="text-xs text-gray-600 max-w-xs line-clamp-2 leading-relaxed">
          {item.description}
        </p>
      ),
    },
    {
      key: 'linkedCountText',
      header: 'SỐ NỘI DUNG LIÊN KẾT',
      render: (item) => (
        <span className="font-semibold text-gray-800 text-xs whitespace-nowrap">
          {item.linkedCountText}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'NGÀY TẠO',
      render: (item) => (
        <span className="text-gray-500 text-xs whitespace-nowrap">
          {item.createdAt}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'TRẠNG THÁI',
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${
            item.isActive
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              item.isActive ? 'bg-emerald-500' : 'bg-slate-400'
            }`}
          />
          {item.statusLabel}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'THAO TÁC',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-2 relative">
          <button
            type="button"
            onClick={() => handleOpenEditModal(item)}
            className="text-xs font-bold text-gray-700 hover:text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            Chỉnh sửa
          </button>

          {/* Three dots dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenuId(openMenuId === item.id ? null : item.id)
              }}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Thao tác khác"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {openMenuId === item.id && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-30 animate-in fade-in zoom-in-95 text-xs font-semibold"
              >
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(item)}
                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sửa thông tin</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleToggleStatus(item.id, item.name, item.isActive)}
                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                >
                  <Power className="w-3.5 h-3.5 text-amber-600" />
                  <span>{item.isActive ? 'Ngừng kích hoạt' : 'Kích hoạt lại'}</span>
                </button>
                <div className="h-px bg-gray-100 my-1" />
                <button
                  type="button"
                  onClick={() => void handleDelete(item.id, item.name)}
                  className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa danh mục</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout
      activeMenu="categories"
      pageTitle="Quản lý Danh mục"
      pageSubtitle="Tạo và quản lý danh mục dùng để phân loại loại thực phẩm và công thức."
      onNavigate={onNavigate}
    >
      <div className="space-y-6 pb-12">
        {/* Top Header Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 -mt-2">
          <div className="text-xs text-gray-500 font-medium">
            Hệ thống phân cấp cơ sở dữ liệu dinh dưỡng chay
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportData}
              className="px-4 py-2 rounded-2xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>Xuất dữ liệu</span>
            </button>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-2xl bg-[#1E6531] hover:bg-[#164e25] text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo danh mục</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {actionSuccessMsg && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-medium flex items-center justify-between animate-in fade-in">
            <span>✓ {actionSuccessMsg}</span>
            <button
              type="button"
              onClick={() => setActionSuccessMsg(null)}
              className="text-emerald-600 hover:text-emerald-900 font-bold ml-2 text-xs"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Stats Row (3 Cards matching Figma Image 2) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Tổng danh mục đang kích hoạt */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Folder className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EAF5EE] text-[#1E6531] border border-emerald-200/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Hoạt động ổn định</span>
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                {stats?.activeCount ?? 12}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Danh mục đang kích hoạt trên hệ thống
              </p>
            </div>
          </div>

          {/* Card 2: Phân loại nguyên liệu & dinh dưỡng */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center">
                <Sprout className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#EAF5EE] text-[#1E6531]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>50% hệ thống</span>
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                {stats?.ingredientCategoryCount ?? 6}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Phân loại nguyên liệu & dinh dưỡng
              </p>
            </div>
          </div>

          {/* Card 3: Phân loại bữa ăn & món nấu */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#EAF5EE] text-[#1E6531]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>50% hệ thống</span>
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                {stats?.recipeCategoryCount ?? 6}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Phân loại bữa ăn & món nấu
              </p>
            </div>
          </div>
        </div>

        {/* Search, Tabs and Dropdowns Filter Bar */}
        <div className="bg-white rounded-3xl p-3 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Left: Search input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm danh mục..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-11 pr-4 py-2 text-xs bg-transparent rounded-2xl focus:outline-none placeholder:text-gray-400 text-gray-900"
            />
          </div>

          {/* Right: Tabs & Selects */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Classification Tabs matching Figma */}
            <div className="flex items-center p-1 bg-slate-50 rounded-2xl border border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('all')
                  setCurrentPage(1)
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'all'
                    ? 'bg-[#1E6531] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tất cả ({total || 12})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('ingredient')
                  setCurrentPage(1)
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'ingredient'
                    ? 'bg-[#1E6531] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Loại thực phẩm (6)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('recipe')
                  setCurrentPage(1)
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'recipe'
                    ? 'bg-[#1E6531] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Công thức (6)
              </button>
            </div>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')
                setCurrentPage(1)
              }}
              className="px-3.5 py-2 bg-white rounded-2xl border border-slate-200 text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang sử dụng</option>
              <option value="inactive">Ngừng sử dụng</option>
            </select>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as 'newest' | 'name')
                setCurrentPage(1)
              }}
              className="px-3.5 py-2 bg-white rounded-2xl border border-slate-200 text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="newest">Mới nhất</option>
              <option value="name">Theo tên A - Z</option>
            </select>
          </div>
        </div>

        {/* Data Table Container matching Figma */}
        <SharedDataTable<AdminCategoryItem>
          title="Danh sách danh mục"
          totalCountBadge={`${total} danh mục`}
          updatedAtText="Cập nhật lúc 15:30 hôm nay"
          columns={columns}
          data={categories}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          error={error}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          pageSize={6}
          onPageChange={setCurrentPage}
          emptyMessage="Không tìm thấy danh mục nào phù hợp với bộ lọc."
        />
      </div>

      {/* Category Create/Edit Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categoryToEdit={editingCategory}
        onSubmit={handleModalSubmit}
      />
    </AdminLayout>
  )
}
export default AdminCategoriesPage
