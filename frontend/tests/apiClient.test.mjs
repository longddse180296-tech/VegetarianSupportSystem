import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

// Chạy client thật trong môi trường trình duyệt giả lập, không gửi yêu cầu ra mạng.
function clientWith(response, options = {}) {
  const storage = new Map(options.token ? [['vegetarian_auth_token', 'test-token']] : [])
  const localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) }
  const events = []
  const window = { location: { hash: options.hash ?? '#/recipes', pathname: '/', search: '' }, dispatchEvent: event => events.push(event.type) }
  const context = { exports: {}, Headers, FormData, DOMException, Event, localStorage, sessionStorage: { ...localStorage, getItem: () => null }, window,
    fetch: options.fetch ?? (async () => { if (response instanceof Error) throw response; return response }) }
  const source = fs.readFileSync(new URL('../src/shared/api/apiClient.ts', import.meta.url), 'utf8').replaceAll('import.meta.env', '({})')
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText
  vm.runInNewContext(js, context)
  return { ...context.exports, window, storage, events }
}

test('Access token hết hạn được gia hạn một lần và gửi lại request với token mới', async () => {
  let refreshes = 0
  const env = clientWith(null, { token: true, fetch: async (url, options) => {
    if (url.endsWith('/auth/refresh')) {
      refreshes++
      assert.equal(options.credentials, 'include')
      assert.equal(options.headers['X-Session-Refresh'], '1')
      return new Response(JSON.stringify({ accessToken: 'new-token', user: { id: 'u' } }))
    }
    return options.headers.get('Authorization') === 'Bearer new-token'
      ? new Response(JSON.stringify({ ok: true })) : new Response('{}', { status: 401 })
  } })
  const values = await Promise.all([env.apiClient.get('/api/auth/me'), env.apiClient.get('/api/profile')])
  assert.equal(refreshes, 1)
  assert.ok(values.every(value => value.ok))
  assert.equal(env.storage.get('vegetarian_auth_token'), 'new-token')
  assert.deepEqual(env.events, [])
})

test('Gia hạn gặp lỗi dịch vụ giữ nguyên phiên và không chuyển về đăng nhập', async () => {
  const env = clientWith(null, { token: true, fetch: async url => new Response('{}', { status: url.endsWith('/auth/refresh') ? 503 : 401 }) })
  await assert.rejects(env.apiClient.get('/api/profile'), error => error.status === 503)
  assert.equal(env.storage.get('vegetarian_auth_token'), 'test-token')
  assert.equal(env.window.location.hash, '#/recipes')
  assert.deepEqual(env.events, [])
})

test('Phiên bị máy khác thay thế không thử gia hạn để chiếm lại phiên', async () => {
  let calls = 0
  const env = clientWith(null, { token: true, fetch: async () => {
    calls++
    return new Response(JSON.stringify({ code: 'SESSION_REPLACED', title: 'Tài khoản đã đăng nhập trên trình duyệt khác.' }), { status: 401 })
  } })
  await assert.rejects(env.apiClient.get('/api/profile'), error => error.status === 401)
  assert.equal(calls, 1)
  assert.equal(env.storage.has('vegetarian_auth_token'), false)
  assert.deepEqual(env.events, ['vegetarian_session_expired'])
})

test('Phản hồi gia hạn đến sau khi đăng xuất không khôi phục phiên', async () => {
  let complete
  const env = clientWith(null, { token: true, fetch: async () => new Promise(resolve => { complete = resolve }) })
  const pending = env.refreshAccessToken()
  env.clearStoredAuth()
  complete(new Response(JSON.stringify({ accessToken: 'late-token', user: { id: 'u' } })))
  await assert.rejects(pending, error => error.status === 401)
  assert.equal(env.getStoredToken(), null)
})

test('Sai mật khẩu giữ nguyên trang đăng nhập và không xóa phiên bằng lỗi từ yêu cầu công khai', async () => {
  const env = clientWith(new Response('{}', { status: 401 }), { hash: '#/auth/login', token: true })
  await assert.rejects(env.apiClient.post('/api/auth/login', {}, { requiresAuth: false }), error => error.status === 401)
  assert.equal(env.window.location.hash, '#/auth/login')
  assert.equal(env.storage.get('vegetarian_auth_token'), 'test-token')
})
test('Phiên hết hạn chuyển đúng hash và giữ đường dẫn để quay lại', async () => {
  const env = clientWith(new Response('{}', { status: 401 }), { token: true, hash: '#/profile/my-articles?page=2' })
  await assert.rejects(env.apiClient.get('/api/me/articles'))
  assert.equal(env.storage.has('vegetarian_auth_token'), false)
  assert.equal(env.window.location.hash, '/auth/login?returnUrl=%2Fprofile%2Fmy-articles%3Fpage%3D2')
  assert.deepEqual(env.events, ['vegetarian_session_expired'])
})
test('Hủy yêu cầu giữ nguyên AbortError', async () => {
  const error = new DOMException('Cancelled', 'AbortError')
  const env = clientWith(error)
  await assert.rejects(env.apiClient.get('/api/recipes'), result => result === error)
})
test('Lỗi mạng có hướng dẫn thử lại', async () => {
  const env = clientWith(new TypeError('Failed to fetch'))
  await assert.rejects(env.apiClient.get('/api/recipes'), error => error.status === 0 && /kết nối/.test(error.message))
})
test('JSON sai không được coi như dữ liệu trống thành công', async () => {
  const env = clientWith(new Response('<html>proxy error</html>', { status: 200 }))
  await assert.rejects(env.apiClient.get('/api/recipes'), error => /chưa hợp lệ/.test(error.message))
})
test('Lỗi máy chủ không làm lộ chi tiết kỹ thuật', async () => {
  const env = clientWith(new Response(JSON.stringify({ detail: 'SqlException private database path' }), { status: 500 }))
  await assert.rejects(env.apiClient.get('/api/recipes'), error => !error.message.includes('SqlException') && /gián đoạn/.test(error.message))
})
test('Thông báo lỗi trường nhập được ưu tiên hơn tiêu đề mặc định', async () => {
  const env = clientWith(new Response(JSON.stringify({ title: 'One or more validation errors occurred.', errors: { Name: ['Vui lòng nhập tên.'] } }), { status: 400 }))
  await assert.rejects(env.apiClient.post('/api/example', {}), error => error.message === 'Vui lòng nhập tên.')
})
for (const status of [403, 404, 409, 413, 415, 429, 503, 504]) {
  test(`HTTP ${status} có thông báo tiếng Việt và giữ mã lỗi`, async () => {
    const env = clientWith(new Response('{}', { status }))
    await assert.rejects(env.apiClient.get('/api/example'), error => error.status === status && /[àáạảãăâđêôơư]/i.test(error.message))
  })
}
test('204 được chấp nhận khi xóa thành công không trả nội dung', async () => {
  const env = clientWith(new Response(null, { status: 204 }))
  assert.equal(await env.apiClient.delete('/api/example'), undefined)
})
test('Lỗi trường bắt buộc mặc định được chuyển sang tiếng Việt', async () => {
  const env = clientWith(new Response(JSON.stringify({ title: 'One or more validation errors occurred.', errors: { Servings: ['The Servings field is required.'] } }), { status: 400 }))
  await assert.rejects(env.apiClient.post('/api/recipes', {}), error => error.message === 'Vui lòng nhập khẩu phần.')
})
test('Khoảng giá trị mặc định được chuyển sang hướng dẫn nhập', async () => {
  const env = clientWith(new Response(JSON.stringify({ detail: 'The field Quantity must be between 0.001 and 100000.' }), { status: 400 }))
  await assert.rejects(env.apiClient.post('/api/recipes', {}), error => error.message === 'Vui lòng nhập số lượng trong khoảng 0.001 đến 100000.')
})
test('Thông báo nghiệp vụ không hiển thị tên tham số nội bộ', async () => {
  const env = clientWith(new Response(JSON.stringify({ detail: "Vui lòng nhập bình luận. (Parameter 'body')" }), { status: 400 }))
  await assert.rejects(env.apiClient.post('/api/comments', {}), error => error.message === 'Vui lòng nhập bình luận.')
})

// Kiểm tra các dạng lỗi tự sinh mà biểu mẫu quản trị có thể nhận từ backend.
for (const [detail, expected] of [
  ['The field Description must be a string with a maximum length of 5000.', 'Vui lòng nhập mô tả tối đa 5000 ký tự.'],
  ['The field Name must be a string with a minimum length of 2 and a maximum length of 120.', 'Vui lòng nhập tên từ 2 đến 120 ký tự.'],
  ['The field DefaultUnit is invalid.', 'Lựa chọn đơn vị nguyên liệu chưa hợp lệ. Vui lòng chọn lại.'],
  ['The Email field is not a valid e-mail address.', 'Địa chỉ email chưa hợp lệ. Vui lòng kiểm tra lại.'],
  ['The field Ingredients must be a string or array type with a minimum length of 1.', 'Số lượng mục hoặc giá trị đã nhập vượt giới hạn cho phép. Vui lòng kiểm tra lại biểu mẫu.'],
  ['The JSON value could not be converted to System.Decimal. Path: $.quantity', 'Một số thông tin chưa đúng định dạng. Vui lòng kiểm tra lại các trường đã nhập.'],
  ['Tên công thức đã tồn tại. Vui lòng kiểm tra cả công thức đã ngừng sử dụng.', 'Tên công thức đã tồn tại. Vui lòng kiểm tra cả công thức đã ngừng sử dụng.'],
]) {
  test(`Thông báo quản trị được hiển thị rõ bằng tiếng Việt: ${detail}`, async () => {
    const env = clientWith(new Response(JSON.stringify({ detail }), { status: 400 }))
    await assert.rejects(env.apiClient.post('/api/admin/recipes', {}), error => error.status === 400 && error.message === expected)
  })
}
