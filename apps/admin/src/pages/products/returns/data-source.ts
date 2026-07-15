// 교환/반품 데이터 소스 어댑터 (A41 소유 — apps/admin/src/pages/products/**)
//
// [백엔드 연동 지점] 프레임워크 createCrudAdapter 에 시드를 넣는다. 목록/상세는 fetchAll/fetchOne,
// 상태·메모 저장은 update 를 쓴다(생성·삭제 UI 는 없다 — 요청은 고객이 만들고 관리자는 처리만 한다).
import { createCrudAdapter } from '../../../shared/crud';
import { sortReturns } from './types';
import type { ReturnRequest, ReturnRequestInput } from './types';

const RETURN_SEED: readonly ReturnRequest[] = [
  {
    id: 'ret-1',
    orderNo: 'ORD-20260712-0031',
    productName: '루미엔 경량 패딩 점퍼',
    customer: '김**',
    kind: 'exchange',
    reason: '사이즈 교환',
    reasonDetail: 'M 사이즈가 작아 L 로 교환 요청합니다.',
    quantity: 1,
    refundAmount: 0,
    requestedAt: '2026-07-12',
    status: 'requested',
    adminNote: '',
  },
  {
    id: 'ret-2',
    orderNo: 'ORD-20260710-0148',
    productName: '테라 스니커즈 데일리',
    customer: '박**',
    kind: 'return',
    reason: '단순 변심',
    reasonDetail: '착용감이 기대와 달라 반품합니다.',
    quantity: 1,
    refundAmount: 79000,
    requestedAt: '2026-07-10',
    status: 'collecting',
    adminNote: '수거 택배 접수 완료(2026-07-11).',
  },
  {
    id: 'ret-3',
    orderNo: 'ORD-20260708-0092',
    productName: '노바 베이직 코튼 티셔츠',
    customer: '이**',
    kind: 'return',
    reason: '상품 불량',
    reasonDetail: '봉제 마감 불량으로 반품 및 환불 요청합니다.',
    quantity: 2,
    refundAmount: 39800,
    requestedAt: '2026-07-08',
    status: 'inspecting',
    adminNote: '입고 검수 중 — 불량 확인되면 전액 환불 예정.',
  },
  {
    id: 'ret-4',
    orderNo: 'ORD-20260705-0210',
    productName: '오브제 미니멀 크로스백',
    customer: '최**',
    kind: 'return',
    reason: '단순 변심',
    reasonDetail: '색상이 화면과 달라 반품합니다.',
    quantity: 1,
    refundAmount: 38250,
    requestedAt: '2026-07-05',
    status: 'completed',
    adminNote: '환불 완료(2026-07-09).',
  },
  {
    id: 'ret-5',
    orderNo: 'ORD-20260703-0177',
    productName: '카밀 워시드 데님 팬츠',
    customer: '정**',
    kind: 'exchange',
    reason: '변심 교환',
    reasonDetail: '착용 흔적이 있어 교환 규정에 맞지 않습니다.',
    quantity: 1,
    refundAmount: 0,
    requestedAt: '2026-07-03',
    status: 'rejected',
    adminNote: '착용 흔적으로 교환 반려 안내함.',
  },
];

let seq = RETURN_SEED.length;

// TODO(backend): GET /api/returns · GET/PUT /api/returns/:id (상태 전이·처리 메모)
export const returnAdapter = createCrudAdapter<ReturnRequest, ReturnRequestInput>({
  scope: 'returns',
  seed: RETURN_SEED,
  build: (input) => {
    seq += 1;
    return { id: `ret-${String(seq)}`, ...input };
  },
  patch: (item, input) => ({ ...item, ...input }),
  sort: sortReturns,
});
