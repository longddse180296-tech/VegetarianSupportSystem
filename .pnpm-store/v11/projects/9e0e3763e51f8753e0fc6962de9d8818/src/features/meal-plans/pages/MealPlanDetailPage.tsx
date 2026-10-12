import { useEffect, useState } from 'react'
import { Calendar, Check, FileDown, Loader2, Plus, RefreshCw, ShoppingCart, X } from 'lucide-react'
import { addPlanDays, formatPlanDate, mealNutrition, mealPlanApi, nextMonday, PLAN_DIET_LABELS } from '../api/mealPlanApi'
import type { PlanPage, ReplacementRecipe, SavedPlan, SavedPlanMeal } from '../types/mealPlanBackend.types'
import { MealPlanSkeleton } from '../components/MealPlanSkeleton'

const slotLabels = { Breakfast: 'Bữa sáng', Lunch: 'Bữa trưa', Dinner: 'Bữa tối' }
const slots = ['Breakfast', 'Lunch', 'Dinner'] as const
const message = (error: unknown) => error instanceof Error ? error.message : 'Thao tác chưa thành công. Vui lòng thử lại.'
const buttonClass = 'fe1-btn fe1-btn-outline inline-flex items-center justify-center gap-2 px-4 py-2.5 disabled:opacity-50'
const primaryButtonClass = 'fe1-btn fe1-btn-primary inline-flex items-center justify-center gap-2 px-4 py-2.5 disabled:opacity-50'

export const MealPlanDetailPage = ({ planId, onNavigate }: { planId?: string; onNavigate?: (path: string) => void }) => {
  const [plan, setPlan] = useState<SavedPlan | null>(null)
  const [list, setList] = useState<PlanPage | null>(null)
  const [page, setPage] = useState(1)
  const [day, setDay] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [shoppingOpen, setShoppingOpen] = useState(false)
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
  const planDiet = plan?.profileDiet

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      await Promise.resolve()
      if (controller.signal.aborted) return
      setLoading(true)
      setError(null)
      setPlan(null)
      setShoppingOpen(false)
      setCopyOpen(false)
      setReplacement(null)
      try {
        const result = await mealPlanApi.list(page, controller.signal)
        const id = planId || result.items[0]?.id
        const detail = id ? await mealPlanApi.get(id, controller.signal) : null
        if (!controller.signal.aborted) { setList(result); setPlan(detail); setDay(1) }
      } catch (err) { if (!controller.signal.aborted) setError(message(err)) }
      finally { if (!controller.signal.aborted) setLoading(false) }
    }
    void load()
    return () => controller.abort()
  }, [planId, page, refresh])

  useEffect(() => {
    if (!replacement || !planDiet) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setRecipesLoading(true)
      setRecipeError(null)
      mealPlanApi.recipes(planDiet, recipeSearch, recipePage, controller.signal)
        .then(result => { if (!controller.signal.aborted) { setRecipes(result.items); setRecipeCount(result.totalCount) } })
        .catch(err => { if (!controller.signal.aborted) { setRecipes([]); setRecipeError(message(err)) } })
        .finally(() => { if (!controller.signal.aborted) setRecipesLoading(false) })
    }, 250)
    return () => { clearTimeout(timer); controller.abort() }
  }, [replacement, planDiet, recipeSearch, recipePage])

  const act = async (operation: () => Promise<void>) => {
    if (busy) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try { await operation() } catch (err) { setError(message(err)) }
    finally { setBusy(false) }
  }

  const openReplacement = (meal: SavedPlanMeal) => {
    setReplacement(meal); setRecipeId(''); setRecipeSearch(''); setRecipePage(1); setRecipes([]); setServings(meal.servings)
  }

  const updatePurchase = (itemId: string, isPurchased: boolean) => {
    if (!plan || busy) return
    const previous = plan
    setPlan({ ...plan, shoppingItems: plan.shoppingItems.map(item => item.id === itemId ? { ...item, isPurchased } : item) })
    void act(async () => {
      try { setPlan({ ...plan, shoppingItems: await mealPlanApi.purchase(plan.id, itemId, isPurchased) }) }
      catch (err) { setPlan(previous); throw err }
    })
  }

  if (loading) return <MealPlanSkeleton />
  const meals = plan?.meals.filter(meal => meal.dayNumber === day) || []
  const sum = (key: 'caloriesPerServing' | 'proteinGramPerServing' | 'carbohydrateGramPerServing' | 'fatGramPerServing') =>
    meals.some(meal => meal[key] === null) ? null : meals.reduce((total, meal) => total + (meal[key] ?? 0) * meal.servings, 0)
  const weeklyValue = (key: 'caloriesPerServing' | 'proteinGramPerServing' | 'carbohydrateGramPerServing' | 'fatGramPerServing', total: number) =>
    plan?.meals.some(meal => meal[key] === null) ? 'Chưa đầy đủ' : mealNutrition(total, 1)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl font-black text-slate-900">Thực đơn của bạn</h1><p className="mt-2 text-sm text-slate-500">7 ngày · 3 bữa mỗi ngày · Lưu theo tài khoản</p></div>
        <button className={primaryButtonClass} disabled={busy} onClick={() => onNavigate?.('/meal-plans/setup')}><Plus className="w-4 h-4" />Tạo thực đơn mới</button>
      </div>
      {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error} <button disabled={busy} onClick={() => setRefresh(value => value + 1)} className="fe1-control ml-3 underline">Tải lại</button></div>}
      {notice && <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
      {!plan && !error && <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-4"><Calendar className="w-12 h-12 mx-auto text-emerald-700" /><h2 className="font-bold text-xl">Bạn chưa có thực đơn</h2><p className="text-sm text-slate-500">Kiểm tra chế độ ăn và dị ứng trong hồ sơ rồi tạo kế hoạch 21 bữa đầu tiên.</p></div>}
      {plan && <>
        <section className="rounded-3xl bg-gradient-to-br from-[#0f4a24] to-[#22874a] p-7 text-white space-y-3">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs">{PLAN_DIET_LABELS[plan.profileDiet]}</span>
          <h2 className="text-2xl font-extrabold">{plan.name}</h2>
          <p className="text-sm text-emerald-100">{formatPlanDate(plan.weekStartDate)} – {formatPlanDate(addPlanDays(plan.weekStartDate, 6))} · {plan.meals.length} bữa · Đã lưu</p>
          <p className="text-xs text-white/75">Đổi món và tạo lại dùng chế độ ăn, dị ứng, thực phẩm cần tránh đã lưu khi tạo kế hoạch.</p>
        </section>
        <div className="flex flex-wrap gap-2">
          <button disabled={busy} className={buttonClass} onClick={() => void act(async () => { setPlan(await mealPlanApi.regenerate(plan.id)); setNotice('Đã tạo lại và lưu toàn bộ 21 bữa.') })}><RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />Tạo lại toàn bộ</button>
          <button disabled={busy} className={buttonClass} onClick={() => void act(async () => { const items = await mealPlanApi.shoppingList(plan.id); setPlan({ ...plan, shoppingItems: items }); setShoppingOpen(true) })}><ShoppingCart className="w-4 h-4" />Danh sách đi chợ</button>
          <button disabled={busy} className={buttonClass} onClick={() => { setCopyDate(addPlanDays(plan.weekStartDate, 7)); setCopyOpen(true) }}><Calendar className="w-4 h-4" />Áp dụng sang tuần mới</button>
          <button disabled={busy} className={buttonClass} onClick={() => void act(async () => { await mealPlanApi.pdf(plan.id); setNotice('Đã tải PDF thực đơn.') })}><FileDown className="w-4 h-4" />Tải PDF</button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2" aria-label="Chọn ngày">
          {Array.from({ length: 7 }, (_, index) => index + 1).map(number => <button key={number} aria-pressed={day === number} disabled={busy} onClick={() => setDay(number)} className={`fe1-control shrink-0 rounded-full px-4 py-2 text-xs font-bold ${day === number ? 'bg-[#184d28] text-white' : 'bg-slate-100 text-slate-600'}`}>Ngày {number} · {formatPlanDate(addPlanDays(plan.weekStartDate, number - 1))}</button>)}
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {slots.map(slot => {
            const meal = meals.find(item => item.slot === slot)
            return meal ? <article key={slot} className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">{slotLabels[slot]}</span><span className="text-xs text-slate-500">{meal.totalTimeMinutes} phút</span></div>
              <h3 className="text-lg font-extrabold text-slate-900">{meal.recipeName}</h3>
              <p className="text-xs text-slate-500">{meal.servings} khẩu phần · {mealNutrition(meal.caloriesPerServing, meal.servings)}{meal.caloriesPerServing !== null && ' kcal'}</p>
              <p className="text-xs text-slate-600 leading-6">Đạm: {mealNutrition(meal.proteinGramPerServing, meal.servings)} · Carbs: {mealNutrition(meal.carbohydrateGramPerServing, meal.servings)} · Béo: {mealNutrition(meal.fatGramPerServing, meal.servings)} (g)</p>
              <div className="flex gap-2"><button className={buttonClass} disabled={busy} onClick={() => onNavigate?.(`/recipes/${meal.recipeId}`)}>Xem công thức</button><button className={buttonClass} disabled={busy} onClick={() => openReplacement(meal)}><RefreshCw className="w-3 h-3" />Đổi món</button></div>
            </article> : <p key={slot} className="rounded-2xl border p-5">Chưa có dữ liệu {slotLabels[slot].toLowerCase()}.</p>
          })}
        </div>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
          <h3 className="font-bold text-lg">Dinh dưỡng ngày {day}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {([['Năng lượng (kcal)', sum('caloriesPerServing')], ['Đạm (g)', sum('proteinGramPerServing')], ['Carbs (g)', sum('carbohydrateGramPerServing')], ['Chất béo (g)', sum('fatGramPerServing')]] as const).map(([label, value]) => <div key={label} className="rounded-xl bg-emerald-50 p-4"><p className="text-xs text-slate-500">{label}</p><strong className="text-lg text-emerald-800">{mealNutrition(value, 1)}</strong></div>)}
          </div>
          <p className="text-xs text-slate-500">Tổng tuần: Năng lượng (kcal) {weeklyValue('caloriesPerServing', plan.nutrition.calories)} · Đạm (g) {weeklyValue('proteinGramPerServing', plan.nutrition.proteinGrams)} · Carbs (g) {weeklyValue('carbohydrateGramPerServing', plan.nutrition.carbohydrateGrams)} · Béo (g) {weeklyValue('fatGramPerServing', plan.nutrition.fatGrams)}. Giá trị còn thiếu được ghi rõ tại từng bữa.</p>
        </section>
      </>}
      {list && <section className="space-y-4">
        <h2 className="text-xl font-extrabold">Thực đơn đã lưu ({list.totalCount})</h2>
        <div className="grid md:grid-cols-3 gap-4">{list.items.map(item => <button key={item.id} disabled={busy} onClick={() => onNavigate?.(`/meal-plans/${item.id}`)} className={`fe1-control rounded-2xl border bg-white p-5 text-left space-y-2 ${plan?.id === item.id ? 'border-emerald-500' : 'border-slate-200'}`}><h3 className="font-bold">{item.name}</h3><p className="text-xs text-slate-500">{formatPlanDate(item.weekStartDate)} · {item.mealCount} bữa</p><span className="text-xs font-bold text-emerald-800">Xem kế hoạch →</span></button>)}</div>
        {list.totalCount > 12 && <div className="flex justify-center gap-3"><button disabled={page === 1 || busy} className={buttonClass} onClick={() => setPage(value => value - 1)}>Trước</button><span className="self-center text-sm">{page} / {Math.ceil(list.totalCount / 12)}</span><button disabled={page * 12 >= list.totalCount || busy} className={buttonClass} onClick={() => setPage(value => value + 1)}>Sau</button></div>}
      </section>}
      {plan && shoppingOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><section role="dialog" aria-modal="true" aria-label="Danh sách đi chợ" className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 space-y-4">
        <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Danh sách đi chợ</h2><button className="fe1-control" aria-label="Đóng" disabled={busy} onClick={() => setShoppingOpen(false)}><X /></button></div>
        <p className="text-xs text-slate-500">Số lượng cần mua đã trừ nguyên liệu tủ bếp có đơn vị phù hợp. Đánh dấu được lưu vào kế hoạch.</p>
        {plan.shoppingItems.length === 0 && <p className="text-sm text-slate-500">Danh sách trống.</p>}
        {plan.shoppingItems.map(item => <label key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-sm"><input type="checkbox" checked={item.isPurchased} disabled={busy} onChange={event => updatePurchase(item.id, event.target.checked)} /><span className={`flex-1 ${item.isPurchased ? 'line-through text-slate-400' : ''}`}>{item.ingredientName}<small className="block text-slate-500">Cần {item.requiredQuantity} {item.unit} · Có sẵn {item.pantryQuantity} {item.unit}</small></span><strong>{item.quantityToBuy} {item.unit}</strong></label>)}
        {busy && <p role="status" className="text-xs text-slate-500">Đang lưu thay đổi...</p>}
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <button className={buttonClass} disabled={busy} onClick={() => void act(() => mealPlanApi.pdf(plan.id))}><FileDown className="w-4 h-4" />Tải kế hoạch và danh sách PDF</button>
      </section></div>}
      {plan && copyOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form role="dialog" aria-modal="true" aria-label="Áp dụng sang tuần mới" onSubmit={event => { event.preventDefault(); void act(async () => { const copy = await mealPlanApi.applyToWeek(plan.id, copyDate); setCopyOpen(false); onNavigate?.(`/meal-plans/${copy.id}`) }) }} className="w-full max-w-md rounded-3xl bg-white p-6 space-y-4"><h2 className="text-xl font-bold">Áp dụng sang tuần mới</h2><p className="text-xs text-slate-500">Tạo bản sao kế hoạch với ngày bắt đầu mới; danh sách đi chợ được tính lại theo tủ bếp hiện tại.</p><label className="block text-sm">Ngày bắt đầu<input aria-label="Ngày bắt đầu tuần mới" type="date" required value={copyDate} disabled={busy} onChange={event => setCopyDate(event.target.value)} className="mt-2 w-full rounded-xl border p-3" /></label>{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}<div className="flex gap-2"><button type="button" disabled={busy} className={buttonClass} onClick={() => setCopyOpen(false)}>Hủy</button><button type="submit" disabled={busy} className={primaryButtonClass}><Check className="w-4 h-4" />{busy ? 'Đang lưu...' : 'Áp dụng'}</button></div></form></div>}
      {plan && replacement && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form role="dialog" aria-modal="true" aria-label="Đổi món" onSubmit={event => { event.preventDefault(); if (!recipeId) return; void act(async () => { setPlan(await mealPlanApi.replace(plan.id, replacement, recipeId, servings)); setReplacement(null); setNotice('Đã đổi món và cập nhật dinh dưỡng, danh sách đi chợ.') }) }} className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 space-y-4">
        <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Đổi món · {slotLabels[replacement.slot]} ngày {replacement.dayNumber}</h2><button className="fe1-control" type="button" aria-label="Đóng" disabled={busy} onClick={() => setReplacement(null)}><X /></button></div>
        <p className="text-xs text-slate-500">Công thức theo chế độ ăn của kế hoạch. Hệ thống kiểm tra thêm dị ứng và thực phẩm cần tránh khi lưu; món không phù hợp sẽ bị từ chối.</p>
        <input aria-label="Tìm công thức thay thế" placeholder="Tìm công thức..." maxLength={120} value={recipeSearch} disabled={busy} onChange={event => { setRecipeSearch(event.target.value); setRecipePage(1); setRecipeId('') }} className="w-full rounded-xl border p-3 text-sm" />
        {recipesLoading ? <p className="flex gap-2 text-sm"><Loader2 className="w-4 h-4 animate-spin" />Đang tải công thức...</p> : recipes.map(recipe => <label key={recipe.id} className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${recipeId === recipe.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}><input type="radio" name="replacementRecipe" required checked={recipeId === recipe.id} disabled={busy} onChange={() => setRecipeId(recipe.id)} /><span>{recipe.name}<small className="block text-slate-500">{mealNutrition(recipe.caloriesPerServing, 1)}{recipe.caloriesPerServing !== null && ' kcal / khẩu phần'} · {recipe.cookTimeMinutes + recipe.prepTimeMinutes} phút</small></span></label>)}
        {!recipesLoading && !recipes.length && !recipeError && <p className="text-sm text-slate-500">Không có công thức phù hợp bộ lọc.</p>}
        {recipeCount > 12 && <div className="flex gap-2"><button type="button" className={buttonClass} disabled={busy || recipePage === 1} onClick={() => { setRecipePage(value => value - 1); setRecipeId('') }}>Trước</button><span className="self-center text-sm">{recipePage} / {Math.ceil(recipeCount / 12)}</span><button type="button" className={buttonClass} disabled={busy || recipePage * 12 >= recipeCount} onClick={() => { setRecipePage(value => value + 1); setRecipeId('') }}>Sau</button></div>}
        <label className="block text-sm">Khẩu phần<input aria-label="Khẩu phần" type="number" required min={1} max={20} step={1} value={servings} disabled={busy} onChange={event => setServings(Number(event.target.value))} className="ml-3 w-20 rounded-xl border p-2" /></label>
        {(error || recipeError) && <p role="alert" className="text-sm text-rose-700">{error || recipeError}</p>}
        <button type="submit" disabled={busy || recipesLoading || !recipeId} className={primaryButtonClass}>{busy ? 'Đang lưu...' : 'Lưu món thay thế'}</button>
      </form></div>}
    </div>
  )
}
export default MealPlanDetailPage
