import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { createRequire } from 'node:module'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
const context = { exports: {} }
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/features/profile/utils/weightGoalWarning.ts', import.meta.url), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText, context)
const warning = context.exports.weightGoalWarning

test('Thừa cân hoặc béo phì chọn tăng cân và thiếu cân chọn giảm cân được cảnh báo', () => {
  for (const bmiCategory of ['overweight', 'obese']) assert.match(warning({ bmiCategory, goal: 'muscle_gain' }), /tăng cân/)
  assert.match(warning({ bmiCategory: 'underweight', goal: 'weight_loss' }), /giảm cân/)
})
test('BMI bình thường hoặc chưa xác định không cảnh báo; mục tiêu còn lại không bị cảnh báo', () => {
  for (const bmiCategory of ['normal', 'unknown']) for (const goal of ['maintain', 'weight_loss', 'muscle_gain'])
    assert.equal(warning({ bmiCategory, goal }), null)
  assert.equal(warning({ bmiCategory: 'overweight', goal: 'weight_loss' }), null)
  assert.equal(warning({ bmiCategory: 'underweight', goal: 'maintain' }), null)
})

test('Form có đúng ba mức vận động và cảnh báo BMI dùng màu vàng', () => {
  const require = createRequire(import.meta.url)
  const formContext = { exports: {}, require: name => {
    if (name.endsWith('weightGoalWarning')) return { weightGoalWarning: warning }
    if (name.endsWith('profileApi')) return { ageOn: () => 30, profileApi: {} }
    if (name.endsWith('shared/components')) return {
      Input: () => null, AlertError: () => null,
      Select: ({ label, options }) => React.createElement('select', { 'aria-label': label }, options.map(option =>
        React.createElement('option', { key: option.value, value: option.value }, option.label))),
    }
    return require(name)
  } }
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/features/profile/components/BodyMetricsCalculator.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, formContext)
  const render = bmiCategory => renderToStaticMarkup(React.createElement(formContext.exports.BodyMetricsCalculator, {
    metrics: { bmiCategory, bmi: 26, goal: 'muscle_gain', tdeeKcal: 2000, targetCalories: 2200,
      dailyProteinGrams: 110, dailyCarbsGrams: 275, dailyFatGrams: 73.3 }, onChange() {},
  }))
  const html = render('overweight')
  assert.match(html, /role="alert" class="[^"]*bg-amber-50/)
  for (const label of ['Ít vận động', 'Vận động vừa phải', 'Vận động nhiều']) assert.ok(html.includes(label))
  assert.ok(!html.includes('Vận động nhẹ'))
  assert.ok(!html.includes('Vận động rất nhiều'))
  assert.ok(!render('normal').includes('role="alert"'))
})
