// Checks that all examples are working.
const glob = require('glob')
const chalk = require('chalk')
let failures = 0

console.log('Checking if all examples work!')

function runTest(file, testName, { onMulti } = {}) {
  const title = `${file}${testName ? ` => ${testName}` : ''}`
  try {
    require('child_process').execFileSync('./bin/prescript', [
      file,
      ...(testName ? [testName] : [])
    ])
    console.log(chalk.bgGreen.bold(' OK '), title)
  } catch (e) {
    if (e.status === 2) {
      console.log(chalk.bgCyan.bold(' .. '), title)
    } else if (onMulti && e.status === 3) {
      console.log(chalk.bgYellow.bold(' ** '), title)
      onMulti()
    } else {
      console.log(chalk.bgRed.bold(' NG '), title)
      console.log(e.output.join(''))
      failures += 1
    }
  }
}

for (const file of glob.sync('examples/*/tests/**/*.js')) {
  runTest(file, null, {
    onMulti() {
      const testNamesJSON = require('child_process').execFileSync(
        './bin/prescript',
        [file, '--list', '--json']
      )
      const testNames = JSON.parse(testNamesJSON)
      for (const name of testNames) {
        runTest(file, name)
      }
    }
  })
}

if (failures) {
  process.exitCode = 1
}
