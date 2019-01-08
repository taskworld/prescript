/** @type {import('../..').IConfig} */
module.exports = {
  async wrapAction(step, execute, state, context) {
    const start = process.hrtime()
    try {
      return await execute()
    } finally {
      const diff = process.hrtime(start)
      context.log('Step took %s nanoseconds', diff[0] * 1e9 + diff[1])
      require('./lib/stats').runCount++
    }
  }
}
