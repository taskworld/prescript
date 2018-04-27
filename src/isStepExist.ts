import walkSteps from './walkSteps'

export default function isStepExist (root, number) {
  let isExists = false
  walkSteps(root, (node) => {
    if (node.number === number) isExists = true
  })
  return isExists
}
