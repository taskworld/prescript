const assert = require('assert')
const { action } = require('../../..')

action('Action 1', () => {})
action('Action 2', () => {})
action('Action 3', () => {})
action('Check count', () => {
  assert.equal(require('../lib/stats').runCount, 3)
})
