// 조직도 화면의 동작 회귀 테스트 (A41) — 계층 구성(순수) + 폼 검증
import { describe, expect, it } from 'vitest';

import { departmentCandidates, descendantIds, flattenTree, removeSubtree } from './types';
import type { OrgNode } from './types';
import { orgSchema } from './validation';
import type { OrgFormValues } from './validation';

function nodeOf(overrides: Partial<OrgNode> & { id: string }): OrgNode {
  return { name: '노드', type: 'department', parentId: '', title: '', order: 1, ...overrides };
}

// 대표이사실 > 홍길동 / 경영지원본부 > 인사팀 > 김철수
const NODES: readonly OrgNode[] = [
  nodeOf({ id: '1', name: '대표이사실', type: 'department', parentId: '', order: 1 }),
  nodeOf({ id: '2', name: '홍길동', type: 'member', parentId: '1', title: '대표이사', order: 1 }),
  nodeOf({ id: '3', name: '경영지원본부', type: 'department', parentId: '', order: 2 }),
  nodeOf({ id: '4', name: '인사팀', type: 'department', parentId: '3', order: 1 }),
  nodeOf({ id: '5', name: '김철수', type: 'member', parentId: '4', title: '팀장', order: 1 }),
];

describe('flattenTree — 계층 펼치기(순수)', () => {
  it('부모→자식 순서로 펼치고 깊이를 매긴다', () => {
    const rows = flattenTree(NODES);
    expect(rows.map((r) => r.id)).toEqual(['1', '2', '3', '4', '5']);
    expect(rows.map((r) => r.depth)).toEqual([0, 1, 0, 1, 2]);
  });

  it('부모를 찾을 수 없는 노드는 최상위로 본다', () => {
    const rows = flattenTree([nodeOf({ id: 'x', parentId: 'ghost' })]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.depth).toBe(0);
  });

  it('형제는 order 순으로 정렬한다', () => {
    const rows = flattenTree([
      nodeOf({ id: 'a', parentId: '', order: 2, name: '나중' }),
      nodeOf({ id: 'b', parentId: '', order: 1, name: '먼저' }),
    ]);
    expect(rows.map((r) => r.id)).toEqual(['b', 'a']);
  });
});

describe('descendantIds — 후손 수집(순수)', () => {
  it('직·간접 후손을 모두 모은다', () => {
    expect(descendantIds(NODES, '3').sort()).toEqual(['4', '5']);
  });

  it('잎 노드는 후손이 없다', () => {
    expect(descendantIds(NODES, '5')).toEqual([]);
  });
});

describe('removeSubtree — cascade 삭제(순수)', () => {
  it('노드와 그 후손을 모두 제거한다', () => {
    const next = removeSubtree(NODES, '3');
    expect(next.map((n) => n.id).sort()).toEqual(['1', '2']);
  });

  it('원본을 변형하지 않는다', () => {
    removeSubtree(NODES, '3');
    expect(NODES).toHaveLength(5);
  });
});

describe('departmentCandidates — 상위부서 후보(순수)', () => {
  it('부서만 후보로 준다(구성원 제외)', () => {
    expect(
      departmentCandidates(NODES)
        .map((n) => n.id)
        .sort(),
    ).toEqual(['1', '3', '4']);
  });

  it('편집 중인 노드 자신과 후손은 제외한다(순환 방지)', () => {
    // 경영지원본부(3)를 편집하면 3·4(후손)는 상위 후보가 될 수 없다
    expect(departmentCandidates(NODES, '3').map((n) => n.id)).toEqual(['1']);
  });
});

function valuesOf(overrides: Partial<OrgFormValues> = {}): OrgFormValues {
  return { name: '인사팀', type: 'department', parentId: '3', title: '', ...overrides };
}

function messageFor(values: OrgFormValues, field: keyof OrgFormValues): string | undefined {
  const result = orgSchema.safeParse(values);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe('orgSchema — 폼 검증', () => {
  it('정상 입력은 통과한다', () => {
    expect(orgSchema.safeParse(valuesOf()).success).toBe(true);
  });

  it('최상위(상위부서 없음)도 통과한다', () => {
    expect(orgSchema.safeParse(valuesOf({ parentId: '' })).success).toBe(true);
  });

  it('이름이 비면 막는다', () => {
    expect(messageFor(valuesOf({ name: '  ' }), 'name')).toContain('입력');
  });

  it('구분이 두 값이 아니면 막는다', () => {
    expect(messageFor(valuesOf({ type: 'team' as OrgFormValues['type'] }), 'type')).toContain(
      '선택',
    );
  });

  it('구성원 직책도 받는다', () => {
    expect(
      orgSchema.safeParse(valuesOf({ type: 'member', title: '팀장', parentId: '4' })).success,
    ).toBe(true);
  });
});
