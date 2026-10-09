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
  Input,
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
    <div className="min-h-screen bg-[#F8FAF8] text-[#1F2937] font-['Inter']">
      {/* Section container max 1200px, gutter 24px desktop / 16px mobile theo DESIGN.md */}
      <div className="mx-auto w-full max-w-[1200px] px-[24px] py-10 md:px-[24px] sm:px-[16px]">
        {/* ============== PAGE HEADER ============== */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.02em] text-[#2E7D32]"
              style={{ lineHeight: '16px' }}
            >
              <Warehouse size={14} />
              Tủ bếp AI
            </span>

            {/* headline-lg 36/44 bold 700 - desktop */}
            <h1
              className="mt-3 w-full font-bold tracking-[-0.015em] text-[#121C2A] sm:text-[26px] sm:leading-[34px]"
              style={{ fontSize: '36px', lineHeight: '44px' }}
            >
              Quản lý nguyên liệu &amp; Gợi ý món ăn theo tủ bếp
            </h1>

            {/* body-md 16/24 regular 400 */}
            <p
              className="mt-3 max-w-[780px] font-normal text-[#6B7280]"
              style={{ fontSize: '16px', lineHeight: '24px' }}
            >
              Thêm nguyên liệu bạn đang có trong tủ, hệ thống sẽ tính trực quan % khớp nguyên liệu từ kho
              công thức thuần thực vật và gợi ý các món bạn có thể nấu ngay hôm nay.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              leftIcon={<RefreshCw size={16} />}
              onClick={handleRefresh}
            >
              Làm mới
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<Plus size={16} />}
              onClick={() => setShowAddModal(true)}
            >
              Thêm nguyên liệu
            </Button>
          </div>
        </header>

        {/* ============== STATS ROW 4 CARDS (12-col grid, gutter 24px) ============== */}
        <section
          aria-label="Thống kê nhanh tủ bếp"
          className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* Card Tổng */}
          <div
            className="rounded-[16px] border border-[#E5E7EB] bg-white p-6"
            style={{ boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.04)' }}
          >
            <div
              className="flex items-center justify-between"
              style={{ fontSize: '12px', lineHeight: '16px' }}
            >
              <span className="font-semibold uppercase tracking-[0.02em] text-[#6B7280]">
                Tổng nguyên liệu
              </span>
              <Warehouse size={18} className="text-[#2E7D32]" />
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div
                className="font-extrabold tabular-nums text-[#1F2937]"
                style={{ fontSize: '36px', lineHeight: '40px' }}
              >
                {stats.total}
              </div>
              <StatusBadge status="info" label="items" size="sm" />
            </div>
          </div>

          {/* Card Phù hợp */}
          <div
            className="rounded-[16px] border border-[#C8E6C9] bg-[#E8F5E9]/70 p-6"
            style={{ boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.04)' }}
          >
            <div
              className="flex items-center justify-between"
              style={{ fontSize: '12px', lineHeight: '16px' }}
            >
              <span className="font-semibold uppercase tracking-[0.02em] text-[#2E7D32]">
                Phù hợp
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div
                className="font-extrabold tabular-nums text-[#2E7D32]"
                style={{ fontSize: '36px', lineHeight: '40px' }}
              >
                {stats.suitable}
              </div>
              <StatusBadge status="suitable" size="sm" />
            </div>
          </div>

          {/* Card Cần xem lại */}
          <div
            className="rounded-[16px] border border-amber-200 bg-amber-50 p-6"
            style={{ boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.04)' }}
          >
            <div
              className="flex items-center justify-between"
              style={{ fontSize: '12px', lineHeight: '16px' }}
            >
              <span className="font-semibold uppercase tracking-[0.02em] text-amber-800">
                Cần xem lại
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div
                className="font-extrabold tabular-nums text-amber-800"
                style={{ fontSize: '36px', lineHeight: '40px' }}
              >
                {stats.warning}
              </div>
              <StatusBadge status="insufficient" size="sm" />
            </div>
          </div>

          {/* Card Không phù hợp */}
          <div
            className="rounded-[16px] border border-red-200 bg-red-50 p-6"
            style={{ boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.04)' }}
          >
            <div
              className="flex items-center justify-between"
              style={{ fontSize: '12px', lineHeight: '16px' }}
            >
              <span className="font-semibold uppercase tracking-[0.02em] text-red-700">
                Không phù hợp
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div
                className="font-extrabold tabular-nums text-red-700"
                style={{ fontSize: '36px', lineHeight: '40px' }}
              >
                {stats.unsuitable}
              </div>
              <StatusBadge status="unsuitable" size="sm" />
            </div>
          </div>
        </section>

        {/* ============== MAIN GRID: TỦ BẾP (c.1.1fr) + GỢI Ý MÓN (c.0.9fr), gutter 24px ============== */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          {/* ================= CỘT TRÁI: TỦ BẾP ================= */}
          <section
            aria-label="Danh sách nguyên liệu trong tủ"
            className="flex flex-col gap-6"
          >
            <div
              className="rounded-[16px] border border-[#E5E7EB] bg-white p-6"
              style={{ boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.04)' }}
            >
              {/* Section header */}
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2
                    className="font-semibold tracking-[-0.01em] text-[#1F2937]"
                    style={{ fontSize: '20px', lineHeight: '28px' }}
                  >
                    Nguyên liệu trong tủ
                  </h2>
                  <p
                    className="mt-1 font-normal text-[#6B7280]"
                    style={{ fontSize: '14px', lineHeight: '20px' }}
                  >
                    Xem tất cả các nguyên liệu bạn đã lưu, xóa bớt hoặc thêm mới.
                  </p>
                </div>
                <div
                  className="inline-flex items-center gap-1 rounded-full bg-[#F8FAF8] px-2.5 py-1 text-[12px] font-medium text-[#6B7280]"
                  style={{ lineHeight: '16px' }}
                >
                  {filteredItems.length} / {items.length} nguyên liệu
                </div>
              </div>

              {/* Filter row: 12-col sub-grid spacing 12px */}
              <div className="mb-6 grid grid-cols-12 gap-3">
                <div className="col-span-12 sm:col-span-5 md:col-span-4">
                  <Select
                    size={12}
                    label="Danh mục"
                    value={activeCategory}
                    onChange={(e) =>
                      setActiveCategory(e.target.value as PantryCategory | 'all')
                    }
                    options={ALL_CATEGORY_OPTIONS}
                  />
                </div>
                <div className="col-span-12 sm:col-span-7 md:col-span-6">
                  <Input
                    label="Tìm kiếm"
                    leftIcon={<Search size={16} />}
                    placeholder="Tìm theo tên, danh mục, đơn vị..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="col-span-12 md:col-span-2">
                  <div className="invisible md:visible">
                    <Button
                      type="button"
                      size="md"
                      variant="outline"
                      fullWidth
                      leftIcon={<Plus size={14} />}
                      onClick={() => setShowAddModal(true)}
                    >
                      Thêm nhanh
                    </Button>
                  </div>
                </div>
              </div>

              {/* Loading / Empty / Data */}
              {isLoadingItems && filteredItems.length === 0 ? (
                <div className="py-2">
                  <SkeletonLoader count={6} variant="card" />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="py-4">
                  <EmptyState
                    title="Tủ bếp chưa có nguyên liệu nào"
                    description="Hãy bắt đầu thêm một vài nguyên liệu phổ biến (đậu phụ, cà chua, gạo lứt…) để tôi gợi ý các món ăn theo đúng tủ bếp bạn đang có."
                    actionLabel="Thêm nguyên liệu"
                    onAction={() => setShowAddModal(true)}
                  />
                </div>
              ) : (
                <PantryItemList
                  items={filteredItems}
                  isLoading={isLoadingItems}
                  onDelete={handleDelete}
                />
              )}
            </div>
          </section>

          {/* ================= CỘT PHẢI: GỢI Ý MÓN ĂN ================= */}
          <section
            aria-label="Gợi ý món ăn theo nguyên liệu"
            className="flex flex-col gap-6"
          >
            <div
              className="rounded-[16px] border border-[#E5E7EB] bg-white p-6"
              style={{ boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.04)' }}
            >
              {/* Section header */}
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#2E7D32] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.02em] text-white"
                    style={{ lineHeight: '16px' }}
                  >
                    <Sparkles size={14} />
                    Tính độ khớp
                  </span>
                  <h2
                    className="mt-3 font-semibold tracking-[-0.01em] text-[#1F2937]"
                    style={{ fontSize: '20px', lineHeight: '28px' }}
                  >
                    Gợi ý món ăn từ nguyên liệu đang có
                  </h2>
                  <p
                    className="mt-1 max-w-[380px] font-normal text-[#6B7280]"
                    style={{ fontSize: '14px', lineHeight: '20px' }}
                  >
                    Hệ thống tính % khớp dựa trên số nguyên liệu bạn có trên tổng số nguyên liệu trong
                    mỗi công thức.
                  </p>
                </div>
                <div
                  className="rounded-[12px] border border-[#E5E7EB] bg-[#F8FAF8] px-3 py-2 text-right"
                  style={{ minWidth: '156px' }}
                >
                  <div
                    className="font-medium text-[#6B7280]"
                    style={{ fontSize: '12px', lineHeight: '16px' }}
                  >
                    Gợi ý hôm nay
                  </div>
                  <div
                    className="mt-0.5 font-semibold tabular-nums text-[#1F2937]"
                    style={{ fontSize: '18px', lineHeight: '26px' }}
                  >
                    {matches.length} món
                  </div>
                  <div
                    className="mt-1 inline-flex items-center gap-1 font-medium text-[#2E7D32]"
                    style={{ fontSize: '12px', lineHeight: '16px' }}
                  >
                    <ChefHat size={12} />
                    {stats.totalKcalPotential.toLocaleString('vi-VN')} kcal
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
            <div
              className="rounded-[16px] border border-[#C8E6C9] bg-[#E8F5E9]/70 p-6"
              style={{ boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.04)' }}
            >
              <h3
                className="font-semibold text-[#2E7D32]"
                style={{ fontSize: '18px', lineHeight: '26px' }}
              >
                💡 3 mẹo để có gợi ý chính xác hơn
              </h3>

              <ul
                className="mt-4 space-y-3 font-normal text-[#1F2937]"
                style={{ fontSize: '14px', lineHeight: '22px' }}
              >
                <li className="flex gap-2.5">
                  <span
                    aria-hidden
                    className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2E7D32] text-[11px] font-bold text-white"
                    style={{ lineHeight: '1' }}
                  >
                    1
                  </span>
                  <span>
                    Nhập đầy đủ <strong>tên nguyên liệu + số lượng (g / kg / quả / bó…)</strong> — hệ
                    thống sẽ ưu tiên gợi ý món bạn có đủ khối lượng.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span
                    aria-hidden
                    className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2E7D32] text-[11px] font-bold text-white"
                    style={{ lineHeight: '1' }}
                  >
                    2
                  </span>
                  <span>
                    Nếu có sản phẩm chế biến sẵn, kiểm tra nhãn thành phần tại{' '}
                    <button
                      type="button"
                      className="font-semibold text-[#1F2937] underline decoration-[#2E7D32]/60 underline-offset-2 hover:decoration-[#2E7D32]"
                      onClick={() => onNavigate?.('/food-scan')}
                    >
                      Quét thực phẩm
                    </button>{' '}
                    trước khi thêm vào tủ bếp.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span
                    aria-hidden
                    className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2E7D32] text-[11px] font-bold text-white"
                    style={{ lineHeight: '1' }}
                  >
                    3
                  </span>
                  <span>
                    Thêm <strong>5-8 nguyên liệu phổ biến</strong> (đậu phụ, gạo lứt, cà chua, nấm,
                    hành, tỏi, hạt chia) thường có đủ để gợi ý trên 15 món ăn khác nhau.
                  </span>
                </li>
              </ul>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  leftIcon={<ChefHat size={16} />}
                  onClick={() => onNavigate?.('/recipes')}
                >
                  Xem toàn bộ cộng đồng công thức
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  leftIcon={<Sparkles size={16} />}
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
