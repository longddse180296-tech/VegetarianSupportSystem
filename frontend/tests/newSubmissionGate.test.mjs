import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

const require = createRequire(import.meta.url)
let availability
const context = { exports: {}, require: id => {
  if (id.endsWith('useSubmissionAvailability')) return { useSubmissionAvailability: () => availability }
  if (id === './Button') return { Button: ({ children }) => createElement('button', {}, children) }
  return require(id)
} }
const source = fs.readFileSync(new URL('../src/shared/components/NewSubmissionGate.tsx', import.meta.url), 'utf8')
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, context)
const render = type => renderToStaticMarkup(createElement(context.exports.NewSubmissionGate, { type, onNavigate() {} }, createElement('form', {}, 'CREATE_FORM')))

test('A pending article blocks only article creation and links to own articles', () => {
  availability = { loading: false, articlePending: true, videoPending: false }
  assert.match(render('Article'), /Xem bài viết của tôi/)
  assert.doesNotMatch(render('Article'), /CREATE_FORM/)
  assert.match(render('Video'), /CREATE_FORM/)
})

test('A pending video blocks only video creation and restores creation after a decision', () => {
  availability = { loading: false, articlePending: false, videoPending: true }
  assert.match(render('Video'), /Xem video của tôi/)
  assert.doesNotMatch(render('Video'), /CREATE_FORM/)
  assert.match(render('Article'), /CREATE_FORM/)
  availability.videoPending = false
  assert.match(render('Video'), /CREATE_FORM/)
})

test('Loading never flashes a creation form; network failure does not claim an existing submission', () => {
  availability = { loading: true }
  assert.doesNotMatch(render('Article'), /CREATE_FORM/)
  availability = { loading: false, unavailable: true, articlePending: true, videoPending: true }
  assert.match(render('Video'), /Chưa kiểm tra được trạng thái gửi duyệt/)
  assert.doesNotMatch(render('Video'), /Bạn đang có video chờ xử lý/)
})
