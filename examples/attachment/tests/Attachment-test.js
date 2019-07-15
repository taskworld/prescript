const { action } = require('../../..')

action('Attachment', (state, context) => {
  context.attach('Report', Buffer.from('<h1>ALL IS GOOD!</h1>'), 'text/html')
})
