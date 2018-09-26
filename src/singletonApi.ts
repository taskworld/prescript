import { ITestPrescriptionAPI } from './types'
const { getInstance } = require('./singleton')
import { named } from './StepName'

const singletonPrescriptionApi: ITestPrescriptionAPI = {
  test(...args) {
    return getInstance().test(...args)
  },
  to(...args) {
    return getInstance().to(...args)
  },
  action(...args) {
    return getInstance().action(...args)
  },
  defer(...args) {
    return getInstance().defer(...args)
  },
  pending() {
    return getInstance().pending()
  },
  step(name, f) {
    return getInstance().step(name, f)
  },
  cleanup(name, f) {
    return getInstance().cleanup(name, f)
  },
  onFinish(f) {
    return getInstance().onFinish(f)
  }
}

const singletonApi = Object.assign({}, singletonPrescriptionApi, { named })

export default singletonApi

export const {
  test,
  to,
  action,
  defer,
  pending,
  step,
  cleanup,
  onFinish
} = singletonApi

export { named }
