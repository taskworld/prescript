import { IConfig, ActionWrapper } from './types'

export interface ResolvedConfig extends IConfig {
  wrapAction: ActionWrapper
}

export function resolveConfig(config: IConfig): ResolvedConfig {
  return {
    wrapAction: config.wrapAction || ((step, execute) => execute()),
    createTestReporter: config.createTestReporter
  }
}
