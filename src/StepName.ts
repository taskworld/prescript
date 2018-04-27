import chalk from 'chalk'
import invariant from 'invariant'

export function parse (string: string): StepName {
  const placeholders: string[] = [ ]
  const stringedParts = string.replace(/`([^`]+?)`/g, (a, x) => {
    placeholders.push(x)
    return '\0'
  })
  return new StepName(stringedParts.split('\0'), placeholders)
}

export function coerce (stepNameOrString: StepName | string): StepName {
  if (typeof stepNameOrString === 'string') {
    return parse(stepNameOrString)
  }
  if (typeof stepNameOrString === 'object' && stepNameOrString) {
    const stepName = stepNameOrString
    invariant(
      stepName.parts,
      'Expected step name object to have `parts` property'
    )
    invariant(
      stepName.placeholders,
      'Expected step name object to have `placeholders` property'
    )
    return stepName
  }
  throw invariant(false, 'Step name should be a string or a tagged `named` literal.')
}

/**
 * Creates a step name. Use this as tagged template string.
 */
export function named (parts: string[], ...placeholders: string[]) {
  return new StepName(parts, placeholders)
}

export function format (stepName: StepName | string, { colors = true } = { }) {
  if (typeof stepName === 'string') {
    return stepName
  }
  const { parts, placeholders } = stepName
  const resultParts: string[] = [ ]
  for (let i = 0; i < parts.length; i++) {
    resultParts.push(parts[i])
    if (placeholders[i]) {
      resultParts.push(colors
        ? chalk.cyan(String(placeholders[i]))
        : `‘${placeholders[i]}’`
      )
    }
  }
  return resultParts.join('')
}

export class StepName {
  constructor (public parts: string[], public placeholders: string[]) {
  }
  toString () {
    return format(this, { colors: false })
  }
}
