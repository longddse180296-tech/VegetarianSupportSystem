import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

function client(get) {
  const source = fs.readFileSync(new URL('../src/features/profile/api/dietarySuggestions.ts', import.meta.url), 'utf8')
  const context = { exports: {}, require: () => ({ apiClient: { get } }) }
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText, context)
  return context.exports
}

test('Gợi ý hồ sơ đọc đủ các trang, lấy dị nguyên thực và đúng tên nguyên liệu', async () => {
  const calls = []
  const result = await client(async url => {
    calls.push(url)
    return { totalCount: 3, items: calls.length === 1
      ? [{ name: 'Đậu hũ', allergens: ' Đậu nành; Sữa' }, { name: 'Trứng gà', allergens: 'Trứng|sữa' }]
      : [{ name: 'Rau cải', allergens: null }] }
  }).getDietarySuggestions()
  assert.equal(calls.length, 2)
  assert.ok(calls[1].includes('pageNumber=2'))
  assert.deepEqual(Array.from(result.allergies, name => name.toLowerCase()).sort(), ['sữa', 'trứng', 'đậu nành'].sort())
  assert.deepEqual(Array.from(result.avoided).sort(), ['Đậu hũ', 'Trứng gà', 'Rau cải'].sort())
})

test('Dữ liệu rỗng không chèn gợi ý viết sẵn', async () => {
  const result = await client(async () => ({ items: [], totalCount: 0 })).getDietarySuggestions()
  assert.equal(result.allergies.length, 0)
  assert.equal(result.avoided.length, 0)
})

test('Lỗi API được trả về để giao diện báo không tải được gợi ý', async () => {
  await assert.rejects(client(async () => { throw Error('offline') }).getDietarySuggestions(), /offline/)
})

test('Tìm tên đọc toàn bộ danh mục, không giới hạn ở 8 mục hiển thị nhanh', async () => {
  const api = client(async () => ({ totalCount: 12, items: [
    ...Array.from({length: 10}, (_, i) => ({name: `A ${i}`})),
    {name: 'Bánh mì nguyên cám thuần chay'}, {name: 'Bánh mì lúa mạch'},
  ] }))
  const result = await api.getDietarySuggestions()
  assert.equal(result.ingredientNames.length, 12)
  assert.equal(result.avoided.length, 8)
  assert.deepEqual(Array.from(api.searchIngredientNames(result.ingredientNames, 'bánh mì')), ['Bánh mì lúa mạch', 'Bánh mì nguyên cám thuần chay'])
})

test('Search chỉ khớp theo tên, hỗ trợ không dấu và loại mục đã thêm', () => {
  const api = client(async () => ({items: [], totalCount: 0}))
  const names = ['Bánh mì nguyên cám', 'Bánh mì đen', 'Đậu hũ']
  assert.deepEqual(Array.from(api.searchIngredientNames(names, ' BANH   MI ', ['Bánh mì đen'])), ['Bánh mì nguyên cám'])
  assert.deepEqual(Array.from(api.searchIngredientNames(names, 'dau')), ['Đậu hũ'])
  assert.equal(api.searchIngredientNames(names, 'gluten').length, 0)
  assert.equal(api.searchIngredientNames(names, '').length, 0)
  assert.equal(api.searchIngredientNames(names, 'Tên tự nhập ngoài danh mục').length, 0)
})
