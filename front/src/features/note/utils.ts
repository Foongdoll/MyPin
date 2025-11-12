import type { CategoryNode } from "../../shared/types/NoteType";

export type FlatCategory = {
  id: number;
  label: string;
  depth: number;
  path: string;
  code: string;
  parentId?: number | null;
};

export const flattenCategories = (nodes: CategoryNode[] = [], depth = 0, acc: FlatCategory[] = []): FlatCategory[] => {
  nodes.forEach((node) => {
    acc.push({
      id: node.id,
      label: node.label,
      depth,
      path: node.path,
      code: node.code,
      parentId: node.parentId,
    });
    if (node.children && node.children.length > 0) {
      flattenCategories(node.children, depth + 1, acc);
    }
  });
  return acc;
};

export const buildDefaultOpenState = (nodes: CategoryNode[], depthLimit = 2) => {
  const state: Record<number, boolean> = {};
  const traverse = (items: CategoryNode[]) => {
    items.forEach((node) => {
      state[node.id] = node.depth <= depthLimit;
      if (node.children?.length) {
        traverse(node.children);
      }
    });
  };
  traverse(nodes);
  return state;
};
