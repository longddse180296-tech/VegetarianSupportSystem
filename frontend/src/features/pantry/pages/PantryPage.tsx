// Chức năng: tủ bếp và nguyên liệu sẵn có. Ghép dữ liệu, thao tác và các trạng thái tải/lỗi cho màn hình.
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bookmark,
  Calendar,
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
  Badge,
  Button,
  EmptyState,
  Input,
  Modal,
  PageHeading,
  Select,
  type SelectOption,
} from '../../../shared/components'
import {
  addPantryItem,
  CATEGORY_ORDER,
  type CoreDietType,
  deletePantryItem,
  getPantryCategories,
  getPantryItems,
  getQuickAddChips,
  getRecipeMatches,
  getSubstitutionForIngredient,
  QUICK_ADD_CHIPS,
  searchCatalogIngredients,
  type CatalogIngredient,
  updatePantryItem,
} from '../api/pantryApi'
import { profileApi } from '../../profile/api/profileApi'
import AlertError from '../../../shared/components/AlertError'
import { useRecipeSaves } from '../../favorites/hooks/useRecipeSaves'
import type {
  AddIngredientFormState,
  PantryCategory,
  PantryItem,
  PantrySuitability,
  RecipeMatch,
} from '../types/pantry.types'
import { DEFAULT_UNITS } from '../types/pantry.types'

// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (suitabilityTone); thuộc tủ bếp và nguyên liệu sẵn có.
function suitabilityTone(s: PantrySuitability, diet?: CoreDietType | null): {
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

// Cấu trúc PantryPageProps quy định dữ liệu trao đổi trong tủ bếp và nguyên liệu sẵn có.
interface PantryPageProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (PantryPage); thuộc tủ bếp và nguyên liệu sẵn có.
export default function PantryPage({ onNavigate, isLoggedIn }: PantryPageProps) {
  // Đồng bộ trạng thái hoặc tác động bên ngoài khi các phụ thuộc thay đổi.
  useEffect(() => {
    if (isLoggedIn === false) {
      try {
        sessionStorage.setItem('returnUrl', '/pantry')
      } catch {
        // ignore storage error
      }
      onNavigate?.('/login')
    }
  }, [isLoggedIn, onNavigate])
  /* ---------------- STATES ---------------- */
  const [items, setItems] = useState<PantryItem[]>([])
  const [currentDiet, setCurrentDiet] = useState<CoreDietType | null>(null)
  const [profileAllergies, setProfileAllergies] = useState<string[]>([])
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [matches, setMatches] = useState<RecipeMatch[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(true)
  const [pantryError, setPantryError] = useState<string | null>(null)
  const [pendingItem, setPendingItem] = useState<string | null>(null)
  const [isLoadingMatches, setIsLoadingMatches] = useState(false)
  const [isAddSubmitting, setIsAddSubmitting] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const recipeSaves = useRecipeSaves('Pantry')

  // Công thức trong tủ bếp dùng cùng kho đã lưu của Profile; không phải thao tác thêm vào thực đơn tuần.
  const saveRecipe = async (match: RecipeMatch) => {
    try {
      const saved = await recipeSaves.toggle(match.id)
      setToast(saved ? `Đã lưu ${match.title} vào Profile → Mục đã lưu → Công thức.` : `Đã bỏ lưu ${match.title}.`)
      window.setTimeout(() => setToast(null), 2500)
    } catch (error) {
      setPantryError(error instanceof Error ? error.message : 'Chưa lưu được công thức. Vui lòng thử lại.')
    }
  }

  const [quickAddChips, setQuickAddChips] = useState<typeof QUICK_ADD_CHIPS>(QUICK_ADD_CHIPS)

  const [catalogSuggestions, setCatalogSuggestions] = useState<CatalogIngredient[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  // Giữ tham chiếu giữa các lần render để quản lý yêu cầu hoặc phần tử giao diện.
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (handleSearchChange); thuộc tủ bếp và nguyên liệu sẵn có.
  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (!value.trim()) {
      setCatalogSuggestions([])
      setShowDropdown(false)
    }
  }

  // Đồng bộ trạng thái hoặc tác động bên ngoài khi các phụ thuộc thay đổi.
  useEffect(() => {
    if (!search.trim()) return

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const res = await searchCatalogIngredients(search)
        if (!cancelled) {
          setCatalogSuggestions(res)
          setShowDropdown(res.length > 0)
        }
      } catch {
        // ignore
      }
    }, 150)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [search])

  // Đăng ký sự kiện phục vụ màn hình và dọn bộ lắng nghe khi không còn sử dụng.
  useEffect(() => {
    // Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (handleClickOutside); thuộc tủ bếp và nguyên liệu sẵn có.
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Xử lý lựa chọn hoặc chuyển trạng thái giao diện theo thao tác người dùng (handleSelectCatalogItem); thuộc tủ bếp và nguyên liệu sẵn có.
  const handleSelectCatalogItem = async (ing: CatalogIngredient) => {
    setShowDropdown(false)
    setSearch('')
    setIsAddSubmitting(true)
    try {
      const item = await addPantryItem({
        name: ing.name,
        quantity: '200',
        unit: ing.defaultUnit || 'g',
        category: 'rau-cu-qua',
        ingredientId: ing.id,
      })
      setItems((prev) => [item, ...prev.filter((i) => i.id !== item.id)])
      showToast(`Đã lưu ${item.name} vào tủ bếp.`)
    } catch {
      setForm({
        name: ing.name,
        quantity: '200',
        unit: ing.defaultUnit || 'g',
        category: 'rau-cu-qua',
        ingredientId: ing.id,
      })
      setShowAddModal(true)
    } finally {
      setIsAddSubmitting(false)
    }
  }

  // Đồng bộ trạng thái hoặc tác động bên ngoài khi các phụ thuộc thay đổi.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [, chips] = await Promise.all([
        getPantryCategories(),
        getQuickAddChips(),
      ])
      if (cancelled) return
      setQuickAddChips(chips)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Hồ sơ đổi thì lấy lại đánh giá từ máy chủ, không phân loại lại chỉ từ tên nguyên liệu trên frontend.
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    let profileRequest = 0
    const loadProfile = (reloadPantry = false) => {
      const request = ++profileRequest
      setProfileLoading(true)
      void profileApi.getProfile(controller.signal).then(profile => {
        if (!active || request !== profileRequest) return
        const diets: Record<string, CoreDietType> = {
          Vegan: 'Thuần chay (Vegan)', 'Lacto-vegetarian': 'Ăn chay có sữa (Lacto)',
          'Ovo-vegetarian': 'Chay có trứng (Ovo)', 'Lacto-ovo vegetarian': 'Trứng & Sữa (Lacto-ovo)',
        }
        setCurrentDiet(diets[profile.dietaryType] ?? null)
        setProfileAllergies(profile.allergies || [])
        setProfileError(null)
        setProfileLoading(false)
        if (reloadPantry) void getPantryItems('all', controller.signal).then(items => {
          if (active && request === profileRequest) setItems(items)
        }).catch(error => { if (active) setPantryError(error instanceof Error ? error.message : 'Chưa cập nhật được đánh giá tủ bếp.') })
      }).catch(error => {
        if (active && request === profileRequest) {
          setProfileLoading(false)
          setCurrentDiet(null)
          setProfileAllergies([])
          setProfileError(error instanceof Error ? error.message : 'Chưa đọc được hồ sơ để đối chiếu nguyên liệu.')
        }
      })
    }
    const profileUpdated = () => loadProfile(true)
    const profileVisible = () => { if (document.visibilityState === 'visible') loadProfile(true) }
    loadProfile()
    window.addEventListener('vegetarian_user_updated', profileUpdated)
    window.addEventListener('focus', profileUpdated)
    document.addEventListener('visibilitychange', profileVisible)
    return () => {
      active = false; controller.abort()
      window.removeEventListener('vegetarian_user_updated', profileUpdated)
      window.removeEventListener('focus', profileUpdated)
      document.removeEventListener('visibilitychange', profileVisible)
    }
  }, [])

  const [form, setForm] = useState<AddIngredientFormState>({
    name: '',
    quantity: '',
    unit: 'g',
    category: '',
  })
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof AddIngredientFormState, string>>
  >({})

  const UNIT_OPTIONS: SelectOption[] = DEFAULT_UNITS.map((u) => ({ value: u, label: u }))

  // Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (showToast); thuộc tủ bếp và nguyên liệu sẵn có.
  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 1700)
  }

  // Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (loadItems); thuộc tủ bếp và nguyên liệu sẵn có.
  const loadItems = async () => {
    setIsLoadingItems(true)
    setPantryError(null)
    try { setItems(await getPantryItems('all')) }
    catch (error) { setPantryError(error instanceof Error ? error.message : 'Chưa tải được tủ bếp. Vui lòng thử lại.') }
    finally { setIsLoadingItems(false) }
  }

  // Đồng bộ trạng thái hoặc tác động bên ngoài khi các phụ thuộc thay đổi.
  useEffect(() => {
    const controller = new AbortController()
    // Không biến lỗi mạng thành tủ bếp rỗng; hủy cập nhật khi người dùng rời màn hình.
    void getPantryItems('all', controller.signal).then(data => {
      if (!controller.signal.aborted) setItems(data)
    }).catch(error => {
      if (!controller.signal.aborted) setPantryError(error instanceof Error ? error.message : 'Chưa tải được tủ bếp.')
    }).finally(() => { if (!controller.signal.aborted) setIsLoadingItems(false) })
    return () => controller.abort()
  }, [])

  // Đồng bộ trạng thái hoặc tác động bên ngoài khi các phụ thuộc thay đổi.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      setIsLoadingMatches(true)
      try {
        const data = await getRecipeMatches(items)
        if (!cancelled) setMatches(data)
      } catch (error) {
        if (!cancelled) {
          setMatches([])
          setPantryError(error instanceof Error ? error.message : 'Chưa tải được gợi ý món ăn. Vui lòng thử lại.')
        }
      } finally {
        if (!cancelled) setIsLoadingMatches(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [items])

  const itemsWithDiet = items

  const stats = useMemo(() => {
    const suit = itemsWithDiet.filter((i) => i.isSuitable === 'suitable').length
    const warn = itemsWithDiet.filter((i) => i.isSuitable === 'warning').length
    const unsuit = itemsWithDiet.filter((i) => i.isSuitable === 'unsuitable').length
    return { suit, warn, unsuit, total: itemsWithDiet.length }
  }, [itemsWithDiet])

  const violatingItems = useMemo(() => {
    return itemsWithDiet.filter((i) => i.isSuitable === 'unsuitable')
  }, [itemsWithDiet])

  const suggestedReplacements = useMemo(() => {
    return violatingItems.map((item) => {
      const sub = getSubstitutionForIngredient(item.name, currentDiet ?? undefined)
      return {
        item,
        ...sub,
      }
    })
  }, [violatingItems, currentDiet])

  const dietBadgeText = useMemo(() => {
    return currentDiet ? `Đối chiếu ${currentDiet}` : 'Chưa chọn chế độ ăn'
  }, [currentDiet])

  // Khôi phục hoặc kết thúc trạng thái thao tác hiện tại (resetForm); thuộc tủ bếp và nguyên liệu sẵn có.
  const resetForm = () => {
    setForm({ name: '', quantity: '', unit: 'g', category: 'rau-cu-qua' })
    setFormErrors({})
  }

  // Ghi nhận thay đổi dữ liệu và cập nhật kết quả cho bên gọi (openAdd); thuộc tủ bếp và nguyên liệu sẵn có.
  const openAdd = () => {
    resetForm()
    setShowAddModal(true)
  }
  // Ghi nhận thay đổi dữ liệu và cập nhật kết quả cho bên gọi (closeAdd); thuộc tủ bếp và nguyên liệu sẵn có.
  const closeAdd = () => {
    if (isAddSubmitting) return
    resetForm()
    setShowAddModal(false)
  }

  // Kiểm tra điều kiện hợp lệ trước khi cho phép xử lý tiếp (validateForm); thuộc tủ bếp và nguyên liệu sẵn có.
  const validateForm = (): boolean => {
    const next: Partial<Record<keyof AddIngredientFormState, string>> = {}
    if (!form.name.trim()) next.name = 'Vui lòng nhập tên nguyên liệu'
    else if (form.name.trim().length < 2) next.name = 'Tên tối thiểu 2 ký tự'
    if (!form.quantity.trim() || !Number.isFinite(Number(form.quantity)) || Number(form.quantity) <= 0)
      next.quantity = 'Vui lòng nhập số lượng lớn hơn 0.'
    if (!form.unit.trim()) next.unit = 'Vui lòng chọn đơn vị'
    setFormErrors(next)
    return Object.keys(next).length === 0
  }

  // Kiểm tra dữ liệu trước khi gửi thao tác và xử lý kết quả trả về (handleSubmitAdd); thuộc tủ bếp và nguyên liệu sẵn có.
  const handleSubmitAdd = async () => {
    if (isAddSubmitting || !validateForm()) return
    setIsAddSubmitting(true)
    setPantryError(null)
    try {
      const item = await addPantryItem({ ...form, name: form.name.trim() })
      setItems(previous => [item, ...previous.filter(existing => existing.id !== item.id)])
      showToast('Đã lưu ' + item.name + ' vào tủ bếp.')
      closeAdd()
    } catch (error) {
      // Không tạo nguyên liệu cục bộ để giả thành công; giữ nội dung biểu mẫu cho lần thử lại.
      setPantryError(error instanceof Error ? error.message : 'Chưa lưu được nguyên liệu. Vui lòng thử lại.')
    } finally { setIsAddSubmitting(false) }
  }

  // Ghi nhận thay đổi dữ liệu và cập nhật kết quả cho bên gọi (handleQuickAdd); thuộc tủ bếp và nguyên liệu sẵn có.
  const handleQuickAdd = async (name: string) => {
    try {
      const results = await searchCatalogIngredients(name)
      const exact = results.find(
        (r) => r.name.toLowerCase() === name.toLowerCase(),
      ) || results[0]
      if (exact) {
        setForm({
          name: exact.name,
          quantity: '200',
          unit: exact.defaultUnit || 'g',
          category: 'rau-cu-qua',
          ingredientId: exact.id,
        })
      } else {
        setForm({ name, quantity: '200', unit: 'g', category: 'rau-cu-qua' })
      }
    } catch {
      setForm({ name, quantity: '200', unit: 'g', category: 'rau-cu-qua' })
    }
    setShowAddModal(true)
  }

  // Xóa mục được chọn theo phạm vi và điều kiện của tính năng (handleDelete); thuộc tủ bếp và nguyên liệu sẵn có.
  const handleDelete = async (id: string) => {
    if (pendingItem) return
    setPendingItem(id)
    setPantryError(null)
    try {
      await deletePantryItem(id)
      setItems(previous => previous.filter(item => item.id !== id))
      showToast('Đã xóa nguyên liệu khỏi tủ bếp.')
    } catch (error) {
      setPantryError(error instanceof Error ? error.message : 'Chưa xóa được nguyên liệu. Danh sách được giữ nguyên để bạn thử lại.')
    } finally { setPendingItem(null) }
  }

  // Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (handleApplyReplacement); thuộc tủ bếp và nguyên liệu sẵn có.
  const handleApplyReplacement = async (item: PantryItem, name: string, _category: PantryCategory) => {
    if (pendingItem) return
    setPendingItem(item.id)
    setPantryError(null)
    try {
      const updated = await updatePantryItem(item.id, { name, quantity: item.quantity ?? undefined, unit: item.unit ?? undefined })
      if (!updated) throw new Error('Chưa nhận được kết quả thay nguyên liệu. Vui lòng tải lại.')
      // Hiển thị đúng kết quả phân loại backend, không tự gắn nhãn an toàn sau khi đổi tên.
      setItems(previous => previous.map(existing => existing.id === item.id ? updated : existing))
      showToast('Đã cập nhật nguyên liệu trong tủ bếp.')
    } catch (error) {
      setPantryError(error instanceof Error ? error.message : 'Chưa thay được nguyên liệu. Dữ liệu cũ được giữ nguyên.')
    } finally { setPendingItem(null) }
  }

  // Hiển thị giao diện tủ bếp và nguyên liệu sẵn có từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <div className="ui-page-container py-8 space-y-6">
      {recipeSaves.error && <AlertError message={recipeSaves.error} onRetry={recipeSaves.reload} />}
      {pantryError && <AlertError title="Chưa hoàn tất thao tác với tủ bếp" message={pantryError} onRetry={() => void loadItems()} />}
      {pendingItem && <p role="status" className="text-sm text-slate-600">Đang cập nhật nguyên liệu...</p>}
      <PageHeading
        title="Gợi ý Món Chay Từ Tủ bếp"
        description="Khám phá các món ăn ngon, chuẩn dinh dưỡng từ nguyên liệu sẵn có gian bếp của bạn cùng Trợ lý AI thông minh."
        breadcrumbs={[
          { label: 'Trang chủ', onClick: () => onNavigate?.('/') },
          { label: 'Công thức', onClick: () => onNavigate?.('/recipes') },
          { label: 'Tủ bếp AI' },
        ]}
        eyebrow={<Badge icon={<SparklesIcon size={14} />}>Trợ lý nguyên liệu &amp; Tủ bếp</Badge>}
      />

        {/* Tủ bếp chỉ dùng chế độ ăn/dị ứng đã khai báo; không yêu cầu chỉ số cơ thể để gợi ý món. */}
        <section aria-label="Hồ sơ áp dụng cho tủ bếp" className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-slate-900">Hồ sơ áp dụng cho tủ bếp</h2>
            <button type="button" className="min-h-10 text-sm font-semibold text-emerald-800 underline" onClick={() => onNavigate?.('/profile')}>Cập nhật hồ sơ</button>
          </div>
          {profileLoading ? <p role="status" className="text-sm text-slate-600">Đang đọc chế độ ăn và dị ứng...</p>
            : profileError ? <p role="alert" className="text-sm text-red-800">{profileError} Vui lòng kiểm tra hồ sơ trước khi chọn món.</p>
            : <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div><p className="font-semibold">Chế độ ăn</p><p>{currentDiet || 'Chưa khai báo chế độ ăn trong hồ sơ.'}</p></div>
              <div><p className="font-semibold">Dị ứng đã khai báo</p>{profileAllergies.length ? <div className="mt-1 flex flex-wrap gap-1.5">{profileAllergies.map(name => <span key={name} className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-red-800">{name}</span>)}</div> : <p>Chưa khai báo dị ứng.</p>}</div>
            </div>}
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

              {/* Ô Input Autocomplete + Nút Thêm compact */}
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0 relative" ref={dropdownRef}>
                  <Input
                    placeholder="Tìm hoặc nhập nguyên liệu (đậu hũ, nấm, rau...)"
                    value={search}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
                    onFocus={() => {
                      if (catalogSuggestions.length > 0) setShowDropdown(true)
                    }}
                    onClick={() => {
                      if (catalogSuggestions.length > 0) setShowDropdown(true)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && search.trim()) {
                        if (catalogSuggestions.length > 0) {
                          handleSelectCatalogItem(catalogSuggestions[0])
                        } else {
                          handleQuickAdd(search.trim())
                          setSearch('')
                        }
                      } else if (e.key === 'Escape') {
                        setShowDropdown(false)
                      }
                    }}
                    leftIcon={<SearchIcon size={14} className="text-slate-400" />}
                    className="!h-10 !rounded-xl !border-slate-300 text-[13.5px] w-full"
                  />

                  {/* Autocomplete Dropdown */}
                  {showDropdown && catalogSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                      <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Nguyên liệu gợi ý chuẩn ({catalogSuggestions.length})
                      </div>
                      <div className="divide-y divide-slate-100">
                        {catalogSuggestions.map((ing) => {
                          const recipes = ing.recipeNames || []
                          // Hiển thị giao diện tủ bếp và nguyên liệu sẵn có từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
                          return (
                            <button
                              key={ing.id}
                              type="button"
                              onClick={() => handleSelectCatalogItem(ing)}
                              className="w-full text-left rounded-lg p-2.5 transition hover:bg-emerald-50/80 group cursor-pointer"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[13.5px] font-bold text-slate-900 group-hover:text-[#2E7D32] flex items-center gap-1.5">
                                  <span>🥗</span>
                                  <span>{ing.name}</span>
                                </span>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                  {ing.defaultUnit || 'g'}
                                </span>
                              </div>
                              {recipes.length > 0 ? (
                                <p className="mt-1 text-[11.5px] text-slate-500 line-clamp-1">
                                  <span className="font-semibold text-emerald-700">🍲 Có trong món: </span>
                                  {recipes.slice(0, 3).join(', ')}
                                  {recipes.length > 3 ? ` và +${recipes.length - 3} món khác` : ''}
                                </p>
                              ) : (
                                <p className="mt-0.5 text-[11.5px] text-slate-400">
                                  🌱 Nguyên liệu giàu dinh dưỡng
                                </p>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
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
                      <span>Đối chiếu chế độ ăn và dị ứng trong hồ sơ:</span>
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
                <div className="space-y-4">
                  {/* Danh sách nguyên liệu */}
                  <div className="space-y-2">
                    {isLoadingItems ? (
                      <div className="space-y-2">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="h-14 animate-pulse rounded-xl border border-slate-100 bg-slate-50"
                          />
                        ))}
                      </div>
                    ) : itemsWithDiet.length === 0 ? (
                      <div className="py-6 text-center text-[13px] text-slate-500">
                        Chưa có nguyên liệu nào trong tủ bếp.
                      </div>
                    ) : (
                      itemsWithDiet.map((item) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          currentDiet={currentDiet}
                          onDelete={() => handleDelete(item.id)}
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
                  🌱 Nguyên liệu được đối chiếu với chế độ ăn và dị ứng đã khai báo. Kiểm tra thành phần của lựa chọn thay thế trước khi sử dụng.
                </div>
              ) : suggestedReplacements.length === 0 ? (
                <div className="rounded-xl border border-emerald-200 bg-white p-3.5 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <span className="text-[20px]" aria-hidden>🌱</span>
                    <div>
                      <div className="text-[13px] font-bold text-emerald-800">
                        Chưa ghi nhận nguyên liệu không phù hợp với chế độ {currentDiet}
                      </div>
                      <div className="text-[12px] text-slate-500 mt-0.5">
                        Kết quả dựa trên thông tin nguyên liệu hiện có. Gợi ý thay thế sẽ xuất hiện khi hệ thống có dữ liệu phù hợp.
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
                          Công thức được đối chiếu với hồ sơ và nguyên liệu trong tủ bếp. Bạn có thể lưu để xem lại trong Profile.
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" leftIcon={<Bookmark size={15} />} onClick={() => onNavigate?.('/favorites?type=Recipe')}>Công thức đã lưu</Button>
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
                        saved={recipeSaves.isSaved(m.id)}
                        saving={recipeSaves.isSaving(m.id)}
                        saveDisabled={!recipeSaves.ready}
                        onSave={() => void saveRecipe(m)}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Nút quay lại danh sách công thức ở cuối trang */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex justify-start">
          <Button
            type="button"
            variant="outline"
            size="md"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => onNavigate?.('/recipes')}
            className="!rounded-[12px] !border-slate-300 hover:!border-[#2E7D32] hover:!text-[#2E7D32] font-semibold"
          >
            Quay lại danh sách công thức
          </Button>
        </div>

      {/* =============== ADD MODAL =============== */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { if (!isAddSubmitting) closeAdd() }}
        maxWidth="md"
        title={
          <span className="flex items-center gap-2">
            <PlusIcon size={18} className="text-[#2E7D32]" />
            Thêm nguyên liệu vào Tủ bếp AI
          </span>
        }
        description={`Nhập tên và số lượng nguyên liệu. Hệ thống sẽ tự động phân tích mức độ phù hợp với hồ sơ đã khai báo.`}
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
          {pantryError && <div className="sm:col-span-2"><AlertError message={pantryError} /></div>}
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

function ItemRow({
  item,
  currentDiet,
  onDelete,
}: {
  item: PantryItem
  currentDiet?: CoreDietType | null
  onDelete: () => void
}) {
  const t = suitabilityTone(item.isSuitable, currentDiet)
  const d = new Date(item.addedAt)
  const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
  // Hiển thị giao diện tủ bếp và nguyên liệu sẵn có từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
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
              {item.quantity === null ? 'Chưa có định lượng' : `${item.quantity} ${item.unit ?? ''}`}
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

// Thành phần ReplacementRow nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc tủ bếp và nguyên liệu sẵn có.
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
  // Hiển thị giao diện tủ bếp và nguyên liệu sẵn có từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
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

// Thành phần MatchCard nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc tủ bếp và nguyên liệu sẵn có.
function MatchCard({
  m,
  currentDiet = 'Thuần chay (Vegan)',
  onViewRecipe,
  onSave,
  saved,
  saving,
  saveDisabled,
}: {
  m: RecipeMatch
  currentDiet?: CoreDietType | null
  onViewRecipe: () => void
  onSave: () => void
  saved: boolean
  saving: boolean
  saveDisabled: boolean
}) {
  // Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (onKey); thuộc tủ bếp và nguyên liệu sẵn có.
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

  // Hiển thị giao diện tủ bếp và nguyên liệu sẵn có từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
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
            Theo hồ sơ {currentDiet || 'đã khai báo'}
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
          <NutriBox label="Calo" value={m.kcal === null ? '—' : `${m.kcal}`} unit="kcal" tone="amber" />
          <NutriBox label="Đạm" value="—" unit="g" tone="green" />
          <NutriBox label="Carb" value="—" unit="g" tone="blue" />
          <NutriBox label="Béo" value="—" unit="g" tone="rose" />
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
            leftIcon={<Bookmark size={14} fill={saved ? 'currentColor' : 'none'} />}
            onClick={onSave}
            isLoading={saving}
            disabled={saveDisabled}
            className="!h-9.5 !w-9.5 shrink-0 !rounded-xl !p-0 !border-slate-300"
            aria-label={`${saved ? 'Bỏ lưu' : 'Lưu công thức'} ${m.title}`}
            aria-pressed={saved}
            title={saved ? 'Bỏ lưu công thức' : 'Lưu vào Profile → Mục đã lưu → Công thức'}
          />
        </div>
      </div>
    </div>
  )
}

// Thành phần NutriBox nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc tủ bếp và nguyên liệu sẵn có.
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
  // Hiển thị giao diện tủ bếp và nguyên liệu sẵn có từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
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
