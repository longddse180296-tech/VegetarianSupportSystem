import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Calendar,
  Check,
  CheckCircle2,
  Clock as ClockIcon,
  Plus as PlusIcon,
  Search as SearchIcon,
  ShieldCheck,
  ShoppingBasket,
  Sparkles as SparklesIcon,
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
} from '../../../shared/components'
import {
  addPantryItem,
  CATEGORY_ORDER,
  type CoreDietType,
  deletePantryItem,
  evaluateIngredientForDiet,
  getPantryCategories,
  getPantryItems,
  getQuickAddChips,
  getRecipeMatches,
  getSubstitutionForIngredient,
  QUICK_ADD_CHIPS,
  updatePantryItem,
} from '../api/pantryApi'
import { profileApi } from '../../profile/api/profileApi'
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

function suitabilityTone(s: PantrySuitability, diet?: CoreDietType): {
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
        icon: <BadgeCheck size={14} className="text-[#22C55E]" />,
        border: 'border-[#86EFAC]',
        bg: 'bg-[#F0FDF4]',
      }
    case 'warning':
      return {
        label: 'Cần lưu ý',
        cls: 'text-[#92400E]',
        tagCls: 'bg-[#FEF3C7] text-[#92400E] ring-1 ring-[#FDE68A]',
        icon: <TriangleAlertIcon size={14} className="text-[#F59E0B]" />,
        border: 'border-[#FDE68A]',
        bg: 'bg-[#FFFBEB]',
      }
    case 'unsuitable':
      return {
        label: diet ? `Không hợp: ${diet}` : 'Không phù hợp',
        cls: 'text-[#9F1239]',
        tagCls: 'bg-[#FFE4E6] text-[#9F1239] ring-1 ring-[#FECDD3]',
        icon: <AlertTriangle size={14} className="text-[#EF4444]" />,
        border: 'border-[#FECDD3]',
        bg: 'bg-[#FFF1F2]',
      }
    default:
      return {
        label: 'Chưa phân tích',
        cls: 'text-slate-700',
        tagCls: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
        icon: <CheckCircle2 size={14} className="text-slate-400" />,
        border: 'border-slate-200',
        bg: 'bg-slate-50',
      }
  }
}

interface PantryPageProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

export default function PantryPage({ onNavigate, isLoggedIn: _isLoggedIn }: PantryPageProps) {
  /* ---------------- STATES ---------------- */
  const [items, setItems] = useState<PantryItem[]>([])
  const [currentDiet, setCurrentDiet] = useState<CoreDietType>('Thuần chay (Vegan)')
  const [matches, setMatches] = useState<RecipeMatch[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  const [isLoadingMatches, setIsLoadingMatches] = useState(false)
  const [isAddSubmitting, setIsAddSubmitting] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeCategory, setActiveCategory] = useState<PantryCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<string | null>(null)

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

  const syncDietFromProfile = useCallback(async () => {
    try {
      const p = await profileApi.getProfile()
      if (p?.dietaryType) {
        if (p.dietaryType === 'Lacto-vegetarian') {
          setCurrentDiet('Ăn chay có sữa (Lacto)')
        } else if (p.dietaryType === 'Ovo-vegetarian') {
          setCurrentDiet('Chay có trứng (Ovo)')
        } else if (p.dietaryType === 'Lacto-ovo vegetarian') {
          setCurrentDiet('Trứng & Sữa (Lacto-ovo)')
        } else if (p.dietaryType === 'Vegan') {
          setCurrentDiet('Thuần chay (Vegan)')
        }
      }
    } catch {
      // offline fallback
    }
  }, [])

  useEffect(() => {
    void syncDietFromProfile()
    const handleProfileUpdate = () => {
      void syncDietFromProfile()
    }
    window.addEventListener('vegetarian_user_updated', handleProfileUpdate)
    return () => {
      window.removeEventListener('vegetarian_user_updated', handleProfileUpdate)
    }
  }, [syncDietFromProfile])

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

  const itemsWithDiet = useMemo(() => {
    return items.map((it) => {
      const evalRes = evaluateIngredientForDiet(it.name, currentDiet)
      return {
        ...it,
        isSuitable: evalRes.isSuitable,
        suitableNote: evalRes.note,
      }
    })
  }, [items, currentDiet])

  const stats = useMemo(() => {
    const suit = itemsWithDiet.filter((i) => i.isSuitable === 'suitable').length
    const warn = itemsWithDiet.filter((i) => i.isSuitable === 'warning').length
    const unsuit = itemsWithDiet.filter((i) => i.isSuitable === 'unsuitable').length
    return { suit, warn, unsuit, total: itemsWithDiet.length }
  }, [itemsWithDiet])

  const filteredItems = useMemo(() => {
    if (!search.trim()) return itemsWithDiet
    const q = search.toLowerCase()
    return itemsWithDiet.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        PANTRY_CATEGORY_LABELS[i.category]?.toLowerCase().includes(q),
    )
  }, [itemsWithDiet, search])

  const grouped = useMemo(() => {
    const g: Record<string, PantryItem[]> = {}
    filteredItems.forEach((it) => {
      const k = it.category
      if (!g[k]) g[k] = []
      g[k].push(it)
    })
    return g
  }, [filteredItems])

  const violatingItems = useMemo(() => {
    return itemsWithDiet.filter((i) => i.isSuitable === 'unsuitable')
  }, [itemsWithDiet])

  const suggestedReplacements = useMemo(() => {
    return violatingItems.map((item) => {
      const sub = getSubstitutionForIngredient(item.name, currentDiet)
      return {
        item,
        ...sub,
      }
    })
  }, [violatingItems, currentDiet])

  const dietBadgeText = useMemo(() => {
    return currentDiet ? `Phù hợp ${currentDiet}` : 'Phù hợp Ăn chay'
  }, [currentDiet])

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
      try {
        const item = await addPantryItem({ ...form, name: form.name.trim() })
        setItems((prev) => [item, ...prev])
        const evalRes = evaluateIngredientForDiet(item.name, currentDiet)
        const t = suitabilityTone(evalRes.isSuitable, currentDiet)
        showToast(`Đã thêm ${item.name} · ${t.label}`)
      } catch {
        const localItem: PantryItem = {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: form.name.trim(),
          quantity: Number(form.quantity) || 1,
          unit: form.unit || 'g',
          category: form.category as PantryCategory,
          isSuitable: 'suitable',
          suitableNote: 'Đã thêm vào tủ bếp',
          addedAt: new Date().toISOString(),
        }
        setItems((prev) => [localItem, ...prev])
        const evalRes = evaluateIngredientForDiet(localItem.name, currentDiet)
        const t = suitabilityTone(evalRes.isSuitable, currentDiet)
        showToast(`Đã thêm ${localItem.name} · ${t.label}`)
      }
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
    } else {
      setItems((prev) => prev.filter((i) => i.id !== id))
      showToast(`Đã xóa ${cur?.name ?? 'nguyên liệu'}`)
    }
  }

  const handleApplyReplacement = async (
    item: PantryItem,
    newIngredientName: string,
    newCategory: PantryCategory,
  ) => {
    try {
      await updatePantryItem(item.id, {
        name: newIngredientName,
        quantity: item.quantity,
        unit: item.unit,
      })
    } catch {
      // offline fallback
    }

    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              name: newIngredientName,
              category: newCategory,
              isSuitable: 'suitable' as const,
              suitableNote: `Đã thay thế an toàn theo hồ sơ ${currentDiet}.`,
            }
          : i,
      ),
    )

    showToast(`✨ Đã thay thế "${item.name}" bằng "${newIngredientName}"`)
  }

  return (
    <div
      className="min-h-screen text-[#1F2937] font-['Inter']"
      style={{
        background:
          'radial-gradient(ellipse at top, #EEF8F1 0%, #F6FBF7 35%, #F8FAFB 70%)',
      }}
    >
      <div className="mx-auto w-full max-w-[1248px] px-[24px] pb-14 pt-6 sm:px-[16px]">
        {/* ================= BREADCRUMB ================= */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-[12.5px] font-medium text-slate-500">
            <button
              type="button"
              className="hover:text-[#2E7D32] transition-colors"
              onClick={() => onNavigate?.('/')}
            >
              Trang chủ
            </button>
            <span className="text-slate-300">/</span>
            <button
              type="button"
              className="hover:text-[#2E7D32] transition-colors"
              onClick={() => onNavigate?.('/recipes')}
            >
              Công thức
            </button>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-900">Tủ bếp AI</span>
          </div>
        </div>

        {/* ================= HERO ================= */}
        <section className="mb-7 flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
          <div className="max-w-[780px] flex-1">
            <h1
              className="font-extrabold tracking-[-0.015em] text-[#121C2A]"
              style={{ fontSize: '32px', lineHeight: '40px' }}
            >
              Gợi ý Món Chay Từ Tủ Bếp AI
            </h1>
            <p className="mt-1.5 text-[14.5px] leading-[23px] text-slate-600">
              Khám phá các món ăn ngon, chuẩn dinh dưỡng từ nguyên liệu sẵn có gian bếp của bạn cùng
              Trợ lý AI thông minh.
            </p>
          </div>
        </section>

        {/* ================= MAIN 2 COLUMNS ================= */}
        <section className="grid gap-6 lg:grid-cols-12 items-start">
          {/* =============== CỘT TRÁI: 3 CARDS LOGIC =============== */}
          <div className="space-y-5 lg:col-span-5">
            {/* ---------------- CARD 1: THÊM NGUYÊN LIỆU (Trên cùng) ---------------- */}
            <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-xs">
              <div className="mb-3.5 flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-emerald-50 text-[#2E7D32]">
                  <PlusIcon size={16} />
                </span>
                <h2 className="text-[16.5px] font-extrabold text-[#111827] tracking-tight">
                  Thêm nguyên liệu
                </h2>
              </div>

              {/* Ô Input + Nút Thêm compact */}
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <Input
                    placeholder="Nhập tên nguyên liệu (đậu phụ, nấm, rau...)"
                    value={search}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && search.trim()) {
                        handleQuickAdd(search.trim())
                        setSearch('')
                      }
                    }}
                    leftIcon={<SearchIcon size={14} className="text-slate-400" />}
                    className="!h-10 !rounded-xl !border-slate-300 text-[13.5px] w-full"
                  />
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={openAdd}
                  leftIcon={<PlusIcon size={14} />}
                  className="!h-10 shrink-0 !rounded-xl !bg-[#2E7D32] hover:!bg-[#1B5E20] !px-3.5 text-[13px] font-semibold"
                >
                  Thêm
                </Button>
              </div>

              {/* Dòng chip gợi ý nhanh với nhãn "Phổ biến:" */}
              <div className="mt-3.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500 mr-1">
                    Phổ biến:
                  </span>
                  {quickAddChips.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleQuickAdd(c.name)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50/70 px-2.5 py-1 text-[12px] font-medium text-slate-700 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      <span aria-hidden>{c.emoji}</span>
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Box Kiểm tra vi phạm chế độ ăn (CHỈ hiển thị khi có nguyên liệu) */}
              {items.length > 0 && (
                <div
                  className={`mt-4 rounded-xl border p-3.5 transition-all ${
                    stats.unsuit > 0
                      ? 'border-amber-200 bg-amber-50/70'
                      : 'border-emerald-200 bg-emerald-50/60'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[13px] font-bold text-slate-900">
                      <ShieldCheck size={16} className="text-[#2E7D32]" />
                      <span>Kiểm tra Chế độ {currentDiet}:</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] font-bold">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-800">
                        {stats.suit} Hợp lệ
                      </span>
                      {stats.unsuit + stats.warn > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-rose-800">
                          {stats.unsuit + stats.warn} Cảnh báo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ---------------- CARD 2: NGUYÊN LIỆU CỦA BẠN (Ở giữa) ---------------- */}
            <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-xs">
              <div className="mb-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-emerald-50 text-[#2E7D32]">
                    <UtensilsIcon size={16} />
                  </span>
                  <h2 className="text-[16.5px] font-extrabold text-[#111827] tracking-tight">
                    Nguyên liệu của bạn
                  </h2>
                </div>
                {items.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[12px] font-bold text-slate-700">
                    {items.length} món
                  </span>
                )}
              </div>

              {/* Nếu tủ bếp trống -> ẨN FILTER VÀ HIỆN EMPTY STATE TONE TRUNG TÍNH */}
              {items.length === 0 ? (
                <div className="py-7 px-4 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 shadow-xs mb-3">
                    <ShoppingBasket size={28} />
                  </div>
                  <h3 className="text-[15.5px] font-bold text-slate-800">
                    Tủ bếp của bạn đang trống
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 max-w-xs mx-auto">
                    Chưa có nguyên liệu nào trong tủ bếp. Hãy thêm nguyên liệu bạn đang có sẵn để AI gợi ý món ngon nhé.
                  </p>
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={openAdd}
                      leftIcon={<PlusIcon size={14} />}
                      className="!rounded-xl !bg-[#2E7D32] hover:!bg-[#1B5E20] font-semibold !px-4"
                    >
                      Thêm nguyên liệu đầu tiên
                    </Button>
                  </div>
                </div>
              ) : (
                /* Có nguyên liệu -> HIỂN THỊ FILTER CHIPS NẰM NGANG + DANH SÁCH */
                <div className="space-y-4">
                  {/* Filter chips nằm ngang (horizontal scrollable) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                    {categoryOrder.map((c) => {
                      const count =
                        c.key === 'all'
                          ? filteredItems.length
                          : filteredItems.filter((i) => i.category === c.key).length
                      const active = activeCategory === c.key
                      const label = c.label || (c.key === 'all' ? 'Tất cả' : c.key)
                      return (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => setActiveCategory(c.key)}
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all ${
                            active
                              ? 'border-[#2E7D32] bg-[#2E7D32] text-white shadow-xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:bg-emerald-50/50'
                          }`}
                        >
                          {active ? (
                            <Check size={12} className="text-white" />
                          ) : (
                            <span aria-hidden className="text-[12.5px] leading-none">
                              {c.emoji}
                            </span>
                          )}
                          <span>{label}</span>
                          <span
                            className={`ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                              active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Danh sách nguyên liệu */}
                  <div className="space-y-3.5">
                    {isLoadingItems ? (
                      <div className="space-y-2">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="h-14 animate-pulse rounded-xl border border-slate-100 bg-slate-50"
                          />
                        ))}
                      </div>
                    ) : filteredItems.length === 0 ? (
                      <div className="py-6 text-center text-[13px] text-slate-500">
                        Không có nguyên liệu nào trong danh mục này.
                      </div>
                    ) : (
                      Object.entries(grouped).map(([cat, list]) => (
                        <GroupBlock
                          key={cat}
                          cat={cat as PantryCategory}
                          list={list}
                          currentDiet={currentDiet}
                          onDelete={handleDelete}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ---------------- CARD 3: GỢI Ý THAY THẾ (Dưới cùng cột trái) ---------------- */}
            <div className="rounded-[18px] border border-emerald-200 bg-gradient-to-br from-white via-emerald-50/25 to-green-50/40 p-5 shadow-xs">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#2E7D32] text-white shadow-xs">
                    <SparklesIcon size={15} />
                  </span>
                  <div>
                    <h3 className="text-[15.5px] font-extrabold text-[#111827] tracking-tight">
                      Gợi ý thay thế thông minh
                    </h3>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  {dietBadgeText}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-emerald-200/90 bg-white/80 p-3.5 text-[12.5px] text-slate-600 leading-relaxed">
                  🌱 Khi bạn thêm nguyên liệu chưa phù hợp với chế độ {currentDiet}, AI sẽ tự động phân tích và đưa ra các lựa chọn thay thế thuần thực vật an toàn tại đây.
                </div>
              ) : suggestedReplacements.length === 0 ? (
                <div className="rounded-xl border border-emerald-200 bg-white p-3.5 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <span className="text-[20px]" aria-hidden>🌱</span>
                    <div>
                      <div className="text-[13px] font-bold text-emerald-800">
                        Tủ bếp 100% phù hợp chế độ {currentDiet}
                      </div>
                      <div className="text-[12px] text-slate-500 mt-0.5">
                        Không phát hiện nguyên liệu nào vi phạm quy tắc. Khi bạn thêm nguyên liệu chưa hợp, AI sẽ tự động gợi ý thay thế tại đây.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {suggestedReplacements.map(({ item, replacementName, category, icon, description }) => (
                    <ReplacementRow
                      key={item.id}
                      icon={icon}
                      from={item.name}
                      to={replacementName}
                      description={description}
                      onApply={() => handleApplyReplacement(item, replacementName, category)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* =============== CỘT PHẢI: HIỂN THỊ CÓ ĐIỀU KIỆN (MUTUALLY EXCLUSIVE) =============== */}
          <div className="lg:col-span-7">
            {/* Logic Mutually Exclusive dựa trên items.length:
                - Nếu items.length === 0: CHỈ hiển thị card "Chưa có gợi ý món nào phù hợp" (Ẩn card Món ngon nấu ngay)
                - Nếu items.length > 0: Hiển thị card "Món ngon nấu ngay" (Ẩn card Chưa có gợi ý) */}
            {items.length === 0 ? (
              /* CARD: CHƯA CÓ GỢI Ý MÓN NÀO PHÙ HỢP */
              <div className="rounded-[20px] border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center shadow-xs">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-[#2E7D32] shadow-xs mb-4">
                  <SparklesIcon size={32} />
                </div>
                <h2 className="text-[20px] font-extrabold text-[#111827] tracking-tight">
                  Chưa có gợi ý món nào phù hợp
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-slate-600 max-w-md mx-auto">
                  Tủ bếp hiện đang trống. Hãy thêm các nguyên liệu sẵn có ở gian bếp của bạn (như đậu phụ, nấm, cà chua, rau xanh...) vào cột bên trái để AI bắt đầu tính toán và đề xuất thực đơn nấu ngay nhé!
                </p>
                <div className="mt-6 flex justify-center">
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={openAdd}
                    leftIcon={<PlusIcon size={15} />}
                    className="!rounded-xl !bg-[#2E7D32] hover:!bg-[#1B5E20] font-semibold !px-6"
                  >
                    Thêm nguyên liệu ngay
                  </Button>
                </div>
              </div>
            ) : (
              /* CARD: MÓN NGON CÓ THỂ NẤU NGAY TỪ TỦ BẾP */
              <div className="space-y-5">
                {/* Header card */}
                <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                        <SparklesIcon size={18} />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-[18px] font-extrabold text-[#111827] tracking-tight">
                            Món ngon có thể nấu ngay từ tủ bếp
                          </h2>
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11.5px] font-bold text-emerald-800">
                            {matches.length} công thức
                          </span>
                        </div>
                        <p className="mt-0.5 text-[13px] text-slate-500">
                          AI đã đối chiếu và tìm thấy các công thức tối ưu dinh dưỡng dựa trên nguyên liệu trong bếp của bạn.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid 2 cột công thức tương thích */}
                <div className="grid gap-5 md:grid-cols-2">
                  {isLoadingMatches ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-[380px] animate-pulse rounded-[16px] border border-slate-200 bg-white"
                      />
                    ))
                  ) : matches.length === 0 ? (
                    <div className="md:col-span-2">
                      <EmptyState
                        title="Chưa tìm thấy công thức trùng khớp hoàn toàn"
                        description="Thêm thêm một số nguyên liệu cơ bản như đậu hũ, cà chua hoặc nấm để AI hoàn thiện gợi ý món ngon nhé."
                        actionLabel="Thêm thêm nguyên liệu"
                        onAction={openAdd}
                        icon={<SparklesIcon size={36} className="text-[#2E7D32]" />}
                      />
                    </div>
                  ) : (
                    matches.slice(0, 6).map((m) => (
                      <MatchCard
                        key={m.id}
                        m={m}
                        currentDiet={currentDiet}
                        onViewRecipe={() => {
                          showToast(`🍲 Đang mở công thức: ${m.title}`)
                          onNavigate?.(`/recipes/${encodeURIComponent(m.id)}`)
                        }}
                        onSave={() => showToast(`📌 Đã lưu: ${m.title} vào kế hoạch tuần`)}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* =============== ADD MODAL =============== */}
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
        description={`Nhập tên, số lượng và danh mục. Hệ thống sẽ tự động phân tích mức độ phù hợp với chế độ ${currentDiet}.`}
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
              disabled={isAddSubmitting}
              leftIcon={<PlusIcon size={14} />}
              onClick={handleSubmitAdd}
              className="!bg-[#2E7D32] hover:!bg-[#1B5E20]"
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
              helperText="Nhập tiếng Việt có dấu để hệ thống phân tích chính xác nhất."
              autoFocus
            />
          </div>
          <div>
            <Input
              label="Số lượng"
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="Ví dụ: 300"
              value={form.quantity}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setForm((f) => ({ ...f, quantity: e.target.value }))
                setFormErrors((p) => ({ ...p, quantity: undefined }))
              }}
              error={formErrors.quantity}
              helperText="Bỏ trống nếu không cần ghi rõ."
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
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-10 left-1/2 z-40 -translate-x-1/2 rounded-full bg-slate-900/90 px-5 py-2 text-[14px] font-semibold text-white shadow-lg backdrop-blur-md"
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
  currentDiet,
  onDelete,
}: {
  cat: PantryCategory
  list: PantryItem[]
  currentDiet?: CoreDietType
  onDelete: (id: string) => void
}) {
  const meta = CATEGORY_ORDER.find((c) => c.key === cat)
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-slate-600">
          <span aria-hidden>{meta?.emoji ?? '📦'}</span>
          {meta?.label ?? PANTRY_CATEGORY_LABELS[cat]}
          <span className="text-[11px] font-semibold text-slate-400">
            ({list.length})
          </span>
        </div>
        <span className="h-[1px] flex-1 mx-3 bg-gradient-to-r from-slate-200 via-emerald-100 to-transparent" />
      </div>
      <div className="space-y-2">
        {list.map((i) => (
          <ItemRow key={i.id} item={i} currentDiet={currentDiet} onDelete={() => onDelete(i.id)} />
        ))}
      </div>
    </div>
  )
}

function ItemRow({
  item,
  currentDiet,
  onDelete,
}: {
  item: PantryItem
  currentDiet?: CoreDietType
  onDelete: () => void
}) {
  const t = suitabilityTone(item.isSuitable, currentDiet)
  const d = new Date(item.addedAt)
  const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
  return (
    <div
      className={`group flex items-center justify-between gap-3 rounded-[12px] border ${t.border} ${t.bg} px-3 py-2.5 transition hover:shadow-xs`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-white text-[16px] shadow-2xs ring-1 ring-slate-100">
          {CATEGORY_ORDER.find((c) => c.key === item.category)?.emoji ?? '📦'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`line-clamp-1 text-[13.5px] font-bold ${t.cls}`}>{item.name}</span>
            <span
              className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold ${t.tagCls}`}
            >
              {t.icon}
              {t.label}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-slate-500">
            <span className="font-semibold text-slate-700">
              {item.quantity} {item.unit}
            </span>
            <span className="text-slate-300">·</span>
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
        className="!h-7 !w-7 shrink-0 !rounded-[8px] !p-0 !text-slate-400 transition hover:!bg-rose-50 hover:!text-rose-600 !min-w-0"
        leftIcon={<TrashIcon size={14} />}
      />
    </div>
  )
}

function ReplacementRow({
  icon,
  from,
  to,
  description,
  onApply,
}: {
  icon: string
  from: string
  to: string
  description?: string
  onApply: () => void
}) {
  return (
    <div className="rounded-[12px] border border-emerald-200 bg-white p-3 shadow-2xs transition hover:border-emerald-400">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-[18px]" aria-hidden>{icon}</span>
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="font-semibold text-rose-700 line-through decoration-rose-500">
              {from}
            </span>
            <span className="font-bold text-slate-400">→</span>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11.5px] font-bold text-emerald-800">
              {to}
            </span>
          </div>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          rightIcon={<ArrowRight size={13} />}
          onClick={onApply}
          className="!h-7.5 shrink-0 !rounded-[8px] !bg-[#2E7D32] hover:!bg-[#1B5E20] !px-3 !text-[12px] font-semibold"
        >
          Áp dụng
        </Button>
      </div>
      {description && (
        <p className="mt-1.5 pl-6 text-[11.5px] text-slate-500">
          {description}
        </p>
      )}
    </div>
  )
}

function MatchCard({
  m,
  currentDiet = 'Thuần chay (Vegan)',
  onViewRecipe,
  onSave,
}: {
  m: RecipeMatch
  currentDiet?: CoreDietType
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
      className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-md"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onViewRecipe}
        onKeyDown={onKey(onViewRecipe)}
        className="relative block w-full cursor-pointer overflow-hidden bg-slate-100"
      >
        <img
          src={m.cover}
          alt={m.title}
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
          }}
          className="h-[175px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Top badges */}
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-xs backdrop-blur-md ${
              veganOk
                ? 'bg-emerald-700/90 text-white'
                : 'bg-amber-100/90 text-amber-900 border border-amber-200'
            }`}
          >
            ✓ Chuẩn {currentDiet}
          </span>
        </div>
        <div className="absolute right-3 top-3 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-xs backdrop-blur-md ${
              match3of
                ? 'bg-emerald-100/95 text-emerald-900 border border-emerald-300'
                : 'bg-white/95 text-emerald-800'
            }`}
          >
            Khớp {m.matchedIngredients.length}/{Math.min(3, m.totalIngredients)} có sẵn
          </span>
        </div>
        <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-md">
          <ClockIcon size={11} /> {m.timeMin} phút
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3
            className="line-clamp-2 text-[16px] font-bold text-[#111827] group-hover:text-[#2E7D32] transition-colors leading-[23px]"
          >
            {m.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-[13px] leading-[19px] text-slate-500">
            {m.subtitle}
          </p>
        </div>

        {/* Match summary line */}
        <div className="text-[12px] text-slate-600">
          <span className="font-semibold text-emerald-800">
            Tủ bếp:{' '}
            {m.matchedIngredients.length > 0
              ? m.matchedIngredients.slice(0, 3).map((x) => `${x} (Có ✓)`).join(' · ')
              : 'Đang khớp...'}
          </span>
        </div>

        {/* Nutrition 4 col */}
        <div className="grid grid-cols-4 gap-1 rounded-xl border border-slate-100 bg-slate-50/70 p-2 text-center">
          <NutriBox label="Calo" value={`${m.kcal}`} unit="" tone="amber" />
          <NutriBox label="Đạm" value={`${Math.round(m.kcal * 0.18 / 4)}`} unit="g" tone="green" />
          <NutriBox label="Carb" value={`${Math.round(m.kcal * 0.5 / 4)}`} unit="g" tone="blue" />
          <NutriBox label="Béo" value={`${Math.round(m.kcal * 0.3 / 9)}`} unit="g" tone="rose" />
        </div>

        {/* MATCH % PROGRESS BAR */}
        <div className="mt-1 flex items-center gap-3">
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
        <div className="mt-auto flex items-center gap-2 pt-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            rightIcon={<ArrowRight size={14} />}
            onClick={onViewRecipe}
            className="!h-9.5 !rounded-xl !bg-[#2E7D32] hover:!bg-[#1B5E20] font-semibold text-[13px]"
          >
            Xem công thức
          </Button>
          <Button
            type="button"
            variant="outline"
            size="md"
            leftIcon={<Calendar size={14} />}
            onClick={onSave}
            className="!h-9.5 !w-9.5 shrink-0 !rounded-xl !p-0 !border-slate-300"
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
    <div className="rounded-lg bg-white px-1 py-1">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className={`text-[13px] font-extrabold ${colorMap[tone] ?? 'text-slate-800'}`}>
        {value}
        {unit && <span className="ml-0.5 text-[10px] font-bold">{unit}</span>}
      </div>
    </div>
  )
}
