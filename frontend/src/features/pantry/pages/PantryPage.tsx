import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock as ClockIcon,
  Leaf,
  Plus as PlusIcon,
  Printer,
  Search as SearchIcon,
  ShieldCheck,
  Sparkles as SparklesIcon,
  Stethoscope,
  Trash2 as TrashIcon,
  TriangleAlert as TriangleAlertIcon,
  UtensilsCrossed as UtensilsIcon,
} from 'lucide-react'
import {
  Button,
  EmptyState,
  Input,
  Modal,
  Select,
  type SelectOption,
  StatusBadge,
} from '../../../shared/components'
import {
  addPantryItem,
  CATEGORY_ORDER,
  deletePantryItem,
  getPantryCategories,
  getPantryItems,
  getQuickAddChips,
  getRecipeMatches,
  QUICK_ADD_CHIPS,
} from '../api/pantryApi'
import type {
  AddIngredientFormState,
  PantryCategory,
  PantryItem,
  PantrySuitability,
  RecipeMatch,
} from '../types/pantry.types'
import {
  DEFAULT_UNITS,
  PANTRY_CATEGORY_LABELS,
} from '../types/pantry.types'

function suitabilityTone(s: PantrySuitability): {
  label: string
  cls: string
  tagCls: string
  icon: React.ReactNode
  border: string
  bg: string
} {
  switch (s) {
    case 'suitable':
      return {
        label: 'Hợp lệ',
        cls: 'text-[#166534]',
        tagCls: 'bg-[#DCFCE7] text-[#166534] ring-1 ring-[#86EFAC]',
        icon: <BadgeCheck size={15} className="text-[#22C55E]" />,
        border: 'border-[#86EFAC]',
        bg: 'bg-[#F0FDF4]',
      }
    case 'warning':
      return {
        label: 'Cần lưu ý',
        cls: 'text-[#92400E]',
        tagCls: 'bg-[#FEF3C7] text-[#92400E] ring-1 ring-[#FDE68A]',
        icon: <TriangleAlertIcon size={15} className="text-[#F59E0B]" />,
        border: 'border-[#FDE68A]',
        bg: 'bg-[#FFFBEB]',
      }
    case 'unsuitable':
      return {
        label: 'Không hợp với Vegan',
        cls: 'text-[#9F1239]',
        tagCls: 'bg-[#FFE4E6] text-[#9F1239] ring-1 ring-[#FECDD3]',
        icon: <AlertTriangle size={15} className="text-[#EF4444]" />,
        border: 'border-[#FECDD3]',
        bg: 'bg-[#FFF1F2]',
      }
    default:
      return {
        label: 'Chưa phân tích',
        cls: 'text-slate-700',
        tagCls: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
        icon: <CheckCircle2 size={15} className="text-slate-400" />,
        border: 'border-slate-200',
        bg: 'bg-slate-50',
      }
  }
}

/* =============== PAGE =============== */

interface PantryPageProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

export default function PantryPage({ onNavigate, isLoggedIn: _isLoggedIn }: PantryPageProps) {
  /* ---------------- STATES ---------------- */
  const [items, setItems] = useState<PantryItem[]>([])
  const [matches, setMatches] = useState<RecipeMatch[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  const [isLoadingMatches, setIsLoadingMatches] = useState(false)
  const [isAddSubmitting, setIsAddSubmitting] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeCategory, setActiveCategory] = useState<PantryCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  /* ---- Static helper data loaded via api (T8A) ---- */
  const [categoryOrder, setCategoryOrder] = useState<typeof CATEGORY_ORDER>(CATEGORY_ORDER)
  const [quickAddChips, setQuickAddChips] = useState<typeof QUICK_ADD_CHIPS>(QUICK_ADD_CHIPS)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [cats, chips] = await Promise.all([
        getPantryCategories(),
        getQuickAddChips(),
      ])
      if (cancelled) return
      setCategoryOrder(cats)
      setQuickAddChips(chips)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  /* ---- Inline modal form (Figma-standard Modal) ---- */
  const [form, setForm] = useState<AddIngredientFormState>({
    name: '',
    quantity: '',
    unit: 'g',
    category: '',
  })
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof AddIngredientFormState, string>>
  >({})

  const CATEGORY_OPTIONS: SelectOption[] = (
    Object.keys(PANTRY_CATEGORY_LABELS) as PantryCategory[]
  ).map((k) => ({ value: k, label: PANTRY_CATEGORY_LABELS[k] }))
  const UNIT_OPTIONS: SelectOption[] = DEFAULT_UNITS.map((u) => ({ value: u, label: u }))

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 1700)
  }

  /* ---------------- LOADERS ---------------- */
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

  /* ---------------- STATS ---------------- */
  const stats = useMemo(() => {
    const suit = items.filter((i) => i.isSuitable === 'suitable').length
    const warn = items.filter((i) => i.isSuitable === 'warning').length
    const unsuit = items.filter((i) => i.isSuitable === 'unsuitable').length
    return { suit, warn, unsuit, total: items.length }
  }, [items])

  /* ---------------- FILTERED ITEMS (for UI) ---------------- */
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        PANTRY_CATEGORY_LABELS[i.category].toLowerCase().includes(q),
    )
  }, [items, search])

  /* ---------------- GROUPED BY CATEGORY ---------------- */
  const grouped = useMemo(() => {
    const g: Record<string, PantryItem[]> = {}
    filteredItems.forEach((it) => {
      const k = it.category
      if (!g[k]) g[k] = []
      g[k].push(it)
    })
    return g
  }, [filteredItems])

  /* ---------------- HANDLERS ---------------- */
  const resetForm = () => {
    setForm({ name: '', quantity: '', unit: 'g', category: '' })
    setFormErrors({})
  }

  const openAdd = () => {
    resetForm()
    setShowAddModal(true)
  }
  const closeAdd = () => {
    if (isAddSubmitting) return
    resetForm()
    setShowAddModal(false)
  }

  const validateForm = (): boolean => {
    const next: Partial<Record<keyof AddIngredientFormState, string>> = {}
    if (!form.name.trim()) next.name = 'Vui lòng nhập tên nguyên liệu'
    else if (form.name.trim().length < 2) next.name = 'Tên tối thiểu 2 ký tự'
    if (form.quantity !== '' && Number.isNaN(Number(form.quantity)))
      next.quantity = 'Số lượng phải là số'
    if (!form.category) next.category = 'Vui lòng chọn danh mục'
    if (!form.unit.trim()) next.unit = 'Vui lòng chọn đơn vị'
    setFormErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmitAdd = async () => {
    if (!validateForm()) return
    setIsAddSubmitting(true)
    try {
      const item = await addPantryItem({ ...form, name: form.name.trim() })
      setItems((prev) => [item, ...prev])
      const t = suitabilityTone(item.isSuitable)
      showToast(
        `Đã thêm ${item.name} · ${t.label}`,
      )
      closeAdd()
    } finally {
      setIsAddSubmitting(false)
    }
  }

  const handleQuickAdd = (name: string) => {
    setForm((f) => ({ ...f, name, quantity: '200', unit: 'g', category: 'rau-cu-qua' }))
    setShowAddModal(true)
  }

  const handleDelete = async (id: string) => {
    const cur = items.find((i) => i.id === id)
    const r = await deletePantryItem(id)
    if (r.deleted) {
      setItems((prev) => prev.filter((i) => i.id !== id))
      showToast(`Đã xóa ${cur?.name ?? 'nguyên liệu'}`)
    }
  }

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div
      className="min-h-screen text-[#1F2937] font-['Inter']"
      style={{
        background:
          'radial-gradient(ellipse at top, #EEF8F1 0%, #F6FBF7 35%, #F8FAFB 70%)',
      }}
    >
      <div className="mx-auto w-full max-w-[1248px] px-[24px] pb-14 pt-6 sm:px-[16px]">
        {/* ================= BREADCRUMB / TITLE ================= */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-[12.5px] font-medium text-[#6B7280]">
            <Button
              type="button"
              variant="ghost"
              className="hover:!text-[#2E7D32] !p-0 !h-auto !min-h-0 !bg-transparent !border-0 !shadow-none"
              onClick={() => onNavigate?.('/')}
            >
              🏠 Trang chủ
            </Button>
            <span className="text-[#9CA3AF]">/</span>
            <Button
              type="button"
              variant="ghost"
              className="hover:!text-[#2E7D32] !p-0 !h-auto !min-h-0 !bg-transparent !border-0 !shadow-none"
              onClick={() => onNavigate?.('/recipes')}
            >
              Công thức
            </Button>
            <span className="text-[#9CA3AF]">/</span>
            <span className="font-bold text-[#1F2937]">Gợi ý món từ Tủ bếp AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Printer size={13} />}
              onClick={() => showToast('📄 Đã xuất danh sách khấu phần')}
              className="rounded-[10px] !text-[12.5px] !font-bold !text-[#4B5563] hover:!bg-[#F5FBF6] hover:!border-[#C8E6C9]"
            >
              Đổi sót khấu phần
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<ShieldCheck size={14} />}
              onClick={() => showToast('📑 Tính năng AI sẽ cập nhật chi tiết trong bản sau')}
            >
              Đổi chế độ ăn
            </Button>
          </div>
        </div>

        {/* ================= HERO ================= */}
        <section className="mb-7 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-[780px] flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                className="font-extrabold tracking-[-0.015em] text-[#121C2A]"
                style={{ fontSize: '36px', lineHeight: '44px' }}
              >
                Gợi ý Món Chay Từ Tủ Bếp AI
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E6F3EC] px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.02em] text-[#2E7D32] ring-1 ring-[#C8E6C9]">
                <SparklesIcon size={11} /> Smart Pantry 2.4
              </span>
            </div>
            <p
              className="mt-2 font-normal text-[#6B7280]"
              style={{ fontSize: '15px', lineHeight: '24px' }}
            >
              Khám phá các món ăn ngon, chuẩn dinh dưỡng từ nguyên liệu sẵn có gian bếp của bạn cùng
              Trợ lý AI thông minh.
            </p>
          </div>
        </section>

        {/* ================= SUITABILITY STRIP ================= */}
        <section
          className="mb-6 flex flex-col items-start gap-3 rounded-[16px] border border-[#C8E6C9] bg-gradient-to-br from-[#FFFFFF] via-[#F5FBF6] to-[#E8F5E9] px-5 py-4 shadow-xs md:flex-row md:items-center md:justify-between"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] ring-4 ring-[#DCFCE7]/40">
              <BadgeCheck size={22} className="text-[#16A34A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[11px] font-bold text-[#92400E] ring-1 ring-[#FDE68A]">
                  ✅ Đã đồng bộ hồ sơ
                </span>
                <span className="text-[13.5px] font-bold text-[#0F172A]">
                  Chế độ hiện tại: Thuần chay (Vegan)
                </span>
              </div>
              <p className="mt-1.5 text-[13px] leading-[20px] text-[#4B5563]">
                Hệ thống tự động quét nhận diện 100% nguồn gốc động vật (thịt, cá, sữa bò, trứng gia cầm, gelatin,
                mỡ động vật) để đảm bảo món chay an tâm tuyệt đối.
              </p>
            </div>
          </div>
        </section>

        {/* ================= MAIN 2 COLUMNS ================= */}
        <section className="grid gap-6 lg:grid-cols-12">
          {/* =============== LEFT: PANTRY =============== */}
          <div className="space-y-6 lg:col-span-5">
            {/* PANTRY CARD */}
            <div
              className="rounded-[16px] border border-[#E5E7EB] bg-white p-5 shadow-xs"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#E8F5E9] text-[#2E7D32]">
                      <UtensilsIcon size={16} />
                    </span>
                    <span
                      className="font-extrabold tracking-[-0.005em] text-[#121C2A]"
                      style={{ fontSize: '17px', lineHeight: '24px' }}
                    >
                      Tủ bếp của bạn
                    </span>
                    <span className="inline-flex items-center rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[11.5px] font-bold text-[#4338CA]">
                      {filteredItems.length} nguyên liệu đã chọn
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    className="rounded-[10px]"
                    leftIcon={<PlusIcon size={14} />}
                    onClick={() => showToast('📖 Hướng dẫn sử dụng Tủ bếp AI')}
                  >
                    + Thêm nguyên liệu
                  </Button>
                </div>

                {/* SEARCH + ADD */}
                <div className="flex flex-col gap-2 md:flex-row">
                  <div className="flex-1">
                    <Input
                      size={13}
                      placeholder="Nhập nguyên liệu bạn đang có (vd: + Thêm đậu phụ, cà chua, nấm...)"
                      value={form.name && showAddModal ? '' : search}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                      leftIcon={<SearchIcon size={14} />}
                      className="!h-10 !rounded-[12px]"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    leftIcon={<PlusIcon size={15} />}
                    onClick={openAdd}
                    className="rounded-[10px] !h-10 shrink-0"
                  >
                    + Thêm nguyên liệu
                  </Button>
                </div>

              {/* QUICK ADD CHIPS */}
              <div className="mt-4">
                <div className="mb-2 text-[11.5px] font-bold uppercase tracking-[0.02em] text-[#6B7280]">
                  Gợi ý thêm nhanh:
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {quickAddChips.map((c) => (
                    <Button
                      key={c.name}
                      type="button"
                      variant="ghost"
                      onClick={() => handleQuickAdd(c.name)}
                      className={`rounded-full !border !border-[#E5E7EB] !px-3 !py-1.5 !text-[12.5px] !font-semibold transition hover:-translate-y-[0.5px] hover:!border-[#2E7D32]/30 ${c.cls}`}
                    >
                      <span>{c.emoji}</span> + {c.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* VEGAN CHECK SUMMARY */}
              <div
                className={`mt-4 rounded-[14px] border px-4 py-3 ${
                  stats.unsuit > 0
                    ? 'border-[#FDE68A] bg-[#FFFBEB]'
                    : 'border-[#C8E6C9] bg-[#F0FDF4]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[13.5px] font-bold text-[#121C2A]">
                    <ShieldCheck size={16} className="text-[#22C55E]" />
                    Kiểm tra vi phạm Vegan:
                  </div>
                  <div className="flex items-center gap-2 text-[12.5px] font-bold">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[#166534]">
                      {stats.suit} Hợp lệ
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#FFE4E6] px-2.5 py-1 text-[#9F1239]">
                      {stats.unsuit + stats.warn} Cảnh báo
                    </span>
                  </div>
                </div>
              </div>

              {/* LIST: BY CATEGORY */}
              <div className="mt-4 space-y-5">
                {/* CATEGORY CHIPS ROUNDED-FULL */}
                <div className="flex flex-wrap items-center gap-2">
                  {categoryOrder.map((c) => {
                    const count =
                      c.key === 'all'
                        ? filteredItems.length
                        : filteredItems.filter((i) => i.category === c.key).length
                    const active = activeCategory === c.key
                    return (
                      <Button
                        key={c.key}
                        type="button"
                        variant="ghost"
                        className={[
                          'rounded-full border !px-3 !py-1.5 !text-[12.5px] !font-semibold',
                          active
                            ? '!border-[#2E7D32] bg-[#2E7D32] !text-white hover:bg-[#1B5E20] !shadow-sm ring-2 ring-[#2E7D32]/20'
                            : '!border-[#E5E7EB] !bg-white !text-[#4B5563] hover:!bg-[#F5FBF6] hover:!border-[#C8E6C9]',
                        ].join(' ')}
                        leftIcon={
                          active ? (
                            <Check size={14} />
                          ) : (
                            <span aria-hidden className="text-[13px] leading-none">
                              {c.emoji}
                            </span>
                          )
                        }
                        onClick={() => setActiveCategory(c.key)}
                      >
                        {c.label}
                        <span
                          className={`ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-bold ${
                            active ? 'bg-white/20 text-white' : 'bg-[#F3F4F6] text-[#6B7280]'
                          }`}
                        >
                          {count}
                        </span>
                      </Button>
                    )
                  })}
                </div>

                {/* GROUPED ITEMS / EMPTY */}
                <div className="space-y-4">
                  {isLoadingItems ? (
                    <div className="space-y-2">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="h-16 animate-pulse rounded-[12px] border border-[#E5E7EB] bg-white"
                        />
                      ))}
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <EmptyState
                      title="Tủ bếp của bạn đang trống"
                      description="Bắt đầu thêm vài nguyên liệu phổ biến như đậu phụ, nấm, cà chua, rau cải để AI gợi ý món ngon chuẩn dinh dưỡng hôm nay."
                      actionLabel="+ Thêm nguyên liệu đầu tiên"
                      onAction={openAdd}
                      icon={<UtensilsIcon size={40} className="text-[#2E7D32]" />}
                    />
                  ) : (
                    Object.entries(grouped).map(([cat, list]) => (
                      <GroupBlock
                        key={cat}
                        cat={cat as PantryCategory}
                        list={list}
                        onDelete={handleDelete}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* =============== SUITABLE RESULTS =============== */}
            <div
              className="rounded-[16px] border border-[#C8E6C9] bg-gradient-to-br from-white to-[#F0FDF4] p-5 shadow-xs"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div className="mb-3 flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#DCFCE7] text-[#166534]">
                  <ShieldCheck size={16} />
                </span>
                <div>
                  <h3
                    className="font-extrabold tracking-[-0.005em] text-[#121C2A]"
                    style={{ fontSize: '17px', lineHeight: '24px' }}
                  >
                    Kết quả kiểm tra theo hồ sơ Vegan
                  </h3>
                  <p className="mt-1 text-[13px] leading-[20px] text-[#4B5563]">
                    Hệ thống AI tự động phân tích từng nguồn gốc nguyên liệu đối chiếu với chế độ
                    Thuần chay (Vegan).
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-[12px] border border-[#86EFAC] bg-white px-3 py-2 text-[13px] font-semibold">
                <div className="flex items-center gap-1.5 text-[#166534]">
                  <BadgeCheck size={15} /> Nguyên liệu hợp lệ ({stats.suit} nguyên liệu)
                </div>
                <span className="font-bold text-[#16A34A]">100% An toàn</span>
              </div>
              <div className="mt-3 space-y-2">
                {filteredItems
                  .filter((i) => i.isSuitable === 'suitable')
                  .slice(0, 3)
                  .map((i) => (
                    <SuitableRow
                      key={i.id}
                      item={i}
                      onDelete={() => handleDelete(i.id)}
                    />
                  ))}
                {filteredItems.filter((i) => i.isSuitable === 'suitable').length === 0 && (
                  <div className="rounded-[12px] border border-dashed border-[#C8E6C9] bg-[#F0FDF4]/50 px-3 py-3 text-[12.5px] text-[#166534]">
                    Chưa có nguyên liệu hợp lệ nào, hãy bắt đầu thêm từ danh mục trên.
                  </div>
                )}
              </div>
            </div>

            {/* =============== WARNING / UNSUITABLE =============== */}
            <div
              className="rounded-[16px] border border-[#FECDD3] bg-gradient-to-br from-white to-[#FFF1F2] p-5 shadow-xs"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div className="mb-3 flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#FFE4E6] text-[#9F1239]">
                  <TriangleAlertIcon size={16} />
                </span>
                <div className="flex-1">
                  <h3
                    className="font-extrabold tracking-[-0.005em] text-[#9F1239]"
                    style={{ fontSize: '17px', lineHeight: '24px' }}
                  >
                    Cảnh báo vi phạm chế độ ăn ({stats.unsuit + stats.warn} nguyên liệu)
                  </h3>
                  <p className="mt-1 text-[13px] leading-[20px] text-[#4B5563]">
                    Cần loại trừ
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {filteredItems
                  .filter((i) => i.isSuitable === 'unsuitable')
                  .map((i) => (
                    <WarnRow
                      key={i.id}
                      item={i}
                      tone="danger"
                      onDelete={() => handleDelete(i.id)}
                    />
                  ))}
                {filteredItems
                  .filter((i) => i.isSuitable === 'warning')
                  .map((i) => (
                    <WarnRow
                      key={i.id}
                      item={i}
                      tone="warn"
                      onDelete={() => handleDelete(i.id)}
                    />
                  ))}
                {stats.unsuit + stats.warn === 0 && (
                  <div className="rounded-[12px] border border-dashed border-[#FECDD3] bg-[#FFF1F2]/50 px-3 py-3 text-[12.5px] text-[#9F1239]">
                    🎉 Chưa có cảnh báo nào - Tủ bếp của bạn đang rất thuần chay!
                  </div>
                )}
              </div>
            </div>

            {/* =============== AI SUGGESTED REPLACEMENT =============== */}
            <div
              className="rounded-[16px] border border-[#C8E6C9] bg-gradient-to-br from-white via-[#F0FDF4] to-[#DCFCE7] p-5 shadow-xs"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#2E7D32] text-white shadow-sm">
                    <SparklesIcon size={16} />
                  </span>
                  <div>
                    <h3
                      className="font-extrabold tracking-[-0.005em] text-[#121C2A]"
                      style={{ fontSize: '17px', lineHeight: '24px' }}
                    >
                      Gợi ý thay thế thuần thực vật từ AI
                    </h3>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[11.5px] font-bold text-[#166534] ring-1 ring-[#86EFAC]">
                  100% Thuần chay
                </span>
              </div>
              <div className="space-y-2.5">
                <ReplacementRow
                  icon="🥛"
                  from="Đậu hào----"
                  fromLabel="Sốt đậu hào"
                  to="Sốt đậu hào thuần chay (Vegan)"
                  onApply={() => showToast('✨ Đã áp dụng thay thế: Sốt đậu hào → Vegan')}
                />
                <ReplacementRow
                  icon="🥚"
                  from="Trứng gà"
                  fromLabel="Trứng gà thường"
                  to="Đậu hũ non tán nhuyễn xào bột nghiện (Tofu Scramble)"
                  onApply={() => showToast('✨ Đã áp dụng thay thế: Trứng → Đậu hũ non')}
                />
              </div>
              <p className="mt-3 flex items-start gap-1.5 text-[12.5px] font-medium text-[#166534]">
                <ShieldCheck size={14} className="mt-0.5" />
                <span>
                  Tự động thay thế tất cả nguyên liệu vi phạm bằng phiên bản thuần thực vật an toàn
                  khi gợi ý công thức.
                </span>
              </p>
            </div>
          </div>

          {/* =============== RIGHT: RECIPE MATCHES =============== */}
          <div className="space-y-6 lg:col-span-7">
            {/* HEADER */}
            <div
              className="rounded-[16px] border border-[#E5E7EB] bg-white p-5 shadow-xs"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#FEF9C3] text-[#854D0E]">
                      <SparklesIcon size={16} />
                    </span>
                    <h2
                      className="font-extrabold tracking-[-0.005em] text-[#121C2A]"
                      style={{ fontSize: '20px', lineHeight: '28px' }}
                    >
                      Món ngon có thể nấu ngay từ tủ bếp
                    </h2>
                    <span className="inline-flex items-center rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[11.5px] font-bold text-[#166534]">
                      {matches.length} công thức
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] text-[#4B5563]">
                    Tìm thấy {matches.length} công thức đủ ưu tiên dinh dưỡng dựa trên nguyên liệu
                    đã kiểm duyệt an toàn.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[12.5px] font-semibold text-[#6B7280]">
                  <span className="text-[#6B7280]">Sắp xếp:</span>
                  <div className="rounded-[10px] border border-[#E5E7EB] bg-[#FAFBFA] px-3 py-1.5 shadow-xs">
                    Khớp nguyên liệu cao nhất (100%)
                  </div>
                </div>
              </div>
            </div>

            {/* RECIPE GRID 2 COL */}
            <div className="grid gap-5 md:grid-cols-2">
              {isLoadingMatches
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[380px] animate-pulse rounded-[16px] border border-[#E5E7EB] bg-white"
                    />
                  ))
                : matches.length === 0
                  ? (
                      <div className="md:col-span-2">
                        <EmptyState
                          title="Chưa có gợi ý món nào phù hợp"
                          description="Thêm vài nguyên liệu phổ biến như đậu phụ, cà chua, nấm vào tủ bếp để AI bắt đầu gợi ý món nhé."
                          actionLabel="+ Thêm nguyên liệu"
                          onAction={openAdd}
                          icon={<SparklesIcon size={40} className="text-[#2E7D32]" />}
                        />
                      </div>
                    )
                  : matches.slice(0, 4).map((m) => (
                      <MatchCard
                        key={m.id}
                        m={m}
                        onViewRecipe={() => {
                          showToast(`🍲 Đang mở công thức: ${m.title}`)
                          onNavigate?.(`/recipes/${encodeURIComponent(m.id)}`)
                        }}
                        onSave={() => showToast(`📌 Đã lưu: ${m.title} vào kế hoạch tuần`)}
                      />
                    ))}
            </div>

            {/* =============== EXPERT NUTRITION PANEL =============== */}
            <div
              className="mt-6 rounded-[16px] border border-[#2E7D32]/30 bg-white p-5 shadow-sm"
              style={{
                background:
                  'linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 60%, #DCFCE7 100%)',
                boxShadow: '0 6px 18px 0 rgba(21,128,61,0.12)',
              }}
            >
              <div className="grid gap-4 md:grid-cols-12 md:items-start">
                <div className="md:col-span-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#2E7D32] text-white shadow-md ring-4 ring-[#2E7D32]/20">
                    <Stethoscope size={22} />
                  </div>
                </div>
                <div className="md:col-span-11">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3
                      className="font-extrabold tracking-[-0.005em] text-[#121C2A]"
                      style={{ fontSize: '18px', lineHeight: '26px' }}
                    >
                      Góc chuyên gia dinh dưỡng thực vật AI
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#D9F99D] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.02em] text-[#3F6212]">
                      <Leaf size={10} /> Chỉ số hấp thu tối ưu
                    </span>
                  </div>
                  <p
                    className="font-medium leading-[24px] text-[#1F2937]"
                    style={{ fontSize: '14px' }}
                  >
                    Trợ lý AI đánh giá: Bộ 3 nguyên liệu <strong className="text-[#166534]">Đậu hũ</strong> +{' '}
                    <strong className="text-[#166534]">Nấm hương</strong> +{' '}
                    <strong className="text-[#166534]">Cà chua</strong> là sự kết hợp hoàn hảo giữa
                    <strong> Đạm thực vật hoàn chỉnh</strong> (Đậu hũ chứa 9 axit amin thiết yếu)
                    , <strong>Beta-glucan nâng đề kháng thể</strong> (từ Nấm hương) và{' '}
                    <strong>Lycopene chống oxy hóa</strong> được hoạt hóa tốt nhất khi nấu cùng dầu
                    thực vật như của chua chin. Bạn hoàn toàn có thể nấu một bữa ăn thuần chay cân
                    bằng, ngon miệng mà không lo thiếu hụt vi chất.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[12.5px] font-semibold text-[#166534]">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 size={13} /> Phù hợp cho chế độ giữ dáng & kiểm soát BMI
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 size={13} /> Chỉ số đường huyết (GI) thấp
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* =============== ADD MODAL (Figma design) =============== */}
      <Modal
        isOpen={showAddModal}
        onClose={closeAdd}
        maxWidth="md"
        title={
          <span className="flex items-center gap-2">
            <PlusIcon size={18} className="text-[#2E7D32]" />
            Thêm nguyên liệu vào Tủ bếp AI
          </span>
        }
        description="Nhập đầy đủ tên, số lượng và danh mục. Hệ thống sẽ tự động phân tích mức độ phù hợp Thuần chay (Vegan) dựa trên tên gọi."
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={closeAdd}
              disabled={isAddSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              isLoading={isAddSubmitting}
              leftIcon={<PlusIcon size={14} />}
              onClick={handleSubmitAdd}
            >
              Lưu nguyên liệu
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Tên nguyên liệu"
              required
              placeholder="Ví dụ: Đậu phụ tươi, Cà chua bi hữu cơ..."
              value={form.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setForm((f) => ({ ...f, name: e.target.value }))
                setFormErrors((p) => ({ ...p, name: undefined }))
              }}
              error={formErrors.name}
              helperText="Nhập tiếng Việt có dấu để hệ thống phân tích tốt hơn."
              autoFocus
            />
          </div>
          <div>
            <Input
              label="Số lượng"
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="Ví dụ: 400"
              value={form.quantity}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setForm((f) => ({ ...f, quantity: e.target.value }))
                setFormErrors((p) => ({ ...p, quantity: undefined }))
              }}
              error={formErrors.quantity}
              helperText="Bỏ trống để nhập sau."
            />
          </div>
          <div>
            <Select
              label="Đơn vị"
              required
              value={form.unit}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                setForm((f) => ({ ...f, unit: e.target.value }))
                setFormErrors((p) => ({ ...p, unit: undefined }))
              }}
              error={formErrors.unit}
              options={UNIT_OPTIONS}
            />
          </div>
          <div className="sm:col-span-2">
            <Select
              label="Danh mục nguyên liệu"
              required
              value={form.category}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                setForm((f) => ({ ...f, category: e.target.value as PantryCategory | '' }))
                setFormErrors((p) => ({ ...p, category: undefined }))
              }}
              error={formErrors.category}
              options={[{ value: '', label: '— Chọn danh mục —' }, ...CATEGORY_OPTIONS]}
            />
          </div>
        </div>
        <div className="mt-5 rounded-[12px] border border-[#C8E6C9] bg-[#E8F5E9]/60 p-3 text-[12.5px] leading-5 text-[#1F2937]">
          <strong>Lưu ý:</strong> Độ phù hợp dựa trên tên gọi thông thường, không thay cho đọc nhãn
          thành phần thực tế. Nếu sản phẩm có phụ gia E-number, hãy kiểm tra thêm.
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-10 left-1/2 z-40 -translate-x-1/2 rounded-full bg-slate-900/90 px-5 py-2 text-[14px] font-semibold text-white shadow-lg backdrop-blur"
          style={{ lineHeight: '20px' }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}

/* ================= SUB COMPONENTS ================= */

function GroupBlock({
  cat,
  list,
  onDelete,
}: {
  cat: PantryCategory
  list: PantryItem[]
  onDelete: (id: string) => void
}) {
  const meta = CATEGORY_ORDER.find((c) => c.key === cat)
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-[0.02em] text-[#4B5563]">
          <span aria-hidden>{meta?.emoji ?? '📦'}</span>
          {meta?.label ?? PANTRY_CATEGORY_LABELS[cat]}
          <span className="text-[11px] font-semibold text-[#9CA3AF]">
            ({list.length})
          </span>
        </div>
        <span className="h-[1px] flex-1 mx-3 bg-gradient-to-r from-[#E5E7EB] via-[#C8E6C9] to-transparent" />
      </div>
      <div className="space-y-2">
        {list.map((i) => (
          <ItemRow key={i.id} item={i} onDelete={() => onDelete(i.id)} />
        ))}
      </div>
    </div>
  )
}

function ItemRow({
  item,
  onDelete,
}: {
  item: PantryItem
  onDelete: () => void
}) {
  const t = suitabilityTone(item.isSuitable)
  const d = new Date(item.addedAt)
  const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
  return (
    <div
      className={`group flex items-center justify-between gap-3 rounded-[12px] border ${t.border} ${t.bg} px-3 py-2.5 transition hover:shadow-sm`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white text-[18px] shadow-inner ring-1 ring-white/60">
          {CATEGORY_ORDER.find((c) => c.key === item.category)?.emoji ?? '📦'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`line-clamp-1 text-[14px] font-bold ${t.cls}`}>{item.name}</span>
            <span
              className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-bold ${t.tagCls}`}
            >
              {t.icon}
              {t.label}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-[#4B5563]">
            <span className="font-semibold">
              {item.quantity} {item.unit}
            </span>
            <span className="text-[#D1D5DB]">·</span>
            <span className="inline-flex items-center gap-1">
              <Calendar size={11} /> {dateStr}
            </span>
          </div>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        aria-label={`Xóa ${item.name}`}
        onClick={onDelete}
        className="!h-8 !w-8 shrink-0 !rounded-[10px] !p-0 !text-[#6B7280] transition hover:!bg-[#FFF1F2] hover:!text-[#DC2626] !min-w-0"
        leftIcon={<TrashIcon size={15} />}
      />
    </div>
  )
}

function SuitableRow({
  item,
  onDelete,
}: {
  item: PantryItem
  onDelete: () => void
}) {
  const t = suitabilityTone('suitable')
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-[12px] border ${t.border} bg-white px-3 py-2.5 transition hover:shadow-sm`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#DCFCE7]">
          {t.icon}
        </span>
        <div className="min-w-0">
          <div className="line-clamp-1 text-[13.5px] font-bold text-[#166534]">
            ✅ {item.name} ({item.quantity} {item.unit})
          </div>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        aria-label={`Xóa ${item.name}`}
        onClick={onDelete}
        className="!p-0 !h-auto !min-h-0 !bg-transparent !border-0 !shadow-none !text-[13px] !font-semibold !text-[#2E7D32] hover:!underline"
      >
        ×
      </Button>
    </div>
  )
}

function WarnRow({
  item,
  tone,
  onDelete,
}: {
  item: PantryItem
  tone: 'warn' | 'danger'
  onDelete: () => void
}) {
  const isDanger = tone === 'danger'
  return (
    <div
      className={`flex items-start gap-3 rounded-[12px] border ${
        isDanger ? 'border-[#FECDD3] bg-[#FFF1F2]' : 'border-[#FDE68A] bg-[#FFFBEB]'
      } px-3 py-2.5`}
    >
      <div
        className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isDanger ? 'bg-[#FFE4E6]' : 'bg-[#FEF3C7]'
        }`}
      >
        <TriangleAlertIcon size={15} className={isDanger ? 'text-[#DC2626]' : 'text-[#D97706]'} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
              isDanger
                ? 'bg-[#FECDD3] text-[#9F1239]'
                : 'bg-[#FDE68A] text-[#92400E]'
            }`}
          >
            ⚠️ {item.name}
            {isDanger ? ' (Hàu oyster)' : ''}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
              isDanger
                ? 'bg-[#FECDD3] text-[#9F1239]'
                : 'bg-[#DBEAFE] text-[#1E3A8A]'
            }`}
          >
            {isDanger ? 'Món mặn / Góc đóng vật' : 'Không hợp với Vegan'}
          </span>
        </div>
        <p className="mt-1 text-[12.5px] leading-[20px] text-[#4B5563]">
          {isDanger
            ? 'Chứa chiết xuất hàu biển động vật. Không phù hợp với người ăn chay ở bất kỳ hình thức nào.'
            : `Tồn tại nguồn gốc động vật (hoặc trứng). Chỉ phù hợp với chế độ Ovo hoặc Lacto-ovo vegetarian.`}
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <StatusBadge
            status="info"
            size="sm"
            label={isDanger ? 'Cần loại trừ' : 'Cần lưu ý'}
          />
          <Button
            type="button"
            variant="ghost"
            onClick={onDelete}
            className="!p-0 !h-auto !min-h-0 !bg-transparent !border-0 !shadow-none !text-[12.5px] !font-semibold !text-[#DC2626] hover:!underline"
          >
            Xoá ×
          </Button>
        </div>
      </div>
    </div>
  )
}

function ReplacementRow({
  icon,
  from,
  fromLabel,
  to,
  onApply,
}: {
  icon: string
  from: string
  fromLabel: string
  to: string
  onApply: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-[#86EFAC] bg-white px-3.5 py-2.5">
      <span className="text-[20px]" aria-hidden>{icon}</span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-[13px]">
        <span className="line-through decoration-red-400 decoration-2 text-[#9F1239]">
          Dâu hào—→{from}
        </span>
        <ChevronRight size={14} className="text-[#22C55E]" />
        <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[11.5px] font-bold text-[#166534]">
          {fromLabel}
        </span>
        <span className="font-semibold text-[#1F2937]">→ {to}</span>
      </div>
      <Button
        type="button"
        variant="primary"
        size="sm"
        rightIcon={<ArrowRight size={13} />}
        onClick={onApply}
        className="!h-8 !rounded-[10px] !px-3 !text-[12.5px]"
      >
        Áp dụng thay thế
      </Button>
    </div>
  )
}

function MatchCard({
  m,
  onViewRecipe,
  onSave,
}: {
  m: RecipeMatch
  onViewRecipe: () => void
  onSave: () => void
}) {
  const onKey =
    (fn: () => void) =>
    (e: React.KeyboardEvent): void => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        fn()
      }
    }
  const veganOk = m.matchPercent >= 60
  const match3of =
    m.totalIngredients > 0 &&
    (m.matchedIngredients.length === Math.min(3, m.totalIngredients) ||
      m.matchedIngredients.length >= 3)

  return (
    <div
      className="group flex h-full flex-col overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-white shadow-xs transition hover:-translate-y-[1px] hover:border-[#2E7D32]/30"
      style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onViewRecipe}
        onKeyDown={onKey(onViewRecipe)}
        className="relative block w-full cursor-pointer"
      >
        <img
          src={m.cover}
          alt={m.title}
          loading="lazy"
          className="h-[170px] w-full object-cover transition group-hover:scale-[1.03]"
        />
        {/* Top badges */}
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-white/70 backdrop-blur ${
              veganOk
                ? 'bg-[#166534] text-white'
                : 'bg-[#FEF9C3] text-[#854D0E]'
            }`}
          >
            ✅ 100% Thuần Chay (Vegan)
          </span>
        </div>
        <div className="absolute right-3 top-3 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-white/70 backdrop-blur ${
              match3of
                ? 'bg-[#86EFAC] text-[#14532D]'
                : 'bg-white/95 text-[#166534]'
            }`}
          >
            <span className="flex h-3 w-3 items-center justify-center rounded-full bg-white text-[#166534]">
              ✓
            </span>{' '}
            Khớp {m.matchedIngredients.length}/{Math.min(3, m.totalIngredients)} nguyên liệu sẵn có
          </span>
        </div>
        <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-bold text-white ring-1 ring-white/10 backdrop-blur">
          <ClockIcon size={11} /> {m.timeMin} phút
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3
            className="line-clamp-2 font-extrabold tracking-[-0.005em] text-[#121C2A]"
            style={{ fontSize: '17px', lineHeight: '24px' }}
          >
            {m.title}
          </h3>
          <p
            className="mt-1 line-clamp-2 text-[13px] leading-[20px] text-[#4B5563]"
          >
            {m.subtitle}
          </p>
        </div>

        {/* Match summary line */}
        <div className="text-[12.5px] text-[#4B5563]">
          <span className="font-semibold text-[#166534]">
            Tủ bếp:{' '}
            {m.matchedIngredients.length > 0
              ? m.matchedIngredients.slice(0, 3).map((x) => `${x} (Có ✓)`).join(' · ')
              : 'Đang khớp...'}
          </span>
          {m.missingList.length > 0 && (
            <span className="mt-1 block">
              <span className="text-[#9F1239]">
                {m.missingList.slice(0, 2).map((x) => `(${x})`).join(' · ')}
              </span>{' '}
              <span className="text-[#1F2937]">
                Giá phụ: Bột ngũ hương, hành boa-rô, một{' '}
                <span className="font-semibold">
                  chút dầu nành tươi xào (Gia vị cơ bản).
                </span>
              </span>
            </span>
          )}
        </div>

        {/* Nutrition 4 col */}
        <div className="grid grid-cols-4 gap-1.5 rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFB] p-2">
          <NutriBox
            label="Calo"
            value={`${m.kcal}`}
            unit=""
            tone="amber"
          />
          <NutriBox label="Đạm" value={`${Math.round(m.kcal * 0.18 / 4)}`} unit="g" tone="green" />
          <NutriBox label="Carb" value={`${Math.round(m.kcal * 0.5 / 4)}`} unit="g" tone="blue" />
          <NutriBox label="Béo tối" value={`${Math.round(m.kcal * 0.3 / 9)}`} unit="g" tone="rose" />
        </div>

        {/* MATCH % PROGRESS BAR bg-[#2E7D32] fill */}
        <div className="mt-3 flex items-center gap-3">
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              style={{ width: `${Math.min(100, m.matchPercent)}%` }}
              className="h-full rounded-full bg-[#2E7D32] transition-all"
            />
          </div>
          <span className="shrink-0 text-xs font-bold text-[#2E7D32]">
            {m.matchPercent}% khớp
          </span>
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            leftIcon={<SparklesIcon size={14} />}
            rightIcon={<ArrowRight size={14} />}
            onClick={onViewRecipe}
            className="!h-10 !rounded-[12px]"
          >
            Xem công thức chi tiết →
          </Button>
          <Button
            type="button"
            variant="outline"
            size="md"
            leftIcon={<Calendar size={14} />}
            onClick={onSave}
            className="!h-10 !w-10 !rounded-[12px] !p-0"
            aria-label="Lưu vào kế hoạch tuần"
          />
        </div>
      </div>
    </div>
  )
}

function NutriBox({
  label,
  value,
  unit,
  tone,
}: {
  label: string
  value: string
  unit: string
  tone: 'green' | 'blue' | 'amber' | 'rose'
}) {
  const colorMap: Record<string, string> = {
    green: 'text-[#166534]',
    blue: 'text-[#1E3A8A]',
    amber: 'text-[#92400E]',
    rose: 'text-[#9F1239]',
  }
  return (
    <div className="rounded-[8px] bg-white px-1.5 py-1.5 text-center">
      <div className="text-[10.5px] font-bold uppercase tracking-[0.02em] text-[#6B7280]">
        {label}
      </div>
      <div
        className={`mt-0.5 text-[14px] font-extrabold tabular-nums ${colorMap[tone] ?? 'text-[#1F2937]'}`}
      >
        {value}
        {unit && <span className="ml-0.5 text-[11px] font-bold">{unit}</span>}
      </div>
    </div>
  )
}
