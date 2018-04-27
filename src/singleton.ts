import loadTestModule from './loadTestModule'
import { IStep } from './types'

const key = '__prescriptSingletonInstance(╯°□°）╯︵ ┻━┻'
const _global = global as any

export function getInstance () {
  if (!_global[key]) {
    throw new Error('prescript is not running in prescripting phase.')
  }
  return _global[key]
}

export function loadTest (f: Function): IStep {
  try {
    return loadTestModule((context) => {
      _global[key] = context
      f()
    })
  } finally {
    _global[key] = null
  }
}
