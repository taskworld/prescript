import path from 'path'
import { createHash } from 'crypto'
import singletonAllureInstance from './singletonAllureInstance'
import {
  AllureRuntime,
  IAllureConfig,
  ExecutableItemWrapper,
  AllureTest,
  AllureStep,
  Stage,
  Status,
  LabelName
} from 'allure-js-commons'
import { hostname } from 'os'
import { AllureWriter } from 'allure-js-commons/dist/src/writers'

export default function createReporter(testModulePath, rootStepName) {
  if (
    !process.env.ALLURE_SUITE_NAME &&
    !process.env.ALLURE_RESULTS_DIR &&
    !process.env.ALLURE_CASE_NAME
  ) {
    return { onFinish(errors: Error[]) {}, iterationListener: {} }
  }

  const suiteName = process.env.ALLURE_SUITE_NAME || 'prescript'
  const getDefaultCaseName = () => {
    const testPath = path.relative(process.cwd(), testModulePath)
    const rawTestName = String(rootStepName)
    const testName = rawTestName === '[implicit test]' ? '' : rawTestName
    return `${testPath}${testName ? ` - ${testName}` : ''}`
  }
  const caseName = process.env.ALLURE_CASE_NAME || getDefaultCaseName()
  const historyId = createHash('md5')
    .update([suiteName, caseName].join(' / '))
    .digest('hex')

  const allureConfig: IAllureConfig = {
    resultsDir: process.env.ALLURE_RESULTS_DIR || 'allure-results'
  }
  const writer = new AllureWriter(allureConfig)
  const runtime = new AllureRuntime({ ...allureConfig, writer })
  const group = runtime.startGroup(suiteName)
  const test = group.startTest(caseName)
  const prescriptVersion = require('../package').version
  test.historyId = historyId
  test.addLabel(LabelName.THREAD, `${process.pid}`)
  test.addLabel(LabelName.HOST, `${hostname()}`)
  test.addLabel(LabelName.FRAMEWORK, `prescript@${prescriptVersion}`)
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('ALLURE_ENV_') && value) {
      test.addParameter(key, value)
    }
  }
  let stack: IStepStack = new TestStepStack(test)
  singletonAllureInstance.currentReportingInterface = {
    addAttachment: (name, buf, mimeType) => {
      const sha = createHash('sha256')
        .update(buf)
        .digest('hex')
      const fileName = sha + path.extname(name)
      writer.writeAttachment(fileName, buf)
      stack.getExecutableItem().addAttachment(name, mimeType as any, fileName)
    }
  }
  return {
    iterationListener: {
      onEnter(node) {
        if (!node.number) {
          return
        }
        stack = stack.push(String(node.name))
      },
      onExit(node, error) {
        if (!node.number) {
          return
        }
        stack = stack.pop(error)
      }
    },
    onFinish(errors: Error[]) {
      stack = stack.pop(errors[0])
      group.endGroup()
    }
  }
}

type Outcome = Error | undefined

interface IStepStack {
  push: (stepName: string) => IStepStack
  pop: (outcome: Outcome) => IStepStack
  getExecutableItem: () => ExecutableItemWrapper
}

const saveOutcome = (
  executableItem: ExecutableItemWrapper,
  outcome: Outcome
) => {
  if (!outcome) {
    executableItem.status = Status.PASSED
    executableItem.stage = Stage.FINISHED
    return
  }
  if ((outcome as any).__prescriptPending) {
    executableItem.stage = Stage.FINISHED
    executableItem.status = Status.SKIPPED
    return
  }
  executableItem.stage = Stage.FINISHED
  executableItem.status = Status.FAILED
  executableItem.detailsMessage = outcome.message || ''
  executableItem.detailsTrace = outcome.stack || ''
}

class NullStepStack implements IStepStack {
  push(): never {
    throw new Error('This should not happen: Allure stack is corrupted.')
  }
  pop(): never {
    throw new Error('This should not happen: Allure stack is corrupted.')
  }
  getExecutableItem(): never {
    throw new Error('This should not happen: Allure stack is corrupted.')
  }
}

class TestStepStack implements IStepStack {
  constructor(private test: AllureTest) {}
  push(stepName: string) {
    return new StepStepStack(this, this.test.startStep(stepName))
  }
  pop(outcome: Outcome) {
    saveOutcome(this.test, outcome)
    this.test.endTest()
    return new NullStepStack()
  }
  getExecutableItem() {
    return this.test
  }
}

class StepStepStack implements IStepStack {
  constructor(private parent: IStepStack, private step: AllureStep) {}
  push(stepName: string) {
    return new StepStepStack(this, this.step.startStep(stepName))
  }
  pop(outcome: Outcome) {
    saveOutcome(this.step, outcome)
    this.step.endStep()
    return this.parent
  }
  getExecutableItem() {
    return this.step
  }
}
