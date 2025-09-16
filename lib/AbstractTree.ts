// TODO: SylView本体のコードと共通化する
type ExcludeMethods<T> = {
  // biome-ignore lint/complexity/noBannedTypes: cannot avoid using function types
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};

type FlatTreeNodeDataInternal<NodeType, IdType> = Omit<
  TreeNodeData<NodeType>,
  "children"
> & {
  id: IdType;
  parentId?: IdType | null;
};

export type FlatTreeNodeData<
  TreeNode extends AbstractTreeNode<TreeNode>,
  IdType = TreeNode extends { id: infer T } ? T : never
> = FlatTreeNodeDataInternal<ExcludeMethods<TreeNode>, IdType>;

export type TreeNodeData<T> = Omit<
  ExcludeMethods<T>,
  "children" | "depth" | "isLeaf" | "isRoot" | "parent"
> & { children?: TreeNodeData<T>[] };

export type TreeNodeDataWithoutId<T> = Omit<
  ExcludeMethods<T>,
  "children" | "depth" | "isLeaf" | "isRoot" | "parent" | "id"
> & { children?: TreeNodeDataWithoutId<T>[] };

export abstract class AbstractTreeNode<
  NodeType extends AbstractTreeNode<NodeType>
> {
  private _children: Set<NodeType>;
  private _parent: NodeType | TreeRootNode<NodeType> | null;

  constructor(
    children: Iterable<NodeType> = [],
    parent: NodeType | TreeRootNode<NodeType> | null = null
  ) {
    this._children = new Set(children);
    this._parent = parent;
  }
  get children(): NodeType[] {
    return Array.from(this._children);
  }
  get depth(): number {
    if (this.children.length === 0) {
      return 0;
    }
    return 1 + Math.max(...this.children.map((child) => child.depth));
  }
  get isLeaf(): boolean {
    return this.children.length === 0;
  }
  get isRoot(): boolean {
    return !this.parent;
  }
  get parent(): NodeType | TreeRootNode<NodeType> | null {
    return this._parent;
  }
  set parent(parent: NodeType | TreeRootNode<NodeType> | null) {
    this._parent = parent;
  }
  set children(children: NodeType[] | Set<NodeType>) {
    this._children = new Set(children);
  }
  addChild(child: NodeType) {
    this._children.add(child);
  }
  removeChild(child: NodeType) {
    this._children.delete(child);
  }
  filterDescendants(predicate: (node: NodeType) => unknown): NodeType[] {
    const filteredChildren = this.children.flatMap((child) =>
      child.filterDescendants(predicate)
    );
    const filteredNode = predicate(this as unknown as NodeType)
      ? [this as unknown as NodeType]
      : [];
    return [...filteredNode, ...filteredChildren];
  }
  traverseFromRoot<T>(transform: (node: NodeType) => T): T[] {
    if (this.isRoot) return [];
    return [
      ...(this.parent?.traverseFromRoot(transform) ?? []),
      transform(this as unknown as NodeType)
    ];
  }
  traverseToRoot<T>(transform: (node: NodeType) => T): T[] {
    if (this.isRoot) return [];
    return [
      transform(this as unknown as NodeType),
      ...(this.parent?.traverseToRoot(transform) ?? [])
    ];
  }
  traverseToLeaves(callback: (node: NodeType) => boolean | undefined) {
    if (callback(this as unknown as NodeType) === false) return;
    for (const child of this.children) {
      child.traverseToLeaves(callback);
    }
  }
  mapDescendants<NewNodeType extends AbstractTreeNode<NewNodeType>>(
    transform: (node: NodeType) => NewNodeType
  ): NewNodeType {
    const mappedNode = transform(this as unknown as NodeType);
    const mappedChildren = this.children.map((child) =>
      child.mapDescendants(transform)
    );
    mappedNode.children = mappedChildren;
    for (const child of mappedChildren) {
      child.parent = mappedNode;
    }
    return mappedNode;
  }
  reduceDescendants<U>(
    reducer: (accumulator: U, node: NodeType) => U,
    initialValue: U
  ): U {
    let result = reducer(initialValue, this as unknown as NodeType);
    for (const child of this.children) {
      result = child.reduceDescendants(reducer, result);
    }
    return result;
  }
  someDescendant(
    predicate: (node: NodeType) => unknown,
    checkLeaf = false
  ): boolean {
    if (this.isLeaf)
      return !checkLeaf || !!predicate(this as unknown as NodeType);
    for (const child of this.children) {
      if (child.someDescendant(predicate, true)) return true;
    }
    return false;
  }
  everyDescendant(
    predicate: (node: NodeType) => unknown,
    checkLeaf = false
  ): boolean {
    if (this.isLeaf)
      return !checkLeaf || !!predicate(this as unknown as NodeType);
    return this.children.every((child) =>
      child.everyDescendant(predicate, true)
    );
  }
  findDescendant(predicate: (node: NodeType) => unknown): NodeType | null {
    if (predicate(this as unknown as NodeType))
      return this as unknown as NodeType;
    for (const child of this.children) {
      const found = child.findDescendant(predicate);
      if (found) return found;
    }
    return null;
  }
  flat(): NodeType[] {
    return [
      this,
      ...this.children.flatMap((child) => child.flat())
    ] as NodeType[];
  }
  flatDescendants(): NodeType[] {
    return this.children.flatMap((child) => child.flat());
  }
  toJSON() {
    const { children, _children, _parent, ...data } = this;
    return {
      ...data,
      children: children.map((child): TreeNodeData<this> => child.toJSON())
    } as TreeNodeData<this>;
  }
}

export class TreeRootNode<
  ChildNodeType extends AbstractTreeNode<ChildNodeType>
> extends AbstractTreeNode<ChildNodeType> {
  constructor(children: Iterable<ChildNodeType> = []) {
    super(new Set(children));
    for (const child of children) {
      child.parent ??= this;
    }
  }
  get parent(): null {
    return null;
  }
  set parent(_parent: never) {}
  get isRoot(): true {
    return true;
  }
}
export type TreeRootNodeLike<
  ChildNodeType extends AbstractTreeNode<ChildNodeType>
> = ChildNodeType | TreeRootNode<ChildNodeType>;

export const buildTreeFromNodeData = <
  NodeType extends AbstractTreeNode<NodeType> = never
>(
  data: NoInfer<TreeNodeData<NodeType>>[],
  toNode: (
    data: NoInfer<TreeNodeData<NodeType>>,
    parentNode: NodeType | null
  ) => NodeType,
  parentNode: NodeType | null = null
): TreeRootNode<NodeType> => {
  const nodes = data.map((nodeData) => toNode(nodeData, parentNode));
  for (const [index, node] of nodes.entries()) {
    const children = data[index].children;
    if (children) {
      const childNodes = buildTreeFromNodeData(children, toNode, node);
      node.children = childNodes.children;
    }
  }
  return new TreeRootNode(nodes);
};

export const buildTreeFromFlatNodeData = <
  NodeType extends AbstractTreeNode<NodeType> = never,
  IdType = NodeType extends { id: infer T } ? T : never
>(
  data: FlatTreeNodeData<NodeType, IdType>[],
  toNode: (data: FlatTreeNodeData<NodeType, IdType>) => NodeType
): TreeRootNode<NodeType> => {
  const nodes = new Map<
    IdType,
    {
      node: NodeType;
      parentId?: IdType | null;
    }
  >();
  for (const node of data) {
    nodes.set(node.id, { node: toNode(node), parentId: node.parentId });
  }
  for (const { node, parentId } of nodes.values()) {
    if (parentId) nodes.get(parentId)?.node.addChild(node);
  }
  const rootNodes: NodeType[] = [];
  for (const { node, parentId } of nodes.values()) {
    if (!parentId) {
      rootNodes.push(node);
    }
  }
  return new TreeRootNode(rootNodes);
};
