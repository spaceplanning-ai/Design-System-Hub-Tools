// Divider — 내용을 가르는 얇은 장식선 (atom · contracts/Divider.contract.json@1.0.0)
//
// Props 타입은 계약에서 생성된 generated/types/Divider.types 를 그대로 import 한다 (수동 선언 금지 — G6).
// 시각 값은 전부 semantic 토큰 CSS 변수 — 하드코딩 hex/px 0건 (G5/G6).
//
// 승계 원본은 두 벌이다 — 이메일 빌더의 `toolbarDividerStyle`(email/styles.ts)과 문자·알림톡
// 편집기의 `dividerStyle`(components/EditorToolbar.tsx:35). 값은 같았으나 마크업이 갈라져
// 전자에는 `aria-hidden` 이 없었다.
//
// [aria-hidden 은 prop 이 아니다] 이 선은 아무 정보도 나르지 않는다. 장식임이 정의이므로
// 끌 수 있는 축으로 두지 않는다 — 의미 있는 구분(role="separator")은 이 컴포넌트의 대상이
// 아니고, 그 호출부가 리포에 0건이라 계약이 담지 않았다 (계약 description 참조).
//
// <span> 을 쓰는 이유: 인라인 문맥(툴바의 버튼 줄) 안에 놓여도 HTML 이 유효하다. <div> 는
// <p> 나 <button> 계열 인라인 흐름 안에서 파싱이 틀어질 수 있다.
import type { DividerProps } from '../../../generated/types/Divider.types';
import './Divider.css';

export function Divider({ orientation = 'horizontal' }: DividerProps) {
  return <span className={`tds-divider tds-divider--${orientation}`} aria-hidden="true" />;
}
