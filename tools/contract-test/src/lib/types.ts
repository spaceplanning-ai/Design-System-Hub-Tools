/**
 * 계약(Contract) 및 검증 결과 타입 정의.
 * 계약 스키마 원본: contracts/schemas/component.v1.json
 */

export type PropType = 'enum' | 'boolean' | 'string' | 'number' | 'slot' | 'node' | 'function';

export interface ContractProp {
  type: PropType;
  values?: string[];
  default?: unknown;
  required?: boolean;
  /** Figma Component Property 매핑명 — enum/boolean prop은 필수 (G3 체크리스트) */
  figmaProperty?: string;
  /**
   * boolean prop 전용 옵트인 — Figma 에서 BOOLEAN 속성이 아니라 Variant 축(true/false)이 된다.
   * 이 값이 true 면 figma 축 검사는 VARIANT 를 기대한다. React 타입은 그대로 boolean 이다.
   */
  figmaVariant?: boolean;
  /** slot prop 전용 — Figma 에서 슬롯 표시/숨김 BOOLEAN 을 하나 더 만든다 (계약 schema 참고) */
  figmaToggle?: boolean;
  accepts?: string[];
  hiddenWhen?: string[];
  description?: string;
  deprecated?: boolean;
}

export interface ContractEvent {
  payload: string;
  blockedWhen?: string[];
  description?: string;
}

export interface Contract {
  name: string;
  version: string;
  level: string;
  status: string;
  props: Record<string, ContractProp>;
  events?: Record<string, ContractEvent>;
  states?: string[];
  /** Figma 상태 변형 축의 값 목록 — 계약 schema 의 figmaStateAxis 참고 */
  figmaStateAxis?: string[];
  /** 부위 트리 — figmaText 파생 속성을 되짚는 데 쓴다 */
  anatomy?: unknown;
  /** 시각 속성 → tokens.json 경로 매핑 (예: "background": "color.action.primary.default") */
  tokens?: Record<string, string>;
}

/**
 * 검사 상태.
 * - PASS: 일치 확인
 * - FAIL: 불일치(mismatch) — 1건이라도 있으면 exit 1 → G5/G6/G7 동시 차단
 * - SKIP: 검증 대상 산출물이 아직 없음 (부트스트랩 단계 배려 — 차단하지 않음)
 */
export type CheckStatus = 'PASS' | 'FAIL' | 'SKIP';

export interface Check {
  id: string;
  title: string;
  status: CheckStatus;
  detail?: string;
}

export type AxisId = 'react' | 'storybook' | 'figma' | 'token';

export interface AxisResult {
  axis: AxisId;
  title: string;
  status: CheckStatus;
  checks: Check[];
}

export interface ComponentReport {
  component: string;
  contractPath: string;
  contractVersion: string;
  generatedAt: string;
  status: CheckStatus;
  /** FAIL 판정 검사 항목 수 */
  mismatchCount: number;
  axes: AxisResult[];
  /** 계약 파일 자체를 읽지 못한 경우의 오류 메시지 */
  error?: string;
}

/** 검증 축 실행에 필요한 공통 컨텍스트 */
export interface AxisContext {
  /** 리포 루트 절대경로 */
  root: string;
  contract: Contract;
  ui: {
    /** packages/ui 절대경로 */
    base: string;
    /** packages/ui 하위 파일의 POSIX 상대경로 목록 (예: src/atoms/Button/Button.tsx) */
    files: string[];
  };
}

/** 하위 상태들을 하나로 집계한다: FAIL 우선, 전부 SKIP이면 SKIP, 그 외 PASS */
export function summarizeStatuses(statuses: CheckStatus[]): CheckStatus {
  if (statuses.length === 0) return 'SKIP';
  if (statuses.includes('FAIL')) return 'FAIL';
  if (statuses.every((s) => s === 'SKIP')) return 'SKIP';
  return 'PASS';
}
