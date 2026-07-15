// 교환/반품 도메인 타입 · 순수 규칙 · 뷰 헬퍼 (A41 소유 — apps/admin/src/pages/products/**)
//
// 국내 커머스 관례를 따른다: 유형(교환/반품)·사유·상태 흐름(접수→수거중→검수중→완료, 또는 반려).
// 요청은 감사 성격이라 목록에서 삭제하지 않고 상태만 진행한다.
import type { StatusTone } from '../../../shared/ui';

/** 요청 유형 — 교환/반품 */
export type ReturnKind = 'exchange' | 'return';

/** 처리 상태 — 접수 → 수거중 → 검수중 → 완료 / 반려(off-flow 종료) */
export type ReturnStatus = 'requested' | 'collecting' | 'inspecting' | 'completed' | 'rejected';

/** 전체 상태 목록 — 타입가드의 단일 원천(파일 내부 전용) */
const RETURN_STATUSES = ['requested', 'collecting', 'inspecting', 'completed', 'rejected'] as const;

/** 상태 타입가드 — select 값(문자열)을 ReturnStatus 로 안전하게 좁힌다(as 캐스팅 대신) */
export function isReturnStatus(value: unknown): value is ReturnStatus {
  return typeof value === 'string' && (RETURN_STATUSES as readonly string[]).includes(value);
}

export interface ReturnRequest {
  readonly id: string;
  /** 주문번호 — 요청 식별 */
  readonly orderNo: string;
  readonly productName: string;
  /** 신청자 — 마스킹된 이름(실명 아님) */
  readonly customer: string;
  readonly kind: ReturnKind;
  /** 사유(요약) */
  readonly reason: string;
  /** 사유 상세 */
  readonly reasonDetail: string;
  readonly quantity: number;
  /** 환불 예정 금액 — 반품 시(원). 교환은 0 */
  readonly refundAmount: number;
  /** 접수일 — 'YYYY-MM-DD' */
  readonly requestedAt: string;
  readonly status: ReturnStatus;
  /** 관리자 처리 메모 */
  readonly adminNote: string;
}

export interface ReturnRequestInput {
  readonly orderNo: string;
  readonly productName: string;
  readonly customer: string;
  readonly kind: ReturnKind;
  readonly reason: string;
  readonly reasonDetail: string;
  readonly quantity: number;
  readonly refundAmount: number;
  readonly requestedAt: string;
  readonly status: ReturnStatus;
  readonly adminNote: string;
}

export const RETURN_NOTE_MAX = 500;

export const KIND_OPTIONS: readonly { readonly id: ReturnKind; readonly label: string }[] = [
  { id: 'exchange', label: '교환' },
  { id: 'return', label: '반품' },
];

export function kindLabel(kind: ReturnKind): string {
  return KIND_OPTIONS.find((option) => option.id === kind)?.label ?? kind;
}

export function kindTone(kind: ReturnKind): StatusTone {
  return kind === 'exchange' ? 'info' : 'warning';
}

/** 정상 처리 흐름(반려 제외) — 상세의 진행 스텝퍼가 쓴다 */
export const RETURN_FLOW: readonly ReturnStatus[] = [
  'requested',
  'collecting',
  'inspecting',
  'completed',
];

interface StatusMeta {
  readonly label: string;
  readonly tone: StatusTone;
}

const STATUS_META: Record<ReturnStatus, StatusMeta> = {
  requested: { label: '접수', tone: 'neutral' },
  collecting: { label: '수거중', tone: 'info' },
  inspecting: { label: '검수중', tone: 'warning' },
  completed: { label: '완료', tone: 'success' },
  rejected: { label: '반려', tone: 'danger' },
};

export function statusLabel(status: ReturnStatus): string {
  return STATUS_META[status].label;
}

export function statusMeta(status: ReturnStatus): StatusMeta {
  return STATUS_META[status];
}

export const STATUS_FILTER_ALL = 'all';
export type StatusFilter = typeof STATUS_FILTER_ALL | ReturnStatus;

export const STATUS_FILTER_OPTIONS: readonly {
  readonly id: StatusFilter;
  readonly label: string;
}[] = [
  { id: STATUS_FILTER_ALL, label: '전체 상태' },
  { id: 'requested', label: '접수' },
  { id: 'collecting', label: '수거중' },
  { id: 'inspecting', label: '검수중' },
  { id: 'completed', label: '완료' },
  { id: 'rejected', label: '반려' },
];

/** 상태 필터('전체'면 전체) */
export function filterByStatus(
  list: readonly ReturnRequest[],
  filter: StatusFilter,
): readonly ReturnRequest[] {
  if (filter === STATUS_FILTER_ALL) return list;
  return list.filter((request) => request.status === filter);
}

/** 주문번호·상품·신청자 검색(대소문자 무시) */
export function searchReturns(
  list: readonly ReturnRequest[],
  keyword: string,
): readonly ReturnRequest[] {
  const needle = keyword.trim().toLowerCase();
  if (needle === '') return list;
  return list.filter(
    (request) =>
      request.orderNo.toLowerCase().includes(needle) ||
      request.productName.toLowerCase().includes(needle) ||
      request.customer.toLowerCase().includes(needle),
  );
}

/** 접수일 내림차순(최근이 위). 같은 날짜는 id 안정 정렬. 테스트가 직접 부른다. */
export function sortReturns(list: readonly ReturnRequest[]): readonly ReturnRequest[] {
  return [...list].sort((a, b) => {
    if (a.requestedAt !== b.requestedAt) return a.requestedAt < b.requestedAt ? 1 : -1;
    return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
  });
}

/** 항목 → 쓰기 입력(id 제외). 상세 저장이 쓴다. */
export function toReturnInput(request: ReturnRequest): ReturnRequestInput {
  return {
    orderNo: request.orderNo,
    productName: request.productName,
    customer: request.customer,
    kind: request.kind,
    reason: request.reason,
    reasonDetail: request.reasonDetail,
    quantity: request.quantity,
    refundAmount: request.refundAmount,
    requestedAt: request.requestedAt,
    status: request.status,
    adminNote: request.adminNote,
  };
}
