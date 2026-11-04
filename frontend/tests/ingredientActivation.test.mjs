// Kiểm tra mở khóa gửi API thật và giữ lỗi backend cho giao diện xử lý.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

function client(post) {
  const source = fs.readFileSync(new URL('../src/features/admin/ingredients/api/adminIngredientsApi.ts', import.meta.url), 'utf8')
  const context = { exports: {}, require: () => ({ apiClient: { post } }) }
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, context)
  return context.exports.adminIngredientsApi
}
test('Mở khóa nguyên liệu gọi endpoint activate', async () => {
  let path
  await client(async url => { path = url }).activate('ingredient-id')
  assert.equal(path, '/api/admin/ingredients/ingredient-id/activate')
})
test('Lỗi mở khóa không bị chuyển thành thành công giả', async () => {
  const error = new Error('Không lưu được trạng thái')
  await assert.rejects(client(async () => { throw error }).activate('ingredient-id'), actual => actual === error)
})
