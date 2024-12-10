import { isArray } from '@vue/shared'
import {
  type VaporComponentInstance,
  isVaporComponent,
  mountComponent,
  unmountComponent,
} from './component'
import { createComment } from './dom/node'
import { EffectScope } from '@vue/reactivity'

export type Block = Node | Fragment | VaporComponentInstance | Block[]

export type BlockFn = (...args: any[]) => Block

export class Fragment {
  nodes: Block
  anchor?: Node

  constructor(nodes: Block) {
    this.nodes = nodes
  }
}

export class DynamicFragment extends Fragment {
  anchor: Node
  scope: EffectScope | undefined
  key: any

  constructor(anchorLabel?: string) {
    super([])
    this.anchor =
      __DEV__ && anchorLabel
        ? createComment(anchorLabel)
        : // eslint-disable-next-line no-restricted-globals
          document.createTextNode('')
  }

  update(render?: BlockFn, key: any = render): void {
    if (key === this.key) return
    this.key = key

    const parent = this.anchor.parentNode

    // teardown previous branch
    if (this.scope) {
      this.scope.stop()
      parent && remove(this.nodes, parent)
      // TODO lifecycle unmount
    }

    if (render) {
      this.scope = new EffectScope()
      this.nodes = this.scope.run(render) || []
      if (parent) insert(this.nodes, parent)
    } else {
      this.scope = undefined
      this.nodes = []
    }
  }
}

export function isFragment(val: NonNullable<unknown>): val is Fragment {
  return val instanceof Fragment
}

export function isBlock(val: NonNullable<unknown>): val is Block {
  return (
    val instanceof Node ||
    isArray(val) ||
    isVaporComponent(val) ||
    isFragment(val)
  )
}

/*! #__NO_SIDE_EFFECTS__ */
// TODO this should be optimized away
export function normalizeBlock(block: Block): Node[] {
  const nodes: Node[] = []
  if (block instanceof Node) {
    nodes.push(block)
  } else if (isArray(block)) {
    block.forEach(child => nodes.push(...normalizeBlock(child)))
  } else if (isVaporComponent(block)) {
    nodes.push(...normalizeBlock(block.block!))
  } else if (block) {
    nodes.push(...normalizeBlock(block.nodes))
    block.anchor && nodes.push(block.anchor)
  }
  return nodes
}

// TODO optimize
export function isValidBlock(block: Block): boolean {
  return (
    normalizeBlock(block).filter(node => !(node instanceof Comment)).length > 0
  )
}

export function insert(
  block: Block,
  parent: ParentNode,
  anchor: Node | null | 0 = null,
): void {
  if (block instanceof Node) {
    parent.insertBefore(block, anchor === 0 ? parent.firstChild : anchor)
  } else if (isVaporComponent(block)) {
    mountComponent(block, parent, anchor)
  } else if (isArray(block)) {
    for (let i = 0; i < block.length; i++) {
      insert(block[i], parent, anchor)
    }
  } else {
    // fragment
    insert(block.nodes, parent, anchor)
    if (block.anchor) insert(block.anchor, parent, anchor)
  }
}

export function prepend(parent: ParentNode, ...blocks: Block[]): void {
  let i = blocks.length
  while (i--) insert(blocks[i], parent, 0)
}

export function remove(block: Block, parent: ParentNode): void {
  if (block instanceof Node) {
    parent.removeChild(block)
  } else if (isVaporComponent(block)) {
    unmountComponent(block, parent)
  } else if (isArray(block)) {
    for (let i = 0; i < block.length; i++) {
      remove(block[i], parent)
    }
  } else {
    // fragment
    remove(block.nodes, parent)
    if (block.anchor) remove(block.anchor, parent)
  }
}