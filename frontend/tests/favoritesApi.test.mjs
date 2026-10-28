import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

class HttpError extends Error { constructor(status) { super(`HTTP ${status}`); this.status = status } }
// Kiểm thử client mục đã lưu bằng API giả lập, không ghi dữ liệu người dùng thật.
function favoritesWith(apiClient) {
  const source = fs.readFileSync(new URL('../src/features/favorites/api/favoritesApi.ts', import.meta.url), 'utf8')
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText
  const context = { exports: {}, URLSearchParams, require: () => ({ apiClient, ApiError: HttpError }) }
  vm.runInNewContext(js, context)
  return context.exports
}
test('Lưu từ tủ bếp gửi đúng loại công thức và nguồn, không gửi danh tính tự khai báo', async () => {
  let body
  const api = favoritesWith({ post: async (_path, value) => { body = value } })
  assert.equal(await api.toggleFavorite('Recipe', 'recipe-id', true, 'Pantry'), true)
  assert.equal(body.targetType, 'Recipe')
  assert.equal(body.targetId, 'recipe-id')
  assert.equal(body.savedFrom, 'Pantry')
  assert.equal(body.userId, undefined)
})
test('Nguồn trang công thức được gửi khi lưu', async () => {
  let body
  const api = favoritesWith({ post: async (_path, value) => { body = value } })
  await api.toggleFavorite('Recipe', 'recipe-id', true, 'Recipe')
  assert.equal(body.savedFrom, 'Recipe')
})
test('Lỗi lưu được trả cho màn hình, không báo thành công', async () => {
  const error = new HttpError(503)
  const api = favoritesWith({ post: async () => { throw error } })
  await assert.rejects(api.toggleFavorite('Recipe', 'recipe-id', true, 'Pantry'), result => result === error)
})
test('Lưu trùng chỉ thành công sau khi tìm thấy bản lưu thật', async () => {
  const api = favoritesWith({ post: async () => { throw new HttpError(409) }, get: async () => ({ items: [{ id: 'saved-id', targetId: 'RECIPE-ID', savedFrom: 'Recipe' }], pageSize: 100, totalCount: 1 }) })
  assert.equal(await api.toggleFavorite('Recipe', 'recipe-id', true, 'Pantry'), true)
})
test('Xung đột không có bản lưu thật không được bỏ qua', async () => {
  const error = new HttpError(409)
  const api = favoritesWith({ post: async () => { throw error }, get: async () => ({ items: [], pageSize: 100, totalCount: 0 }) })
  await assert.rejects(api.toggleFavorite('Recipe', 'recipe-id', true, 'Pantry'), result => result === error)
})
test('Tải đầy đủ nhiều trang trước khi hiển thị trạng thái đã lưu', async () => {
  const calls = []
  const api = favoritesWith({ get: async path => {
    const page = Number(new URLSearchParams(path.split('?')[1]).get('pageNumber'))
    calls.push(page)
    return { items: Array.from({ length: page === 1 ? 100 : 5 }, (_, index) => ({ id: `${page}-${index}` })), totalCount: 105, pageSize: 100 }
  } })
  assert.equal((await api.listAllFavorites('Recipe')).length, 105)
  assert.deepEqual(calls, [1, 2])
})
test('Bỏ lưu tìm ID bản lưu thay vì xóa theo ID công thức', async () => {
  let deleted
  const api = favoritesWith({ get: async () => ({ items: [{ id: 'favorite-record-id', targetId: 'recipe-id' }], totalCount: 1, pageSize: 100 }), delete: async path => { deleted = path } })
  assert.equal(await api.toggleFavorite('Recipe', 'recipe-id', false), false)
  assert.equal(deleted, '/api/favorites/favorite-record-id')
})
test('Lỗi bỏ lưu không bị coi như đã xóa thành công', async () => {
  const error = new HttpError(500)
  const api = favoritesWith({ get: async () => ({ items: [{ id: 'saved-id', targetId: 'recipe-id' }], totalCount: 1, pageSize: 100 }), delete: async () => { throw error } })
  await assert.rejects(api.toggleFavorite('Recipe', 'recipe-id', false), result => result === error)
})
