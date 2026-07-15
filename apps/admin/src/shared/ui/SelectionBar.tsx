// 선택 일괄 액션 바 (A41 소유 — apps/admin/src/shared/ui/**)
//
// [왜 공통인가] 콘텐츠 목록 6종(공지·FAQ·팝업·배너·약관·개인정보)이 행을 체크박스로 고르면
// 상단에 '선택 개수 + 일괄 액션(삭제·ON/OFF)' 바가 뜬다. 여섯 화면이 각자 그리면 어긋난다
// (shared/ui/README 규칙 1). 아무 동작 없는 체크박스를 없애려면 선택은 반드시 액션과 쌍이다.
//
// [도메인을 모른다] 무엇을 골랐는지 알지 못한다 — 선택 개수와 단위 문구, 그리고 액션 버튼(children)만
// 받는다. 어떤 액션인지(삭제/ON/OFF)는 호출부가 버튼으로 넣는다.
import type { CSSProperties, ReactNode } from 'react';

import { formatNumber } from '../format';

const barStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--tds-space-3)',
  flexWrap: 'wrap',
  paddingTop: 'var(--tds-space-2)',
  paddingBottom: 'var(--tds-space-2)',
  paddingLeft: 'var(--tds-space-3)',
  paddingRight: 'var(--tds-space-3)',
  borderStyle: 'solid',
  borderWidth: 'var(--tds-border-width-thin)',
  borderColor: 'var(--tds-color-border-default)',
  borderRadius: 'var(--tds-radius-md)',
  background: 'var(--tds-color-surface-raised)',
};

const countStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--tds-space-2)',
  color: 'var(--tds-color-text-default)',
  fontSize: 'var(--tds-typography-label-md-font-size)',
  fontWeight: 'var(--tds-primitive-typography-font-weight-bold)',
  lineHeight: 'var(--tds-typography-label-md-line-height)',
};

const actionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--tds-space-2)',
  flexWrap: 'wrap',
};

const clearStyle: CSSProperties = {
  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  paddingRight: 0,
  borderStyle: 'none',
  borderWidth: 0,
  background: 'transparent',
  color: 'var(--tds-color-text-muted)',
  fontSize: 'var(--tds-typography-label-sm-font-size)',
  fontWeight: 'var(--tds-typography-label-sm-font-weight)',
  lineHeight: 'var(--tds-typography-label-sm-line-height)',
  cursor: 'pointer',
  textDecoration: 'underline',
};

interface SelectionBarProps {
  /** 선택된 행 수 — 0 이면 아무것도 그리지 않는다 */
  readonly count: number;
  /** 개수 단위 ('건'/'명' 등, 기본 '건') */
  readonly noun?: string;
  /** 선택 해제 — 있으면 '선택 해제' 버튼을 그린다 */
  readonly onClear?: () => void;
  /** 일괄 액션 버튼들 (일괄 삭제 · 일괄 ON/OFF 등) */
  readonly children: ReactNode;
}

export function SelectionBar({ count, noun = '건', onClear, children }: SelectionBarProps) {
  if (count === 0) return null;

  return (
    <div style={barStyle} role="region" aria-label="선택 항목 일괄 작업">
      <span style={countStyle}>
        {`${formatNumber(count)}${noun} 선택됨`}
        {onClear !== undefined && (
          <button type="button" className="tds-ui-focusable" style={clearStyle} onClick={onClear}>
            선택 해제
          </button>
        )}
      </span>
      <span style={actionsStyle}>{children}</span>
    </div>
  );
}
