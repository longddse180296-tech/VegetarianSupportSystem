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
  const suggestion = { recipeId: 'test-recipe', recipeName: 'Món kiểm thử', servings: 1, totalTimeMinutes: 10, matchPercent: 50, availableIngredients: [{ name: 'Đậu hũ' }], missingIngredients: [] }
  const api = pantryWith({ get: async () => [{ ...suggestion, caloriesPerServing: null }, { ...suggestion, recipeId: 'zero', caloriesPerServing: 0 }] })
  const results = await api.getRecipeMatches([])
  assert.equal(results[0].kcal, null)
  assert.equal(results[1].kcal, 0)
})
test('Thêm nguyên liệu không định lượng gửi null, không tự gán 200 gram', async () => {
  let body
  const api = pantryWith({ post: async (_url, value) => { body = value; return item } })
  await api.addPantryItem({ name: 'Kiểm thử', quantity: '', unit: '', category: 'khac' })
  assert.equal(body.quantity, null)
  assert.equal(body.unit, null)
})

test('Dinh dưỡng tủ bếp nhận đủ đạm, carb, béo; giữ số 0 và dữ liệu thiếu', async () => {
  const base = { recipeId: 'recipe', availableIngredients: [{ name: 'Đậu hũ' }], missingIngredients: [], caloriesPerServing: 100, matchPercent: 100 }
  const result = await pantryWith({ get: async () => [
    { ...base, proteinGramPerServing: 12.5, carbohydrateGramPerServing: 0, fatGramPerServing: 3.2 },
    { ...base, recipeId: 'missing' },
  ] }).getRecipeMatches([])
  assert.equal(result[0].proteinG, 12.5)
  assert.equal(result[0].carbsG, 0)
  assert.equal(result[0].fatG, 3.2)
  assert.equal(result[1].proteinG, null)
})

test('Phổ biến lấy đúng ID và tên từ catalog, không chèn tên viết sẵn', async () => {
  let url
  const api = pantryWith({ get: async path => { url = path; return { items: [{ id: 'db-id', name: 'Rau mới trong database' }] } } })
  const chips = await api.getQuickAddChips()
  assert.equal(url, '/api/ingredients?pageNumber=1&pageSize=8')
  assert.equal(chips.length, 1)
  assert.equal(chips[0].id, 'db-id')
  assert.equal(chips[0].name, 'Rau mới trong database')
  assert.equal((await pantryWith({ get: async () => ({ items: [] }) }).getQuickAddChips()).length, 0)
})

test('Chỉ hiện món có nguyên liệu trong tủ; không khớp món nào thì trả rỗng', async () => {
  const unmatched = { recipeId: 'none', availableIngredients: [], missingIngredients: [{ name: 'Nấm' }], matchPercent: 0 }
  const matched = { ...unmatched, recipeId: 'matched', availableIngredients: [{ name: 'Đậu hũ' }], matchPercent: 50 }
  const result = await pantryWith({ get: async () => [unmatched, matched] }).getRecipeMatches([])
  assert.deepEqual(Array.from(result, item => item.id), ['matched'])
  assert.equal((await pantryWith({ get: async () => [unmatched] }).getRecipeMatches([])).length, 0)
})
test('Cập nhật nguyên liệu chưa định lượng giữ null khi gửi backend', async () => {
  let body
  const api = pantryWith({ put: async (_url, value) => { body = value; return item } })
  await api.updatePantryItem('test-item', { name: 'Tên mới' })
  assert.equal(body.quantity, null)
  assert.equal(body.unit, null)
})
