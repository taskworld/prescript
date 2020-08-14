const { action } = require('../../..')
const expect = require('expect')

action('This is a failing test', async () => {
  expect(1).toEqual(2)
})
