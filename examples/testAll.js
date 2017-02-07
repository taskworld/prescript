// Checks that all examples are working.
const glob = require('glob')
const chalk = require('chalk')
let failures = 0

console.log('Checking if all examples work!')

for (const file of glob.sync('examples/*/tests/**/*.js')) {
  try {
    require('child_process').execFileSync('./bin/prescript', [ file ])
    console.log(chalk.bgGreen.bold(' OK '), file)
  } catch (e) {
    console.log(chalk.bgRed.bold(' NG '), file)
    console.log(e.output.join(''))
    failures += 1
  }
}

if (failures) {
  process.exitCode = 1
}
