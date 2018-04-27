import { IStep } from './types'

export default function walkSteps(root: IStep, visit: (node: IStep) => void) {
  const traverse = node => {
    visit(node)
    if (node.children) for (const child of node.children) traverse(child)
  }
  for (const child of root.children || []) traverse(child)
}
