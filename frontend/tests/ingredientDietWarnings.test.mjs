import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const source = fs.readFileSync(new URL('../src/features/admin/recipes/utils/ingredientDietWarnings.ts', import.meta.url), 'utf8')
const context = { exports: {} }
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText, context)
const warnings = context.exports.ingredientDietWarnings
const plant = { id: 'a', name: 'Nguyên liệu A', isActive: true,
  containsEgg: false, containsMilk: false, containsHoney: false }

test('Đổi nguyên liệu thành trứng chỉ ra nguyên nhân và cập nhật khi chọn lại chế độ ăn', () => {
  assert.equal(warnings(plant, 'Vegan').length, 0)
  const egg = { ...plant, containsEgg: true }
  assert.match(warnings(egg, 'Vegan').join(' '), /Có trứng/)
  assert.match(warnings(egg, 'LactoVegetarian').join(' '), /Có trứng/)
  assert.equal(warnings(egg, 'OvoVegetarian').length, 0)
  assert.equal(warnings(egg, 'LactoOvoVegetarian').length, 0)
})

test('Hiển thị đầy đủ các thành phần không phù hợp, gồm sữa và mật ong', () => {
  const mixed = { ...plant, containsMilk: true, containsHoney: true }
  assert.match(warnings(mixed, 'Vegan').join(' '), /Có sữa/)
  assert.match(warnings(mixed, 'Vegan').join(' '), /Có mật ong/)
  assert.match(warnings(mixed, 'OvoVegetarian').join(' '), /Có sữa/)
  assert.equal(warnings(mixed, 'LactoVegetarian').length, 0)
})

test('Trạng thái ngừng sử dụng có nguyên nhân riêng', () => {
  assert.match(warnings({ ...plant, isActive: false }, 'Vegan').join(' '), /ngừng sử dụng/)
  assert.equal(warnings(plant, null).length, 0)
})
