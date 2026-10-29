// Kiểm tra kết quả AI xuất hiện trong giao diện Admin, phân biệt cảnh báo nội dung và lỗi dịch vụ.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as jsxRuntime from 'react/jsx-runtime'

const labels = {
  NotSubmitted: 'Chưa kiểm tra', Checking: 'Đang kiểm tra', Passed: 'Đã kiểm tra',
  Flagged: 'Có cờ cảnh báo', Partial: 'Kiểm tra một phần', Failed: 'Kiểm tra thất bại',
}
const submission = { id: 'test-version', contentType: 'Article', aiFlagStatus: 'Flagged',
  aiSummary: 'Cần đối chiếu tuyên bố sức khỏe.', aiFlagReason: 'Khẳng định chữa bệnh chưa có căn cứ.',
  aiEvidence: 'Món ăn chữa khỏi bệnh.', aiCheckedScope: 'Nội dung văn bản',
  aiUncheckedScope: 'Ảnh minh họa', decisions: [], adminReviewStatus: 'PendingAdminReview' }
let selected = null
let selectedStateInjected = false
const compiled = ts.transpileModule(fs.readFileSync(new URL('../src/features/admin/moderation/components/ModerationWorkspace.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText
const exports = {}
const messages = {}
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/features/admin/moderation/utils/moderationMessages.ts', import.meta.url), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText, {exports: messages})
vm.runInNewContext(compiled, { exports, URLSearchParams, window: { location: { hash: '' } }, require(path) {
  if (path.includes('moderationMessages')) return messages
  if (path === 'react/jsx-runtime') return jsxRuntime
  if (path === 'react') return { ...React, useState(initial) {
    let value = initial
    if (initial === null && selected && !selectedStateInjected) {
      selectedStateInjected = true
      value = selected
    }
    return React.useState(value)
  } }
  if (path.includes('adminModerationApi')) return { aiStatusLabels: labels, adminStatusLabels: {}, decisionLabels: {} }
  if (path.includes('useApiData')) return { useApiData: () => ({ data: { items: [submission], totalCount: 1 } }) }
  if (path.includes('apiUi')) return { formatDate: value => value }
  if (path.includes('ApiWorkspace')) return { AdminFrame: ({children}) => children, Feedback: () => null }
  if (path.includes('SharedDataTable')) return { SharedDataTable: ({columns}) => React.createElement('div', null,
    columns.map(column => React.createElement('section', {key: column.key}, column.header, column.render?.(submission)))) }
  if (path.includes('/Modal')) return { Modal: ({isOpen, children}) => isOpen ? children : null }
  if (path.includes('/Select')) return { Select: () => null }
  if (path.includes('RichContentRenderer')) return { RichContentRenderer: () => null }
  return new Proxy({}, {get: () => () => null})
} })

test('Admin thấy lý do, bằng chứng và phạm vi kiểm tra của phiên bản bài viết', () => {
  const html = renderToStaticMarkup(React.createElement(exports.AiReview, {submission}))
  for (const text of [submission.aiFlagReason, submission.aiEvidence, submission.aiCheckedScope, submission.aiUncheckedScope]) assert.ok(html.includes(text))
  assert.ok(html.includes('bg-red-50'))
  assert.ok(html.includes('text-red-900'))
})

test('Lỗi AI không được hiển thị thành kết luận vi phạm; video không có kết quả AI', () => {
  const failed = renderToStaticMarkup(React.createElement(exports.AiReview, {submission: {...submission, aiFlagStatus: 'Failed'}}))
  assert.ok(failed.includes('không phải kết luận bài viết vi phạm'))
  const video = renderToStaticMarkup(React.createElement(exports.AiReview, {submission: {...submission, contentType: 'Video'}}))
  assert.ok(!video.includes(submission.aiEvidence))
})

test('Tiền kiểm từ chối có lý do riêng, không hiển thị giả kết quả AI', () => {
  const reason = 'Tiêu đề trùng với bài đã được duyệt và đang công khai.'
  const html = renderToStaticMarkup(React.createElement(exports.AiReview, {submission: {...submission, systemRejectionReason: reason}}))
  assert.ok(html.includes(reason))
  assert.ok(html.includes('Hệ thống chưa kiểm tra'))
  assert.ok(!html.includes(submission.aiEvidence))
  assert.ok(html.includes('bg-red-50'))
})

test('Trang bài viết gắn cả cột AI và khối kết quả vào hộp kiểm duyệt', () => {
  selected = submission
  const html = renderToStaticMarkup(React.createElement(exports.ModerationWorkspace, {contentType: 'Article'}))
  assert.ok(html.includes('Kiểm tra của Hệ thống'))
  assert.ok(html.includes('aria-label="Kết quả kiểm tra của Hệ thống"'))
  assert.ok(html.includes(submission.aiEvidence))
  assert.ok(html.includes('Cập nhật kết quả hệ thống'))
  selected = null
})

test('Thông báo cũ dùng Hệ thống/Quản trị viên, trích dẫn gốc giữ nguyên', () => {
  const html = renderToStaticMarkup(React.createElement(exports.AiReview, {submission: {...submission,
    aiSummary: 'AI chưa hoàn tất kiểm tra. Admin cần xem trực tiếp.',
    aiUncheckedScope: 'Gemini chưa đọc được ảnh.', aiEvidence: 'AI là nội dung được trích nguyên văn.'}}))
  assert.ok(html.includes('Hệ thống chưa hoàn tất kiểm tra. Quản trị viên cần xem trực tiếp.'))
  assert.ok(html.includes('Hệ thống chưa đọc được ảnh.'))
  assert.ok(html.includes('AI là nội dung được trích nguyên văn.'))
  assert.equal(messages.formatSystemReviewMessage('hệ thống AI đã kiểm tra'), 'Hệ thống đã kiểm tra')
})
