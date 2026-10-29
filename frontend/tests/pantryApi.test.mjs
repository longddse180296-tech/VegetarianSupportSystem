import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

// Cô lập adapter tủ bếp bằng API giả lập; không ghi database hoặc tạo dữ liệu trên hệ thống thật.
function pantryWith(apiClient) {
  const source = fs.readFileSync(new URL('../src/features/pantry/api/pantryApi.ts', import.meta.url), 'utf8')
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText
  const context = { exports: {}, require: () => ({ apiClient }), console: { error() {} } }
  vm.runInNewContext(js, context)
  return context.exports
}

const item = { id: 'test-item', ingredientId: 'test-ingredient', name: 'Nguyên liệu kiểm thử', isCatalogMatched: true,
  quantity: null, unit: null, dietaryCompatibility: 'Unknown', dietaryNotice: null, allergenWarnings: [], avoidedFoodWarnings: [], createdAt: '2026-10-27T00:00:00Z' }

test('Nguyên liệu đã khớp nhưng chưa đủ bằng chứng vẫn giữ trạng thái chưa xác định', async () => {
  const api = pantryWith({ get: async () => [item] })
  const result = (await api.getPantryItems())[0]
  assert.equal(result.isSuitable, 'unchecked')
  assert.equal(result.quantity, null)
  assert.equal(result.unit, null)
})
test('Giữ cảnh báo dị ứng và thực phẩm cần tránh cùng kết quả không phù hợp', async () => {
  const api = pantryWith({ get: async () => [{ ...item, dietaryCompatibility: 'Incompatible', allergenWarnings: ['Đậu phộng'], avoidedFoodWarnings: ['Nấm'] }] })
  const result = (await api.getPantryItems())[0]
  assert.equal(result.isSuitable, 'unsuitable')
  assert.match(result.suitableNote, /Đậu phộng/)
  assert.match(result.suitableNote, /Nấm/)
})
for (const operation of ['getPantryItems', 'deletePantryItem', 'updatePantryItem', 'getRecipeMatches']) {
  test(`${operation}: lỗi API được trả về cho giao diện, không giả thành công hoặc danh sách rỗng`, async () => {
    const error = new Error('Không thể kết nối')
    const fail = async () => { throw error }
    const api = pantryWith({ get: fail, delete: fail, put: fail })
    const args = operation === 'updatePantryItem' ? ['test-id', { name: 'Tên kiểm thử' }] : operation === 'getPantryItems' ? [] : ['test-id']
    await assert.rejects(api[operation](...args), result => result === error)
  })
}
test('Thiếu calo giữ null; số 0 có dữ liệu vẫn được giữ', async () => {
  const suggestion = { recipeId: 'test-recipe', recipeName: 'Món kiểm thử', servings: 1, totalTimeMinutes: 10, matchPercent: 50, availableIngredients: [], missingIngredients: [] }
  const api = pantryWith({ get: async () => [{ ...suggestion, caloriesPerServing: null }, { ...suggestion, recipeId: 'zero', caloriesPerServing: 0 }] })
  const results = await api.getRecipeMatches([])
  assert.equal(results[0].kcal, null)
  assert.equal(results[1].kcal, 0)
})
test('Không tự gán số lượng 1 hoặc đơn vị gram khi thêm thiếu dữ liệu', async () => {
  let calls = 0
  const api = pantryWith({ post: async () => { calls++; return item } })
  await assert.rejects(api.addPantryItem({ name: 'Kiểm thử', quantity: '', unit: '', category: 'khac' }))
  assert.equal(calls, 0)
})
test('Cập nhật nguyên liệu chưa định lượng giữ null khi gửi backend', async () => {
  let body
  const api = pantryWith({ put: async (_url, value) => { body = value; return item } })
  await api.updatePantryItem('test-item', { name: 'Tên mới' })
  assert.equal(body.quantity, null)
  assert.equal(body.unit, null)
})
