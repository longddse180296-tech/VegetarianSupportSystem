import { useEffect, useState } from 'react'
import {
  Calendar,
  Check,
  Clock,
  ExternalLink,
  FileDown,
  Loader2,
  Moon,
  Plus,
  RefreshCw,
  ShoppingCart,
  Sun,
  Sunrise,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import {
  addPlanDays,
  formatPlanDate,
  mealNutrition,
  mealPlanApi,
  nextMonday,
  PLAN_DIET_LABELS,
} from '../api/mealPlanApi'
import type {
  ReplacementRecipe,
  PlanShoppingItem,
  SavedPlan,
  SavedPlanMeal,
  SavedPlanSummary,
} from '../types/mealPlanBackend.types'
import { MealPlanSkeleton } from '../components/MealPlanSkeleton'
import { Badge, Breadcrumb, PageHeading } from '../../../shared/components'
import {
  exportMealPlanPdf,
  exportShoppingListPdf,
} from '../utils/mealPlanPdfExport'

const slotConfig = {
  Breakfast: {
    label: 'Bữa sáng',
    icon: Sunrise,
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
    iconColor: 'text-amber-600',
  },
  Lunch: {
    label: 'Bữa trưa',
    icon: Sun,
    badgeClass: 'bg-emerald-50 text-[#2E7D32] border-emerald-200/80',
    iconColor: 'text-[#2E7D32]',
  },
  Dinner: {
    label: 'Bữa tối',
    icon: Moon,
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    iconColor: 'text-indigo-600',
  },
} as const

const slots = ['Breakfast', 'Lunch', 'Dinner'] as const
const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : 'Thao tác chưa thành công. Vui lòng thử lại.'

const formatSavedAt = (date: string) => new Date(date).toLocaleString('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
})

const actionButtonClass =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-300 transition-all disabled:opacity-50 disabled:pointer-events-none'

export const MealPlanDetailPage = ({
  planId,
  onNavigate,
}: {
  planId?: string
  onNavigate?: (path: string) => void
}) => {
  const [plan, setPlan] = useState<SavedPlan | null>(null)
  const [day, setDay] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [shoppingOpen, setShoppingOpen] = useState(false)
  const [shoppingDay, setShoppingDay] = useState<number | null>(null)
  const [dailyShoppingItems, setDailyShoppingItems] = useState<PlanShoppingItem[]>([])
  const [shoppingLoading, setShoppingLoading] = useState(false)
  const [shoppingError, setShoppingError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SavedPlan | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [copyDate, setCopyDate] = useState(nextMonday)
  const [copyOpen, setCopyOpen] = useState(false)
  const [replacement, setReplacement] = useState<SavedPlanMeal | null>(null)
  const [recipes, setRecipes] = useState<ReplacementRecipe[]>([])
  const [recipeCount, setRecipeCount] = useState(0)
  const [recipePage, setRecipePage] = useState(1)
  const [recipeSearch, setRecipeSearch] = useState('')
  const [recipesLoading, setRecipesLoading] = useState(false)
  const [recipeError, setRecipeError] = useState<string | null>(null)
  const [recipeId, setRecipeId] = useState('')
  const [servings, setServings] = useState(1)
  const [refresh, setRefresh] = useState(0)
  const [savedPlans, setSavedPlans] = useState<SavedPlanSummary[]>([])
  const planDiet = plan?.profileDiet
  const shoppingPlanId = plan?.id

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      await Promise.resolve()
      if (controller.signal.aborted) return
      setLoading(true)
      setError(null)
      setPlan(null)
      setShoppingOpen(false)
      setDeleteTarget(null)
      setCopyOpen(false)
      setReplacement(null)
      try {
        const items = await mealPlanApi.listAll(controller.signal)
        if (!controller.signal.aborted) setSavedPlans(items)
        const id = planId || items[0]?.id
        const detail = id ? await mealPlanApi.get(id, controller.signal) : null
        if (!controller.signal.aborted) {
          setPlan(detail)
          setDay(1)
        }
      } catch (err) {
        if (!controller.signal.aborted) setError(message(err))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [planId, refresh])

  useEffect(() => {
    if (!shoppingOpen || !shoppingPlanId || shoppingDay === null) return
    const controller = new AbortController()
    mealPlanApi.shoppingList(shoppingPlanId, shoppingDay, controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setDailyShoppingItems(items)
      })
      .catch((err) => {
        if (!controller.signal.aborted) setShoppingError(message(err))
      })
      .finally(() => {
        if (!controller.signal.aborted) setShoppingLoading(false)
      })
    return () => controller.abort()
  }, [shoppingOpen, shoppingDay, shoppingPlanId])

  useEffect(() => {
    if (!replacement || !planDiet) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setRecipesLoading(true)
      setRecipeError(null)
      mealPlanApi
        .recipes(planDiet, recipeSearch, recipePage, controller.signal)
        .then((result) => {
          if (!controller.signal.aborted) {
            setRecipes(result.items)
            setRecipeCount(result.totalCount)
          }
        })
        .catch((err) => {
          if (!controller.signal.aborted) {
            setRecipes([])
            setRecipeError(message(err))
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setRecipesLoading(false)
        })
    }, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [replacement, planDiet, recipeSearch, recipePage])

  const act = async (operation: () => Promise<void>) => {
    if (busy) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await operation()
    } catch (err) {
      setError(message(err))
    } finally {
      setBusy(false)
    }
  }

  const openReplacement = (meal: SavedPlanMeal) => {
    setReplacement(meal)
    setRecipeId('')
    setRecipeSearch('')
    setRecipePage(1)
    setRecipes([])
    setServings(meal.servings)
  }

  const updatePurchase = (itemId: string, isPurchased: boolean) => {
    if (!plan || busy) return
    const previous = plan
    setPlan({
      ...plan,
      shoppingItems: plan.shoppingItems.map((item) =>
        item.id === itemId ? { ...item, isPurchased } : item,
      ),
    })
    setDailyShoppingItems((items) => items.map((item) =>
      item.id === itemId ? { ...item, isPurchased } : item,
    ))
    void act(async () => {
      try {
        const shoppingItems = await mealPlanApi.purchase(plan.id, itemId, isPurchased)
        setPlan({
          ...plan,
          shoppingItems,
        })
      } catch (err) {
        setPlan(previous)
        setDailyShoppingItems((items) => items.map((item) =>
          item.id === itemId ? { ...item, isPurchased: !isPurchased } : item,
        ))
        throw err
      }
    })
  }

  const selectShoppingDay = (selectedDay: number | null) => {
    setShoppingDay(selectedDay)
    setShoppingError(null)
    setShoppingLoading(selectedDay !== null)
    setDailyShoppingItems([])
  }

  const deleteSelectedPlan = async () => {
    if (!deleteTarget || deleteBusy) return
    setDeleteBusy(true)
    setDeleteError(null)
    try {
      await mealPlanApi.remove(deleteTarget.id)
      const remaining = savedPlans.filter((saved) => saved.id !== deleteTarget.id)
      setSavedPlans(remaining)
      setPlan(null)
      setDeleteTarget(null)
      onNavigate?.(remaining.length > 0 ? `/meal-plans/${remaining[0].id}` : '/meal-plans')
    } catch (err) {
      setDeleteError(message(err))
    } finally {
      setDeleteBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="ui-page-container py-8 space-y-6">
        <Breadcrumb
          items={[
            { label: 'Trang chủ', onClick: () => onNavigate?.('/') },
            { label: 'Thực đơn' },
          ]}
        />
        <MealPlanSkeleton />
      </div>
    )
  }

  const meals = plan?.meals.filter((meal) => meal.dayNumber === day) || []
  const sum = (
    key:
      | 'caloriesPerServing'
      | 'proteinGramPerServing'
      | 'carbohydrateGramPerServing'
      | 'fatGramPerServing',
  ) =>
    meals.some((meal) => meal[key] === null)
      ? null
      : meals.reduce((total, meal) => total + (meal[key] ?? 0) * meal.servings, 0)

  const weeklyValue = (
    key:
      | 'caloriesPerServing'
      | 'proteinGramPerServing'
      | 'carbohydrateGramPerServing'
      | 'fatGramPerServing',
    total: number,
  ) =>
    plan?.meals.some((meal) => meal[key] === null)
      ? 'Chưa đầy đủ'
      : mealNutrition(total, 1)

  return (
    <div className="ui-page-container py-8 space-y-6">
      <PageHeading
        title="Thực đơn của bạn"
        description="Kế hoạch 7 ngày · 21 bữa ăn dinh dưỡng cân bằng · Lưu theo tài khoản"
        breadcrumbs={[
          { label: 'Trang chủ', onClick: () => onNavigate?.('/') },
          ...(planId
            ? [
                {
                  label: 'Thực đơn',
                  onClick: () => onNavigate?.('/meal-plans'),
                },
                { label: 'Chi tiết thực đơn' },
              ]
            : [{ label: 'Thực đơn' }]),
        ]}
        eyebrow={<Badge icon={<Calendar size={14} />}>Kế hoạch 7 ngày</Badge>}
        actions={
          <button
            type="button"
            disabled={busy}
            onClick={() => onNavigate?.('/meal-plans/setup')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-sm font-bold shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50"
          >
            <Plus size={16} />
            Tạo thực đơn mới
          </button>
        }
      />

      {savedPlans.length > 0 && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Thực đơn đã lưu</p>
            <p className="text-xs text-slate-600">Chọn thực đơn để xem lại hoặc xoá khỏi lịch sử.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={plan?.id ?? planId ?? savedPlans[0]?.id}
              onChange={(event) => onNavigate?.(`/meal-plans/${event.target.value}`)}
              className="min-w-64 max-w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
              aria-label="Chọn thực đơn đã lưu"
            >
              {savedPlans.map((saved) => (
                <option key={saved.id} value={saved.id}>
                  {saved.name} · {saved.weekStartDate} · tạo {formatSavedAt(saved.createdAt)}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!plan || busy || deleteBusy}
              onClick={() => {
                setDeleteError(null)
                setDeleteTarget(plan)
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
            >
              <Trash2 size={14} />
              Xoá thực đơn này
            </button>
          </div>
        </section>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-meal-plan-title"
            aria-describedby="delete-meal-plan-description"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4"
          >
            <h2 id="delete-meal-plan-title" className="text-lg font-extrabold text-slate-900">
              Xoá thực đơn đã lưu?
            </h2>
            <p id="delete-meal-plan-description" className="text-sm text-slate-600 leading-relaxed">
              Bạn sẽ xoá <strong>{deleteTarget.name}</strong> (tuần {formatPlanDate(deleteTarget.weekStartDate)},
              tạo lúc {formatSavedAt(deleteTarget.createdAt)}) cùng 21 bữa và danh sách đi chợ liên quan.
              Thao tác này không thể khôi phục.
            </p>
            {deleteError && <p role="alert" className="text-sm text-rose-700">{deleteError}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={deleteBusy}
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                type="button"
                disabled={deleteBusy}
                onClick={() => void deleteSelectedPlan()}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2 text-sm font-bold text-white hover:bg-rose-800 disabled:opacity-50"
              >
                <Trash2 size={15} />
                {deleteBusy ? 'Đang xoá...' : 'Xoá thực đơn'}
              </button>
            </div>
          </section>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-center justify-between"
        >
          <span>{error}</span>
          <button
            disabled={busy}
            onClick={() => setRefresh((value) => value + 1)}
            className="text-xs font-bold text-rose-700 underline hover:no-underline ml-3"
          >
            Tải lại
          </button>
        </div>
      )}

      {notice && (
        <p
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 font-medium"
        >
          {notice}
        </p>
      )}

      {!plan && !error && (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-4">
          <Calendar className="w-12 h-12 mx-auto text-[#2E7D32]" />
          <h2 className="font-extrabold text-xl text-slate-900">
            Bạn chưa có thực đơn nào
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Kiểm tra chế độ ăn và dị ứng trong hồ sơ rồi tạo kế hoạch 21 bữa đầu
            tiên được cá nhân hóa riêng cho bạn.
          </p>
          <button
            type="button"
            onClick={() => onNavigate?.('/meal-plans/setup')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-sm font-bold shadow-sm transition-all"
          >
            <Plus size={16} />
            Bắt đầu tạo thực đơn ngay
          </button>
        </div>
      )}

      {plan && (
        <>
          {/* Banner Thực đơn hiện tại */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B5E20] via-[#2E7D32] to-[#388E3C] p-6 md:p-8 text-white shadow-md">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="relative space-y-3 max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-white">
                {PLAN_DIET_LABELS[plan.profileDiet]}
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {plan.name}
              </h2>
              <p className="text-sm text-emerald-100 font-medium">
                {formatPlanDate(plan.weekStartDate)} –{' '}
                {formatPlanDate(addPlanDays(plan.weekStartDate, 6))} ·{' '}
                {plan.meals.length} bữa ăn · Đã lưu trong tài khoản
              </p>
              <p className="text-xs text-white/80 leading-relaxed">
                Kế hoạch được lập theo chế độ ăn, dị ứng và thực phẩm cần tránh đã
                lưu. Bạn có thể tự do đổi món hoặc tải bản PDF tiện lợi.
              </p>
            </div>
          </section>

          {/* Thanh công cụ hành động */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              disabled={busy}
              className={actionButtonClass}
              onClick={() =>
                void act(async () => {
                  setPlan(await mealPlanApi.regenerate(plan.id))
                  setNotice('Đã tạo lại và lưu toàn bộ 21 bữa mới.')
                })
              }
            >
              <RefreshCw
                size={15}
                className={busy ? 'animate-spin text-[#2E7D32]' : 'text-slate-600'}
              />
              Tạo lại toàn bộ
            </button>
            <button
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-xs font-bold text-[#2E7D32] hover:bg-emerald-100/80 shadow-xs transition-all disabled:opacity-50"
              onClick={() =>
                void act(async () => {
                  const items = await mealPlanApi.shoppingList(plan.id)
                  setPlan({ ...plan, shoppingItems: items })
                  selectShoppingDay(null)
                  setShoppingOpen(true)
                })
              }
            >
              <ShoppingCart size={15} />
              Danh sách đi chợ
            </button>
            <button
              disabled={busy}
              className={actionButtonClass}
              onClick={() => {
                setCopyDate(addPlanDays(plan.weekStartDate, 7))
                setCopyOpen(true)
              }}
            >
              <Calendar size={15} className="text-slate-600" />
              Áp dụng sang tuần mới
            </button>
            <button
              disabled={busy}
              className={actionButtonClass}
              onClick={() => {
                exportMealPlanPdf(plan)
                setNotice('Đã chuẩn bị bản in/PDF thực đơn 7 ngày.')
              }}
            >
              <FileDown size={15} className="text-slate-600" />
              Tải PDF thực đơn
            </button>
          </div>

          {/* Chọn ngày 1 -> 7 (Căn đều 7 ngày vừa vặn chiều ngang) */}
          <div
            className="grid grid-cols-7 gap-1.5 sm:gap-2 w-full"
            aria-label="Chọn ngày trong tuần"
          >
            {Array.from({ length: 7 }, (_, index) => index + 1).map((number) => {
              const isActive = day === number
              const planDate = addPlanDays(plan.weekStartDate, number - 1)
              const parts = planDate.split('-')
              const shortDate = parts.length === 3 ? `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}` : ''
              return (
                <button
                  key={number}
                  aria-pressed={isActive}
                  disabled={busy}
                  onClick={() => setDay(number)}
                  className={`rounded-2xl py-2 px-1 sm:px-2 flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1.5 text-xs font-bold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#2E7D32] text-white shadow-sm ring-2 ring-[#2E7D32]/25'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                  }`}
                >
                  <span className="whitespace-nowrap">Ngày {number}</span>
                  {shortDate && (
                    <span className={`text-[11px] font-semibold whitespace-nowrap ${isActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                      <span className="hidden md:inline">· </span>{shortDate}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* 3 Thẻ Bữa ăn (Sáng / Trưa / Tối) */}
          <div className="grid md:grid-cols-3 gap-5">
            {slots.map((slot) => {
              const meal = meals.find((item) => item.slot === slot)
              const cfg = slotConfig[slot]
              const SlotIcon = cfg.icon

              if (!meal) {
                return (
                  <div
                    key={slot}
                    className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400 space-y-2 flex flex-col items-center justify-center min-h-[300px]"
                  >
                    <UtensilsCrossed size={32} className="text-slate-300" />
                    <span>Chưa có dữ liệu {cfg.label.toLowerCase()}</span>
                  </div>
                )
              }

              return (
                <article
                  key={slot}
                  className="rounded-3xl border border-slate-200/80 bg-white p-4 md:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 hover:border-emerald-200 group"
                >
                  <div className="space-y-3.5">
                    {/* Ảnh món ăn & Badges đè */}
                    <div
                      onClick={() =>
                        onNavigate?.(`/recipes/${meal.recipeId}?from=meal-plans`)
                      }
                      className="relative w-full h-44 rounded-2xl overflow-hidden bg-slate-100 cursor-pointer"
                    >
                      {meal.imageUrl ? (
                        <img
                          src={meal.imageUrl}
                          alt={meal.recipeName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const placeholder = e.currentTarget.parentElement?.querySelector(
                              '.fallback-placeholder',
                            )
                            if (placeholder) placeholder.classList.remove('hidden')
                          }}
                        />
                      ) : null}

                      {/* Fallback khi không có ảnh hoặc ảnh lỗi */}
                      <div
                        className={`fallback-placeholder ${
                          meal.imageUrl ? 'hidden' : ''
                        } absolute inset-0 bg-gradient-to-br from-emerald-50 via-slate-50 to-slate-100 flex flex-col items-center justify-center p-4 text-center`}
                      >
                        <UtensilsCrossed size={32} className="text-[#2E7D32]/40 mb-1" />
                        <span className="text-xs text-slate-500 font-medium line-clamp-2">
                          {meal.recipeName}
                        </span>
                      </div>

                      {/* Tag Buổi ăn ở góc trên trái */}
                      <div className="absolute top-2.5 left-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-xs ${cfg.badgeClass}`}
                        >
                          <SlotIcon size={13} className={cfg.iconColor} />
                          {cfg.label}
                        </span>
                      </div>

                      {/* Tag Thời gian ở góc trên phải */}
                      <div className="absolute top-2.5 right-2.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-black/60 backdrop-blur-md text-white shadow-xs">
                          <Clock size={12} />
                          {meal.totalTimeMinutes} phút
                        </span>
                      </div>

                      {/* Tag Khẩu phần ở góc dưới trái */}
                      <div className="absolute bottom-2.5 left-2.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-black/65 backdrop-blur-md text-white">
                          {meal.servings} khẩu phần
                        </span>
                      </div>
                    </div>

                    {/* Tên món & Calo */}
                    <div className="space-y-1.5">
                      <h3
                        onClick={() =>
                          onNavigate?.(`/recipes/${meal.recipeId}?from=meal-plans`)
                        }
                        className="text-base font-extrabold text-slate-900 hover:text-[#2E7D32] transition-colors cursor-pointer line-clamp-2 leading-snug"
                        title={meal.recipeName}
                      >
                        {meal.recipeName}
                      </h3>

                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <span className="text-slate-500 font-medium">
                          Năng lượng:
                        </span>
                        <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-md">
                          {mealNutrition(meal.caloriesPerServing, meal.servings)}
                          {meal.caloriesPerServing !== null ? ' kcal' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Dinh dưỡng 3 chỉ số Đạm / Carbs / Béo */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                      <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-medium">
                          Đạm
                        </span>
                        <strong className="font-extrabold text-slate-800">
                          {mealNutrition(
                            meal.proteinGramPerServing,
                            meal.servings,
                          )}
                          g
                        </strong>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-medium">
                          Carbs
                        </span>
                        <strong className="font-extrabold text-slate-800">
                          {mealNutrition(
                            meal.carbohydrateGramPerServing,
                            meal.servings,
                          )}
                          g
                        </strong>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-medium">
                          Béo
                        </span>
                        <strong className="font-extrabold text-slate-800">
                          {mealNutrition(meal.fatGramPerServing, meal.servings)}
                          g
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Nút Xem công thức & Đổi món */}
                  <div className="flex gap-2 pt-3 mt-3 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        onNavigate?.(`/recipes/${meal.recipeId}?from=meal-plans`)
                      }
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:border-[#2E7D32] hover:text-[#2E7D32] hover:bg-emerald-50/40 transition-all disabled:opacity-50"
                    >
                      <ExternalLink size={13} />
                      Xem công thức
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => openReplacement(meal)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-50 text-[#2E7D32] hover:bg-[#2E7D32] hover:text-white border border-emerald-200/60 text-xs font-bold transition-all disabled:opacity-50"
                    >
                      <RefreshCw size={13} />
                      Đổi món
                    </button>
                  </div>
                </article>
              )
            })}
          </div>

          {/* Dinh dưỡng tổng hợp trong ngày */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
            <h3 className="font-extrabold text-base text-slate-900">
              Tổng quan dinh dưỡng Ngày {day}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {(
                [
                  ['Năng lượng (kcal)', sum('caloriesPerServing')],
                  ['Chất đạm (g)', sum('proteinGramPerServing')],
                  ['Carbohydrate (g)', sum('carbohydrateGramPerServing')],
                  ['Chất béo (g)', sum('fatGramPerServing')],
                ] as const
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl bg-emerald-50/60 border border-emerald-100 p-4"
                >
                  <p className="text-xs text-slate-500 font-medium">{label}</p>
                  <strong className="text-xl font-black text-[#2E7D32] mt-0.5 block">
                    {mealNutrition(value, 1)}
                  </strong>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tổng cả tuần: Năng lượng (kcal){' '}
              <strong className="text-slate-800">
                {weeklyValue('caloriesPerServing', plan.nutrition.calories)}
              </strong>{' '}
              · Đạm (g){' '}
              <strong className="text-slate-800">
                {weeklyValue('proteinGramPerServing', plan.nutrition.proteinGrams)}
              </strong>{' '}
              · Carbs (g){' '}
              <strong className="text-slate-800">
                {weeklyValue(
                  'carbohydrateGramPerServing',
                  plan.nutrition.carbohydrateGrams,
                )}
              </strong>{' '}
              · Béo (g){' '}
              <strong className="text-slate-800">
                {weeklyValue('fatGramPerServing', plan.nutrition.fatGrams)}
              </strong>
              . Dữ liệu dinh dưỡng được tính chuẩn xác theo từng khẩu phần nguyên
              liệu.
            </p>
          </section>
        </>
      )}



      {/* Modal Danh sách đi chợ */}
      {plan && shoppingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Danh sách đi chợ"
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 md:p-8 space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-[#2E7D32] flex items-center justify-center">
                  <ShoppingCart size={18} />
                </span>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Danh sách đi chợ ({shoppingDay === null ? '21 bữa' : `Ngày ${shoppingDay} · 3 bữa`})
                </h2>
              </div>
              <button
                type="button"
                aria-label="Đóng"
                disabled={busy}
                onClick={() => setShoppingOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2" aria-label="Chọn ngày cho danh sách đi chợ">
              {[null, ...Array.from({ length: 7 }, (_, index) => index + 1)].map((number) => (
                <button
                  key={number ?? 'week'}
                  type="button"
                  aria-pressed={shoppingDay === number}
                  onClick={() => selectShoppingDay(number)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors ${shoppingDay === number
                    ? 'bg-[#2E7D32] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-[#2E7D32]'}`}
                >
                  {number === null ? 'Cả tuần' : `Ngày ${number}`}
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Số lượng cần mua đã tự động đối soát và trừ đi nguyên liệu bạn có sẵn
              trong Tủ bếp. Đánh dấu đã mua áp dụng cho nguyên liệu của cả tuần và được lưu ngay vào hệ thống.
            </p>

            {shoppingDay !== null && (
              <p className="text-xs font-semibold text-slate-600">
                Ngày {shoppingDay} · {formatPlanDate(addPlanDays(plan.weekStartDate, shoppingDay - 1))}
              </p>
            )}

            {shoppingLoading && <p role="status" className="text-sm text-slate-500 py-6 text-center">Đang tải nguyên liệu...</p>}
            {shoppingError && <p role="alert" className="text-sm text-rose-700">{shoppingError}</p>}
            {!shoppingLoading && !shoppingError && (shoppingDay === null ? plan.shoppingItems : dailyShoppingItems).length === 0 && (
              <p className="text-sm text-slate-500 py-8 text-center">
                {shoppingDay === null ? 'Danh sách đi chợ trống.' : 'Ngày này chưa có nguyên liệu cần liệt kê.'}
              </p>
            )}

            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
              {!shoppingLoading && !shoppingError && (shoppingDay === null ? plan.shoppingItems : dailyShoppingItems).map((item) => (
                <label
                  key={item.id}
                  className={`flex items-center gap-3.5 rounded-2xl border p-3 text-sm transition-colors cursor-pointer ${
                    item.isPurchased
                      ? 'border-slate-100 bg-slate-50/70 text-slate-400'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.isPurchased}
                    disabled={busy}
                    onChange={(event) =>
                      updatePurchase(item.id, event.target.checked)
                    }
                    className="w-4 h-4 rounded text-[#2E7D32] accent-[#2E7D32] cursor-pointer"
                  />
                  <div className="flex-1">
                    <span
                      className={`font-semibold ${
                        item.isPurchased ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {item.ingredientName}
                    </span>
                    <small className="block text-slate-500 text-xs">
                      Cần: {item.requiredQuantity} {item.unit} · Có trong tủ:{' '}
                      {item.pantryQuantity} {item.unit}
                    </small>
                  </div>
                  <strong
                    className={`text-sm ${
                      item.isPurchased ? 'text-slate-400' : 'text-[#2E7D32]'
                    }`}
                  >
                    {item.quantityToBuy} {item.unit}
                  </strong>
                </label>
              ))}
            </div>

            {busy && (
              <p role="status" className="text-xs text-slate-500 italic">
                Đang lưu trạng thái...
              </p>
            )}
            {error && (
              <p role="alert" className="text-xs font-medium text-rose-700">
                {error}
              </p>
            )}

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                disabled={busy || shoppingLoading || !!shoppingError}
                onClick={() => {
                  exportShoppingListPdf(plan, shoppingDay === null ? plan.shoppingItems : dailyShoppingItems, shoppingDay)
                  setNotice('Đã chuẩn bị bản in/PDF danh sách đi chợ.')
                }}
              >
                <FileDown size={15} />
                Tải tệp PDF danh sách đi chợ
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Modal Áp dụng sang tuần mới */}
      {plan && copyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            role="dialog"
            aria-modal="true"
            aria-label="Áp dụng sang tuần mới"
            onSubmit={(event) => {
              event.preventDefault()
              void act(async () => {
                const copy = await mealPlanApi.applyToWeek(plan.id, copyDate)
                setCopyOpen(false)
                onNavigate?.(`/meal-plans/${copy.id}`)
              })
            }}
            className="w-full max-w-md rounded-3xl bg-white p-6 space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-lg font-extrabold text-slate-900">
                Áp dụng sang tuần mới
              </h2>
              <button
                type="button"
                aria-label="Đóng"
                disabled={busy}
                onClick={() => setCopyOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Hệ thống sẽ sao chép cấu trúc 21 bữa sang tuần mới, đồng thời tính
              lại danh sách đi chợ theo số lượng thực tế trong Tủ bếp của bạn.
            </p>

            <label className="block text-sm font-bold text-slate-800">
              Ngày bắt đầu tuần mới
              <input
                aria-label="Ngày bắt đầu tuần mới"
                type="date"
                required
                value={copyDate}
                disabled={busy}
                onChange={(event) => setCopyDate(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 p-3 text-sm font-normal text-slate-900 focus:outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20"
              />
            </label>

            {error && (
              <p role="alert" className="text-xs font-medium text-rose-700">
                {error}
              </p>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={busy}
                className="flex-1 rounded-2xl border border-slate-200 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => setCopyOpen(false)}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[#2E7D32] hover:bg-[#1B5E20] py-3 text-xs font-bold text-white shadow-sm transition-all"
              >
                <Check size={15} />
                {busy ? 'Đang lưu...' : 'Áp dụng ngay'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Đổi món */}
      {plan && replacement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            role="dialog"
            aria-modal="true"
            aria-label="Đổi món"
            onSubmit={(event) => {
              event.preventDefault()
              if (!recipeId) return
              void act(async () => {
                setPlan(
                  await mealPlanApi.replace(
                    plan.id,
                    replacement,
                    recipeId,
                    servings,
                  ),
                )
                setReplacement(null)
                setNotice('Đã đổi món và cập nhật lại dinh dưỡng, danh sách đi chợ.')
              })
            }}
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 md:p-8 space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Đổi món · {slotConfig[replacement.slot].label} Ngày{' '}
                  {replacement.dayNumber}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đang thay thế cho: <strong>{replacement.recipeName}</strong>
                </p>
              </div>
              <button
                type="button"
                aria-label="Đóng"
                disabled={busy}
                onClick={() => setReplacement(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Các công thức hiển thị phù hợp với chế độ ăn của kế hoạch. Hệ thống
              sẽ kiểm tra thêm dị ứng và thực phẩm cần tránh khi lưu.
            </p>

            <input
              aria-label="Tìm công thức thay thế"
              placeholder="Tìm kiếm công thức món chay..."
              maxLength={120}
              value={recipeSearch}
              disabled={busy}
              onChange={(event) => {
                setRecipeSearch(event.target.value)
                setRecipePage(1)
                setRecipeId('')
              }}
              className="w-full rounded-2xl border border-slate-200 p-3 text-sm font-normal text-slate-900 focus:outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20"
            />

            <div className="space-y-2.5 max-h-[42vh] overflow-y-auto pr-1">
              {recipesLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin text-[#2E7D32]" />
                  <span>Đang tìm công thức phù hợp...</span>
                </div>
              ) : (
                recipes.map((recipe) => (
                  <label
                    key={recipe.id}
                    className={`flex items-center gap-3.5 rounded-2xl border p-3 transition-all cursor-pointer ${
                      recipeId === recipe.id
                        ? 'border-[#2E7D32] bg-emerald-50/70 ring-1 ring-[#2E7D32]/30 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="replacementRecipe"
                      required
                      checked={recipeId === recipe.id}
                      disabled={busy}
                      onChange={() => setRecipeId(recipe.id)}
                      className="accent-[#2E7D32] w-4 h-4 cursor-pointer"
                    />

                    {recipe.imageUrl ? (
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.name}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 bg-slate-100"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-emerald-100 text-[#2E7D32] flex items-center justify-center shrink-0">
                        <UtensilsCrossed size={20} />
                      </div>
                    )}

                    <div className="flex-1">
                      <span className="font-bold text-slate-900 text-sm block">
                        {recipe.name}
                      </span>
                      <small className="block text-slate-500 text-xs mt-0.5">
                        {mealNutrition(recipe.caloriesPerServing, 1)}
                        {recipe.caloriesPerServing !== null
                          ? ' kcal / khẩu phần'
                          : ''}{' '}
                        · {recipe.cookTimeMinutes + recipe.prepTimeMinutes} phút
                      </small>
                    </div>
                  </label>
                ))
              )}

              {!recipesLoading && !recipes.length && !recipeError && (
                <p className="text-sm text-slate-500 py-6 text-center">
                  Không tìm thấy công thức nào phù hợp tiêu chí.
                </p>
              )}
            </div>

            {recipeCount > 12 && (
              <div className="flex justify-between items-center pt-1">
                <button
                  type="button"
                  className={actionButtonClass}
                  disabled={busy || recipePage === 1}
                  onClick={() => {
                    setRecipePage((value) => value - 1)
                    setRecipeId('')
                  }}
                >
                  Trước
                </button>
                <span className="text-xs font-semibold text-slate-600">
                  {recipePage} / {Math.ceil(recipeCount / 12)}
                </span>
                <button
                  type="button"
                  className={actionButtonClass}
                  disabled={busy || recipePage * 12 >= recipeCount}
                  onClick={() => {
                    setRecipePage((value) => value + 1)
                    setRecipeId('')
                  }}
                >
                  Sau
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                Khẩu phần:
                <input
                  aria-label="Khẩu phần"
                  type="number"
                  required
                  min={1}
                  max={20}
                  step={1}
                  value={servings}
                  disabled={busy}
                  onChange={(event) => setServings(Number(event.target.value))}
                  className="w-20 rounded-xl border border-slate-200 p-2 text-center text-sm font-semibold focus:outline-none focus:border-[#2E7D32]"
                />
              </label>

              <button
                type="submit"
                disabled={busy || recipesLoading || !recipeId}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                {busy ? 'Đang lưu...' : 'Xác nhận đổi món'}
              </button>
            </div>

            {(error || recipeError) && (
              <p role="alert" className="text-xs font-medium text-rose-700">
                {error || recipeError}
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  )
}

export default MealPlanDetailPage
