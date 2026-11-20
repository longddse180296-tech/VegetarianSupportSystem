import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const source = fs.readFileSync(new URL('../src/shared/components/OwnerModerationNotice.tsx', import.meta.url), 'utf8')
const context = { exports: {}, require }
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, context)
const render = props => renderToStaticMarkup(createElement(context.exports.OwnerModerationNotice, props))

test('Owner sees the admin decision and reason, with approval green and rejection red', () => {
  const approved = render({ status: 'Published', reason: 'Nội dung phù hợp.' })
  assert.match(approved, /Nội dung đã được chấp nhận/)
  assert.match(approved, /Nội dung phù hợp\./)
  assert.match(approved, /bg-emerald-50/)
  const rejected = render({ status: 'Rejected', reason: 'Thiếu nguồn thông tin.' })
  assert.match(rejected, /Nội dung đã bị từ chối/)
  assert.match(rejected, /Thiếu nguồn thông tin\./)
  assert.match(rejected, /bg-red-50/)
})

test('Pending drafts do not show a previous admin decision', () => {
  for (const status of ['Draft', 'Submitted', 'PendingAdminReview'])
    assert.equal(render({ status, reason: 'Phản hồi phiên bản cũ' }), '')
  assert.equal(render({ status: 'Published', reason: '   ' }), '')
})

test('Admin feedback is rendered as text, never executed as HTML', () => {
  const html = render({ status: 'Rejected', reason: '<script>alert(1)</script>\nCần kiểm tra.' })
  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /&lt;script&gt;/)
  assert.match(html, /Cần kiểm tra\./)
})
