// 계약 데이터 소스 어댑터
//
// [백엔드 연동 지점] 실제 연동 시 // TODO(backend) 엔드포인트로 저장소 함수 본문만 교체하고 화면은
// 그대로 둔다.
//
// [왜 createCrudAdapter 가 아니라 저장소인가] 계약은 이제 견적을 가리킨다(Contract.quoteId).
// 견적 상세의 '계약 초안 만들기' 버튼은 **그리는 순간** '이 견적에 이미 계약이 있는가' 를 알아야
// 하는데, createCrudAdapter 는 목록을 클로저에 가둬 비동기 fetchAll 로만 내준다. 저장소를 노출하고
// 그 위에 createStoreAdapter 를 얹으면 같은 목록을 동기로도 읽을 수 있다(../quotes/data-source 선례).
//
// [거래처 참조] 시드의 accountId 는 accounts/data-source 의 실제 거래처 id(acc-1~3)를 가리킨다 —
// 이름만 같고 연결이 없는 행이 하나라도 있으면 거래처 상세의 역방향 조회가 조용히 비어 보인다.
import { createStoreAdapter } from '../../../shared/crud';
import { HTTP_STATUS, HttpError } from '../../../shared/errors/http-error';
import { sortContracts } from './types';
import type { Contract, ContractInput } from './types';

const CONTRACT_SEED: readonly Contract[] = [
  {
    id: 'ct-1',
    title: '2026년 SaaS 연간 이용계약',
    accountId: 'acc-1',
    accountName: '(주)한빛소프트웨어',
    contractType: 'license',
    startAt: '2026-01-01',
    endAt: '2026-12-31',
    amount: 36000000,
    vatIncluded: false,
    autoRenew: true,
    renewNoticeDays: 30,
    status: 'active',
    signStatus: 'signed',
    ownerName: '김영업',
    attachments: [],
    terms: '연간 라이선스 12개월, 계정 100석 기준. 미납 시 서비스 일시중지 조항 포함.',
    note: '',
    quoteId: '',
    quoteNo: '',
  },
  {
    id: 'ct-2',
    title: '전산시스템 유지보수 계약',
    accountId: 'acc-2',
    accountName: '대성물산 주식회사',
    contractType: 'maintenance',
    startAt: '2026-03-01',
    endAt: '2027-02-28',
    amount: 18000000,
    vatIncluded: true,
    autoRenew: false,
    renewNoticeDays: 0,
    status: 'review',
    signStatus: 'sent',
    ownerName: '박계약',
    attachments: [],
    terms: '월 1회 정기점검, 장애 대응 SLA 4시간. 부가세 포함 금액.',
    note: '법무 검토 회신 대기.',
    // 승인된 견적(qt-2)에서 나온 계약 — 견적 → 계약 화살표가 데이터에도 있다는 본보기다.
    quoteId: 'qt-2',
    quoteNo: 'Q-20260705-001',
  },
  {
    id: 'ct-3',
    title: '용역 개발 위탁계약(1차)',
    accountId: 'acc-3',
    accountName: '미래테크놀로지',
    contractType: 'service',
    startAt: '2025-09-01',
    endAt: '2026-02-28',
    amount: 24000000,
    vatIncluded: false,
    autoRenew: false,
    renewNoticeDays: 0,
    status: 'expired',
    signStatus: 'signed',
    ownerName: '이수주',
    attachments: [],
    terms: '착수금 30% / 중도금 40% / 잔금 30%. 산출물 검수 후 잔금 지급.',
    note: '',
    quoteId: '',
    quoteNo: '',
  },
];

let contracts = sortContracts(CONTRACT_SEED);
let seq = CONTRACT_SEED.length;

/* ── 계약 저장소 (어댑터가 위임한다 — 밖으로는 어댑터와 역방향 조회만 내보낸다) ── */

function listContracts(): readonly Contract[] {
  return sortContracts(contracts);
}

function getContract(id: string): Contract {
  const found = contracts.find((contract) => contract.id === id);
  // 404 와 500 은 복구 수단이 다르다 — '목록으로' vs '다시 시도' (EXC-12).
  if (found === undefined) throw new HttpError(HTTP_STATUS.notFound, '계약을 찾을 수 없습니다.');
  return found;
}

function addContract(input: ContractInput): void {
  seq += 1;
  contracts = sortContracts([...contracts, { id: `ct-${String(seq)}`, ...input }]);
}

function updateContract(id: string, input: ContractInput): void {
  // [EXC-04] 없는 id 를 조용히 지나치고 성공을 반환하면 '저장했습니다' 유령 토스트가 뜬다.
  if (!contracts.some((contract) => contract.id === id)) {
    throw new HttpError(HTTP_STATUS.conflict, '다른 사용자가 먼저 삭제한 계약입니다.');
  }
  contracts = sortContracts(
    contracts.map((contract) => (contract.id === id ? { ...contract, ...input, id } : contract)),
  );
}

function removeContract(id: string): void {
  if (!contracts.some((contract) => contract.id === id)) {
    throw new HttpError(HTTP_STATUS.conflict, '이미 삭제된 계약입니다.');
  }
  contracts = contracts.filter((contract) => contract.id !== id);
}

/**
 * 견적 → 계약 역방향 조회 — 계약 초안 중복 생성을 막는 판정의 정본. 없으면 ''.
 *
 * 빈 문자열이 '없음' 인 것은 이 도메인의 규약이다(AccountRef.accountId 와 같은 결) —
 * `undefined` 를 섞으면 호출부마다 두 가지 없음을 각자 다루게 된다.
 */
export function findContractIdByQuote(quoteId: string): string {
  if (quoteId === '') return '';
  return contracts.find((contract) => contract.quoteId === quoteId)?.id ?? '';
}

// TODO(backend): GET/POST /api/sales/contracts · GET/PUT/DELETE /api/sales/contracts/:id
//   · POST /api/sales/quotes/:id/contract (계약 초안 생성 — 이미 있으면 기존 계약을 돌려준다)
export const contractAdapter = createStoreAdapter<Contract, ContractInput>({
  scope: 'sales-contracts',
  list: listContracts,
  getOne: getContract,
  add: addContract,
  update: updateContract,
  remove: removeContract,
});
