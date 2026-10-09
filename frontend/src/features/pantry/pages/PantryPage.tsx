import { useEffect, useMemo, useState } from 'react'
import {
  ChefHat,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Warehouse,
} from 'lucide-react'
import {
  Button,
  EmptyState,
  Select,
  SkeletonLoader,
  StatusBadge,
} from '../../../shared/components'
import type { SelectOption } from '../../../shared/components/Select'

import {
  addPantryItem,
  deletePantryItem,
  getPantryItems,
  getRecipeMatches,
} from '../api/pantryApi'
import { AddIngredientModal } from '../components/AddIngredientModal'
import { PantryItemList } from '../components/PantryItemList'
import { RecipeMatchList } from '../components/RecipeMatchList'
import type {
  AddIngredientFormState,
  PantryCategory,
  PantryItem,
  RecipeMatch,
} from '../types/pantry.types'
import { PANTRY_CATEGORY_LABELS } from '../types/pantry.types'

interface PantryPageProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

const ALL_CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Tất cả danh mục' },
  ...(Object.keys(PANTRY_CATEGORY_LABELS) as PantryCategory[]).map((key) => ({
    value: key,
    label: PANTRY_CATEGORY_LABELS[key],
  })),
]

export default function PantryPage({ onNavigate, isLoggedIn: _isLoggedIn }: PantryPageProps) {
  const [items, setItems] = useState<PantryItem[]>([])
  const [matches, setMatches] = useState<RecipeMatch[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  const [isLoadingMatches, setIsLoadingMatches] = useState(false)
  const [isAddSubmitting, setIsAddSubmitting] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeCategory, setActiveCategory] = useState<PantryCategory | 'all'>('all')
  const [search, setSearch] = useState('')

  // 1. Load pantry
  const loadItems = async () => {
    setIsLoadingItems(true)
    try {
      const data = await getPantryItems(activeCategory)
      setItems(data)
    } finally {
      setIsLoadingItems(false)
    }
  }

  useEffect(() => {
    void loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory])

  // 2. Gợi ý món ăn: khi items thay đổi thì recalculate
  useEffect(() => {
    let cancelled = false
    void (async () => {
      setIsLoadingMatches(true)
      try {
        const data = await getRecipeMatches(items)
        if (!cancelled) setMatches(data)
      } finally {
        if (!cancelled) setIsLoadingMatches(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [items])

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items
    const q = search.trim().toLowerCase()
    return items.filter(
      (it) =>
        it.name.toLowerCase().includes(q) ||
        PANTRY_CATEGORY_LABELS[it.category]?.toLowerCase().includes(q) ||
        it.unit.toLowerCase().includes(q),
    )
  }, [items, search])

  const stats = useMemo(() => {
    const total = items.length
    const suitable = items.filter((i) => i.isSuitable === 'suitable').length
    const warning = items.filter((i) => i.isSuitable === 'warning').length
    const unsuitable = items.filter((i) => i.isSuitable === 'unsuitable').length
    const totalKcalPotential = matches.slice(0, 6).reduce((acc, m) => acc + m.kcal, 0)
    return { total, suitable, warning, unsuitable, totalKcalPotential }
  }, [items, matches])

  const handleAddSubmit = async (form: AddIngredientFormState) => {
    setIsAddSubmitting(true)
    try {
      const created = await addPantryItem(form)
      // Nếu đang xem all thì append vào list, hoặc nếu category khớp thì append
      if (activeCategory === 'all' || activeCategory === created.category) {
        setItems((prev) => [created, ...prev])
      } else {
        // Force refetch khi không khớp category đang filter (sai UI nếu không)
        await loadItems()
      }
    } finally {
      setIsAddSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    const res = await deletePantryItem(id)
    if (res.deleted) {
      setItems((prev) => prev.filter((p) => p.id !== id))
    }
  }

  const handleRefresh = () => {
    void loadItems()
  }

  return (
    <div className="min-h-screen bg-[#f6faf7] text-[#1f2937]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f5e9] px-3 py-1 text-[11px] font-extrabold text-[#2e7d32]">
              <Warehouse size={12} /> Tủ bếp AI
            </span>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#1f2937] sm:text-3xl">
              Quản lý nguyên liệu & Gợi ý món ăn theo tủ bếp
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-[#6b7280]">
              Thêm nguyên liệu bạn đang có trong tủ, hệ thống sẽ tính trực quan % khớp nguyên liệu từ kho
              công thức thuần thực vật và gợi ý các món bạn có thể nấu ngay hôm nay.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              leftIcon={<RefreshCw size={14} />}
              onClick={handleRefresh}
            >
              Làm mới
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<Plus size={14} />}
              onClick={() => setShowAddModal(true)}
            >
              Thêm nguyên liệu
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-4 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wide text-[#6b7280]">
              Tổng nguyên liệu
            </div>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div className="text-3xl font-extrabold text-[#1f2937]">{stats.total}</div>
              <StatusBadge status="info" label="items" size="sm" />
            </div>
          </div>
          <div className="rounded-[16px] border border-[#c8e6c9] bg-[#e8f5e9]/60 p-4 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wide text-[#2e7d32]">
              Phù hợp
            </div>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div className="text-3xl font-extrabold text-[#2e7d32]">{stats.suitable}</div>
              <StatusBadge status="suitable" size="sm" />
            </div>
          </div>
          <div className="rounded-[16px] border border-amber-200 bg-amber-50/80 p-4 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wide text-amber-800">
              Cần xem lại
            </div>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div className="text-3xl font-extrabold text-amber-800">{stats.warning}</div>
              <StatusBadge status="insufficient" size="sm" />
            </div>
          </div>
          <div className="rounded-[16px] border border-red-200 bg-red-50/80 p-4 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wide text-red-700">
              Không phù hợp
            </div>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div className="text-3xl font-extrabold text-red-700">{stats.unsuitable}</div>
              <StatusBadge status="unsuitable" size="sm" />
            </div>
          </div>
        </div>

        {/* Main grid: Pantry items + Recipe Matches */}
        <div className="grid gap-6 xl:grid-cols-[1.1fr_minmax(0,0.9fr)]">
          {/* ====== Cột trái: Tủ bếp ====== */}
          <section className="flex flex-col gap-5">
            <div className="rounded-[20px] border border-[#e5e7eb] bg-white p-4 shadow-xs sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight text-[#1f2937]">
                    Nguyên liệu trong tủ
                  </h2>
                  <p className="mt-0.5 text-xs text-[#6b7280]">
                    Xem tất cả các nguyên liệu bạn đã lưu, xóa bớt hoặc thêm mới.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-56">
                    <Select
                      size={12}
                      value={activeCategory}
                      onChange={(e) =>
                        setActiveCategory(e.target.value as PantryCategory | 'all')
                      }
                      options={ALL_CATEGORY_OPTIONS}
                    />
                  </div>
                  <div className="w-60">
                    <input
                      type="search"
                      placeholder="Tìm nguyên liệu..."
                      className="h-11 w-full rounded-[10px] border border-[#e5e7eb] bg-white px-3.5 pl-10 text-sm outline-none focus:border-[#2e7d32] focus:ring-3 focus:ring-[#e8f5e9]"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{
                        backgroundImage:
                          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' stroke='%2394a3b8' viewBox='0 0 24 24'><path stroke-width='2' stroke-linecap='round' stroke-linejoin='round' d='M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z'/></svg>\")",
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'left 12px center',
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    leftIcon={<Search size={12} />}
                    onClick={() => setShowAddModal(true)}
                  >
                    Thêm nhanh
                  </Button>
                </div>
              </div>

              {isLoadingItems && filteredItems.length === 0 ? (
                <div className="py-2">
                  <SkeletonLoader count={6} variant="card" />
                </div>
              ) : filteredItems.length === 0 ? (
                <EmptyState
                  title="Tủ bếp chưa có nguyên liệu nào"
                  description="Hãy bắt đầu thêm một vài nguyên liệu phổ biến (đậu phụ, cà chua, gạo lứt…) để tôi gợi ý các món ăn theo đúng tủ bếp bạn đang có."
                  actionLabel="Thêm nguyên liệu"
                  onAction={() => setShowAddModal(true)}
                />
              ) : (
                <PantryItemList
                  items={filteredItems}
                  isLoading={isLoadingItems}
                  onDelete={handleDelete}
                />
              )}
            </div>
          </section>

          {/* ====== Cột phải: Gợi ý món ăn ====== */}
          <section className="flex flex-col gap-5">
            <div className="rounded-[20px] border border-[#e5e7eb] bg-white p-4 shadow-xs sm:p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-[#2e7d32] px-2.5 py-1 text-[10px] font-extrabold text-white">
                    <Sparkles size={11} /> TÍNH ĐỘ KHỚP
                  </div>
                  <h2 className="mt-2 text-lg font-extrabold tracking-tight text-[#1f2937]">
                    Gợi ý món ăn từ nguyên liệu đang có
                  </h2>
                  <p className="mt-0.5 text-xs text-[#6b7280]">
                    Hệ thống tính % khớp dựa trên số nguyên liệu bạn có trên tổng số nguyên liệu trong
                    mỗi công thức.
                  </p>
                </div>
                <div className="text-right text-xs text-[#6b7280]">
                  <div className="font-semibold text-[#1f2937]">
                    Tổng {matches.length} gợi ý
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1">
                    <ChefHat size={12} className="text-[#2e7d32]" />
                    {stats.totalKcalPotential.toLocaleString('vi-VN')} kcal (top 6)
                  </div>
                </div>
              </div>

              <RecipeMatchList
                matches={matches}
                isLoading={isLoadingMatches}
                onNavigate={onNavigate}
              />
            </div>

            {/* Quick tips card */}
            <div className="rounded-[20px] border border-[#c8e6c9] bg-[#e8f5e9]/60 p-5 shadow-xs">
              <h3 className="text-[15px] font-extrabold text-[#2e7d32]">
                💡 3 mẹo để có gợi ý chính xác hơn
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[#1f2937]">
                <li>
                  1. Nhập đầy đủ <strong>tên nguyên liệu + số lượng (g / kg / quả / bó…)</strong> — hệ
                  thống sẽ ưu tiên gợi ý món bạn có đủ khối lượng.
                </li>
                <li>
                  2. Nếu có sản phẩm chế biến sẵn, kiểm tra nhãn thành phần tại{' '}
                  <button
                    type="button"
                    className="font-bold text-[#1f2937] underline decoration-[#2e7d32]/50 hover:decoration-[#2e7d32]"
                    onClick={() => onNavigate?.('/food-scan')}
                  >
                    Quét thực phẩm
                  </button>{' '}
                  trước khi thêm vào tủ bếp.
                </li>
                <li>
                  3. Thêm <strong>5-8 nguyên liệu phổ biến</strong> (đậu phụ, gạo lứt, cà chua, nấm,
                  hành, tỏi, hạt chia) thường có đủ để gợi ý trên 15 món ăn khác nhau.
                </li>
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={<ChefHat size={13} />}
                  onClick={() => onNavigate?.('/recipes')}
                >
                  Xem toàn bộ cộng đồng công thức
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Sparkles size={13} />}
                  onClick={() => onNavigate?.('/ai-chat')}
                >
                  Hỏi AI thêm mẹo nấu ăn
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Add ingredient Modal */}
      <AddIngredientModal
        isOpen={showAddModal}
        onClose={() => {
          if (!isAddSubmitting) setShowAddModal(false)
        }}
        onSubmit={handleAddSubmit}
        submitting={isAddSubmitting}
      />
    </div>
  )
}
