import React, { useEffect, useState } from 'react'
import {
  Apple,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Pencil,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react'
import { AdminLayout } from '../../../../app/layouts/AdminLayout'
import { SharedDataTable, type ColumnDef } from '../../../../shared/components/SharedDataTable'
import { Modal } from '../../../../shared/components/Modal'
import {
  getAdminIngredients,
  getAdminIngredientStats,
  createAdminIngredient,
  updateAdminIngredient,
  deleteAdminIngredient,
} from '../api/adminIngredientsApi'
import type {
  AdminIngredientItem,
  AdminIngredientStats,
  DangerLevel,
} from '../types/adminIngredients.types'

interface AdminIngredientsPageProps {
  onNavigate?: (path: string) => void
}

export const AdminIngredientsPage: React.FC<AdminIngredientsPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<AdminIngredientStats | null>(null)
  const [ingredients, setIngredients] = useState<AdminIngredientItem[]>([])
  const [total, setTotal] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Filters
  const [dangerFilter, setDangerFilter] = useState<DangerLevel | 'all'>('all')
  const [keyword, setKeyword] = useState<string>('')

  // UI state
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Edit / Create Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AdminIngredientItem | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    category: string
    eNumber: string
    vegan: boolean
    lactoVegan: boolean
    dangerLevel: DangerLevel
    description: string
  }>({
    name: '',
    category: 'Gia vị & Nước dùng',
    eNumber: '',
    vegan: true,
    lactoVegan: true,
    dangerLevel: 'safe',
    description: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<AdminIngredientItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [statsRes, listRes] = await Promise.all([
          getAdminIngredientStats(),
          getAdminIngredients(
            {
              dangerLevel: dangerFilter,
              keyword,
            },
            currentPage,
            6
          ),
        ])
        if (isMounted) {
          setStats(statsRes)
          setIngredients(listRes.items)
          setTotal(listRes.total)
          setTotalPages(listRes.totalPages)
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Lỗi khi tải danh sách nguyên liệu')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void fetchData()
    return () => {
      isMounted = false
    }
  }, [dangerFilter, keyword, currentPage, refreshTrigger])

  const handleOpenCreateModal = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      category: 'Gia vị & Nước dùng',
      eNumber: '—',
      vegan: true,
      lactoVegan: true,
      dangerLevel: 'safe',
      description: '',
    })
    setIsFormModalOpen(true)
  }

  const handleOpenEditModal = (item: AdminIngredientItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      eNumber: item.eNumber,
      vegan: item.vegan,
      lactoVegan: item.lactoVegan,
      dangerLevel: item.dangerLevel,
      description: item.description || '',
    })
    setIsFormModalOpen(true)
  }

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    try {
      setIsSaving(true)
      if (editingItem) {
        await updateAdminIngredient(editingItem.id, formData)
        setActionSuccessMsg(`Đã cập nhật nguyên liệu "${formData.name}".`)
      } else {
        await createAdminIngredient(formData)
        setActionSuccessMsg(`Đã thêm nguyên liệu mới "${formData.name}".`)
      }
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setIsFormModalOpen(false)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Lỗi khi lưu nguyên liệu.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      await deleteAdminIngredient(deleteTarget.id)
      setActionSuccessMsg(`Đã xóa nguyên liệu "${deleteTarget.name}".`)
      setTimeout(() => setActionSuccessMsg(null), 3000)
      setDeleteTarget(null)
      setRefreshTrigger((prev) => prev + 1)
    } catch {
      setError('Lỗi khi xóa nguyên liệu.')
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: ColumnDef<AdminIngredientItem>[] = [
    {
      key: 'name',
      header: 'TÊN NGUYÊN LIỆU',
      render: (item) => (
        <div className="space-y-0.5">
          <div className="font-bold text-xs text-[#1f2937] leading-snug">{item.name}</div>
          {item.description && (
            <div className="text-[11px] text-[#6b7280] line-clamp-1">{item.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'DANH MỤC',
      render: (item) => (
        <span className="text-xs font-semibold text-[#1f2937] bg-slate-100 px-2.5 py-0.5 rounded-[6px]">
          {item.category}
        </span>
      ),
    },
    {
      key: 'eNumber',
      header: 'E-NUMBER',
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-[6px]">
          {item.eNumber}
        </span>
      ),
    },
    {
      key: 'dangerLevel',
      header: 'PHÂN LOẠI AN TOÀN',
      render: (item) => {
        const badgeMap = {
          safe: {
            bg: 'bg-[#e8f5e9]',
            color: 'text-[#1b5e20] border-emerald-300',
            label: 'Thuần chay an toàn',
            icon: ShieldCheck,
          },
          warning: {
            bg: 'bg-amber-50',
            color: 'text-amber-800 border-amber-300',
            label: 'Cảnh báo (Có bơ sữa/trứng)',
            icon: AlertTriangle,
          },
          danger: {
            bg: 'bg-rose-50',
            color: 'text-rose-800 border-rose-300',
            label: 'Không thuần chay (Động vật)',
            icon: ShieldAlert,
          },
        }[item.dangerLevel]

        const Icon = badgeMap.icon

        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeMap.bg} ${badgeMap.color}`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span>{badgeMap.label}</span>
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: 'THAO TÁC',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenEditModal(item)}
            title="Chỉnh sửa"
            className="p-1.5 rounded-[8px] text-slate-400 hover:text-[#2e7d32] hover:bg-[#e8f5e9] transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(item)}
            title="Xóa nguyên liệu"
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
      activeMenu="ingredients"
      pageTitle="Quản lý Từ điển Nguyên liệu &amp; E-Number"
      pageSubtitle="Cơ sở dữ liệu trung tâm phục vụ quét nhận diện OCR và cảnh báo thành phần động vật ẩn."
      onNavigate={onNavigate}
    >
      <div className="space-y-6">
        {/* Action success message */}
        {actionSuccessMsg && (
          <div className="p-4 rounded-[12px] bg-[#e8f5e9] border border-emerald-300 text-[#1b5e20] text-xs font-semibold flex items-center gap-2 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-[#2e7d32] shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-[12px] bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2 shadow-2xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280]">Tổng nguyên liệu</span>
              <div className="w-8 h-8 rounded-[10px] bg-slate-100 text-slate-700 flex items-center justify-center">
                <Apple className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-[#1f2937] tabular-nums tracking-tight">
                {stats?.total ?? 0}
              </div>
              <p className="text-[11px] text-[#6b7280] mt-0.5">Từ điển đã chuẩn hóa</p>
            </div>
          </div>

          <div className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280]">Thuần chay an toàn</span>
              <div className="w-8 h-8 rounded-[10px] bg-emerald-50 text-[#2e7d32] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-[#2e7d32] tabular-nums tracking-tight">
                {stats?.safe ?? 0}
              </div>
              <p className="text-[11px] text-[#2e7d32] mt-0.5">100% nguồn gốc thực vật</p>
            </div>
          </div>

          <div className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280]">Cần cảnh báo</span>
              <div className="w-8 h-8 rounded-[10px] bg-amber-50 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-700 tabular-nums tracking-tight">
                {stats?.warning ?? 0}
              </div>
              <p className="text-[11px] text-amber-700 mt-0.5">Có sữa, phô mai hoặc trứng</p>
            </div>
          </div>

          <div className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280]">Không thuần chay</span>
              <div className="w-8 h-8 rounded-[10px] bg-rose-50 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-rose-600 tabular-nums tracking-tight">
                {stats?.danger ?? 0}
              </div>
              <p className="text-[11px] text-rose-600 mt-0.5">Nguồn gốc thịt, mỡ động vật</p>
            </div>
          </div>
        </div>

        {/* Filter and Action Bar */}
        <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-4 shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => {
                setDangerFilter('all')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-[10px] text-xs font-bold transition-all cursor-pointer ${
                dangerFilter === 'all'
                  ? 'bg-[#2e7d32] text-white shadow-xs'
                  : 'text-[#1f2937] hover:bg-[#f8faf8]'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => {
                setDangerFilter('safe')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-[10px] text-xs font-bold transition-all cursor-pointer ${
                dangerFilter === 'safe'
                  ? 'bg-[#2e7d32] text-white shadow-xs'
                  : 'text-[#1f2937] hover:bg-[#f8faf8]'
              }`}
            >
              Thuần chay an toàn
            </button>
            <button
              type="button"
              onClick={() => {
                setDangerFilter('warning')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-[10px] text-xs font-bold transition-all cursor-pointer ${
                dangerFilter === 'warning'
                  ? 'bg-[#2e7d32] text-white shadow-xs'
                  : 'text-[#1f2937] hover:bg-[#f8faf8]'
              }`}
            >
              Cảnh báo bơ sữa/trứng
            </button>
            <button
              type="button"
              onClick={() => {
                setDangerFilter('danger')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-[10px] text-xs font-bold transition-all cursor-pointer ${
                dangerFilter === 'danger'
                  ? 'bg-[#2e7d32] text-white shadow-xs'
                  : 'text-[#1f2937] hover:bg-[#f8faf8]'
              }`}
            >
              Không thuần chay
            </button>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative min-w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Tìm tên, E-number, danh mục..."
                className="w-full pl-9 pr-3 py-2 rounded-[10px] border border-[#e5e7eb] text-xs text-[#1f2937] focus:outline-none focus:border-[#2e7d32]"
              />
            </div>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="h-9 px-4 rounded-[10px] bg-[#2e7d32] hover:bg-[#1b5e20] text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm nguyên liệu</span>
            </button>
          </div>
        </div>

        {/* Shared Data Table */}
        <SharedDataTable<AdminIngredientItem>
          title="Từ điển Nguyên liệu &amp; Quy chuẩn An toàn"
          totalCountBadge={total}
          updatedAtText="Đồng bộ OCR tự động"
          columns={columns}
          data={ingredients}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          pageSize={6}
          onPageChange={(p) => setCurrentPage(p)}
          emptyMessage="Không tìm thấy nguyên liệu nào phù hợp."
        />

        {/* Modal Create / Edit Ingredient */}
        <Modal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          title={editingItem ? 'Chỉnh sửa Nguyên liệu' : 'Thêm Nguyên liệu mới'}
          maxWidth="md"
        >
          <form onSubmit={handleSaveForm} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#1f2937] block mb-1">
                Tên nguyên liệu / chất phụ gia <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ví dụ: Đậu hũ non, Gelatin E441..."
                className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#e5e7eb] text-xs text-[#1f2937] focus:outline-none focus:border-[#2e7d32] focus:ring-2 focus:ring-[#e8f5e9]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#1f2937] block mb-1">
                  Nhóm danh mục
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#e5e7eb] text-xs text-[#1f2937] focus:outline-none focus:border-[#2e7d32]"
                >
                  <option value="Đạm thực vật">Đạm thực vật</option>
                  <option value="Gia vị & Nước dùng">Gia vị & Nước dùng</option>
                  <option value="Phụ gia tạo gel">Phụ gia tạo gel</option>
                  <option value="Sữa & Chế phẩm">Sữa & Chế phẩm</option>
                  <option value="Rau củ hữu cơ">Rau củ hữu cơ</option>
                  <option value="Hạt dinh dưỡng">Hạt dinh dưỡng</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1f2937] block mb-1">
                  Mã phụ gia E-Number (nếu có)
                </label>
                <input
                  type="text"
                  value={formData.eNumber}
                  onChange={(e) => setFormData({ ...formData, eNumber: e.target.value })}
                  placeholder="Ví dụ: E406, E441 hoặc —"
                  className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#e5e7eb] text-xs font-mono text-[#1f2937] focus:outline-none focus:border-[#2e7d32]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1f2937] block mb-1.5">
                Phân loại mức độ thuần chay &amp; an toàn
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className="flex items-center gap-2 p-2.5 rounded-[10px] border border-[#e5e7eb] cursor-pointer hover:bg-[#f8faf8] text-xs">
                  <input
                    type="radio"
                    name="dangerLevel"
                    value="safe"
                    checked={formData.dangerLevel === 'safe'}
                    onChange={() => setFormData({ ...formData, dangerLevel: 'safe', vegan: true, lactoVegan: true })}
                    className="text-[#2e7d32] focus:ring-[#2e7d32]"
                  />
                  <span className="font-semibold text-[#1b5e20]">An toàn</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-[10px] border border-[#e5e7eb] cursor-pointer hover:bg-[#f8faf8] text-xs">
                  <input
                    type="radio"
                    name="dangerLevel"
                    value="warning"
                    checked={formData.dangerLevel === 'warning'}
                    onChange={() => setFormData({ ...formData, dangerLevel: 'warning', vegan: false, lactoVegan: true })}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-amber-700">Cảnh báo</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-[10px] border border-[#e5e7eb] cursor-pointer hover:bg-[#f8faf8] text-xs">
                  <input
                    type="radio"
                    name="dangerLevel"
                    value="danger"
                    checked={formData.dangerLevel === 'danger'}
                    onChange={() => setFormData({ ...formData, dangerLevel: 'danger', vegan: false, lactoVegan: false })}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span className="font-semibold text-rose-700">Động vật</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1f2937] block mb-1">
                Ghi chú nguồn gốc &amp; thành phần thay thế
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ví dụ: Chiết xuất từ tảo biển, thay thế an toàn cho Gelatin..."
                className="w-full p-3 rounded-[10px] border border-[#e5e7eb] text-xs text-[#1f2937] focus:outline-none focus:border-[#2e7d32] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e5e7eb]">
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="px-4 py-2 rounded-[10px] border border-[#e5e7eb] text-xs font-semibold text-[#1f2937] hover:bg-[#f8faf8] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-[10px] bg-[#2e7d32] hover:bg-[#1b5e20] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Đang lưu...' : editingItem ? 'Lưu cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal Confirm Delete */}
        <Modal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title="Xác nhận xóa nguyên liệu"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-[12px] bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed">
              Bạn có chắc chắn muốn xóa nguyên liệu <strong>"{deleteTarget?.name}"</strong> khỏi cơ sở dữ liệu?
              Hệ thống sẽ không còn phát hiện hoặc gắn cờ tự động đối với nguyên liệu này khi quét OCR.
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

export default AdminIngredientsPage
