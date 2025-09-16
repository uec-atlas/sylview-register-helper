// TODO: SylView本体のコードと共通化する
import { AbstractTreeNode } from "./AbstractTree";

type DepartmentId = number;
export class Department extends AbstractTreeNode<Department> {
  constructor(
    public id: DepartmentId,
    public name: string,
    public hidden: boolean,
    children: Iterable<Department> = [],
    parent: Department | null = null
  ) {
    super(children, parent);
  }
}
