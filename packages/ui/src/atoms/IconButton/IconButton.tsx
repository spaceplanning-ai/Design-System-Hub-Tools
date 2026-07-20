// IconButton — 아이콘만 담는 정사각 버튼 (atom · contracts/IconButton.contract.json@1.0.0)
//
// Props 타입은 계약에서 생성된 generated/types/IconButton.types 를 그대로 import 한다 (수동 선언 금지 — G6).
// 시각 값은 전부 semantic 토큰 CSS 변수 — 하드코딩 hex/px 0건 (G5/G6).
// 상태(hover/active/focus-visible/disabled/selected)는 IconButton.css 의 의사 클래스와
// **속성 셀렉터**가 소유한다.
//
// 승계 원본은 두 벌이다 — 이메일 빌더의 `iconButtonStyle`(email/styles.ts)과 문자·알림톡
// 편집기의 비공개 `function IconButton`(components/EditorToolbar.tsx:74). 없던 것을 만든 게
// 아니라 갈라져 있던 둘을 합쳤다.
//
// [pressed 를 조건부로 낸다] `aria-pressed` 는 '없음 / true / false' 세 상태다. 실행취소 같은
// 일반 액션에 false 를 달면 스크린리더가 '토글 버튼, 안 눌림' 이라고 읽어 **거짓 시맨틱**이 된다.
// 계약이 이 부재를 `pressed: 'unset'` 으로 값화했고, 여기서 조건부 spread 로 속성을 뺀다
// (exactOptionalPropertyTypes: undefined 를 대입하면 TS2375 이므로 키 자체를 생략해야 한다).
//
// [눌린 시각을 aria-pressed 로 그린다] pressed 용 클래스를 따로 두지 않는다. CSS 가
// `[aria-pressed='true']` 를 직접 보므로 **접근성 상태와 픽셀이 구조적으로 갈라질 수 없다** —
// 색만 칠하고 속성을 빠뜨리는(그 반대도) 종류의 결함이 원리적으로 생기지 않는다.
import type { ButtonHTMLAttributes, MouseEvent } from 'react';

import type { IconButtonProps } from '../../../generated/types/IconButton.types';
import './IconButton.css';

// [네이티브 속성 패스스루 — Button 선례(Button.tsx:20)]
//   aria-expanded · aria-haspopup · aria-controls 등을 <button> 으로 그대로 흘린다.
//   계약이 소유한 표면(disabled · onClick · title · aria-label · children)은 제외한다 —
//   두 선언이 교차하면 호출부가 계약의 규칙(label 이 이름의 유일한 원천)을 우회할 수 있다.
//   className/style 은 토큰 규칙 보호를 위해 차단한다.
type IconButtonNativeProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'style' | 'className' | 'children' | 'type' | 'onClick' | 'disabled' | 'title' | 'aria-label'
>;

export function IconButton({
  icon,
  label,
  size = 'md',
  pressed = 'unset',
  disabled = false,
  onClick,
  ...native
}: IconButtonProps & IconButtonNativeProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    // 계약 events.onClick.blockedWhen — disabled 에서는 발화 금지.
    // 네이티브 disabled 가 이미 막지만, 계약이 말한 규칙을 구현이 스스로 갖는다.
    if (disabled) return;
    onClick?.(event);
  };

  return (
    <button
      type="button"
      className={`tds-icon-button tds-icon-button--${size}`}
      disabled={disabled}
      // label 이 두 사용자 집단에 같은 정보를 준다 — 값이 하나이므로 갈라질 수 없다
      aria-label={label}
      title={label}
      {...(pressed !== 'unset' && { 'aria-pressed': pressed === 'on' })}
      onClick={handleClick}
      {...native}
    >
      {/* 글리프는 장식이다 — 접근 가능한 이름은 label 이 소유한다 */}
      <span className="tds-icon-button__icon" aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}
