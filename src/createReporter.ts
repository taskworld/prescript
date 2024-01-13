import path from 'path'
import { createHash } from 'crypto'
import singletonAllureInstance from './singletonAllureInstance'
import {
  AllureRuntime,
  AllureConfig,
  ExecutableItemWrapper,
  AllureTest,
  AllureStep,
  Stage,
  Status,
  LabelName,
  AllureGroup,
  FileSystemAllureWriter
} from 'allure-js-commons'
import { hostname } from 'os'
import { StepName } from './StepName'
import { IStep, ITestReporter, IConfig } from './types'
import { isPendingError } from './PendingError'

class CompositeTestReporter implements ITestReporter {
  constructor(public reporters: ITestReporter[]) {}
  onFinish(errors: Error[]) {
    this.reporters.forEach(reporter => reporter.onFinish(errors))
  }
  onEnterStep(step: IStep) {
    this.reporters.forEach(reporter => reporter.onEnterStep(step))
  }
  onExitStep(step: IStep, error?: Error) {
    this.reporters.forEach(reporter => reporter.onExitStep(step, error))
  }
}

class AllureTestReporter implements ITestReporter {
  private _stack: IStepStack
  private _group: AllureGroup

  constructor({
    suiteName,
    caseName,
    resultsDir
  }: {
    suiteName: string
    caseName: string
    resultsDir: string
  }) {
    const historyId = createHash('md5')
      .update([suiteName, caseName].join(' / '))
      .digest('hex')

    const allureConfig: AllureConfig = { resultsDir }
    const writer = new FileSystemAllureWriter(allureConfig)
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

    this._stack = new TestStepStack(test)
    this._group = group
    singletonAllureInstance.currentReportingInterface = {
      addAttachment: (name, buf, mimeType) => {
        const sha = createHash('sha256')
          .update(buf)
          .digest('hex')
        const fileName = sha + path.extname(name)
        writer.writeAttachment(fileName, buf)
        this._stack
          .getExecutableItem()
          .addAttachment(name, mimeType as any, fileName)
      }
    }
  }

  onEnterStep(node: IStep) {
    if (!node.number) {
      return
    }
    this._stack = this._stack.push(String(node.name))
  }

  onExitStep(node: IStep, error?: Error) {
    if (!node.number) {
      return
    }
    this._stack = this._stack.pop(error)
  }

  onFinish(errors: Error[]) {
    this._stack = this._stack.pop(errors[0])
    this._group.endGroup()
  }
}

export default function createReporter(
  testModulePath: string,
  rootStepName: StepName,
  customTestReporterFactory: IConfig['createTestReporter']
): ITestReporter {
  const reporters: ITestReporter[] = []

  if (
    process.env.ALLURE_SUITE_NAME ||
    process.env.ALLURE_RESULTS_DIR ||
    process.env.ALLURE_CASE_NAME
  ) {
    const suiteName = process.env.ALLURE_SUITE_NAME || 'prescript'
    const getDefaultCaseName = () => {
      const testPath = path.relative(process.cwd(), testModulePath)
      const rawTestName = String(rootStepName)
      const testName = rawTestName === '[implicit test]' ? '' : rawTestName
      return `${testPath}${testName ? ` - ${testName}` : ''}`
    }
    const caseName = process.env.ALLURE_CASE_NAME || getDefaultCaseName()
    const resultsDir = process.env.ALLURE_RESULTS_DIR || 'allure-results'
    reporters.push(new AllureTestReporter({ suiteName, caseName, resultsDir }))
  }

  if (customTestReporterFactory) {
    reporters.push(
      customTestReporterFactory(testModulePath, String(rootStepName))
    )
  }

  return new CompositeTestReporter(reporters)
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
  if (isPendingError(outcome)) {
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
