function walkSteps (root, visit) {
  const traverse = (node) => {
    visit(node)
    if (node.children) for (const child of node.children) traverse(child)
  }
  for (const child of root.children) traverse(child)
}

function isStepExists (root, number) {
  let isExists = false
  walkSteps(root, (node) => {
    if (node.number === number) isExists = true
  })
  return isExists
}

module.exports = {
  walkSteps,
  isStepExists
}
