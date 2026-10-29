// Kiểm thử thời lượng và giải phóng tài nguyên preview, không tải video thật của người dùng.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

function metadataModule() {
  const source = fs.readFileSync(new URL('../src/features/videos/utils/videoMetadata.ts', import.meta.url), 'utf8')
  const video = { duration: 0, load() {}, removeAttribute() {} }
  const revoked = []
  const context = { exports: {}, setTimeout, clearTimeout,
    document: { createElement: () => video },
    URL: { createObjectURL: () => 'blob:test-video', revokeObjectURL: url => revoked.push(url) } }
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, context)
  return { ...context.exports, video, revoked }
}

test('Định dạng giây thực, phút và giờ; không hiển thị thời lượng giả khi thiếu dữ liệu', () => {
  const { formatVideoDuration } = metadataModule()
  assert.equal(formatVideoDuration(24), '0:24')
  assert.equal(formatVideoDuration(26.52), '0:27')
  assert.equal(formatVideoDuration(65), '1:05')
  assert.equal(formatVideoDuration(3661), '1:01:01')
  assert.equal(formatVideoDuration(0.1), '0:01')
  for (const value of [null, undefined, 0, -1, NaN, Infinity]) assert.equal(formatVideoDuration(value), '')
})

test('Preview đọc metadata rồi giải phóng object URL và sự kiện', async () => {
  const { readLocalVideoDuration, video, revoked } = metadataModule()
  const pending = readLocalVideoDuration({}, new AbortController().signal)
  video.duration = 2.05
  video.onloadedmetadata()
  assert.equal(await pending, 2.05)
  assert.equal(video.onloadedmetadata, null)
  assert.deepEqual(revoked, ['blob:test-video'])
})

test('Đổi tệp hoặc đóng form hủy preview và giải phóng object URL', async () => {
  const { readLocalVideoDuration, video, revoked } = metadataModule()
  const controller = new AbortController()
  const pending = readLocalVideoDuration({}, controller.signal)
  controller.abort()
  assert.equal(await pending, null)
  assert.equal(video.onerror, null)
  assert.deepEqual(revoked, ['blob:test-video'])
})

test('Trình duyệt không đọc được tệp trả null thay vì số phút mặc định', async () => {
  const { readLocalVideoDuration, video, revoked } = metadataModule()
  const pending = readLocalVideoDuration({}, new AbortController().signal)
  video.onerror()
  assert.equal(await pending, null)
  assert.equal(revoked.length, 1)
})

test('Metadata không có thời lượng hữu hạn không tạo số phút', async () => {
  const { readLocalVideoDuration, video } = metadataModule()
  const pending = readLocalVideoDuration({}, new AbortController().signal)
  video.duration = Infinity
  video.onloadedmetadata()
  assert.equal(await pending, null)
})
