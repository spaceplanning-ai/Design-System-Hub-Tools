// AUTO-GENERATED from contracts/Slider.contract.json@1.0.0 — DO NOT EDIT (pnpm codegen)
// 레벨: atom · 카테고리: Inputs · 상태: beta

/** 계약에 선언된 상호작용 상태 */
export type SliderState = 'default' | 'hover' | 'focus-visible' | 'disabled';

/**
 * 값 표시가 옆에 붙은 단일 범위 입력. 출처: apps/admin/src/pages/marketing/message-templates/email/controls/Slider.tsx (이메일 빌더의 여백 4면·글자 크기·테두리 반경·미디어 크기·구분선 높이 등 12곳). 도메인을 모른다 — 무엇을 조절하는지 알지 못하고 숫자 범위와 콜백·접근성 라벨·단위 문구만 받는다.
 *
 * [네이티브 <input type="range"> 를 쓴다] 손으로 만든 트랙+썸은 키보드(←/→/Home/End)·터치·스크린리더 지원을 전부 다시 구현해야 한다. 네이티브가 그것을 공짜로 준다 — accent-color 로 트랙 색만 토큰에 맞춘다. 그래서 이 컴포넌트의 a11y 표면(role=slider · aria-valuemin/max/now)은 브라우저가 소유한다.
 *
 * [값 표시는 장식이다] 옆에 붙는 숫자 span 은 aria-hidden 이다 — 같은 값을 네이티브가 이미 aria-valuenow 로 알린다. 자릿수가 바뀌어도 트랙이 흔들리지 않게 tabular-nums + space.8 고정 폭을 준다.
 */
export interface SliderProps {
  /**
   * 현재 값. 제어 값이며 onChange 로만 바뀐다
   */
  value: number;
  /**
   * 허용 최솟값 — 네이티브가 aria-valuemin 으로 노출한다
   */
  min: number;
  /**
   * 허용 최댓값 — 네이티브가 aria-valuemax 로 노출한다
   */
  max: number;
  /**
   * 증감 단위. 화살표 키 한 번이 움직이는 크기이기도 하다
   * @default 1
   */
  step?: number;
  /**
   * 스크린 리더용 이름(aria-label) — 보이는 <label> 이 없는 자리(패널 상자 안)에서 무엇을 조절하는지 알린다('Padding top' 등)
   */
  label: string;
  /**
   * 값 옆에 붙는 단위 표기('px' 등). 비우면 숫자만 보인다. 값 표시는 aria-hidden 장식이므로 이 문구가 접근 가능한 이름을 오염시키지 않는다
   * @default ""
   */
  unit?: string;
  /**
   * range 입력의 DOM id — 한 화면에 슬라이더가 여럿일 때 호출부가 유니크 id 를 주입한다. 비우면 id 속성을 렌더하지 않는다
   * @default ""
   */
  id?: string;
  /**
   * 비활성 — 잠그고 흐리게 표시한다. onChange 발화 없음
   * @default false
   */
  disabled?: boolean;

  // --- events (계약 events 블록에서 생성) ---
  /**
   * 새 값(정수)을 인자로 발화한다. disabled 에서는 발화 금지 — <input disabled> 가 네이티브로 막는다 (Storybook Play Function 이 전수 검증)
   * 발화 차단 상태: disabled (Storybook Play Function 이 전수 검증)
   */
  onChange?: (payload: number) => void;
}
