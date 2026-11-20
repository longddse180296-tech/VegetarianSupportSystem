import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const source = fs.readFileSync(new URL('../src/features/meal-plans/utils/shoppingQuantity.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const context = { exports: {} }
vm.runInNewContext(js, context)
const validate = context.exports.shoppingQuantityError

test('Shopping quantity accepts zero, limit, and decimal comma', () => {
  for (const value of ['0', '450', '12.5', '12,5']) assert.equal(validate(value, 450, 'g'), null)
})

test('Shopping quantity rejects letters, negative values, and quantities above the selected limit', () => {
  assert.match(validate('abc', 450, 'g'), /bằng số/)
  assert.match(validate('1e2', 450, 'g'), /bằng số/)
  assert.match(validate('-1', 450, 'g'), /số âm/)
  assert.match(validate('12312', 450, 'g'), /450 g/)
  assert.match(validate('', 450, 'g'), /Vui lòng nhập/)
})
