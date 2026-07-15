// 상태 배지 — 게시/노출/시행 상태를 색과 문구로 이중 전달한다 (A41 소유 — apps/admin/src/shared/ui/**)
//
// [왜 공통인가] 콘텐츠 목록(공지사항·FAQ·팝업·배너·약관)이 저마다 '상태'를 배지로 보여준다.
// 게시/임시저장/예약, ON/OFF, 노출/숨김, 시행중/만료 — 도메인은 다르지만 **색으로 상태를 알리는
// 규약은 하나**다. 페이지마다 배지 스타일을 손으로 그리면 같은 '게시'가 화면마다 다른 초록이 된다.
//
// [도메인을 모른다] 무엇의 상태인지 알지 못한다 — tone(색 의도)과 label(문구)만 받는다.
//   호출부가 '게시 → success', '임시저장 → neutral' 처럼 **도메인 상태 → tone** 을 정한다.
import type { CSSProperties } from 'react';

import { badgeStyle } from './styles';

/** 색 의도 — 무엇의 상태인지가 아니라 '좋음/주의/위험/중립/정보'만 표현한다 */
export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

/** 중립은 회색 표면, 나머지는 피드백 토큰(테두리 포함)으로 칠한다 */
function toneStyle(tone: StatusTone): CSSProperties {
  if (tone === 'neutral') {
    return {
      ...badgeStyle,
      borderStyle: 'solid',
      borderWidth: 'var(--tds-border-width-thin)',
      borderColor: 'var(--tds-color-border-default)',
    };
  }
  return {
    ...badgeStyle,
    borderStyle: 'solid',
    borderWidth: 'var(--tds-border-width-thin)',
    borderColor: `var(--tds-color-feedback-${tone}-border)`,
    background: `var(--tds-color-feedback-${tone}-surface)`,
    color: `var(--tds-color-feedback-${tone}-text)`,
  };
}

interface StatusBadgeProps {
  readonly tone: StatusTone;
  readonly label: string;
}

export function StatusBadge({ tone, label }: StatusBadgeProps) {
  return <span style={toneStyle(tone)}>{label}</span>;
}
