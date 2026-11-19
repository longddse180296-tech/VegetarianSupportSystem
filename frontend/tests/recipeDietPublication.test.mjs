import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

function recipeClient(response, calls = []) {
  const source = fs.readFileSync(new URL('../src/features/recipes/api/recipeApi.ts', import.meta.url), 'utf8')
  const js = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText
  const context = {
    exports: {}, URLSearchParams,
    require: name => name.includes('apiClient')
      ? { apiClient: { get: async (url) => { calls.push(url); return typeof response === 'function' ? response(url) : response } } }
      : {},
  }
  vm.runInNewContext(js, context)
  return context.exports
}

test('Public giữ nhãn Admin đã lưu khi bằng chứng nguyên liệu chuyển sang trứng', async () => {
  const detail = {
    id: 'recipe', name: 'Món chay', instructions: 'Nấu chín', ingredients: [],
    declaredDietaryType: 'Vegan',
    dietaryAssessments: [
      { dietaryType: 'Vegan', status: 'Incompatible' },
      { dietaryType: 'OvoVegetarian', status: 'Compatible' },
    ],
  }
  assert.equal((await recipeClient(detail).getRecipeDetail('recipe')).dietCategory, 'vegan')
  detail.declaredDietaryType = 'OvoVegetarian'
  assert.equal((await recipeClient(detail).getRecipeDetail('recipe')).dietCategory, 'ovo')
})

test('Công thức cũ chưa khai báo loại vẫn đọc được đánh giá nguyên liệu', () => {
  const api = recipeClient({})
  const assessments = [{ dietaryType: 'OvoVegetarian', status: 'Compatible' }]
  assert.equal(api.resolveDietType(assessments).dietCategory, 'ovo')
  assert.equal(api.resolveDietType(assessments, 1).dietCategory, 'vegan')
})

test('Công thức public cũ nhiều phần quy về định lượng 1 người, giữ dinh dưỡng mỗi người', async () => {
  const recipe = await recipeClient({
    id: 'legacy', name: 'Món cũ', servings: 3, instructions: 'Nấu',
    ingredients: [{ ingredientId: 'tofu', name: 'Đậu hũ', quantity: 300, unit: 'g' }],
    caloriesPerServing: 150, proteinGramPerServing: 10,
  }).getRecipeDetail('legacy')
  assert.equal(recipe.servings, 1)
  assert.equal(recipe.ingredients[0].amount, 100)
  assert.equal(recipe.nutrition.kcal, 150)
})

test('Công thức liên quan lọc đúng loại đã công bố, không gồm món đang xem hoặc loại chỉ tương thích', async () => {
  for (const [category, declared, number] of [
    ['vegan', 'Vegan', 1], ['lacto', 'LactoVegetarian', 2],
    ['ovo', 'OvoVegetarian', 3], ['ovo-lacto', 'LactoOvoVegetarian', 4],
  ]) {
    const calls = []
    const api = recipeClient({ items: [
      { id: 'CURRENT', declaredDietaryType: declared },
      { id: 'other', declaredDietaryType: declared,
        dietaryAssessments: [{ dietaryType: declared, status: 'Incompatible' }] },
      { id: 'different', declaredDietaryType: number === 1 ? 'OvoVegetarian' : 'Vegan' },
    ] }, calls)
    const related = await api.getRelatedRecipes({ id: 'current', dietCategory: category })
    assert.deepEqual(Array.from(related, item => item.id), ['other'])
    assert.equal(calls[0], `/api/recipes?declaredDietaryType=${number}&pageNumber=1&pageSize=4`)
  }
})

test('Giới hạn ba món liên quan; thiếu chế độ ăn hoặc không có món cùng loại thì trả rỗng', async () => {
  const api = recipeClient({ items: Array.from({ length: 4 }, (_, i) => ({ id: String(i), declaredDietaryType: 'Vegan' })) })
  assert.equal((await api.getRelatedRecipes({ id: 'current', dietCategory: 'vegan' })).length, 3)
  const calls = []
  assert.equal((await recipeClient({}, calls).getRelatedRecipes({ id: 'current' })).length, 0)
  assert.equal(calls.length, 0)
  assert.equal((await recipeClient({ items: [] }).getRelatedRecipes({ id: 'current', dietCategory: 'vegan' })).length, 0)
})

test('Danh sách công thức lấy đủ các trang, không cắt mất công thức mới sau 50 hoặc 100 món', async () => {
  const calls = []
  const api = recipeClient(url => ({ totalCount: 102, items: url.includes('pageNumber=2')
    ? [{ id: '100' }, { id: '101' }]
    : Array.from({ length: 100 }, (_, i) => ({ id: String(i) })) }), calls)
  const result = await api.getRecipes()
  assert.equal(result.items.length, 102)
  assert.equal(result.items.at(-1).id, '101')
  assert.equal(calls.length, 2)
})
