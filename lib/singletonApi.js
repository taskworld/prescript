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
  },
  pending (f) {
    return getInstance().pending()
  },
  titled (strings, ...placeholders) {
    const parts = [ ]
    for (let i = 0; i < strings.length; i++) {
      parts.push(strings[i])
      if (placeholders[i]) parts.push(`\`${placeholders[i]}\``)
    }
    return parts.join('')
  }
}
