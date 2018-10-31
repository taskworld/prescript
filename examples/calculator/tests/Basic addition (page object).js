const { test } = require('../../..')
const CalculatorTester = require('../test-lib/CalculatorTester')
test('Basic addition', () => {
  new CalculatorTester().add(50, 70).resultMustBe(120)
})
