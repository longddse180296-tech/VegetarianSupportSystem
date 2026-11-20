import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const source = fs.readFileSync(new URL('../src/features/meal-plans/utils/planPeriod.ts', import.meta.url), 'utf8')
const context = { exports: {} }
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context)
const { planPeriodStatus, currentMealPlan, mealPlanStartError, nextAvailablePlanDate } = context.exports

test('A plan covers exactly seven inclusive calendar dates', () => {
  assert.equal(planPeriodStatus('2026-11-13', '2026-11-12'), 'upcoming')
  assert.equal(planPeriodStatus('2026-11-13', '2026-11-13'), 'current')
  assert.equal(planPeriodStatus('2026-11-13', '2026-11-19'), 'current')
  assert.equal(planPeriodStatus('2026-11-13', '2026-11-20'), 'expired')
  assert.equal(planPeriodStatus('2026-12-28', '2027-01-03'), 'current')
  assert.equal(planPeriodStatus('2026-12-28', '2027-01-04'), 'expired')
})

test('Current view ignores expired and future plans even if they were created later', () => {
  const plans = [
    { id: 'future', weekStartDate: '2026-11-23', createdAt: '2026-11-19T12:00:00Z' },
    { id: 'expired', weekStartDate: '2026-11-09', createdAt: '2026-11-19T11:00:00Z' },
    { id: 'current', weekStartDate: '2026-11-16', createdAt: '2026-11-16T12:00:00Z' },
  ]
  assert.equal(currentMealPlan(plans, '2026-11-19')?.id, 'current')
  assert.equal(currentMealPlan(plans.filter((plan) => plan.id !== 'current'), '2026-11-19'), undefined)
  assert.equal(currentMealPlan([], '2026-11-19'), undefined)
})

test('Seven-day windows reject full or partial overlap and allow the day after an existing week', () => {
  const plans = [{ weekStartDate: '2026-11-19' }]
  for (const start of ['2026-11-13', '2026-11-18', '2026-11-19', '2026-11-25'])
    assert.match(mealPlanStartError(start, plans, '2026-11-01'), /trùng/)
  assert.equal(mealPlanStartError('2026-11-12', plans, '2026-11-01'), null)
  assert.equal(mealPlanStartError('2026-11-26', plans, '2026-11-01'), null)
  assert.equal(nextAvailablePlanDate(plans, '2026-11-19'), '2026-11-26')
  assert.equal(nextAvailablePlanDate([...plans, { weekStartDate: '2026-11-26' }], '2026-11-19'), '2026-12-03')
})
