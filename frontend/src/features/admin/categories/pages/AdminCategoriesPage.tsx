import React, { useEffect, useState } from 'react'
import {
  Sprout,
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Power,
  UtensilsCrossed,
  Leaf,
  Layers,
  Pencil,
  AlertTriangle,
} from 'lucide-react'
import { AdminLayout } from '../../../../app/layouts/AdminLayout'
import { SharedDataTable, type ColumnDef } from '../../../../shared/components/SharedDataTable'
import { CategoryModal } from '../components/CategoryModal'
import { Modal } from '../../../../shared/components/Modal'
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

export const AdminCategoriesPage: React.FC<AdminCategoriesPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<AdminCategoryStats | null>(null)
  const [categories, setCategories] = useState<AdminCategoryItem[]>([])
  const [total, setTotal] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Filters: 4 tabs supporting master data
  const [activeTab, setActiveTab] = useState<'all' | 'food_type' | 'recipe' | 'ingredient'>('all')
  const [keyword, setKeyword] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'name'>('newest')

  // UI state
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<AdminCategoryItem | null>(null)

  // Delete Confirmation Modal State (replaces window.confirm per directive)
  const [deleteTarget, setDeleteTarget] = useState<AdminCategoryItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleCreateOrUpdate = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        await updateAdminCategory(editingCategory.id, data)
        setActionSuccessMsg(`Đã cập nhật danh mục "${data.name}" thành công!`)
      } else {
        await createAdminCategory(data)
        setActionSuccessMsg(`Đã tạo danh mục "${data.name}" thành công!`)
      }
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Thao tác không thành công. Vui lòng thử lại.')
    }
  }

  const handleToggleStatus = async (item: AdminCategoryItem) => {
    try {
      const res = await toggleAdminCategoryStatus(item.id)
      setActionSuccessMsg(
        `Đã chuyển trạng thái "${item.name}" sang ${res.isActive ? 'Đang sử dụng' : 'Ngừng sử dụng'}.`
      )
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Không thể cập nhật trạng thái.')
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      await deleteAdminCategory(deleteTarget.id)
      setActionSuccessMsg(`Đã xóa vĩnh viễn danh mục "${deleteTarget.name}".`)
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setDeleteTarget(null)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Lỗi khi xóa danh mục.')
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: ColumnDef<AdminCategoryItem>[] = [
    {
      key: 'name',
      header: 'TÊN DANH MỤC',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[10px] bg-[#e8f5e9] text-[#2e7d32] flex items-center justify-center font-bold text-xs shrink-0">
            {item.classification === 'food_type' ? (
              <Sprout className="w-4 h-4" />
            ) : item.classification === 'ingredient' ? (
              <Leaf className="w-4 h-4" />
            ) : (
              <UtensilsCrossed className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="font-bold text-xs text-[#1f2937] leading-snug">{item.name}</div>
            <div className="text-[11px] text-[#6b7280] font-mono leading-none mt-0.5">
              slug: /{item.slug}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'classification',
      header: 'PHÂN LOẠI MASTER DATA',
      render: (item) => {
        const badgeMap = {
          food_type: 'bg-emerald-50 text-[#1b5e20] border-emerald-200',
          recipe: 'bg-blue-50 text-blue-700 border-blue-200',
          ingredient: 'bg-amber-50 text-amber-800 border-amber-200',
        }
        return (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeMap[item.classification]}`}
          >
            {item.classificationLabel}
          </span>
        )
      },
    },
    {
      key: 'description',
      header: 'MÔ TẢ CHI TIẾT',
      render: (item) => (
        <div className="max-w-xs text-xs text-[#6b7280] line-clamp-2 leading-relaxed">
          {item.description}
        </div>
      ),
    },
    {
      key: 'linkedCount',
      header: 'MỤC LIÊN KẾT',
      render: (item) => (
        <span className="text-xs font-semibold text-[#1f2937] tabular-nums">
          {item.linkedCountText}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'TRẠNG THÁI',
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
            item.isActive
              ? 'bg-[#e8f5e9] text-[#2e7d32] border border-emerald-300'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              item.isActive ? 'bg-[#2e7d32]' : 'bg-slate-400'
            }`}
          />
          <span>{item.statusLabel}</span>
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'THAO TÁC',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => {
              setEditingCategory(item)
              setIsModalOpen(true)
            }}
            title="Chỉnh sửa"
            className="p-1.5 rounded-[8px] text-slate-400 hover:text-[#2e7d32] hover:bg-[#e8f5e9] transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleToggleStatus(item)}
            title={item.isActive ? 'Ngừng kích hoạt' : 'Kích hoạt'}
            className="p-1.5 rounded-[8px] text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
          >
            <Power className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(item)}
            title="Xóa danh mục"
            className="p-1.5 rounded-[8px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout
      activeMenu="categories"
      pageTitle="Quản lý Danh mục Master Data"
      pageSubtitle="Phân loại chuẩn hóa toàn hệ thống: Loại món ăn (Food Types), Công thức (Recipes) và Nguyên liệu (Ingredients)."
      onNavigate={onNavigate}
    >
      <div className="space-y-6">
        {/* Action success alert */}
        {actionSuccessMsg && (
          <div className="p-4 rounded-[12px] bg-[#e8f5e9] border border-emerald-300 text-[#1b5e20] text-xs font-semibold flex items-center gap-2 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-[#2e7d32] shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Error alert */}
        {error && (
          <div className="p-4 rounded-[12px] bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2 shadow-2xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Master Data Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active */}
          <div className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280]">Đang hoạt động</span>
              <div className="w-8 h-8 rounded-[10px] bg-emerald-50 text-[#2e7d32] flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-[#1f2937] tabular-nums tracking-tight">
                {stats?.activeCount ?? 0}
              </div>
              <p className="text-[11px] text-[#2e7d32] mt-0.5 font-medium">Sẵn sàng phân loại</p>
            </div>
          </div>

          {/* Card 2: Food Types */}
          <div className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280]">Chế độ ăn chay</span>
              <div className="w-8 h-8 rounded-[10px] bg-emerald-50 text-[#2e7d32] flex items-center justify-center">
                <Sprout className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-[#1f2937] tabular-nums tracking-tight">
                {stats?.foodTypeCategoryCount ?? 0}
              </div>
              <p className="text-[11px] text-[#6b7280] mt-0.5">4 chế độ chuẩn hệ thống</p>
            </div>
          </div>

          {/* Card 3: Recipe Categories */}
          <div className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280]">Công thức nấu ăn</span>
              <div className="w-8 h-8 rounded-[10px] bg-blue-50 text-blue-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-[#1f2937] tabular-nums tracking-tight">
                {stats?.recipeCategoryCount ?? 0}
              </div>
              <p className="text-[11px] text-[#6b7280] mt-0.5">Recipes Master</p>
            </div>
          </div>

          {/* Card 4: Ingredient Categories */}
          <div className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280]">Nguyên liệu chay</span>
              <div className="w-8 h-8 rounded-[10px] bg-amber-50 text-amber-700 flex items-center justify-center">
                <Leaf className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-[#1f2937] tabular-nums tracking-tight">
                {stats?.ingredientCategoryCount ?? 0}
              </div>
              <p className="text-[11px] text-[#6b7280] mt-0.5">Ingredients Master</p>
            </div>
          </div>
        </div>

        {/* Filters & Actions Bar */}
        <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-4 shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Master Data Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('all')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                activeTab === 'all'
                  ? 'border-emerald-400 bg-[#EAF5EE] text-[#1E6531] shadow-2xs'
                  : 'border-transparent text-[#1f2937] hover:bg-[#f8faf8]'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('food_type')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                activeTab === 'food_type'
                  ? 'border-emerald-400 bg-[#EAF5EE] text-[#1E6531] shadow-2xs'
                  : 'border-transparent text-[#1f2937] hover:bg-[#f8faf8]'
              }`}
            >
              Chế độ ăn chay (4 loại)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('recipe')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                activeTab === 'recipe'
                  ? 'border-emerald-400 bg-[#EAF5EE] text-[#1E6531] shadow-2xs'
                  : 'border-transparent text-[#1f2937] hover:bg-[#f8faf8]'
              }`}
            >
              Công thức nấu ăn
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('ingredient')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                activeTab === 'ingredient'
                  ? 'border-emerald-400 bg-[#EAF5EE] text-[#1E6531] shadow-2xs'
                  : 'border-transparent text-[#1f2937] hover:bg-[#f8faf8]'
              }`}
            >
              Nguyên liệu chay
            </button>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')
                setCurrentPage(1)
              }}
              className="px-3 py-2 rounded-[10px] border border-[#e5e7eb] text-xs font-semibold text-[#1f2937] focus:outline-none"
            >
              <option value="all">Mọi trạng thái</option>
              <option value="active">Đang sử dụng</option>
              <option value="inactive">Ngừng sử dụng</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as 'newest' | 'name')
                setCurrentPage(1)
              }}
              className="px-3 py-2 rounded-[10px] border border-[#e5e7eb] text-xs font-semibold text-[#1f2937] focus:outline-none"
            >
              <option value="newest">Mới nhất</option>
              <option value="name">Theo tên A-Z</option>
            </select>

            <div className="relative min-w-52">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Tìm danh mục, slug..."
                className="w-full pl-9 pr-3 py-2 rounded-[10px] border border-[#e5e7eb] text-xs text-[#1f2937] focus:outline-none focus:border-[#2e7d32]"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingCategory(null)
                setIsModalOpen(true)
              }}
              className="h-9 px-4 rounded-[10px] bg-[#2e7d32] hover:bg-[#1b5e20] text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm danh mục</span>
            </button>
          </div>
        </div>

        {/* Shared Data Table */}
        <SharedDataTable<AdminCategoryItem>
          title="Danh sách Phân loại Master Data"
          totalCountBadge={total}
          updatedAtText="Đồng bộ thời gian thực"
          columns={columns}
          data={categories}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          pageSize={6}
          onPageChange={(p) => setCurrentPage(p)}
          emptyMessage="Không tìm thấy danh mục nào phù hợp."
        />

        {/* Category Modal (Create / Edit) */}
        <CategoryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          categoryToEdit={editingCategory}
          onSubmit={handleCreateOrUpdate}
        />

        {/* Confirmation Modal for Delete (Replaces window.confirm) */}
        <Modal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title="Xác nhận xóa danh mục"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-[12px] bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn danh mục <strong>"{deleteTarget?.name}"</strong>?
              Hành động này không thể hoàn tác và có thể ảnh hưởng đến các công thức, nguyên liệu liên kết.
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-[10px] border border-[#e5e7eb] text-xs font-semibold text-[#1f2937] hover:bg-[#f8faf8] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-[10px] bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  )
}

export default AdminCategoriesPage
