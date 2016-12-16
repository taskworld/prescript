const chalk = require('chalk')

function prettyFormatStep (step) {
  let result = ''
  const write = (stuff) => { result += stuff }
  const numberParts = step.number.split('.')
  const frontNumber = numberParts.slice(0, -1).join('.')
  const lastNumber = numberParts[numberParts.length - 1]
  const formattedName = step.name.replace(/`([^`]+?)`/g, (a, x) => {
    return chalk.cyan(x)
  })
  write(chalk.dim(frontNumber + (frontNumber ? '.' : '')))
  write(chalk.bold(lastNumber + '. ') + formattedName)
  if (step.children) {
    write(':')
  }
  if (step.creator) {
    write(chalk.dim(' (registered at step ' + step.creator + ')'))
  }
  if (step.cleanup) {
    write(chalk.dim(' (cleanup)'))
  }
  return result
}

module.exports = prettyFormatStep
