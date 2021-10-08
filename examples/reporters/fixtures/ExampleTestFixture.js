const { to, action, defer } = require('../../..')
const expect = require('expect')

to('Do something', () => {
  action('Do this', async () => {})
  action('Do that', async () => {})
  to('Do the other thing', () => {
    action('Do these', async () => {})
    action('Do those', async () => {})
    action('Do deez dooz', async () => {})
  })
})

action('This is a passing step', async () => {})
defer('This is a deferred step', async () => {})
action('This is a failing step', async () => {
  throw new Error('This is a failing step')
})
