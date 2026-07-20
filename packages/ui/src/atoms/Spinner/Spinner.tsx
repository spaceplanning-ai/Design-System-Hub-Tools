// Spinner — 원형 로딩 인디케이터 (atom · contracts/Spinner.contract.json@1.0.0)
//
// Props 타입은 계약에서 생성된 generated/types/Spinner.types 를 그대로 import 한다 (수동 선언 금지 — G6).
// 시각 값은 전부 토큰 CSS 변수 — 하드코딩 hex/px 0건 (G5/G6).
//
// 승계 원본: Button.tsx 의 비공개 `function Spinner()`. **없던 것을 만든 게 아니라 갇혀 있던 것을 꺼냈다.**
// Button 은 이제 이 컴포넌트를 소비한다 (Button.tsx:loading 분기).
//
// 색은 currentColor 다 — 토큰을 직접 읽으면 danger 버튼 위에서 스피너만 파랗게 남는다.
import type { SpinnerProps } from '../../../generated/types/Spinner.types';
import './Spinner.css';

export function Spinner({ size = 'inherit', label = '' }: SpinnerProps) {
  // 계약 a11y — label 이 비면 장식이다. Button 안에서는 버튼의 aria-busy 가 이미 로딩을 알리므로
  // 여기서 또 알리면 한 버튼이 두 번 낭독된다. 그래서 '장식' 이 기본이고 승격이 옵트인이다.
  const decorative = label === '';

  return (
    <span
      className={`tds-spinner tds-spinner--${size}`}
      role={decorative ? undefined : 'status'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label}
    />
  );
}
