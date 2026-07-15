// 조직도 데이터 소스 어댑터 (A41 소유 — apps/admin/src/pages/company/org-chart/**)
//
// 삭제가 하위 노드까지 cascade 라 공용 createCrudAdapter 대신 전용 어댑터를 둔다(remove 가 다르다).
// 인터페이스(CrudAdapter)는 같아 공용 훅(useCrudListQuery·useCrudDelete…)을 그대로 쓴다.
//
// [백엔드 없음] 실제 네트워크 호출 0건 — 픽스처 배열을 mutable 로 들고 흉내 낸다.
import { wait } from '../../../shared/async';
import type { CrudAdapter } from '../_shared/crud';
import { failIfRequested, LATENCY_MS } from '../_shared/dev';
import { removeSubtree } from './types';
import type { OrgInput, OrgNode } from './types';

const ORG_SEED: readonly OrgNode[] = [
  { id: 'org-1', name: '대표이사실', type: 'department', parentId: '', title: '', order: 1 },
  { id: 'org-2', name: '홍길동', type: 'member', parentId: 'org-1', title: '대표이사', order: 1 },
  { id: 'org-3', name: '경영지원본부', type: 'department', parentId: '', title: '', order: 2 },
  { id: 'org-4', name: '인사팀', type: 'department', parentId: 'org-3', title: '', order: 1 },
  { id: 'org-5', name: '김철수', type: 'member', parentId: 'org-4', title: '팀장', order: 1 },
  { id: 'org-6', name: '기획본부', type: 'department', parentId: '', title: '', order: 3 },
  { id: 'org-7', name: '이영희', type: 'member', parentId: 'org-6', title: '본부장', order: 1 },
];

let items: readonly OrgNode[] = [...ORG_SEED];
let seq = ORG_SEED.length;

function nextOrder(parentId: string): number {
  return (
    items
      .filter((node) => node.parentId === parentId)
      .reduce((max, node) => Math.max(max, node.order), 0) + 1
  );
}

// TODO(backend): GET/POST /api/company/org-nodes · GET/PUT/DELETE /api/company/org-nodes/:id
// (DELETE 는 하위 노드까지 함께 지운다 — 서버도 cascade)
export const orgAdapter: CrudAdapter<OrgNode, OrgInput> = {
  async fetchAll(signal) {
    await wait(LATENCY_MS, signal);
    failIfRequested('org-chart', 'list');
    return items;
  },
  async fetchOne(id, signal) {
    await wait(LATENCY_MS, signal);
    failIfRequested('org-chart', 'detail');
    const found = items.find((node) => node.id === id);
    if (found === undefined) throw new Error('항목을 찾을 수 없습니다');
    return found;
  },
  async create(input, signal) {
    await wait(LATENCY_MS, signal);
    failIfRequested('org-chart', 'save');
    seq += 1;
    items = [...items, { id: `org-${String(seq)}`, order: nextOrder(input.parentId), ...input }];
  },
  async update(id, input, signal) {
    await wait(LATENCY_MS, signal);
    failIfRequested('org-chart', 'save');
    items = items.map((node) => (node.id === id ? { ...node, ...input } : node));
  },
  async remove(id, signal) {
    await wait(LATENCY_MS, signal);
    failIfRequested('org-chart', 'delete');
    items = removeSubtree(items, id);
  },
};
