import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const source = fs.readFileSync(new URL('../src/features/articles/utils/articleReviewStatus.ts', import.meta.url), 'utf8')
const context = { exports: {} }
vm.runInNewContext(ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText, context)
const { articleReviewStatus } = context.exports

test('Duyệt màu xanh, từ chối màu đỏ và đang đợi màu vàng', () => {
  assert.equal(articleReviewStatus('Published').label, 'Đã được chấp nhận')
  assert.match(articleReviewStatus('Published').className, /bg-emerald-50/)
  for (const status of ['Rejected', 'RevisionRequested', 'Removed']) {
    assert.equal(articleReviewStatus(status).label, 'Đã bị từ chối')
    assert.match(articleReviewStatus(status).className, /bg-red-50/)
  }
  for (const status of ['Submitted', 'PendingAdminReview']) {
    assert.equal(articleReviewStatus(status).label, 'Đang đợi duyệt')
    assert.match(articleReviewStatus(status).className, /bg-amber-50/)
  }
  assert.equal(articleReviewStatus('Draft').label, 'Bản nháp')
})
