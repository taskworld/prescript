import chalk from 'chalk'
import * as StepName from './StepName'
import { IStep } from './types'

export default function prettyFormatStep(step: IStep) {
  let result = ''
  const write = (stuff: string) => {
    result += stuff
  }
  const numberParts = (step.number || '').split('.')
  const frontNumber = numberParts.slice(0, -1).join('.')
  const lastNumber = numberParts[numberParts.length - 1]
  const formattedName = StepName.format(step.name)
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
