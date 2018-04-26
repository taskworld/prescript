const { test, to, action, defer } = require('../../..')
const assert = require('assert')

test('Deferring actions', () => {
  action('Initialize', (state) => {
    state.initialized = true
    state.tornDown = false
  })
  action('Verify initialzed', (state) => {
    assert.equal(state.initialized, true)
  })
  defer('Deferred teardown step', (state) => {
    state.tornDown = true
  })
  action('Verify not torn down yet', (state) => {
    assert.equal(state.tornDown, false)
  })
  defer('Verify torn down', (state) => {
    assert.equal(state.tornDown, true)
  })
})
