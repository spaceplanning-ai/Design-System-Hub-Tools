// 비전·미션 화면 전용 타입 (A41 소유 — apps/admin/src/pages/company/vision/**)

/** 핵심가치 항목 1개 */
interface CoreValue {
  readonly title: string;
  readonly description: string;
}

/** 비전·미션 — 단일 문서(회사당 1건) */
export interface VisionDoc {
  readonly vision: string;
  readonly mission: string;
  /** 핵심가치 항목들 — 순서대로 노출된다 */
  readonly coreValues: readonly CoreValue[];
}

export const VISION_MAX_LENGTH = 1000;
export const MISSION_MAX_LENGTH = 1000;
export const VALUE_TITLE_MAX_LENGTH = 50;
export const VALUE_DESC_MAX_LENGTH = 300;
/** 핵심가치는 이 개수를 넘겨 등록하지 않는다 */
export const MAX_CORE_VALUES = 10;
