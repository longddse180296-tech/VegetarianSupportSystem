import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Calendar,
  Check,
  Clock as ClockIcon,
  Plus as PlusIcon,
  Search as SearchIcon,
  ShieldCheck,
  Sparkles as SparklesIcon,
  Trash2 as TrashIcon,
  TriangleAlert as TriangleAlertIcon,
  UtensilsCrossed as UtensilsIcon,
} from 'lucide-react'
import {
  PageHeading,
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
  cleanPantryName,
  type CoreDietType,
  deletePantryItem,
  getPantryCategories,
  getPantryItems,
  getQuickAddChips,
  getRecipeMatches,
  getSubstitutionCandidates,
  QUICK_ADD_CHIPS,
  updatePantryItem,
} from '../api/pantryApi'
import AlertError from '../../../shared/components/AlertError'
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
  const dietShort =
    diet === 'Ăn chay có sữa (Lacto)'
      ? 'Lacto'
      : diet === 'Chay có trứng (Ovo)'
        ? 'Ovo'
        : diet === 'Trứng & Sữa (Lacto-ovo)'
          ? 'Lacto-ovo'
          : 'Vegan'

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
        label: `Không hợp với ${dietShort}`,
        cls: 'text-[#9F1239]',
        tagCls: 'bg-[#FFE4E6] text-[#9F1239] ring-1 ring-[#FECDD3]',
        icon: <AlertTriangle size={15} className="text-[#EF4444]" />,
        border: 'border-[#FECDD3]',
        bg: 'bg-[#FFF1F2]',
      }
    default:
      return {
        label: '',
        cls: 'text-slate-800',
        tagCls: '',
        icon: null,
        border: 'border-slate-200',
        bg: 'bg-white',
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
  const [currentDiet, setCurrentDiet] = useState<CoreDietType | undefined>(undefined)
  const [matches, setMatches] = useState<RecipeMatch[]>([])
  const [itemsError, setItemsError] = useState<string | null>(null)
  const [matchesError, setMatchesError] = useState<string | null>(null)
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

  /* ---- Sync diet from profile if available & react to profile updates ---- */
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
      // guest or offline
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
    setItemsError(null)
    try {
      const data = await getPantryItems(activeCategory)
      setItems(data)
    } catch (error) {
      setItemsError(error instanceof Error ? error.message : 'Không thể tải tủ bếp.')
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
      setMatchesError(null)
      try {
        const data = await getRecipeMatches(items)
        if (!cancelled) setMatches(data)
      } catch (error) {
        if (!cancelled) {
          setMatches([])
          setMatchesError(error instanceof Error ? error.message : 'Không thể tải gợi ý công thức.')
        }
      } finally {
        if (!cancelled) setIsLoadingMatches(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [items])

  /* ---------------- ITEMS WITH DIET SUITABILITY ---------------- */
  const itemsWithDiet = items

  /* ---------------- STATS ---------------- */
  const stats = useMemo(() => {
    const suit = itemsWithDiet.filter((i) => i.isSuitable === 'suitable').length
    const warn = itemsWithDiet.filter((i) => i.isSuitable === 'warning').length
    const unsuit = itemsWithDiet.filter((i) => i.isSuitable === 'unsuitable').length
    return { suit, warn, unsuit, total: itemsWithDiet.length }
  }, [itemsWithDiet])

  /* ---------------- FILTERED ITEMS (for UI) ---------------- */
  const filteredItems = useMemo(() => {
    if (!search.trim()) return itemsWithDiet
    const q = search.toLowerCase()
    return itemsWithDiet.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        PANTRY_CATEGORY_LABELS[i.category]?.toLowerCase().includes(q),
    )
  }, [itemsWithDiet, search])

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

  /* ---------------- AI SUBSTITUTIONS FOR VIOLATING INGREDIENTS ---------------- */
  const violatingItems = useMemo(() => {
    return itemsWithDiet.filter((i) => i.isSuitable === 'unsuitable')
  }, [itemsWithDiet])

  const [suggestedReplacements, setSuggestedReplacements] = useState<Array<{
    item: PantryItem; replacementName: string; category: PantryCategory; icon: string; description: string
  }>>([])
  useEffect(() => {
    let active = true
    void Promise.all(violatingItems.map(async (item) => {
      const candidates = await getSubstitutionCandidates(item.id)
      return candidates.map((candidate) => ({
        item, replacementName: candidate.name, category: item.category, icon: '🌱',
        description: [...candidate.allergenWarnings, ...candidate.avoidedFoodWarnings].join('; '),
      }))
    })).then((groups) => { if (active) setSuggestedReplacements(groups.flat()) })
    return () => { active = false }
  }, [violatingItems])

  const dietBadgeText = useMemo(() => {
    switch (currentDiet) {
      case 'Thuần chay (Vegan)':
        return 'Thuần chay (Vegan)'
      case 'Ăn chay có sữa (Lacto)':
        return 'Ăn chay có sữa (Lacto)'
      case 'Chay có trứng (Ovo)':
        return 'Chay có trứng (Ovo)'
      case 'Trứng & Sữa (Lacto-ovo)':
        return 'Trứng & Sữa (Lacto-ovo)'
      default:
        return currentDiet || 'Chưa khai báo chế độ ăn'
    }
  }, [currentDiet])

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
      showToast(`Đã thêm ${item.name}`)
      closeAdd()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể thêm nguyên liệu. Vui lòng thử lại.')
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
      showToast('Không thể xóa nguyên liệu. Dữ liệu chưa được thay đổi.')
    }
  }

  const handleApplyReplacement = async (
    item: PantryItem,
    newIngredientName: string,
    newCategory: PantryCategory,
  ) => {
    try {
      const updated = await updatePantryItem(item.id, {
        name: newIngredientName,
        quantity: item.quantity,
        unit: item.unit,
      })
      if (!updated) throw new Error('Không thể lưu thay thế nguyên liệu.')
      setItems((prev) => prev.map((existing) => existing.id === item.id ? { ...updated, category: newCategory } : existing))
      showToast(`Đã thay thế "${item.name}" bằng "${updated.name}"`)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể lưu thay thế nguyên liệu.')
    }
  }

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div
      className="min-h-screen text-[#1F2937] font-sans"
      style={{
        background:
          'radial-gradient(ellipse at top, #EEF8F1 0%, #F6FBF7 35%, #F8FAFB 70%)',
      }}
    >
      <div className="ui-page-container pb-14 pt-6">
        {itemsError && <AlertError title="Không thể tải tủ bếp" message={itemsError} onRetry={() => void loadItems()} />}
        {matchesError && <AlertError title="Không thể tải gợi ý công thức" message={matchesError} />}
        <PageHeading
          title="Tủ bếp cá nhân"
          description="Quản lý nguyên liệu sẵn có và khám phá công thức từ tủ bếp của bạn."
          breadcrumbs={[{label:'Trang chủ', onClick: () => onNavigate?.('/')}, {label:'Tủ bếp'}]}
        />

        {/* ================= MAIN 2 COLUMNS ================= */}
        <section className="grid gap-6 lg:grid-cols-12">
          {/* =============== LEFT: PANTRY =============== */}
          <div className="space-y-6 lg:col-span-5">
            {/* PANTRY CARD */}
            <div
              className="rounded-[16px] border border-[#E5E7EB] bg-white p-5 shadow-xs"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#E8F5E9] text-[#2E7D32]">
                  <UtensilsIcon size={16} />
                </span>
                <span
                  className="font-extrabold tracking-[-0.005em] text-[#121C2A]"
                  style={{ fontSize: '17px', lineHeight: '24px' }}
                >
                  Tủ bếp của bạn
                </span>
              </div>

              {/* SEARCH + ADD */}
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <Input
                    size={13}
                    placeholder="Nhập nguyên liệu bạn đang có (vd: đậu phụ, cà chua, nấm...)"
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
                  onClick={openAdd}
                  className="!h-10 shrink-0 rounded-[10px] !bg-[#2E7D32] hover:!bg-[#1B5E20] !text-white px-4 py-2 text-sm font-medium"
                >
                  Thêm nguyên liệu
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
                      <span>{c.emoji}</span> {c.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* DIET CHECK SUMMARY */}
              <div
                className={`mt-4 rounded-[14px] border px-4 py-3 ${
                  stats.unsuit > 0
                    ? 'border-[#FDE68A] bg-[#FFFBEB]'
                    : 'border-[#C8E6C9] bg-[#F0FDF4]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[13.5px] font-bold text-[#121C2A]">
                    <ShieldCheck size={16} className="text-[#2E7D32]" />
                    <span>Kiểm tra vi phạm Chế độ {currentDiet}:</span>
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
                    const label = c.label || (c.key === 'all' ? 'Tất cả' : c.key)
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setActiveCategory(c.key)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-all select-none ${
                          active
                            ? 'border-[#2E7D32] bg-[#2E7D32] text-white shadow-sm ring-2 ring-[#2E7D32]/20'
                            : 'border-[#E5E7EB] bg-white text-[#1F2937] hover:bg-[#F5FBF6] hover:border-[#C8E6C9]'
                        }`}
                      >
                        {active ? (
                          <Check size={14} className="text-white" />
                        ) : (
                          <span aria-hidden className="text-[13px] leading-none">
                            {c.emoji}
                          </span>
                        )}
                        <span>{label}</span>
                        <span
                          className={`ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-bold ${
                            active ? 'bg-white/20 text-white' : 'bg-[#F3F4F6] text-[#374151]'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
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
                      actionLabel="Thêm nguyên liệu đầu tiên"
                      onAction={openAdd}
                      icon={<UtensilsIcon size={40} className="text-[#2E7D32]" />}
                    />
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
                      Gợi ý thay thế theo chế độ {currentDiet}
                    </h3>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[11.5px] font-bold text-[#166534] ring-1 ring-[#86EFAC]">
                  {dietBadgeText}
                </span>
              </div>

              {suggestedReplacements.length === 0 ? (
                <div className="rounded-[14px] border border-[#86EFAC] bg-white p-3.5 shadow-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-[22px]" aria-hidden>🌱</span>
                    <div>
                      <div className="text-[13.5px] font-bold text-[#166534]">
                        Chưa có gợi ý thay thế
                      </div>
                      <div className="text-[12px] text-[#4B5563]">
                        Gợi ý chỉ xuất hiện khi hệ thống có nguyên liệu thay thế từ danh mục. Không có gợi ý không có nghĩa mọi nguyên liệu đều phù hợp.
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

              <p className="mt-3 flex items-start gap-1.5 text-[12.5px] font-medium text-[#166534]">
                <ShieldCheck size={14} className="mt-0.5 shrink-0" />
                <span>
                  Nguyên liệu chỉ được thay đổi sau khi bạn xác nhận lưu. Vui lòng kiểm tra kỹ cảnh báo dị ứng và nguồn gốc nguyên liệu.
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
                    Tìm thấy {matches.length} công thức phù hợp dựa trên nguyên liệu hiện có trong tủ bếp của bạn.
                  </p>
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
                          actionLabel="Thêm nguyên liệu"
                          onAction={openAdd}
                          icon={<SparklesIcon size={40} className="text-[#2E7D32]" />}
                        />
                      </div>
                    )
                  : matches.slice(0, 4).map((m) => (
                      <MatchCard
                        key={m.id}
                        m={m}
                        currentDiet={currentDiet}
                        onViewRecipe={() => {
                          showToast(`🍲 Đang mở công thức: ${cleanPantryName(m.title)}`)
                          onNavigate?.(`/recipes/${encodeURIComponent(m.id)}`)
                        }}
                      />
                    ))}
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
        description={`Nhập đầy đủ tên, số lượng và danh mục. Hệ thống sẽ tự động phân tích mức độ phù hợp ${currentDiet} dựa trên tên gọi.`}
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
  const displayName = cleanPantryName(item.name)
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
            <span className={`line-clamp-1 text-[14px] font-bold ${t.cls}`}>{displayName}</span>
            {t.label ? (
              <span
                className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-bold ${t.tagCls}`}
              >
                {t.icon}
                {t.label}
              </span>
            ) : null}
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
  const cleanFrom = cleanPantryName(from)
  const cleanTo = cleanPantryName(to)
  return (
    <div className="rounded-[14px] border border-[#86EFAC] bg-white p-3.5 shadow-xs transition hover:border-[#22C55E]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="text-[20px]" aria-hidden>{icon}</span>
          <div className="flex flex-wrap items-center gap-2 text-[13.5px]">
            <span className="font-semibold text-[#9F1239] line-through decoration-red-500 decoration-2">
              {cleanFrom}
            </span>
            <span className="font-bold text-[#9CA3AF]">→</span>
            <span className="inline-flex items-center rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[12px] font-bold text-[#166534] ring-1 ring-[#86EFAC]">
              {cleanTo}
            </span>
          </div>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          rightIcon={<ArrowRight size={13} />}
          onClick={onApply}
          className="!h-8 shrink-0 !rounded-[10px] !bg-[#2E7D32] hover:!bg-[#1B5E20] !px-3.5 !text-[12.5px] !font-medium"
        >
          Áp dụng thay thế
        </Button>
      </div>
      {description && (
        <p className="mt-2 pl-[34px] text-[12px] text-[#4B5563]">
          {description}
        </p>
      )}
    </div>
  )
}

const FALLBACK_PANTRY_RECIPE_IMG =
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'

function MatchCard({
  m,
  currentDiet,
  onViewRecipe,
}: {
  m: RecipeMatch
  currentDiet?: CoreDietType
  onViewRecipe: () => void
}) {
  const [imgSrc, setImgSrc] = useState(m.cover || FALLBACK_PANTRY_RECIPE_IMG)
  const displayTitle = cleanPantryName(m.title)

  const onKey =
    (fn: () => void) =>
    (e: React.KeyboardEvent): void => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        fn()
      }
    }

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
        className="relative block w-full cursor-pointer overflow-hidden bg-slate-100"
      >
        <img
          src={imgSrc}
          alt={displayTitle}
          loading="lazy"
          onError={() => setImgSrc(FALLBACK_PANTRY_RECIPE_IMG)}
          className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        {/* Top badges */}
        <div className="absolute left-3 top-3 flex items-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#166534]/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs backdrop-blur-xs">
            🌱 {currentDiet || 'Món chay'}
          </span>
        </div>
        <div className="absolute right-3 top-3 flex items-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#166534] ring-1 ring-[#86EFAC] shadow-xs backdrop-blur-xs">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#DCFCE7] text-[#166534] text-[10px]">
              ✓
            </span>
            Khớp {m.matchedIngredients.length}/{m.totalIngredients}
          </span>
        </div>
        <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-bold text-white ring-1 ring-white/10 backdrop-blur-xs">
          <ClockIcon size={11} /> {m.timeMin} phút
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3
            className="line-clamp-2 font-extrabold tracking-[-0.005em] text-[#121C2A]"
            style={{ fontSize: '17px', lineHeight: '24px' }}
          >
            {displayTitle}
          </h3>
          <p
            className="mt-1 line-clamp-2 text-[13px] leading-[20px] text-[#4B5563]"
          >
            {m.subtitle}
          </p>
        </div>

        {/* Ingredients match details */}
        <div className="text-[12.5px] text-[#4B5563] space-y-1">
          {m.matchedIngredients.length > 0 && (
            <div className="font-medium text-[#166534]">
              <span className="font-bold">Đã có: </span>
              {m.matchedIngredients.slice(0, 3).map(cleanPantryName).join(' · ')}
            </div>
          )}
          {m.missingList.length > 0 && (
            <div className="text-[12px] text-[#4B5563]">
              <span className="font-semibold text-amber-700">Cần thêm: </span>
              <span className="text-slate-600">
                {m.missingList.slice(0, 3).map(cleanPantryName).join(' · ')}
              </span>
            </div>
          )}
        </div>

        {/* Nutrition 4 col */}
        <div className="grid grid-cols-4 gap-1.5 rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFB] p-2">
          <NutriBox
            label="Calo"
            value={m.kcal == null ? '--' : `${m.kcal}`}
            unit={m.kcal == null ? '' : 'kcal'}
            tone="amber"
          />
          <NutriBox label="Đạm" value="--" unit="" tone="green" />
          <NutriBox label="Carb" value="--" unit="" tone="blue" />
          <NutriBox label="Béo" value="--" unit="" tone="rose" />
        </div>

        {/* MATCH % PROGRESS BAR bg-[#2E7D32] fill */}
        <div className="mt-2 flex items-center gap-3">
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
        <div className="mt-auto pt-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            leftIcon={<SparklesIcon size={14} />}
            rightIcon={<ArrowRight size={14} />}
            onClick={onViewRecipe}
            className="!h-10 !rounded-[12px] !font-bold"
          >
            Xem công thức chi tiết
          </Button>
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
      <div className="text-[10px] font-bold uppercase tracking-[0.02em] text-[#6B7280]">
        {label}
      </div>
      <div
        className={`mt-0.5 text-[13.5px] font-extrabold tabular-nums ${colorMap[tone] ?? 'text-[#1F2937]'}`}
      >
        {value}
        {unit && <span className="ml-0.5 text-[10.5px] font-bold">{unit}</span>}
      </div>
    </div>
  )
}
