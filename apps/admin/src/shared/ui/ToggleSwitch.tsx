// 상태 ON/OFF 토글 스위치 (A41 소유 — apps/admin/src/shared/ui/**)
//
// [왜 공통인가] 이진 노출 상태(FAQ 노출 여부 · 팝업 ON/OFF · 배너 ON/OFF)를 목록에서 바로 켜고
// 끈다 — 세 목록이 같은 스위치를 쓴다(shared/ui/README 규칙 1). 도메인을 모른다: 무엇을 켜는지
// 알지 못하고 checked 불리언과 콜백·접근성 라벨만 받는다.
//
// [접근성] role="switch" + aria-checked. <button> 이라 Space/Enter 로 토글되고(버튼 기본 동작),
// 포커스 링은 공통 .tds-ui-focusable 을 쓴다. 보이는 ON/OFF 문구로 상태를 색과 글자로 이중 전달한다.
//
// [토큰만] 트랙·손잡이 치수는 space 토큰의 배수, 색은 전부 var(--tds-*). 하드코딩 hex/px 0건.
import type { CSSProperties } from 'react';

const wrapStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--tds-space-2)',
  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  paddingRight: 0,
  borderStyle: 'none',
  borderWidth: 0,
  background: 'transparent',
  cursor: 'pointer',
};

function trackStyle(checked: boolean, locked: boolean): CSSProperties {
  return {
    position: 'relative',
    display: 'inline-block',
    flexShrink: 0,
    width: 'calc(var(--tds-space-5) * 1.75)',
    height: 'var(--tds-space-5)',
    borderRadius: 'var(--tds-radius-full)',
    background: checked
      ? 'var(--tds-color-action-primary-default)'
      : 'var(--tds-color-border-default)',
    opacity: locked ? 0.6 : 1,
    transition: 'background-color var(--tds-motion-duration-fast)',
  };
}

function knobStyle(checked: boolean): CSSProperties {
  return {
    position: 'absolute',
    top: 'var(--tds-space-1)',
    left: 'var(--tds-space-1)',
    width: 'calc(var(--tds-space-5) - var(--tds-space-1) * 2)',
    height: 'calc(var(--tds-space-5) - var(--tds-space-1) * 2)',
    borderRadius: 'var(--tds-radius-full)',
    borderStyle: 'solid',
    borderWidth: 'var(--tds-border-width-thin)',
    borderColor: 'var(--tds-color-border-default)',
    background: 'var(--tds-color-surface-default)',
    // ON 이면 오른쪽 끝으로: 트랙폭 - 트랙높이 = space-5 * 0.75
    transform: checked ? 'translateX(calc(var(--tds-space-5) * 0.75))' : 'none',
    transition: 'transform var(--tds-motion-duration-fast)',
  };
}

function labelStyle(checked: boolean): CSSProperties {
  return {
    color: checked ? 'var(--tds-color-action-primary-default)' : 'var(--tds-color-text-muted)',
    fontSize: 'var(--tds-typography-label-sm-font-size)',
    fontWeight: 'var(--tds-typography-label-sm-font-weight)',
    lineHeight: 'var(--tds-typography-label-sm-line-height)',
    fontVariantNumeric: 'tabular-nums',
  };
}

interface ToggleSwitchProps {
  readonly checked: boolean;
  readonly onChange: (next: boolean) => void;
  /** 스크린 리더용 이름 — 보이는 라벨이 없는 표 안에서 무엇을 켜는지 알린다('FAQ 노출 여부' 등) */
  readonly label: string;
  readonly disabled?: boolean;
  /** 낙관적 업데이트 요청 진행 중 — 잠그고 흐리게 표시한다 */
  readonly busy?: boolean;
  /** ON 상태 문구 (기본 'ON') */
  readonly onLabel?: string;
  /** OFF 상태 문구 (기본 'OFF') */
  readonly offLabel?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled = false,
  busy = false,
  onLabel = 'ON',
  offLabel = 'OFF',
}: ToggleSwitchProps) {
  const locked = disabled || busy;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-busy={busy}
      disabled={locked}
      className="tds-ui-focusable"
      style={{ ...wrapStyle, cursor: locked ? 'not-allowed' : 'pointer' }}
      onClick={() => onChange(!checked)}
    >
      <span style={trackStyle(checked, locked)} aria-hidden="true">
        <span style={knobStyle(checked)} />
      </span>
      <span style={labelStyle(checked)} aria-hidden="true">
        {checked ? onLabel : offLabel}
      </span>
    </button>
  );
}
