export default function walkSteps (root, visit) {
  const traverse = (node) => {
    visit(node)
    if (node.children) for (const child of node.children) traverse(child)
  }
  for (const child of root.children) traverse(child)
}

