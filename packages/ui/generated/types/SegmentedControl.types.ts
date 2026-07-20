// AUTO-GENERATED from contracts/SegmentedControl.contract.json@1.1.0 — DO NOT EDIT (pnpm codegen)
// 레벨: molecule · 카테고리: Selection · 상태: beta

/** `SegmentedControl.size` 허용 값 (계약이 유일한 원천) */
export type SegmentedControlSize = 'sm' | 'md';

/** 계약에 선언된 상호작용 상태 */
export type SegmentedControlState = 'default' | 'hover' | 'focus-visible' | 'disabled' | 'selected';

/**
 * 세그먼티드 컨트롤 — 트랙(회색 배경) 위에 선택된 세그먼트만 알약으로 떠 있는 단일 선택 컨트롤. 라디오 그룹 시맨틱을 소유한다. 도메인 중립: 옵션은 options prop 으로 주입하며 '일/주/월' 같은 도메인 의미는 조립하는 organism/page 가 정한다 (ADR-0003). 출처 구현: apps/admin/src/pages/dashboard/components/RangeToggle.tsx
 *
 * [1.1.0 — 아이콘 세그먼트] options[].icon 과 options[].labelHidden 이 늘었다. 1.0.x 는 label 이 string 뿐이라 **아이콘만 있는 세그먼트를 표현할 방법이 아예 없었고**, 그래서 이메일 빌더의 캔버스 폭 전환([🖥|📱])이 배타 선택·radiogroup·로빙 tabindex 라는 시맨틱을 전부 필요로 하면서도 이 컴포넌트로 이관되지 못하고 로컬 IconToggleGroup 에 남아 있었다. prop 이 늘기만 했고 기존 호출부는 그대로 동작하므로 MINOR 다.
 *
 * [아이콘 세그먼트의 접근 가능한 이름 — label 이 언제나 유일한 원천이다] icon 을 줘도 label 은 여전히 required 이며, labelHidden=true 는 label 을 **시각적으로만** 감춘다 — 텍스트는 DOM 과 접근성 트리에 그대로 남으므로 아이콘만 보이는 세그먼트도 이름을 잃지 않는다(SearchField 의 숨긴 라벨과 같은 처리). 세그먼트에 aria-label 을 덧붙이지 않는 것이 규약이다: 이름의 경로가 하나뿐이어야 보이는 라벨과 감춘 라벨이 같은 규칙을 타고, 이름이 둘로 갈리는 ColorField 류 회귀가 원천적으로 불가능해진다. 아이콘은 어떤 경우에도 접근 가능한 이름에 기여하지 않는다(Icon 의 label 을 비워 aria-hidden 으로 낸다). labelHidden=true 인데 icon 이 없으면 눈에 보이는 내용이 사라지므로 그 조합은 계약 위반이다.
 *
 * [왜 icon 이 ReactNode 가 아니라 Icon 이름 유니온인가] 임의 노드를 받으면 세그먼트 안에 무엇이든 들어올 수 있어 24 그리드·currentColor·크기 규약이 깨진다. 그래서 contracts/Icon.contract.json 의 name enum 과 **같은 값 집합**만 받는다. 이 유니온은 지금 손으로 옮겨 적힌 사본이므로(생성기가 계약 간 타입 import 를 만들지 못한다) SegmentedControl.test.tsx 가 IconName 과의 **양방향 할당 가능성**을 컴파일 타임에 단언해 표류를 막는다 — 한쪽에만 아이콘이 늘면 pnpm typecheck 가 죽는다.
 */
export interface SegmentedControlProps {
  /**
   * 선택된 세그먼트의 id. options[].id 중 하나여야 한다
   */
  value: string;
  /**
   * 세그먼트 목록. 데이터 prop — Figma Component Property 대응 없음 (ADR-0003).
   *
   * id 는 value/onChange 가 쓰는 키, label 은 **언제나 접근 가능한 이름**이다. icon 은 Icon 계약의 name enum 과 같은 값 집합이며 label 앞에 붙는다. labelHidden=true 면 label 을 시각적으로만 감춘다(텍스트는 DOM 에 남아 접근 가능한 이름이 된다) — 아이콘만 보이는 세그먼트가 이름을 잃지 않게 하는 장치이므로 icon 없이 쓰면 안 된다
   */
  options: ReadonlyArray<{ id: string; label: string; icon?: 'align-bottom' | 'align-center' | 'align-left' | 'align-middle' | 'align-right' | 'align-top' | 'arrow-left' | 'avatar' | 'bar-chart' | 'bell' | 'box' | 'briefcase' | 'building' | 'button' | 'chevron-down' | 'chevron-left' | 'chevron-right' | 'close' | 'collapse-left' | 'collapse-right' | 'columns' | 'desktop' | 'divider' | 'download' | 'eye' | 'file-text' | 'footer' | 'heading' | 'headset' | 'image' | 'layout-grid' | 'list' | 'lock' | 'logo' | 'megaphone' | 'menu' | 'mic' | 'mobile' | 'more-horizontal' | 'pencil' | 'plus' | 'plus-circle' | 'redo' | 'scroll-text' | 'search' | 'send' | 'settings' | 'shopping-bag' | 'social' | 'spacer' | 'sparkle' | 'sparkles' | 'text' | 'trash' | 'undo' | 'upload' | 'users' | 'video' | 'x-circle'; labelHidden?: boolean }>;
  /**
   * 세그먼트 높이·좌우 패딩 스케일
   * @default "md"
   */
  size?: SegmentedControlSize;
  /**
   * 그룹 전체 비활성. onChange 차단 + aria-disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * radiogroup 의 접근 가능한 이름 (예: '조회 기간'). 시각 레이블이 없으므로 필수
   */
  ariaLabel: string;

  // --- events (계약 events 블록에서 생성) ---
  /**
   * 선택된 세그먼트의 id 를 전달. disabled 에서는 발화 금지 — Storybook Play Function이 전수 검증
   * 발화 차단 상태: disabled (Storybook Play Function 이 전수 검증)
   */
  onChange?: (payload: string) => void;
}
