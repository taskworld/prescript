const loadTestModule = require('./loadTestModule')
const key = '__prescriptSingletonInstance(╯°□°）╯︵ ┻━┻'

module.exports = {
  getInstance () {
    if (!global[key]) {
      throw new Error('prescript is not running in prescripting phase.')
    }
    return global[key]
  },
  loadTest (f) {
    try {
      return loadTestModule((context) => {
        global[key] = context
        f()
      })
    } finally {
      global[key] = null
    }
  }
}
