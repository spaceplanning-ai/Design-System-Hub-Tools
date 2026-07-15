// 팝업 관리 화면 **전용** 타입 (A41 소유 — apps/admin/src/pages/content/popups/**)
//
// 팝업과 배너는 '닮은 쌍'이지만 서로를 import 하지 않는다(페이지 결합 금지). 공유는 도메인을
// 모르는 공통 모듈(ImageUrlField·DateRangeField·StatusBadge·RowActions)로만 한다.
import type { StatusTone } from '../../../shared/ui';

/** 노출 위치 — 팝업이 뜨는 페이지 */
export type PopupPosition = 'home' | 'event' | 'all';

export const POSITION_LABEL: Record<PopupPosition, string> = {
  home: '메인 홈',
  event: '이벤트 페이지',
  all: '전체 페이지',
};

export const POSITION_OPTIONS: readonly { readonly id: PopupPosition; readonly label: string }[] = [
  { id: 'home', label: '메인 홈' },
  { id: 'event', label: '이벤트 페이지' },
  { id: 'all', label: '전체 페이지' },
];

export interface Popup {
  readonly id: string;
  readonly title: string;
  readonly imageUrl: string;
  readonly linkUrl: string;
  readonly position: PopupPosition;
  /** 노출 기간 — 'YYYY-MM-DD' */
  readonly startAt: string;
  readonly endAt: string;
  /** ON/OFF — 끄면 기간 안이라도 노출되지 않는다 */
  readonly enabled: boolean;
  /** 우선순위 — 작을수록 먼저(위에) 뜬다 */
  readonly priority: number;
}

/** ON/OFF 의 색 의도 — ON=성공, OFF=중립 */
export function enabledTone(enabled: boolean): StatusTone {
  return enabled ? 'success' : 'neutral';
}

export function enabledLabel(enabled: boolean): string {
  return enabled ? 'ON' : 'OFF';
}

/* ── 필터 ────────────────────────────────────────────────────────────────── */

export type EnabledFilter = 'all' | 'on' | 'off';

export const ENABLED_FILTERS: readonly { readonly id: EnabledFilter; readonly label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'on', label: 'ON' },
  { id: 'off', label: 'OFF' },
];

export interface PopupListResult {
  readonly popups: readonly Popup[];
  readonly total: number;
}

export const PAGE_SIZE = 10;
export const TITLE_MAX_LENGTH = 100;
