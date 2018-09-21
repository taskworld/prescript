import { ITestPrescriptionAPI } from './types'
const { getInstance } = require('./singleton')
import { named } from './StepName'

const singletonPrescriptionApi: ITestPrescriptionAPI = {
  test(name, f) {
    return getInstance().test(name, f)
  },
  to(name, f) {
    return getInstance().to(name, f)
  },
  action(...args) {
    return getInstance().action(...args)
  },
  defer(name, f) {
    return getInstance().defer(name, f)
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
