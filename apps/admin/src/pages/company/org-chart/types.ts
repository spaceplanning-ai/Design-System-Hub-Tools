// 조직도 화면 전용 타입 + 순수 계층 규칙 (A41 소유 — apps/admin/src/pages/company/org-chart/**)
//
// 화려한 트리 다이어그램 대신 '들여쓰기된 계층 목록'으로 표현한다(라이브러리 불필요). 각 노드는
// 부서 또는 구성원이며 상위 노드(parentId)로 계층을 이룬다. 삭제는 하위 노드까지 함께 지운다(cascade).
import type { StatusTone } from '../../../shared/ui';

export type OrgNodeType = 'department' | 'member';

export interface OrgNode {
  readonly id: string;
  readonly name: string;
  readonly type: OrgNodeType;
  /** 상위 노드 id — 최상위면 '' */
  readonly parentId: string;
  /** 직책(구성원일 때만 의미) */
  readonly title: string;
  /** 형제 정렬 순서 */
  readonly order: number;
}

export interface OrgInput {
  readonly name: string;
  readonly type: OrgNodeType;
  readonly parentId: string;
  readonly title: string;
}

/** 들여쓰기 렌더용 — 트리 순서로 펼친 뒤 깊이를 붙인 행 */
export interface OrgRow extends OrgNode {
  readonly depth: number;
}

interface TypeOption {
  readonly id: OrgNodeType;
  readonly label: string;
}

export const ORG_TYPE_OPTIONS: readonly TypeOption[] = [
  { id: 'department', label: '부서' },
  { id: 'member', label: '구성원' },
];

export function orgTypeLabel(type: OrgNodeType): string {
  return type === 'department' ? '부서' : '구성원';
}

/** 구분의 색 의도 — 부서=neutral, 구성원=info */
export function orgTypeTone(type: OrgNodeType): StatusTone {
  return type === 'department' ? 'neutral' : 'info';
}

const bySibling = (a: OrgNode, b: OrgNode): number => {
  if (a.order !== b.order) return a.order - b.order;
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
};

/**
 * 부모→자식 순서로 펼치고 각 행에 깊이(depth)를 붙인다. 부모가 없거나(빈 문자열) 부모를 찾을 수
 * 없는 노드는 최상위로 본다. 형제는 order → 이름 순. **테스트가 이 순수 함수를 직접 부른다.**
 */
export function flattenTree(nodes: readonly OrgNode[]): OrgRow[] {
  const ids = new Set(nodes.map((node) => node.id));
  const childrenOf = new Map<string, OrgNode[]>();
  const roots: OrgNode[] = [];

  for (const node of nodes) {
    if (node.parentId === '' || !ids.has(node.parentId)) {
      roots.push(node);
      continue;
    }
    const siblings = childrenOf.get(node.parentId) ?? [];
    siblings.push(node);
    childrenOf.set(node.parentId, siblings);
  }

  const out: OrgRow[] = [];
  const visit = (node: OrgNode, depth: number): void => {
    out.push({ ...node, depth });
    const kids = [...(childrenOf.get(node.id) ?? [])].sort(bySibling);
    for (const kid of kids) visit(kid, depth + 1);
  };
  for (const root of [...roots].sort(bySibling)) visit(root, 0);
  return out;
}

/** id 의 모든 후손 id(자신 제외). **테스트가 이 순수 함수를 직접 부른다.** */
export function descendantIds(nodes: readonly OrgNode[], id: string): string[] {
  const childrenOf = new Map<string, string[]>();
  for (const node of nodes) {
    if (node.parentId === '') continue;
    const kids = childrenOf.get(node.parentId) ?? [];
    kids.push(node.id);
    childrenOf.set(node.parentId, kids);
  }
  const out: string[] = [];
  const stack = [...(childrenOf.get(id) ?? [])];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) break;
    out.push(current);
    for (const kid of childrenOf.get(current) ?? []) stack.push(kid);
  }
  return out;
}

/** id 와 그 후손을 모두 제거한 새 목록(cascade). **테스트가 이 순수 함수를 직접 부른다.** */
export function removeSubtree(nodes: readonly OrgNode[], id: string): OrgNode[] {
  const doomed = new Set<string>([id, ...descendantIds(nodes, id)]);
  return nodes.filter((node) => !doomed.has(node.id));
}

/**
 * 상위부서 select 후보 — 부서만, 그리고 편집 중인 노드 자신과 그 후손은 제외한다(순환 방지).
 * **테스트가 이 순수 함수를 직접 부른다.**
 */
export function departmentCandidates(nodes: readonly OrgNode[], excludeId?: string): OrgNode[] {
  const banned = new Set<string>();
  if (excludeId !== undefined) {
    banned.add(excludeId);
    for (const id of descendantIds(nodes, excludeId)) banned.add(id);
  }
  return nodes.filter((node) => node.type === 'department' && !banned.has(node.id));
}

export const NAME_MAX_LENGTH = 60;
export const TITLE_MAX_LENGTH = 60;
