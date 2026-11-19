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
