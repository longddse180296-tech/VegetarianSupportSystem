import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const settle = () => new Promise(resolve => setImmediate(resolve))

function setup(failStart = false) {
  const timers = new Map()
  const handlers = {}
  let id = 0, starts = 0, stops = 0, updates = 0, endpoint
  const hub = {
    on: (name, callback) => { handlers[name] = callback },
    off: name => { delete handlers[name] },
    onreconnected: callback => { handlers.reconnected = callback },
    onclose: callback => { handlers.closed = callback },
    start: async () => { starts++; if (failStart) throw Error('offline') },
    stop: async () => { stops++; handlers.closed?.() },
  }
  class Builder {
    withUrl(url) { endpoint = url; return this }
    withAutomaticReconnect() { return this }
    configureLogging() { return this }
    build() { return hub }
  }
  const context = {
    exports: {},
    setTimeout: (callback, delay) => { timers.set(++id, { callback, delay }); return id },
    clearTimeout: key => timers.delete(key),
    require: name => name === '@microsoft/signalr'
      ? { HubConnectionBuilder: Builder, LogLevel: { None: 0 } }
      : { resolveApiUrl: url => 'http://api.test' + url },
  }
  const source = fs.readFileSync(new URL('../src/features/recipes/api/publicRecipeUpdates.ts', import.meta.url), 'utf8')
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText, context)
  const cleanup = context.exports.subscribePublicRecipeUpdates(() => { updates++ })
  return {
    cleanup, handlers, timers,
    get starts() { return starts }, get stops() { return stops }, get updates() { return updates },
    get endpoint() { return endpoint },
    online: () => { failStart = false },
    flush(delay) {
      for (const [key, timer] of [...timers]) if (timer.delay === delay) {
        timers.delete(key); timer.callback()
      }
    },
  }
}

test('Guest nhận thay đổi công thức, gộp thông báo liên tiếp và tải bù sau kết nối lại', async () => {
  const s = setup()
  await settle()
  assert.equal(s.endpoint, 'http://api.test/api/hubs/public-recipes')
  s.flush(150)
  assert.equal(s.updates, 1)
  s.handlers.RecipesChanged()
  s.handlers.RecipesChanged()
  s.flush(150)
  assert.equal(s.updates, 2)
  s.handlers.reconnected()
  s.flush(150)
  assert.equal(s.updates, 3)
  s.cleanup()
})

test('Kết nối đầu thất bại được thử lại và tự lấy dữ liệu mới khi online', async () => {
  const s = setup(true)
  await settle()
  assert.equal(s.starts, 1)
  s.online()
  s.flush(5000)
  await settle()
  s.flush(150)
  assert.equal(s.starts, 2)
  assert.equal(s.updates, 1)
  s.cleanup()
})

test('Rời trang hủy thông báo đang đợi, đóng kết nối và không kết nối lại', async () => {
  const s = setup()
  await settle()
  const delayedEvent = s.handlers.RecipesChanged
  s.handlers.RecipesChanged()
  s.cleanup()
  delayedEvent()
  s.flush(150)
  s.flush(5000)
  assert.equal(s.updates, 0)
  assert.equal(s.starts, 1)
  assert.equal(s.stops, 1)
  assert.equal(s.timers.size, 0)
  assert.equal(s.handlers.RecipesChanged, undefined)
})
