// Kiểm tra ảnh bìa giữ đúng dữ liệu API, không thay nội dung thiếu ảnh bằng ảnh minh họa khác.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

const require = createRequire(import.meta.url)
function moduleAt(relativePath, dependency) {
  const source = fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8')
  const js = ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText
  const context = { exports: {}, require: dependency, URLSearchParams, console: { error() {} } }
  vm.runInNewContext(js, context)
  return context.exports
}

function apiAt(relativePath, response) {
  return moduleAt(relativePath, name => {
    if (name.includes('apiClient')) return { apiClient: { get: async () => response } }
    if (name.endsWith('videoMetadata')) return { formatVideoDuration: () => '' }
    if (name.endsWith('backendVideos')) return { inferVideoDietType: () => undefined }
    if (name.endsWith('.png')) return { default: 'account-icon.png' }
    return {}
  })
}

test('Bài viết liên quan dùng coverImageUrl thật thay vì mất ảnh do đọc nhầm trường', async () => {
  const api = apiAt('../src/features/recipes/api/recipeApi.ts', {
    items: [{ id: 'article', title: 'Bài viết', coverImageUrl: '/api/public-images/actual-cover' }],
  })
  assert.equal((await api.getRelatedArticles('recipe'))[0].imageUrl, '/api/public-images/actual-cover')
})

test('Ảnh thiếu ở bài viết, video, nhà hàng liên quan được giữ rỗng', async () => {
  const api = apiAt('../src/features/recipes/api/recipeApi.ts', { items: [{ id: 'item', title: 'Nội dung', name: 'Nhà hàng' }] })
  for (const method of ['getRelatedArticles', 'getRelatedVideos', 'getRelatedRestaurants']) {
    assert.equal((await api[method]('recipe'))[0].imageUrl, '')
  }
})

test('Adapter nhà hàng giữ ảnh thật và không tự gán ảnh khi imageUrl null', async () => {
  for (const imageUrl of [null, '/api/public-images/restaurant']) {
    const api = apiAt('../src/features/restaurants/api/restaurantApi.ts', {
      id: 'restaurant', name: 'Nhà hàng', dietaryTypes: [], imageUrl,
    })
    assert.equal((await api.getRestaurantDetail('restaurant')).imageUrl, imageUrl || '')
  }
})

test('Adapter video không tự tạo URL thumbnail khi server chưa có ảnh bìa', async () => {
  for (const thumbnailUrl of [null, '/api/videos/video/thumbnail']) {
    const api = apiAt('../src/features/videos/api/videoApi.ts', {
      id: 'video', title: 'Video', description: '', thumbnailUrl,
    })
    assert.equal((await api.getVideoDetail('video')).thumbnailUrl, thumbnailUrl || '')
  }
})

test('Gợi ý tủ bếp không thay ảnh công thức còn thiếu bằng ảnh ngoài dữ liệu', async () => {
  const api = apiAt('../src/features/pantry/api/pantryApi.ts', [{
    recipeId: 'recipe', recipeName: 'Công thức', servings: 1, totalTimeMinutes: 10,
    caloriesPerServing: null, matchPercent: 0, availableIngredients: [], missingIngredients: [], imageUrl: null,
  }])
  assert.equal((await api.getRecipeMatches([]))[0].cover, '')
})

const { ContentImage } = moduleAt('../src/shared/components/ContentImage.tsx', require)
test('Ảnh trống hiển thị trạng thái truy cập được và không tạo thẻ img rỗng', () => {
  for (const src of [undefined, null, '', '   ']) {
    const markup = renderToStaticMarkup(React.createElement(ContentImage, { src, alt: 'Công thức' }))
    assert.match(markup, /Chưa có ảnh/)
    assert.match(markup, /role="img"/)
    assert.doesNotMatch(markup, /<img\b/)
  }
})

test('Ảnh hợp lệ giữ nguyên nguồn dữ liệu và mô tả thay thế', () => {
  const markup = renderToStaticMarkup(React.createElement(ContentImage, { src: '/actual-cover.png', alt: 'Ảnh món ăn' }))
  assert.match(markup, /src="\/actual-cover.png"/)
  assert.match(markup, /alt="Ảnh món ăn"/)
  assert.doesNotMatch(markup, /unsplash|Chưa có ảnh/)
})
