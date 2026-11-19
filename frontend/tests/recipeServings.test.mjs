import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const source = fs.readFileSync(new URL('../src/features/admin/recipes/utils/recipeServings.ts', import.meta.url), 'utf8')
const context = { exports: {} }
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText, context)
const { totalRecipeQuantity, quantityPerPerson } = context.exports

test('Nhập nguyên liệu cho 1 người, tăng số người nhân tổng; dinh dưỡng mỗi người giữ nguyên', () => {
  const perPerson = 150
  for (const people of [1, 2, 3, 4, 10]) {
    const total = totalRecipeQuantity(perPerson, people)
    assert.equal(total, perPerson * people)
    const totalCalories = total / 100 * 80
    assert.equal(totalCalories / people, 120)
  }
})

test('Mở và lưu công thức cũ giữ tổng định lượng, gồm số không chia hết', () => {
  for (const people of [1, 2, 3, 7, 10000]) {
    for (const total of [0.001, 1, 100, 123.456, 999999999]) {
      assert.equal(totalRecipeQuantity(quantityPerPerson(total, people), people), total)
    }
  }
  assert.equal(totalRecipeQuantity(quantityPerPerson(300, 2), 4), 600)
})
