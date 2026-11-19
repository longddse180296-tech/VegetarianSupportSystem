import type { BodyMetrics } from '../types'

export function weightGoalWarning(metrics: Pick<BodyMetrics, 'bmiCategory' | 'goal'>): string | null {
  if ((metrics.bmiCategory === 'overweight' || metrics.bmiCategory === 'obese') && metrics.goal === 'muscle_gain')
    return 'BMI đang ở nhóm thừa cân hoặc béo phì. Mục tiêu tăng cân có thể chưa phù hợp; bạn nên xem lại mục tiêu trước khi lưu.'
  if (metrics.bmiCategory === 'underweight' && metrics.goal === 'weight_loss')
    return 'BMI đang ở nhóm thiếu cân. Mục tiêu giảm cân có thể chưa phù hợp; bạn nên xem lại mục tiêu trước khi lưu.'
  return null
}
