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
  Check,
  Utensils,
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
  VegetarianDietType,
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
  const [dietFilter, setDietFilter] = useState<VegetarianDietType | 'all'>('all')
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
    dietType: VegetarianDietType
    vegan: boolean
    lactoVegan: boolean
    dangerLevel: 'safe' | 'warning' | 'danger'
    description: string
  }>({
    name: '',
    category: 'Gia vị & Nước dùng',
    eNumber: '',
    dietType: 'vegan',
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
              dietType: dietFilter,
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
  }, [dietFilter, keyword, currentPage, refreshTrigger])

  const handleOpenCreateModal = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      category: 'Gia vị & Nước dùng',
      eNumber: '—',
      dietType: 'vegan',
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
      dietType: item.dietType || 'vegan',
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
      key: 'dietType',
      header: 'PHÂN LOẠI ĂN CHAY (4 LOẠI)',
      render: (item) => {
        const dietMap = {
          vegan: {
            bg: 'bg-emerald-50',
            color: 'text-emerald-800 border-emerald-300',
            label: 'Vegan (Thuần chay)',
            icon: ShieldCheck,
          },
          lacto: {
            bg: 'bg-blue-50',
            color: 'text-blue-800 border-blue-300',
            label: 'Lacto (Có bơ sữa)',
            icon: ShieldCheck,
          },
          ovo: {
            bg: 'bg-amber-50',
            color: 'text-amber-800 border-amber-300',
            label: 'Ovo (Có trứng)',
            icon: ShieldCheck,
          },
          'lacto-ovo': {
            bg: 'bg-purple-50',
            color: 'text-purple-800 border-purple-300',
            label: 'Lacto-Ovo (Trứng & Sữa)',
            icon: ShieldCheck,
          },
          'non-veg': {
            bg: 'bg-rose-50',
            color: 'text-rose-800 border-rose-300',
            label: 'Không chay (Động vật)',
            icon: ShieldAlert,
          },
        }[item.dietType || 'vegan']

        const Icon = dietMap.icon

        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${dietMap.bg} ${dietMap.color}`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span>{dietMap.label}</span>
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
      pageTitle="Từ điển Nguyên liệu & Phân loại Ăn chay"
      pageSubtitle="Quản lý thành phần dinh dưỡng, mã phụ gia E-number và chuẩn hóa 4 trường phái ăn chay."
      onNavigate={onNavigate}
    >
      <div className="space-y-6">
        {/* Action success alert */}
        {actionSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-[#1E6531] text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1E6531] shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionSuccessMsg(null)}
              className="text-[#1E6531] hover:text-emerald-900 cursor-pointer p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 5 Stats Cards for 4 Vegetarian Dietary Types */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Tổng nguyên liệu</span>
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Apple className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tabular-nums tracking-tight">
                {stats?.total ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Từ điển chuẩn hóa</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700">1. Vegan</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-700 tabular-nums tracking-tight">
                {stats?.vegan ?? 0}
              </div>
              <p className="text-[11px] text-emerald-600 mt-0.5">100% Thuần thực vật</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-700">2. Lacto</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-blue-700 tabular-nums tracking-tight">
                {stats?.lacto ?? 0}
              </div>
              <p className="text-[11px] text-blue-600 mt-0.5">Có sữa & bơ phô mai</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700">3. Ovo</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-700 tabular-nums tracking-tight">
                {stats?.ovo ?? 0}
              </div>
              <p className="text-[11px] text-amber-600 mt-0.5">Có trứng gà</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between gap-2 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-700">4. Lacto-Ovo</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-purple-700 tabular-nums tracking-tight">
                {stats?.lactoOvo ?? 0}
              </div>
              <p className="text-[11px] text-purple-600 mt-0.5">Cả trứng & sữa</p>
            </div>
          </div>
        </div>

        {/* Filter and Action Bar matching User Reference Style */}
        <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-4 shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <button
              type="button"
              onClick={() => {
                setDietFilter('all')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                dietFilter === 'all'
                  ? 'border-emerald-400 bg-[#EAF5EE] text-[#1E6531] shadow-2xs'
                  : 'border-transparent text-[#1f2937] hover:bg-[#f8faf8]'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => {
                setDietFilter('vegan')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                dietFilter === 'vegan'
                  ? 'border-emerald-400 bg-[#EAF5EE] text-[#1E6531] shadow-2xs'
                  : 'border-transparent text-[#1f2937] hover:bg-[#f8faf8]'
              }`}
            >
              Vegan (Thuần chay)
            </button>
            <button
              type="button"
              onClick={() => {
                setDietFilter('lacto')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                dietFilter === 'lacto'
                  ? 'border-emerald-400 bg-[#EAF5EE] text-[#1E6531] shadow-2xs'
                  : 'border-transparent text-[#1f2937] hover:bg-[#f8faf8]'
              }`}
            >
              Lacto (Có sữa)
            </button>
            <button
              type="button"
              onClick={() => {
                setDietFilter('ovo')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                dietFilter === 'ovo'
                  ? 'border-emerald-400 bg-[#EAF5EE] text-[#1E6531] shadow-2xs'
                  : 'border-transparent text-[#1f2937] hover:bg-[#f8faf8]'
              }`}
            >
              Ovo (Có trứng)
            </button>
            <button
              type="button"
              onClick={() => {
                setDietFilter('lacto-ovo')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                dietFilter === 'lacto-ovo'
                  ? 'border-emerald-400 bg-[#EAF5EE] text-[#1E6531] shadow-2xs'
                  : 'border-transparent text-[#1f2937] hover:bg-[#f8faf8]'
              }`}
            >
              Lacto-ovo (Trứng & Sữa)
            </button>
            <button
              type="button"
              onClick={() => {
                setDietFilter('non-veg')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                dietFilter === 'non-veg'
                  ? 'border-rose-400 bg-rose-50 text-rose-700 shadow-2xs'
                  : 'border-transparent text-rose-600 hover:bg-rose-50'
              }`}
            >
              Động vật (Cấm)
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
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#2e7d32]"
              />
            </div>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#1E6531] hover:bg-[#164e24] text-white shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm nguyên liệu</span>
            </button>
          </div>
        </div>

        {/* Shared Data Table */}
        <SharedDataTable<AdminIngredientItem>
          title="Từ điển Nguyên liệu &amp; 4 Chuẩn Ăn Chay"
          totalCountBadge={total}
          updatedAtText="Đồng bộ OCR & Phân loại tự động"
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
          maxWidth="lg"
        >
          <form onSubmit={handleSaveForm} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-900 block mb-1">
                Tên nguyên liệu / chất phụ gia <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ví dụ: Đậu hũ non, Sữa tươi thanh trùng, Gelatin E441..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#2e7d32] focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-900 block mb-1">
                  Nhóm danh mục
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#2e7d32] cursor-pointer"
                >
                  <option value="Đạm thực vật">Đạm thực vật</option>
                  <option value="Gia vị & Nước dùng">Gia vị & Nước dùng</option>
                  <option value="Phụ gia tạo gel">Phụ gia tạo gel</option>
                  <option value="Sữa & Chế phẩm">Sữa & Chế phẩm</option>
                  <option value="Trứng & Chế phẩm">Trứng & Chế phẩm</option>
                  <option value="Bánh ngọt & Đồ ăn nhẹ">Bánh ngọt & Đồ ăn nhẹ</option>
                  <option value="Sốt & Dầu giấm">Sốt & Dầu giấm</option>
                  <option value="Rau củ hữu cơ">Rau củ hữu cơ</option>
                  <option value="Hạt dinh dưỡng">Hạt dinh dưỡng</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-900 block mb-1">
                  Mã phụ gia E-Number (nếu có)
                </label>
                <input
                  type="text"
                  value={formData.eNumber}
                  onChange={(e) => setFormData({ ...formData, eNumber: e.target.value })}
                  placeholder="Ví dụ: E406, E441 hoặc —"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#2e7d32]"
                />
              </div>
            </div>

            {/* 4 Phân loại ăn chay chuẩn hóa matching user reference */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-gray-900 text-sm">
                    Phân loại ăn chay
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-rose-500">Bắt buộc</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Vegan */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      dietType: 'vegan',
                      dangerLevel: 'safe',
                      vegan: true,
                      lactoVegan: true,
                    })
                  }
                  className={`p-3.5 rounded-2xl border cursor-pointer select-none transition-all flex flex-col justify-between gap-1 text-left ${
                    formData.dietType === 'vegan'
                      ? 'border-emerald-600 bg-[#EAF5EE] text-[#1E6531] shadow-xs ring-1 ring-emerald-600'
                      : 'border-slate-200/80 bg-white text-gray-800 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Vegan</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        formData.dietType === 'vegan'
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {formData.dietType === 'vegan' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-[11px] opacity-75 leading-tight mt-0.5">
                    Thuần chay 100% không trứng, sữa, mật ong hay sản phẩm động vật
                  </p>
                </div>

                {/* 2. Lacto-vegetarian */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      dietType: 'lacto',
                      dangerLevel: 'warning',
                      vegan: false,
                      lactoVegan: true,
                    })
                  }
                  className={`p-3.5 rounded-2xl border cursor-pointer select-none transition-all flex flex-col justify-between gap-1 text-left ${
                    formData.dietType === 'lacto'
                      ? 'border-emerald-600 bg-[#EAF5EE] text-[#1E6531] shadow-xs ring-1 ring-emerald-600'
                      : 'border-slate-200/80 bg-white text-gray-800 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Lacto-vegetarian</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        formData.dietType === 'lacto'
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {formData.dietType === 'lacto' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-[11px] opacity-75 leading-tight mt-0.5">
                    Ăn chay có sử dụng sữa, bơ, phô mai nhưng không ăn trứng
                  </p>
                </div>

                {/* 3. Ovo-vegetarian */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      dietType: 'ovo',
                      dangerLevel: 'warning',
                      vegan: false,
                      lactoVegan: false,
                    })
                  }
                  className={`p-3.5 rounded-2xl border cursor-pointer select-none transition-all flex flex-col justify-between gap-1 text-left ${
                    formData.dietType === 'ovo'
                      ? 'border-emerald-600 bg-[#EAF5EE] text-[#1E6531] shadow-xs ring-1 ring-emerald-600'
                      : 'border-slate-200/80 bg-white text-gray-800 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Ovo-vegetarian</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        formData.dietType === 'ovo'
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {formData.dietType === 'ovo' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-[11px] opacity-75 leading-tight mt-0.5">
                    Ăn chay có ăn trứng nhưng không dùng sữa và chế phẩm sữa
                  </p>
                </div>

                {/* 4. Lacto-ovo vegetarian */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      dietType: 'lacto-ovo',
                      dangerLevel: 'warning',
                      vegan: false,
                      lactoVegan: false,
                    })
                  }
                  className={`p-3.5 rounded-2xl border cursor-pointer select-none transition-all flex flex-col justify-between gap-1 text-left ${
                    formData.dietType === 'lacto-ovo'
                      ? 'border-emerald-600 bg-[#EAF5EE] text-[#1E6531] shadow-xs ring-1 ring-emerald-600'
                      : 'border-slate-200/80 bg-white text-gray-800 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Lacto-ovo vegetarian</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        formData.dietType === 'lacto-ovo'
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {formData.dietType === 'lacto-ovo' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-[11px] opacity-75 leading-tight mt-0.5">
                    Ăn chay có sử dụng cả trứng và sữa, phổ biến và dễ tiếp cận
                  </p>
                </div>

                {/* 5. Non-vegetarian */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      dietType: 'non-veg',
                      dangerLevel: 'danger',
                      vegan: false,
                      lactoVegan: false,
                    })
                  }
                  className={`p-3.5 rounded-2xl border cursor-pointer select-none transition-all flex flex-col justify-between gap-1 text-left sm:col-span-2 ${
                    formData.dietType === 'non-veg'
                      ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-xs ring-1 ring-rose-500'
                      : 'border-slate-200/80 bg-white text-gray-800 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-rose-700">
                      Không thuần chay (Nguồn gốc động vật / Tuyệt đối cấm)
                    </span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        formData.dietType === 'non-veg'
                          ? 'border-rose-600 bg-rose-600 text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {formData.dietType === 'non-veg' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-[11px] opacity-75 leading-tight mt-0.5">
                    Chứa thịt, tủy xương động vật, mỡ hoặc gelatin lợn/bò - hệ thống sẽ cảnh báo đỏ khi người dùng quét thực phẩm
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-900 block mb-1">
                Ghi chú nguồn gốc &amp; thành phần thay thế
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ví dụ: Chiết xuất từ tảo biển, thay thế an toàn cho Gelatin..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#2e7d32] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1E6531] hover:bg-[#164e24] text-white shadow-xs cursor-pointer transition-colors"
              >
                {isSaving ? 'Đang lưu...' : editingItem ? 'Lưu cập nhật' : 'Thêm nguyên liệu'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal Delete Confirmation */}
        <Modal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title="Xác nhận xóa nguyên liệu"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa nguyên liệu{' '}
              <strong className="text-slate-900">"{deleteTarget?.name}"</strong> khỏi từ điển hệ thống? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer transition-colors"
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
