import type { SavedPlanSummary } from '../types/mealPlanBackend.types'

export function planPeriodStatus(start: string, today: string): 'current' | 'expired' | 'upcoming' {
  if (today < start) return 'upcoming'
  const end = new Date(`${start}T00:00:00Z`)
  end.setUTCDate(end.getUTCDate() + 6)
  return today > end.toISOString().slice(0, 10) ? 'expired' : 'current'
}

export function currentMealPlan(plans: SavedPlanSummary[], today: string): SavedPlanSummary | undefined {
  return plans
    .filter((plan) => planPeriodStatus(plan.weekStartDate, today) === 'current')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
}

function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

export function mealPlanStartError(start: string, plans: SavedPlanSummary[], today: string): string | null {
  if (!start || start < today) return 'Ngày bắt đầu phải từ hôm nay trở đi.'
  const end = shiftDate(start, 6)
  const overlap = plans.find((plan) => plan.weekStartDate <= end && shiftDate(plan.weekStartDate, 6) >= start)
  if (!overlap) return null
  const format = (date: string) => date.split('-').reverse().join('/')
  return `Bạn đã có thực đơn từ ${format(overlap.weekStartDate)} đến ${format(shiftDate(overlap.weekStartDate, 6))}. Vui lòng chọn 7 ngày không trùng với lịch đã lưu.`
}

export function nextAvailablePlanDate(plans: SavedPlanSummary[], from: string): string {
  let candidate = from
  for (const plan of [...plans].sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate))) {
    const end = shiftDate(plan.weekStartDate, 6)
    if (plan.weekStartDate <= shiftDate(candidate, 6) && end >= candidate) candidate = shiftDate(end, 1)
  }
  return candidate
}
