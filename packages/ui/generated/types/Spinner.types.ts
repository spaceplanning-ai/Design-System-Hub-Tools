// AUTO-GENERATED from contracts/Spinner.contract.json@1.0.0 — DO NOT EDIT (pnpm codegen)
// 레벨: atom · 카테고리: Feedback · 상태: beta

/** `Spinner.size` 허용 값 (계약이 유일한 원천) */
export type SpinnerSize = 'inherit' | 'sm' | 'md' | 'lg';

/** 계약에 선언된 상호작용 상태 */
export type SpinnerState = 'default';

/**
 * 원형 로딩 인디케이터. 출처: packages/ui/src/atoms/Button/Button.tsx 의 **비공개** `function Spinner()` — 이미 구현돼 있었으나 배럴로 나가지 않아 Button 밖에서는 쓸 수 없었다. 즉 이 계약은 새 컴포넌트를 만드는 것이 아니라 갇혀 있던 것을 꺼내는 것이다.
 *
 * 기본 크기 `inherit` 는 승계한 Button 스피너의 `1em`(글자 크기 상대) 을 그대로 뜻한다 — Button 이 size sm/md/lg 마다 다른 font-size 를 갖는데 스피너가 따라 커지던 동작이 이 값 하나에 담겨 있다. 고정 크기가 필요한 자리(빈 영역 중앙 등)만 sm/md/lg 를 쓴다.
 *
 * 색은 `currentColor` 다. 토큰을 직접 읽지 않고 부모의 글자색을 따르므로 Button 의 네 variant 위에서 각각 옳은 색이 나온다 — 이 규칙을 색 토큰으로 바꾸면 danger 버튼 위에서 스피너만 파랗게 남는다.
 *
 * [label 과 aria] Button 안에서는 `aria-busy` 가 이미 버튼에 붙어 로딩을 알리므로 스피너는 장식(`aria-hidden`)이어야 한다 — 그래서 label 의 기본값이 빈 문자열이고, 그때 `aria-hidden="true"` 를 낸다. 독립적으로 쓸 때만 label 을 주어 `role="status"` 로 승격시킨다. 기본을 반대로 잡으면 Button 하나가 로딩 상태에서 두 번 낭독된다.
 */
export interface SpinnerProps {
  /**
   * 지름. inherit = `1em` 으로 부모 글자 크기를 따른다(Button 이 쓰는 값 — 버튼 size 가 바뀌면 스피너도 함께 바뀐다). sm/md/lg 는 space 토큰 고정값이며 글자 문맥이 없는 자리에 쓴다
   * @default "inherit"
   */
  size?: SpinnerSize;
  /**
   * 스크린리더에 낭독할 진행 문구(예: '불러오는 중'). 빈 문자열(기본)이면 장식으로 보고 `aria-hidden="true"` 를 낸다 — 부모가 `aria-busy` 로 이미 알리는 Button 안의 용법이다. 값이 있으면 `role="status"` + `aria-label` 로 승격된다
   * @default ""
   */
  label?: string;
}
