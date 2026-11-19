import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

test('Shopping PDF uses saved reconciliation, includes fully stocked items, and has no checkbox column', () => {
  const source = fs.readFileSync(new URL('../src/features/meal-plans/utils/mealPlanPdfExport.ts', import.meta.url), 'utf8')
  const js = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText
  let html = ''
  const context = {
    exports: {},
    require: () => ({
      addPlanDays: () => '2026-11-29',
      formatPlanDate: (date) => date,
      PLAN_DIET_LABELS: { Vegan: 'Thuần chay' },
    }),
    document: {
      createElement: () => ({
        style: {}, setAttribute() {},
        contentWindow: { document: { open() {}, write(value) { html = value }, close() {} }, focus() {} },
      }),
      body: { appendChild() {} },
    },
    setTimeout() {},
  }
  vm.runInNewContext(js, context)
  context.exports.exportShoppingListPdf({
    name: 'Thực đơn kiểm thử',
    weekStartDate: '2026-11-23',
    profileDiet: 'Vegan',
    shoppingItems: [
      { ingredientName: 'Đậu hũ', requiredQuantity: 1820, pantryQuantity: 1200, quantityToBuy: 620, unit: 'g', isPurchased: false },
      { ingredientName: 'Gạo lứt', requiredQuantity: 440, pantryQuantity: 440, quantityToBuy: 0, unit: 'g', isPurchased: false },
      { ingredientName: 'Bắp cải', requiredQuantity: 500, pantryQuantity: 0, quantityToBuy: 500, unit: 'g', isPurchased: true },
    ],
  })
  assert.doesNotMatch(html, /<th[^>]*>Tích<\/th>|<span class="checkbox-box">/)
  assert.match(html, /620 g/)
  assert.match(html, /Cần: 1820 g · Tủ bếp có: 1200 g/)
  assert.match(html, /Cần: 440 g · Tủ bếp có: 440 g/)
  assert.match(html, /Đã có đủ/)
  assert.match(html, /Cần mua thêm/)
  assert.match(html, />\s*Cần mua\s*</)
  assert.doesNotMatch(html, /Đã mua/)
  assert.equal((html.match(/<th[ >]/g) ?? []).length, 5)
  context.exports.exportShoppingListPdf({
    name: 'Thực đơn kiểm thử',
    weekStartDate: '2026-11-23',
    profileDiet: 'Vegan',
    shoppingItems: [
      { ingredientName: 'Đậu hũ', requiredQuantity: 1820, pantryQuantity: 1200, quantityToBuy: 620, unit: 'g', isPurchased: false },
    ],
  }, [
    { ingredientName: 'Đậu hũ', requiredQuantity: 260, pantryQuantity: 100, quantityToBuy: 160, unit: 'g', isPurchased: true },
  ], 1)
  assert.match(html, /Ngày 1 · 3 bữa/)
  assert.match(html, /Cần: 260 g · Tủ bếp có: 100 g/)
  assert.match(html, /160 g/)
  assert.match(html, /Cần mua thêm/)
  assert.doesNotMatch(html, /Đã mua/)
  assert.doesNotMatch(html, /1820 g|1200 g|620 g|<th[^>]*>Tích<\/th>/)
  if (process.env.SHOPPING_PDF_PREVIEW_HTML) {
    fs.writeFileSync(process.env.SHOPPING_PDF_PREVIEW_HTML, html)
  }
})
