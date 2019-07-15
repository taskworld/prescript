import { ITestExecutionContext } from './types'

export default {
  current: null as {
    state: Prescript.GlobalState
    context: ITestExecutionContext
  } | null
}
