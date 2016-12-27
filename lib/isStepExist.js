const walkSteps = require('./walkSteps')

function isStepExist (root, number) {
  let isExists = false
  walkSteps(root, (node) => {
    if (node.number === number) isExists = true
  })
  return isExists
}

module.exports = isStepExist
