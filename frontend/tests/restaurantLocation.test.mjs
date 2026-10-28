// Kiểm tra adapter vị trí và danh mục tỉnh/phường; không dùng tọa độ thật của người dùng.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText
function moduleFrom(path, require = () => ({})) {
  const context = { exports: {}, URLSearchParams, console, require }
  vm.runInNewContext(compile(fs.readFileSync(new URL(path, import.meta.url), 'utf8')), context)
  return context.exports
}
const location = moduleFrom('../src/features/restaurants/utils/restaurantLocation.ts')

test('Khoảng cách hiển thị km, giữ đúng 0 và không giả khi thiếu tọa độ', () => {
  assert.equal(location.formatRestaurantDistance(0), '0 km')
  assert.equal(location.formatRestaurantDistance(0.25), '0,25 km')
  assert.equal(location.formatRestaurantDistance(0.001), '< 0,01 km')
  assert.equal(location.formatRestaurantDistance(1.25), '1,3 km')
  for (const value of [null, undefined, NaN, -1, Infinity]) assert.equal(location.formatRestaurantDistance(value), '')
})

test('Vị trí chỉ hợp lệ khi có đủ hai tọa độ hữu hạn trong miền giá trị', () => {
  assert.equal(location.hasRestaurantLocation({ latitude: 0, longitude: 0 }), true)
  for (const value of [{}, {latitude: 10}, {latitude: NaN, longitude: 106}, {latitude: 91, longitude: 106}])
    assert.equal(location.hasRestaurantLocation(value), false)
})

test('Danh mục hiện hành đủ tỉnh/phường, quan hệ trực thuộc và tọa độ hợp lệ', () => {
  const data = JSON.parse(fs.readFileSync(new URL('../src/features/restaurants/data/vietnamLocations.json', import.meta.url), 'utf8'))
  assert.equal(data.provinces.length, 34)
  const wards = data.provinces.flatMap(province => province.wards)
  assert.equal(wards.length, 3321)
  assert.equal(new Set(wards.map(ward => ward.id)).size, wards.length)
  for (const area of [...data.provinces, ...wards]) assert.equal(location.hasRestaurantLocation(area), true)
  const hcm = data.provinces.find(province => province.id === '79')
  const hanoi = data.provinces.find(province => province.id === '01')
  assert.ok(hcm.wards.some(ward => ward.name === 'Bến Thành'))
  assert.ok(hanoi.wards.some(ward => ward.name === 'Hoàn Kiếm'))
  assert.ok(!hanoi.wards.some(ward => hcm.wards.some(other => other.id === ward.id)))
})

function restaurantApi(get) {
  const types = moduleFrom('../src/features/restaurants/types/restaurant.types.ts')
  return moduleFrom('../src/features/restaurants/api/restaurantApi.ts', path => path.includes('apiClient') ? { apiClient: { get } } : types)
}

test('Không có vị trí không tự gửi tọa độ TP.HCM khi chọn bán kính', async () => {
  let url
  const api = restaurantApi(async path => { url = path; return { items: [], totalCount: 0 } })
  await api.getRestaurants({ distanceMaxKm: 5 })
  assert.ok(!url.includes('latitude='))
  assert.ok(!url.includes('longitude='))
  assert.ok(!url.includes('maxDistanceKm='))
})

test('Tọa độ đã chọn gửi đúng server; giữ thứ tự gần nhất, null và khoảng cách bằng 0', async () => {
  let url
  const api = restaurantApi(async path => {
    url = path
    return { items: [
      { id: 'near', name: 'Z near', address: 'Here', latitude: 10, longitude: 106, distanceKm: 0 },
      { id: 'unknown', name: 'A unknown', address: 'Unknown', latitude: null, longitude: null, distanceKm: null }
    ], totalCount: 2 }
  })
  const response = await api.getRestaurants({ latitude: 10, longitude: 106, distanceMaxKm: 5, sort: 'distance_asc' })
  assert.ok(url.includes('latitude=10') && url.includes('longitude=106') && url.includes('maxDistanceKm=5'))
  assert.equal(response.items[0].id, 'near')
  assert.equal(response.items[0].distanceKm, 0)
  assert.equal(response.items[0].geoLat, 10)
  assert.equal(response.items[1].distanceKm, null)
  assert.equal(response.items[1].geoLat, undefined)
})

test('Admin mở khóa gửi request thật tới endpoint kích hoạt', async () => {
  let requested
  const { restaurantApi } = moduleFrom('../src/features/admin/restaurants/api/restaurantContract.ts', () => ({
    apiClient: { post: async path => { requested = path } }
  }))
  await restaurantApi.activate('restaurant-id')
  assert.equal(requested, '/api/admin/restaurants/restaurant-id/activate')
})

test('Danh sách nhà hàng giữ đủ các loại ăn chay và gửi bộ lọc từng loại', async () => {
  let url
  const api = restaurantApi(async path => {
    url = path
    return { items: [{ id: 'multi', name: 'Nhiều loại', address: 'Địa chỉ', dietaryTypes: ['Vegan', 'OvoVegetarian', 'LactoVegetarian'] }], totalCount: 1 }
  })
  const response = await api.getRestaurants({ diet: 'ovo' })
  assert.ok(url.includes('dietaryType=3'))
  assert.deepEqual(Array.from(response.items[0].dietTypes), ['vegan', 'ovo', 'lacto'])
})

test('Thiếu dữ liệu chế độ ăn không tự gán thuần chay cho nhà hàng', async () => {
  const api = restaurantApi(async () => ({ items: [{ id: 'empty', name: 'Chưa khai báo', address: 'Địa chỉ', dietaryTypes: [] }], totalCount: 1 }))
  assert.deepEqual(Array.from((await api.getRestaurants({})).items[0].dietTypes), [])
})

test('Lỗi mở khóa được trả về giao diện, không chuyển thành thành công giả', async () => {
  const error = new Error('Không thể lưu trạng thái')
  const { restaurantApi } = moduleFrom('../src/features/admin/restaurants/api/restaurantContract.ts', () => ({
    apiClient: { post: async () => { throw error } }
  }))
  await assert.rejects(restaurantApi.activate('restaurant-id'), result => result === error)
})
