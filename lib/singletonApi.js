const { getInstance } = require('./singleton')

module.exports = {
  step (name, f) {
    return getInstance().step(name, f)
  },
  cleanup (name, f) {
    return getInstance().cleanup(name, f)
  },
  onFinish (f) {
    return getInstance().onFinish(f)
  },
  action (f) {
    return getInstance().action(f)
  }
}
